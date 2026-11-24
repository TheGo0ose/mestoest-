package com.tablemint.booking.controller;

import com.tablemint.booking.service.BookingService;
import com.tablemint.booking.service.BookingService.BookingDto;
import com.tablemint.booking.service.BookingService.BookingPageDto;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    public record CreateBookingRequest(
            @NotNull UUID restaurantId,
            @NotNull Instant startsAt,
            @Min(1) int partySize,
            boolean consentAccepted,
            @NotBlank String consentVersion
    ) {}

    public record RescheduleBookingRequest(
            @NotNull Instant startsAt
    ) {}

    @PostMapping({"/bookings", "/api/v1/bookings"})
    public ResponseEntity<BookingDto> createBooking(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateBookingRequest req,
            Authentication authentication
    ) {
        String email = requireUserEmail(authentication);
        BookingService.BookingResult result = bookingService.createCustomerBooking(
                email,
                req.restaurantId(),
                req.startsAt(),
                req.partySize(),
                req.consentAccepted(),
                req.consentVersion(),
                idempotencyKey
        );

        HttpHeaders headers = new HttpHeaders();
        if (result.isReplayed()) {
            headers.add("Idempotent-Replayed", "true");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(headers)
                .body(result.booking());
    }

    @GetMapping({"/me/bookings", "/api/v1/me/bookings"})
    public ResponseEntity<BookingPageDto> listMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        String email = requireUserEmail(authentication);
        return ResponseEntity.ok(bookingService.listMyBookings(email, page, size));
    }

    @GetMapping({"/bookings/{bookingId}", "/api/v1/bookings/{bookingId}"})
    public ResponseEntity<BookingDto> getBooking(
            @PathVariable UUID bookingId,
            Authentication authentication
    ) {
        String email = requireUserEmail(authentication);
        return ResponseEntity.ok(bookingService.getBooking(bookingId, email));
    }

    @PostMapping({"/bookings/{bookingId}/cancel", "/api/v1/bookings/{bookingId}/cancel"})
    public ResponseEntity<BookingDto> cancelBooking(
            @PathVariable UUID bookingId,
            Authentication authentication
    ) {
        String email = requireUserEmail(authentication);
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, email));
    }

    @PostMapping({"/bookings/{bookingId}/reschedule", "/api/v1/bookings/{bookingId}/reschedule"})
    public ResponseEntity<BookingDto> rescheduleBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody RescheduleBookingRequest req,
            Authentication authentication
    ) {
        String email = requireUserEmail(authentication);
        BookingService.BookingResult result = bookingService.rescheduleBooking(
                bookingId,
                req.startsAt(),
                idempotencyKey,
                email
        );

        HttpHeaders headers = new HttpHeaders();
        if (result.isReplayed()) {
            headers.add("Idempotent-Replayed", "true");
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(result.booking());
    }

    private String requireUserEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }
}
