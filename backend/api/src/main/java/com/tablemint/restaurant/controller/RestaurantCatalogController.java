package com.tablemint.restaurant.controller;

import com.tablemint.contact.service.ContactRequestService;
import com.tablemint.contact.service.ContactRequestService.ContactRequestDto;
import com.tablemint.restaurant.service.AvailabilityService;
import com.tablemint.restaurant.service.RestaurantCatalogService;
import com.tablemint.restaurant.service.RestaurantCatalogService.PublicMenuDto;
import com.tablemint.restaurant.service.RestaurantCatalogService.RestaurantDetailDto;
import com.tablemint.restaurant.service.RestaurantCatalogService.RestaurantPageDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping({"/restaurants", "/api/v1/restaurants"})
public class RestaurantCatalogController {

    private final RestaurantCatalogService catalogService;
    private final AvailabilityService availabilityService;
    private final ContactRequestService contactRequestService;

    public RestaurantCatalogController(
            RestaurantCatalogService catalogService,
            AvailabilityService availabilityService,
            ContactRequestService contactRequestService
    ) {
        this.catalogService = catalogService;
        this.availabilityService = availabilityService;
        this.contactRequestService = contactRequestService;
    }

    public record CreateContactRequestBody(
            @NotBlank String name,
            String phone,
            String email,
            @NotBlank String message,
            boolean consentAccepted,
            @NotBlank String consentVersion
    ) {}

    @GetMapping
    public ResponseEntity<RestaurantPageDto> listRestaurants(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(catalogService.listRestaurants(query, page, size));
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<RestaurantDetailDto> getRestaurant(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(catalogService.getRestaurant(restaurantId));
    }

    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<PublicMenuDto> getMenu(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(catalogService.getMenu(restaurantId));
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
    public ResponseEntity<ContactRequestDto> createContactRequest(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CreateContactRequestBody req,
            HttpServletRequest httpRequest
    ) {
        String clientKey = httpRequest.getRemoteAddr() + ":" + restaurantId;
        ContactRequestDto created = contactRequestService.createContactRequest(
                restaurantId,
                new ContactRequestService.CreateContactRequestCmd(
                        req.name(),
                        req.phone(),
                        req.email(),
                        req.message(),
                        req.consentAccepted(),
                        req.consentVersion()
                ),
                clientKey
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
