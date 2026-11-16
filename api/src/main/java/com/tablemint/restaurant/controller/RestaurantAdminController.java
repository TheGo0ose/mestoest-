package com.tablemint.restaurant.controller;

import com.tablemint.booking.service.BookingService;
import com.tablemint.booking.service.BookingService.RestaurantBookingDto;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.service.RestaurantAdminService;
import com.tablemint.restaurant.service.RestaurantAdminService.DiningTableDto;
import com.tablemint.restaurant.service.RestaurantAdminService.ManagedRestaurantDto;
import com.tablemint.restaurant.service.RestaurantCatalogService.OpeningHoursDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
@PreAuthorize("hasAnyRole('OWNER', 'MODERATOR')")
public class RestaurantAdminController {

    private final RestaurantAdminService adminService;
    private final BookingService bookingService;

    public RestaurantAdminController(RestaurantAdminService adminService, BookingService bookingService) {
        this.adminService = adminService;
        this.bookingService = bookingService;
    }

    public record CreateRestaurantRequest(
            @NotNull UUID ownerId,
            @NotBlank String name,
            String description,
            @NotBlank String address,
            @NotBlank String phone
    ) {}

    public record UpdateRestaurantRequest(
            String name,
            String description,
            String address,
            String phone,
            Integer sittingMinutes,
            Integer slotMinutes,
            Integer minLeadMinutes,
            Integer maxAdvanceDays
    ) {}

    public record PublicationRequest(
            @NotNull RestaurantStatus status
    ) {}

    public record CreateTableRequest(
            @NotBlank String label,
            @Min(1) @Max(50) int seats,
            Boolean active
    ) {}

    public record UpdateTableRequest(
            String label,
            @Min(1) @Max(50) Integer seats,
            Boolean active
    ) {}

    @GetMapping("/restaurants")
    public ResponseEntity<List<ManagedRestaurantDto>> listManagedRestaurants(Authentication authentication) {
        return ResponseEntity.ok(adminService.listManagedRestaurants(requireUserEmail(authentication)));
    }

    @PostMapping("/restaurants")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<ManagedRestaurantDto> createRestaurant(
            @Valid @RequestBody CreateRestaurantRequest req,
            Authentication authentication
    ) {
        ManagedRestaurantDto created = adminService.createRestaurant(
                new RestaurantAdminService.CreateRestaurantCmd(
                        req.ownerId(),
                        req.name(),
                        req.description(),
                        req.address(),
                        req.phone()
                ),
                requireUserEmail(authentication)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<ManagedRestaurantDto> getManagedRestaurant(
            @PathVariable UUID restaurantId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminService.getManagedRestaurant(restaurantId, requireUserEmail(authentication)));
    }

    @PatchMapping("/restaurants/{restaurantId}")
    public ResponseEntity<ManagedRestaurantDto> updateRestaurant(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody UpdateRestaurantRequest req,
            Authentication authentication
    ) {
        ManagedRestaurantDto updated = adminService.updateRestaurant(
                restaurantId,
                new RestaurantAdminService.UpdateRestaurantCmd(
                        req.name(),
                        req.description(),
                        req.address(),
                        req.phone(),
                        req.sittingMinutes(),
                        req.slotMinutes(),
                        req.minLeadMinutes(),
                        req.maxAdvanceDays()
                ),
                requireUserEmail(authentication)
        );
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/restaurants/{restaurantId}/publication")
    public ResponseEntity<ManagedRestaurantDto> setPublication(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody PublicationRequest req,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                adminService.setPublication(restaurantId, req.status(), requireUserEmail(authentication))
        );
    }

    @PutMapping("/restaurants/{restaurantId}/opening-hours")
    public ResponseEntity<List<OpeningHoursDto>> replaceOpeningHours(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody List<OpeningHoursDto> hours,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                adminService.replaceOpeningHours(restaurantId, hours, requireUserEmail(authentication))
        );
    }

    @GetMapping("/restaurants/{restaurantId}/tables")
    public ResponseEntity<List<DiningTableDto>> listTables(
            @PathVariable UUID restaurantId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminService.listTables(restaurantId, requireUserEmail(authentication)));
    }

    @PostMapping("/restaurants/{restaurantId}/tables")
    public ResponseEntity<DiningTableDto> createTable(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CreateTableRequest req,
            Authentication authentication
    ) {
        DiningTableDto created = adminService.createTable(
                restaurantId,
                req.label(),
                req.seats(),
                req.active(),
                requireUserEmail(authentication)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/tables/{tableId}")
    public ResponseEntity<DiningTableDto> updateTable(
            @PathVariable UUID tableId,
            @Valid @RequestBody UpdateTableRequest req,
            Authentication authentication
    ) {
        DiningTableDto updated = adminService.updateTable(
                tableId,
                req.label(),
                req.seats(),
                req.active(),
                requireUserEmail(authentication)
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/tables/{tableId}")
    public ResponseEntity<Void> deleteTable(
            @PathVariable UUID tableId,
            Authentication authentication
    ) {
        adminService.deleteTable(tableId, requireUserEmail(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/restaurants/{restaurantId}/bookings")
    public ResponseEntity<List<RestaurantBookingDto>> listRestaurantBookings(
            @PathVariable UUID restaurantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                bookingService.listRestaurantBookings(restaurantId, fromDate, toDate, requireUserEmail(authentication))
        );
    }

    private String requireUserEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }
}
