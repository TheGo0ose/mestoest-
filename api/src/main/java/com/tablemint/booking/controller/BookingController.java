package com.tablemint.booking.controller;

import com.tablemint.booking.model.Booking;
import com.tablemint.booking.model.BookingSource;
import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.booking.service.BookingService;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.restaurant.model.DiningTable;
import com.tablemint.restaurant.repository.DiningTableRepository;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final DiningTableRepository tableRepository;
    private final UserRepository userRepository;

    public BookingController(
            BookingService bookingService,
            BookingRepository bookingRepository,
            DiningTableRepository tableRepository,
            UserRepository userRepository
    ) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.tableRepository = tableRepository;
        this.userRepository = userRepository;
    }

    public record CreateBookingRequest(
            @NotNull UUID restaurantId,
            @NotNull Instant startsAt,
            @Min(1) int partySize,
            boolean consentAccepted,
            @NotBlank String consentVersion
    ) {}

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

    @PostMapping("/bookings")
    public ResponseEntity<BookingDto> createBooking(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateBookingRequest req,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }

        AppUser user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));

        BookingService.CreateBookingCmd cmd = new BookingService.CreateBookingCmd(
                req.restaurantId(),
                req.startsAt(),
                req.partySize(),
                user.getId(),
                null,
                null,
                null,
                BookingSource.WEB,
                req.consentAccepted(),
                req.consentVersion(),
                idempotencyKey
        );

        BookingService.BookingResult result = bookingService.createBooking(cmd);
        String label = tableRepository.findById(result.booking().getTableId())
                .map(DiningTable::getLabel)
                .orElse("Table");

        HttpHeaders headers = new HttpHeaders();
        if (result.isReplayed()) {
            headers.add("Idempotent-Replayed", "true");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(headers)
                .body(BookingDto.fromEntity(result.booking(), label));
    }

    @GetMapping("/me/bookings")
    public ResponseEntity<Map<String, Object>> listMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }

        AppUser user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));

        int boundedSize = Math.min(Math.max(size, 1), 100);
        Page<Booking> bookings = bookingRepository.findByCustomerIdOrderByStartsAtDesc(user.getId(), PageRequest.of(page, boundedSize));

        List<BookingDto> items = bookings.getContent().stream()
                .map(b -> {
                    String label = tableRepository.findById(b.getTableId()).map(DiningTable::getLabel).orElse("Table");
                    return BookingDto.fromEntity(b, label);
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", items);
        response.put("page", bookings.getNumber());
        response.put("size", bookings.getSize());
        response.put("totalItems", bookings.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<BookingDto> getBooking(@PathVariable UUID bookingId, Authentication authentication) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        String label = tableRepository.findById(booking.getTableId()).map(DiningTable::getLabel).orElse("Table");
        return ResponseEntity.ok(BookingDto.fromEntity(booking, label));
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<BookingDto> cancelBooking(@PathVariable UUID bookingId, Authentication authentication) {
        Booking booking = bookingService.cancelBooking(bookingId, authentication != null ? authentication.getName() : "CUSTOMER");
        String label = tableRepository.findById(booking.getTableId()).map(DiningTable::getLabel).orElse("Table");
        return ResponseEntity.ok(BookingDto.fromEntity(booking, label));
    }
}
