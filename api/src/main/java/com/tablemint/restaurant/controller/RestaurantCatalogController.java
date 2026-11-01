package com.tablemint.restaurant.controller;

import com.tablemint.booking.model.BookingSource;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.contact.model.ContactRequest;
import com.tablemint.contact.repository.ContactRequestRepository;
import com.tablemint.menu.model.MenuItem;
import com.tablemint.menu.model.MenuSection;
import com.tablemint.menu.repository.MenuItemRepository;
import com.tablemint.menu.repository.MenuSectionRepository;
import com.tablemint.restaurant.model.OpeningHours;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.OpeningHoursRepository;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.restaurant.service.AvailabilityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/restaurants")
public class RestaurantCatalogController {

    private final RestaurantRepository restaurantRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final MenuSectionRepository menuSectionRepository;
    private final MenuItemRepository menuItemRepository;
    private final AvailabilityService availabilityService;
    private final ContactRequestRepository contactRequestRepository;

    public RestaurantCatalogController(
            RestaurantRepository restaurantRepository,
            OpeningHoursRepository openingHoursRepository,
            MenuSectionRepository menuSectionRepository,
            MenuItemRepository menuItemRepository,
            AvailabilityService availabilityService,
            ContactRequestRepository contactRequestRepository
    ) {
        this.restaurantRepository = restaurantRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.menuSectionRepository = menuSectionRepository;
        this.menuItemRepository = menuItemRepository;
        this.availabilityService = availabilityService;
        this.contactRequestRepository = contactRequestRepository;
    }

    public record OpeningHoursDto(int dayOfWeek, String opensAt, String closesAt) {
        public static OpeningHoursDto fromEntity(OpeningHours oh) {
            return new OpeningHoursDto(oh.getDayOfWeek(), oh.getOpensAt().toString(), oh.getClosesAt().toString());
        }
    }

    public record RestaurantDetailDto(
            UUID id,
            String name,
            String description,
            String address,
            String phone,
            String timeZone,
            int sittingMinutes,
            int slotMinutes,
            List<OpeningHoursDto> openingHours
    ) {
        public static RestaurantDetailDto fromEntity(Restaurant r, List<OpeningHours> hours) {
            return new RestaurantDetailDto(
                    r.getId(),
                    r.getName(),
                    r.getDescription(),
                    r.getAddress(),
                    r.getPhone(),
                    r.getTimeZone(),
                    r.getSittingMinutes(),
                    r.getSlotMinutes(),
                    hours.stream().map(OpeningHoursDto::fromEntity).toList()
            );
        }
    }

    public record MenuItemDto(UUID id, String name, String description, String priceAmount, String currency) {}
    public record MenuSectionDto(UUID id, String name, List<MenuItemDto> items) {}
    public record PublicMenuDto(List<MenuSectionDto> sections) {}

    public record CreateContactRequestBody(
            @NotBlank String name,
            String phone,
            String email,
            @NotBlank String message,
            boolean consentAccepted,
            @NotBlank String consentVersion
    ) {}

    @GetMapping
    public ResponseEntity<Map<String, Object>> listRestaurants(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int boundedSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageRequest = PageRequest.of(page, boundedSize);

        Page<Restaurant> result;
        if (query != null && !query.isBlank()) {
            result = restaurantRepository.findByStatusAndNameContainingIgnoreCase(RestaurantStatus.PUBLISHED, query.trim(), pageRequest);
        } else {
            result = restaurantRepository.findByStatus(RestaurantStatus.PUBLISHED, pageRequest);
        }

        List<RestaurantDetailDto> items = result.getContent().stream()
                .map(r -> RestaurantDetailDto.fromEntity(r, Collections.emptyList()))
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", items);
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalItems", result.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<RestaurantDetailDto> getRestaurant(@PathVariable UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        List<OpeningHours> hours = openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(restaurantId);
        return ResponseEntity.ok(RestaurantDetailDto.fromEntity(restaurant, hours));
    }

    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<PublicMenuDto> getMenu(@PathVariable UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        List<MenuSection> sections = menuSectionRepository.findByRestaurantIdOrderByPositionAsc(restaurantId);
        List<MenuSectionDto> sectionDtos = new ArrayList<>();

        for (MenuSection sec : sections) {
            List<MenuItem> items = menuItemRepository.findBySectionIdAndAvailableTrueOrderByPositionAsc(sec.getId());
            List<MenuItemDto> itemDtos = items.stream()
                    .map(i -> new MenuItemDto(i.getId(), i.getName(), i.getDescription(), i.getPriceAmount().toPlainString(), i.getCurrency()))
                    .toList();
            sectionDtos.add(new MenuSectionDto(sec.getId(), sec.getName(), itemDtos));
        }

        return ResponseEntity.ok(new PublicMenuDto(sectionDtos));
    }

    @GetMapping("/{restaurantId}/availability")
    public ResponseEntity<AvailabilityService.AvailabilityResponse> getAvailability(
            @PathVariable UUID restaurantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int partySize
    ) {
        return ResponseEntity.ok(availabilityService.getAvailability(restaurantId, date, partySize));
    }

    @PostMapping("/{restaurantId}/contact-requests")
    public ResponseEntity<Map<String, Object>> createContactRequest(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CreateContactRequestBody req
    ) {
        if (!req.consentAccepted()) {
            throw new DomainException(ErrorCode.CONSENT_REQUIRED);
        }
        if ((req.phone() == null || req.phone().isBlank()) && (req.email() == null || req.email().isBlank())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        ContactRequest cr = new ContactRequest();
        cr.setRestaurantId(restaurant.getId());
        cr.setName(req.name());
        cr.setPhone(req.phone());
        cr.setEmail(req.email());
        cr.setMessage(req.message());
        cr.setSource(BookingSource.WEB);
        cr.setConsentVersion(req.consentVersion());
        cr.setCreatedAt(Instant.now());

        ContactRequest saved = contactRequestRepository.save(cr);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", saved.getId());
        body.put("restaurantId", saved.getRestaurantId());
        body.put("status", saved.getStatus().name());
        body.put("createdAt", saved.getCreatedAt().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
