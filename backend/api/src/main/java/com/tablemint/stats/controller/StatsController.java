package com.tablemint.stats.controller;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.stats.service.StatsService;
import com.tablemint.stats.service.StatsService.BookingStatsDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping({"/admin/stats", "/api/v1/admin/stats"})
@PreAuthorize("hasAnyRole('OWNER', 'MODERATOR')")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/bookings")
    public ResponseEntity<BookingStatsDto> getBookingStats(
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(statsService.getBookingStats(restaurantId, fromDate, toDate, authentication.getName()));
    }
}
