package com.tablemint.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablemint.auth.service.AuthService;
import com.tablemint.booking.model.Booking;
import com.tablemint.booking.model.BookingSource;
import com.tablemint.booking.model.BookingStatus;
import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.common.idempotency.IdempotencyRecord;
import com.tablemint.common.idempotency.IdempotencyService;
import com.tablemint.restaurant.model.DiningTable;
import com.tablemint.restaurant.model.OpeningHours;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.DiningTableRepository;
import com.tablemint.restaurant.repository.OpeningHoursRepository;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RestaurantRepository restaurantRepository;
    private final DiningTableRepository tableRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final IdempotencyService idempotencyService;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    private static final String REFERENCE_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    public BookingService(
            BookingRepository bookingRepository,
            RestaurantRepository restaurantRepository,
            DiningTableRepository tableRepository,
            OpeningHoursRepository openingHoursRepository,
            UserRepository userRepository,
            AuthService authService,
            IdempotencyService idempotencyService,
            Clock clock,
            ObjectMapper objectMapper
    ) {
        this.bookingRepository = bookingRepository;
        this.restaurantRepository = restaurantRepository;
        this.tableRepository = tableRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.idempotencyService = idempotencyService;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    public record BookingDto(
            UUID id,
            String reference,
            UUID restaurantId,
            UUID tableId,
            String tableLabel,
            int partySize,
            Instant startsAt,
            Instant endsAt,
            String status,
            String source,
            String guestName,
            String guestPhone,
            Instant createdAt,
            Instant cancelledAt
    ) {
        public static BookingDto fromEntity(Booking b, String tableLabel) {
            return new BookingDto(
                    b.getId(),
                    b.getReference(),
                    b.getRestaurantId(),
                    b.getTableId(),
                    tableLabel != null ? tableLabel : "Table",
                    b.getPartySize(),
                    b.getStartsAt(),
                    b.getEndsAt(),
                    b.getStatus().name(),
                    b.getSource().name(),
                    b.getGuestName(),
                    b.getGuestPhone(),
                    b.getCreatedAt(),
                    b.getCancelledAt()
            );
        }
    }

    public record RestaurantBookingDto(
            UUID id,
            String reference,
            UUID restaurantId,
            UUID tableId,
            String tableLabel,
            int partySize,
            Instant startsAt,
            Instant endsAt,
            String status,
            String source,
            String guestName,
            String guestPhone,
            String customerEmail,
            Instant createdAt,
            Instant cancelledAt
    ) {
        public static RestaurantBookingDto fromEntity(Booking b, String tableLabel, String customerEmail) {
            return new RestaurantBookingDto(
                    b.getId(),
                    b.getReference(),
                    b.getRestaurantId(),
                    b.getTableId(),
                    tableLabel != null ? tableLabel : "Table",
                    b.getPartySize(),
                    b.getStartsAt(),
                    b.getEndsAt(),
                    b.getStatus().name(),
                    b.getSource().name(),
                    b.getGuestName(),
                    b.getGuestPhone(),
                    customerEmail,
                    b.getCreatedAt(),
                    b.getCancelledAt()
            );
        }
    }

    public record BookingPageDto(
            List<BookingDto> items,
            int page,
            int size,
            long totalItems
    ) {}

    public record CreateBookingCmd(
            UUID restaurantId,
            Instant startsAt,
            int partySize,
            UUID customerId,
            String guestName,
            String guestPhone,
            Long telegramUserId,
            BookingSource source,
            boolean consentAccepted,
            String consentVersion,
            String idempotencyKey
    ) {}

    public record BookingResult(BookingDto booking, boolean isReplayed) {}

    @Transactional
    public BookingResult createCustomerBooking(
            String customerEmail,
            UUID restaurantId,
            Instant startsAt,
            int partySize,
            boolean consentAccepted,
            String consentVersion,
            String idempotencyKey
    ) {
        AppUser user = authService.requireActiveUser(customerEmail);
        if (user.getRole() != UserRole.CUSTOMER) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }

        return createBooking(new CreateBookingCmd(
                restaurantId,
                startsAt,
                partySize,
                user.getId(),
                null,
                null,
                null,
                BookingSource.WEB,
                consentAccepted,
                consentVersion,
                idempotencyKey
        ));
    }

    @Transactional
    public BookingResult createBooking(CreateBookingCmd cmd) {
        if (!cmd.consentAccepted()) {
            throw new DomainException(ErrorCode.CONSENT_REQUIRED);
        }

        // 1. Предварительная валидация ресторана и бизнес-правил
        Restaurant restaurant = restaurantRepository.findById(cmd.restaurantId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        Instant endsAt = validateBookingSlotAndRules(restaurant, cmd.startsAt(), cmd.partySize());

        // 2. Идемпотентность: блокировка строки idempotency_record В ПЕРВУЮ ОЧЕРЕДЬ
        String scope = "CREATE_BOOKING:" + restaurant.getId();
        String payloadToHash = cmd.restaurantId() + ":" + cmd.startsAt() + ":" + cmd.partySize() + ":"
                + (cmd.customerId() != null ? cmd.customerId() : cmd.guestPhone());
        String requestHash = IdempotencyService.computeHash(payloadToHash);

        Optional<IdempotencyRecord> existingRecord = idempotencyService.lockAndCheck(scope, cmd.idempotencyKey(), requestHash);
        if (existingRecord.isPresent() && existingRecord.get().getResponseBody() != null) {
            try {
                BookingDto cachedDto = objectMapper.readValue(existingRecord.get().getResponseBody(), BookingDto.class);
                return new BookingResult(cachedDto, true);
            } catch (Exception ignored) {
                // fallback
            }
        }

        // 3. Блокировка строки ресторана ВО ВТОРУЮ ОЧЕРЕДЬ
        restaurantRepository.findByIdForUpdate(restaurant.getId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        // 4. Поиск наименьшего свободного столика без наложений
        UUID tableId = bookingRepository.findAvailableTable(restaurant.getId(), cmd.partySize(), cmd.startsAt(), endsAt)
                .orElseThrow(() -> new DomainException(ErrorCode.BOOKING_NO_AVAILABILITY));

        // 5. Создание и сохранение бронирования
        Booking booking = new Booking();
        booking.setReference(generateReference());
        booking.setRestaurantId(restaurant.getId());
        booking.setTableId(tableId);
        booking.setCustomerId(cmd.customerId());
        booking.setGuestName(cmd.guestName());
        booking.setGuestPhone(cmd.guestPhone());
        booking.setTelegramUserId(cmd.telegramUserId());
        booking.setPartySize(cmd.partySize());
        booking.setStartsAt(cmd.startsAt());
        booking.setEndsAt(endsAt);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSource(cmd.source());
        booking.setConsentVersion(cmd.consentVersion());
        booking.setCreatedAt(Instant.now(clock));

        Booking savedBooking = bookingRepository.save(booking);
        String label = resolveTableLabel(savedBooking.getTableId());
        BookingDto dto = BookingDto.fromEntity(savedBooking, label);

        // 6. Сохранение ответа в записи идемпотентности
        try {
            String responseJson = objectMapper.writeValueAsString(dto);
            idempotencyService.saveRecord(scope, cmd.idempotencyKey(), requestHash, 201, responseJson);
        } catch (Exception ignored) {
        }

        return new BookingResult(dto, false);
    }

    @Transactional(readOnly = true)
    public BookingPageDto listMyBookings(String customerEmail, int page, int size) {
        AppUser user = authService.requireActiveUser(customerEmail);
        if (user.getRole() != UserRole.CUSTOMER) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }

        int boundedSize = Math.min(Math.max(size, 1), 100);
        Page<Booking> bookings = bookingRepository.findByCustomerIdOrderByStartsAtDesc(
                user.getId(),
                PageRequest.of(Math.max(page, 0), boundedSize)
        );

        List<BookingDto> items = bookings.getContent().stream()
                .map(b -> BookingDto.fromEntity(b, resolveTableLabel(b.getTableId())))
                .toList();

        return new BookingPageDto(items, bookings.getNumber(), bookings.getSize(), bookings.getTotalElements());
    }

    @Transactional(readOnly = true)
    public BookingDto getBooking(UUID bookingId, String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);
        Booking booking = findAccessibleBooking(bookingId, user);
        return BookingDto.fromEntity(booking, resolveTableLabel(booking.getTableId()));
    }

    @Transactional
    public BookingDto cancelBooking(UUID bookingId, String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);
        Booking booking = findAccessibleBooking(bookingId, user);

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStartsAt().isBefore(Instant.now(clock))) {
            throw new DomainException(ErrorCode.BOOKING_NOT_MODIFIABLE);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now(clock));
        booking.setCancelledBy(user.getRole() == UserRole.CUSTOMER ? "CUSTOMER" : "OWNER");

        Booking saved = bookingRepository.save(booking);
        return BookingDto.fromEntity(saved, resolveTableLabel(saved.getTableId()));
    }

    @Transactional
    public BookingResult rescheduleBooking(
            UUID bookingId,
            Instant newStartsAt,
            String idempotencyKey,
            String currentUserEmail
    ) {
        AppUser user = authService.requireActiveUser(currentUserEmail);
        Booking booking = findAccessibleBooking(bookingId, user);

        if (booking.getStatus() != BookingStatus.CONFIRMED || booking.getStartsAt().isBefore(Instant.now(clock))) {
            throw new DomainException(ErrorCode.BOOKING_NOT_MODIFIABLE);
        }

        Restaurant restaurant = restaurantRepository.findById(booking.getRestaurantId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        Instant newEndsAt = validateBookingSlotAndRules(restaurant, newStartsAt, booking.getPartySize());

        // 1. Строгий порядок блокировок: сначала строка идемпотентности
        String scope = "RESCHEDULE_BOOKING:" + booking.getId();
        String payloadToHash = booking.getId() + ":" + newStartsAt;
        String requestHash = IdempotencyService.computeHash(payloadToHash);

        Optional<IdempotencyRecord> existingRecord = idempotencyService.lockAndCheck(scope, idempotencyKey, requestHash);
        if (existingRecord.isPresent() && existingRecord.get().getResponseBody() != null) {
            try {
                BookingDto cachedDto = objectMapper.readValue(existingRecord.get().getResponseBody(), BookingDto.class);
                return new BookingResult(cachedDto, true);
            } catch (Exception ignored) {
            }
        }

        // 2. Во вторую очередь: блокировка строки ресторана FOR UPDATE
        restaurantRepository.findByIdForUpdate(restaurant.getId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        // 3. Поиск свободного столика (исключая текущее переносимое бронирование)
        UUID newTableId = bookingRepository.findAvailableTableExcludingBooking(
                        restaurant.getId(),
                        booking.getPartySize(),
                        newStartsAt,
                        newEndsAt,
                        booking.getId()
                )
                .orElseThrow(() -> new DomainException(ErrorCode.BOOKING_NO_AVAILABILITY));

        booking.setTableId(newTableId);
        booking.setStartsAt(newStartsAt);
        booking.setEndsAt(newEndsAt);

        Booking saved = bookingRepository.save(booking);
        BookingDto dto = BookingDto.fromEntity(saved, resolveTableLabel(saved.getTableId()));

        try {
            String responseJson = objectMapper.writeValueAsString(dto);
            idempotencyService.saveRecord(scope, idempotencyKey, requestHash, 200, responseJson);
        } catch (Exception ignored) {
        }

        return new BookingResult(dto, false);
    }

    @Transactional(readOnly = true)
    public List<RestaurantBookingDto> listRestaurantBookings(
            UUID restaurantId,
            LocalDate fromDate,
            LocalDate toDate,
            String currentUserEmail
    ) {
        if (toDate.isBefore(fromDate)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        AppUser user = authService.requireActiveUser(currentUserEmail);
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (user.getRole() == UserRole.OWNER && !restaurant.getOwnerId().equals(user.getId())) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        ZoneId zone = ZoneId.of(restaurant.getTimeZone());
        Instant fromInstant = fromDate.atStartOfDay(zone).toInstant();
        Instant toInstant = toDate.plusDays(1).atStartOfDay(zone).toInstant();

        List<Booking> bookings = bookingRepository.findByRestaurantIdAndStartsAtBetweenOrderByStartsAtAsc(
                restaurantId,
                fromInstant,
                toInstant
        );

        return bookings.stream()
                .map(b -> {
                    String label = resolveTableLabel(b.getTableId());
                    String customerEmail = null;
                    if (b.getCustomerId() != null) {
                        customerEmail = userRepository.findById(b.getCustomerId())
                                .map(AppUser::getEmail)
                                .orElse(null);
                    }
                    return RestaurantBookingDto.fromEntity(b, label, customerEmail);
                })
                .toList();
    }

    private Booking findAccessibleBooking(UUID bookingId, AppUser user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (user.getRole() == UserRole.CUSTOMER) {
            if (booking.getCustomerId() == null || !booking.getCustomerId().equals(user.getId())) {
                throw new DomainException(ErrorCode.NOT_FOUND);
            }
        } else if (user.getRole() == UserRole.OWNER) {
            Restaurant restaurant = restaurantRepository.findById(booking.getRestaurantId())
                    .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
            if (!restaurant.getOwnerId().equals(user.getId())) {
                throw new DomainException(ErrorCode.NOT_FOUND);
            }
        }
        return booking;
    }

    private Instant validateBookingSlotAndRules(Restaurant restaurant, Instant startsAt, int partySize) {
        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.RESTAURANT_NOT_BOOKABLE);
        }

        ZoneId zone = ZoneId.of(restaurant.getTimeZone());
        ZonedDateTime bookingStartLocal = startsAt.atZone(zone);
        ZonedDateTime nowLocal = Instant.now(clock).atZone(zone);

        int slotMinutes = restaurant.getSlotMinutes();
        if (bookingStartLocal.getMinute() % slotMinutes != 0 || bookingStartLocal.getSecond() != 0) {
            throw new DomainException(ErrorCode.BOOKING_SLOT_INVALID);
        }

        if (startsAt.isBefore(Instant.now(clock).plus(restaurant.getMinLeadMinutes(), ChronoUnit.MINUTES))) {
            throw new DomainException(ErrorCode.BOOKING_TOO_SOON, restaurant.getMinLeadMinutes());
        }

        if (bookingStartLocal.toLocalDate().isAfter(nowLocal.toLocalDate().plusDays(restaurant.getMaxAdvanceDays()))) {
            throw new DomainException(ErrorCode.BOOKING_TOO_FAR, restaurant.getMaxAdvanceDays());
        }

        int maxSeats = tableRepository.findMaxActiveSeats(restaurant.getId());
        if (partySize > maxSeats) {
            throw new DomainException(ErrorCode.BOOKING_PARTY_SIZE, maxSeats);
        }

        Instant endsAt = startsAt.plus(restaurant.getSittingMinutes(), ChronoUnit.MINUTES);
        ZonedDateTime bookingEndLocal = endsAt.atZone(zone);

        int dayOfWeek = bookingStartLocal.getDayOfWeek().getValue();
        OpeningHours hours = openingHoursRepository.findByRestaurantIdAndDayOfWeek(restaurant.getId(), dayOfWeek)
                .orElseThrow(() -> new DomainException(ErrorCode.BOOKING_OUTSIDE_HOURS));

        LocalTime startTime = bookingStartLocal.toLocalTime();
        LocalTime endTime = bookingEndLocal.toLocalTime();

        if (startTime.isBefore(hours.getOpensAt())
                || endTime.isAfter(hours.getClosesAt())
                || bookingStartLocal.toLocalDate().isBefore(bookingEndLocal.toLocalDate())) {
            throw new DomainException(ErrorCode.BOOKING_OUTSIDE_HOURS);
        }

        return endsAt;
    }

    private String resolveTableLabel(UUID tableId) {
        return tableRepository.findById(tableId)
                .map(DiningTable::getLabel)
                .orElse("Table");
    }

    public static String generateReference() {
        StringBuilder sb = new StringBuilder("TM-");
        for (int i = 0; i < 6; i++) {
            sb.append(REFERENCE_CHARS.charAt(RANDOM.nextInt(REFERENCE_CHARS.length())));
        }
        return sb.toString();
    }
}
