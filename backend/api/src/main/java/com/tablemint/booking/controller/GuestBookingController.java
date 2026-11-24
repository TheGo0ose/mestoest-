package com.tablemint.booking.controller;

import com.tablemint.booking.model.BookingSource;
import com.tablemint.booking.service.BookingService;
import com.tablemint.booking.service.BookingService.BookingDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping({"/guest", "/api/v1/guest"})
public class GuestBookingController {

    private final BookingService bookingService;

    public GuestBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    public record CreateGuestBookingRequest(
            @NotNull UUID restaurantId,
            @NotNull Instant startsAt,
            @Min(1) int partySize,
            @NotBlank String guestName,
            @NotBlank String guestPhone,
            @NotNull Long telegramUserId,
            boolean consentAccepted,
            @NotBlank String consentVersion
    ) {}

    @PostMapping("/bookings")
    @PreAuthorize("hasRole('BOT')")
    public ResponseEntity<BookingDto> createGuestBooking(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateGuestBookingRequest req
    ) {
        BookingService.CreateBookingCmd cmd = new BookingService.CreateBookingCmd(
                req.restaurantId(),
                req.startsAt(),
                req.partySize(),
                null,
                req.guestName(),
                req.guestPhone(),
                req.telegramUserId(),
                BookingSource.TELEGRAM,
                req.consentAccepted(),
                req.consentVersion(),
                idempotencyKey
        );

        BookingService.BookingResult result = bookingService.createBooking(cmd);

        HttpHeaders headers = new HttpHeaders();
        if (result.isReplayed()) {
            headers.add("Idempotent-Replayed", "true");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(headers)
                .body(result.booking());
    }
}
