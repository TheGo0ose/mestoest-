package com.tablemint.restaurant.service;

import com.tablemint.auth.service.AuthService;
import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.menu.model.MenuSection;
import com.tablemint.menu.repository.MenuItemRepository;
import com.tablemint.menu.repository.MenuSectionRepository;
import com.tablemint.restaurant.model.DiningTable;
import com.tablemint.restaurant.model.OpeningHours;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.DiningTableRepository;
import com.tablemint.restaurant.repository.OpeningHoursRepository;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.restaurant.service.RestaurantCatalogService.OpeningHoursDto;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RestaurantAdminService {

    private final RestaurantRepository restaurantRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final DiningTableRepository tableRepository;
    private final MenuSectionRepository menuSectionRepository;
    private final MenuItemRepository menuItemRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final Clock clock;

    public RestaurantAdminService(
            RestaurantRepository restaurantRepository,
            OpeningHoursRepository openingHoursRepository,
            DiningTableRepository tableRepository,
            MenuSectionRepository menuSectionRepository,
            MenuItemRepository menuItemRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            AuthService authService,
            Clock clock
    ) {
        this.restaurantRepository = restaurantRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.tableRepository = tableRepository;
        this.menuSectionRepository = menuSectionRepository;
        this.menuItemRepository = menuItemRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.clock = clock;
    }

    public record ManagedRestaurantDto(
            UUID id,
            UUID ownerId,
            String name,
            String description,
            String address,
            String phone,
            String timeZone,
            RestaurantStatus status,
            int sittingMinutes,
            int slotMinutes,
            int minLeadMinutes,
            int maxAdvanceDays,
            List<OpeningHoursDto> openingHours
    ) {
        public static ManagedRestaurantDto fromEntity(Restaurant r, List<OpeningHours> hours) {
            return new ManagedRestaurantDto(
                    r.getId(),
                    r.getOwnerId(),
                    r.getName(),
                    r.getDescription(),
                    r.getAddress(),
                    r.getPhone(),
                    r.getTimeZone(),
                    r.getStatus(),
                    r.getSittingMinutes(),
                    r.getSlotMinutes(),
                    r.getMinLeadMinutes(),
                    r.getMaxAdvanceDays(),
                    hours.stream().map(OpeningHoursDto::fromEntity).toList()
            );
        }
    }

    public record DiningTableDto(
            UUID id,
            String label,
            int seats,
            boolean active
    ) {
        public static DiningTableDto fromEntity(DiningTable t) {
            return new DiningTableDto(t.getId(), t.getLabel(), t.getSeats(), t.isActive());
        }
    }

    public record CreateRestaurantCmd(
            UUID ownerId,
            String name,
            String description,
            String address,
            String phone
    ) {}

    public record UpdateRestaurantCmd(
            String name,
            String description,
            String address,
            String phone,
            Integer sittingMinutes,
            Integer slotMinutes,
            Integer minLeadMinutes,
            Integer maxAdvanceDays
    ) {}

    @Transactional(readOnly = true)
    public List<ManagedRestaurantDto> listManagedRestaurants(String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);

        List<Restaurant> restaurants;
        if (user.getRole() == UserRole.MODERATOR) {
            restaurants = restaurantRepository.findAll();
        } else {
            restaurants = restaurantRepository.findByOwnerId(user.getId());
        }

        return restaurants.stream()
                .map(r -> {
                    List<OpeningHours> hours = openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(r.getId());
                    return ManagedRestaurantDto.fromEntity(r, hours);
                })
                .toList();
    }

    @Transactional
    public ManagedRestaurantDto createRestaurant(CreateRestaurantCmd cmd, String currentUserEmail) {
        AppUser moderator = authService.requireActiveUser(currentUserEmail);
        if (moderator.getRole() != UserRole.MODERATOR) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }

        userRepository.findById(cmd.ownerId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        Instant now = Instant.now(clock);
        Restaurant r = new Restaurant();
        r.setOwnerId(cmd.ownerId());
        r.setName(cmd.name().trim());
        r.setDescription(cmd.description());
        r.setAddress(cmd.address().trim());
        r.setPhone(cmd.phone().trim());
        r.setTimeZone("Asia/Bishkek");
        r.setStatus(RestaurantStatus.DRAFT);
        r.setSittingMinutes(120);
        r.setSlotMinutes(30);
        r.setMinLeadMinutes(60);
        r.setMaxAdvanceDays(60);
        r.setCreatedAt(now);
        r.setUpdatedAt(now);

        Restaurant saved = restaurantRepository.save(r);
        return ManagedRestaurantDto.fromEntity(saved, List.of());
    }

    @Transactional(readOnly = true)
    public ManagedRestaurantDto getManagedRestaurant(UUID restaurantId, String currentUserEmail) {
        Restaurant r = verifyRestaurantAccess(restaurantId, currentUserEmail);
        List<OpeningHours> hours = openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(r.getId());
        return ManagedRestaurantDto.fromEntity(r, hours);
    }

    @Transactional
    public ManagedRestaurantDto updateRestaurant(UUID restaurantId, UpdateRestaurantCmd cmd, String currentUserEmail) {
        Restaurant r = verifyRestaurantAccess(restaurantId, currentUserEmail);

        if (cmd.name() != null && !cmd.name().isBlank()) {
            r.setName(cmd.name().trim());
        }
        if (cmd.description() != null) {
            r.setDescription(cmd.description());
        }
        if (cmd.address() != null && !cmd.address().isBlank()) {
            r.setAddress(cmd.address().trim());
        }
        if (cmd.phone() != null && !cmd.phone().isBlank()) {
            r.setPhone(cmd.phone().trim());
        }
        if (cmd.sittingMinutes() != null) {
            if (cmd.sittingMinutes() < 15) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            r.setSittingMinutes(cmd.sittingMinutes());
        }
        if (cmd.slotMinutes() != null) {
            if (cmd.slotMinutes() < 5 || 60 % cmd.slotMinutes() != 0) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            r.setSlotMinutes(cmd.slotMinutes());
        }
        if (cmd.minLeadMinutes() != null) {
            if (cmd.minLeadMinutes() < 0) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            r.setMinLeadMinutes(cmd.minLeadMinutes());
        }
        if (cmd.maxAdvanceDays() != null) {
            if (cmd.maxAdvanceDays() < 1) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            r.setMaxAdvanceDays(cmd.maxAdvanceDays());
        }

        r.setUpdatedAt(Instant.now(clock));
        Restaurant saved = restaurantRepository.save(r);
        List<OpeningHours> hours = openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(saved.getId());
        return ManagedRestaurantDto.fromEntity(saved, hours);
    }

    @Transactional
    public ManagedRestaurantDto setPublication(UUID restaurantId, RestaurantStatus targetStatus, String currentUserEmail) {
        Restaurant r = verifyRestaurantAccess(restaurantId, currentUserEmail);

        if (targetStatus != RestaurantStatus.PUBLISHED && targetStatus != RestaurantStatus.HIDDEN) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        List<OpeningHours> hours = openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(r.getId());

        if (targetStatus == RestaurantStatus.PUBLISHED) {
            boolean hasHours = !hours.isEmpty();
            boolean hasActiveTable = tableRepository.findMaxActiveSeats(r.getId()) > 0;
            boolean hasMenuItem = hasAvailableMenuItem(r.getId());

            if (!hasHours || !hasActiveTable || !hasMenuItem) {
                throw new DomainException(ErrorCode.RESTAURANT_NOT_READY);
            }
        }

        r.setStatus(targetStatus);
        r.setUpdatedAt(Instant.now(clock));
        Restaurant saved = restaurantRepository.save(r);
        return ManagedRestaurantDto.fromEntity(saved, hours);
    }

    @Transactional
    public List<OpeningHoursDto> replaceOpeningHours(
            UUID restaurantId,
            List<OpeningHoursDto> items,
            String currentUserEmail
    ) {
        Restaurant r = verifyRestaurantAccess(restaurantId, currentUserEmail);

        Set<Integer> seenDays = new HashSet<>();
        List<OpeningHours> toSave = new ArrayList<>();

        for (OpeningHoursDto dto : items) {
            if (dto.dayOfWeek() < 1 || dto.dayOfWeek() > 7 || !seenDays.add(dto.dayOfWeek())) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            LocalTime opens;
            LocalTime closes;
            try {
                opens = LocalTime.parse(dto.opensAt());
                closes = LocalTime.parse(dto.closesAt());
            } catch (DateTimeParseException | NullPointerException e) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            if (!closes.isAfter(opens)) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }

            OpeningHours oh = new OpeningHours();
            oh.setRestaurantId(r.getId());
            oh.setDayOfWeek(dto.dayOfWeek());
            oh.setOpensAt(opens);
            oh.setClosesAt(closes);
            toSave.add(oh);
        }

        openingHoursRepository.deleteByRestaurantId(r.getId());
        openingHoursRepository.flush();
        openingHoursRepository.saveAll(toSave);

        return openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(r.getId()).stream()
                .map(OpeningHoursDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiningTableDto> listTables(UUID restaurantId, String currentUserEmail) {
        verifyRestaurantAccess(restaurantId, currentUserEmail);
        return tableRepository.findByRestaurantIdOrderByLabelAsc(restaurantId).stream()
                .map(DiningTableDto::fromEntity)
                .toList();
    }

    @Transactional
    public DiningTableDto createTable(
            UUID restaurantId,
            String label,
            int seats,
            Boolean active,
            String currentUserEmail
    ) {
        verifyRestaurantAccess(restaurantId, currentUserEmail);

        if (seats < 1 || seats > 50 || label == null || label.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        String normalizedLabel = label.trim();
        if (tableRepository.findByRestaurantIdAndLabel(restaurantId, normalizedLabel).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        DiningTable table = new DiningTable();
        table.setRestaurantId(restaurantId);
        table.setLabel(normalizedLabel);
        table.setSeats(seats);
        table.setActive(active == null || active);

        DiningTable saved = tableRepository.save(table);
        return DiningTableDto.fromEntity(saved);
    }

    @Transactional
    public DiningTableDto updateTable(
            UUID tableId,
            String label,
            Integer seats,
            Boolean active,
            String currentUserEmail
    ) {
        DiningTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(table.getRestaurantId(), currentUserEmail);

        boolean hasFutureBookings = bookingRepository.existsFutureConfirmedBookingsForTable(tableId, Instant.now(clock));

        if (hasFutureBookings) {
            boolean deactivating = Boolean.FALSE.equals(active) && table.isActive();
            boolean reducingSeats = seats != null && seats < table.getSeats();
            if (deactivating || reducingSeats) {
                throw new DomainException(ErrorCode.TABLE_IN_USE);
            }
        }

        if (label != null && !label.isBlank()) {
            table.setLabel(label.trim());
        }
        if (seats != null) {
            if (seats < 1 || seats > 50) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            table.setSeats(seats);
        }
        if (active != null) {
            table.setActive(active);
        }

        DiningTable saved = tableRepository.save(table);
        return DiningTableDto.fromEntity(saved);
    }

    @Transactional
    public void deleteTable(UUID tableId, String currentUserEmail) {
        DiningTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(table.getRestaurantId(), currentUserEmail);

        if (bookingRepository.existsFutureConfirmedBookingsForTable(tableId, Instant.now(clock))
                || bookingRepository.existsByTableId(tableId)) {
            throw new DomainException(ErrorCode.TABLE_IN_USE);
        }

        tableRepository.delete(table);
    }

    private boolean hasAvailableMenuItem(UUID restaurantId) {
        List<MenuSection> sections = menuSectionRepository.findByRestaurantIdOrderByPositionAsc(restaurantId);
        for (MenuSection sec : sections) {
            if (!menuItemRepository.findBySectionIdAndAvailableTrueOrderByPositionAsc(sec.getId()).isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private Restaurant verifyRestaurantAccess(UUID restaurantId, String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (user.getRole() == UserRole.OWNER && !restaurant.getOwnerId().equals(user.getId())) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }
        return restaurant;
    }
}
