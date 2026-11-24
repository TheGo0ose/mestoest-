package com.tablemint.stats.service;

import com.tablemint.auth.service.AuthService;
import com.tablemint.booking.model.Booking;
import com.tablemint.booking.model.BookingSource;
import com.tablemint.booking.model.BookingStatus;
import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private RestaurantRepository restaurantRepository;
    @Mock private AuthService authService;

    private StatsService statsService;
    private UUID restaurantId;
    private UUID ownerId;
    private Restaurant restaurant;

    @BeforeEach
    void setUp() {
        statsService = new StatsService(bookingRepository, restaurantRepository, authService);

        restaurantId = UUID.randomUUID();
        ownerId = UUID.randomUUID();

        restaurant = new Restaurant();
        restaurant.setId(restaurantId);
        restaurant.setOwnerId(ownerId);
        restaurant.setTimeZone("Asia/Bishkek");
    }

    @Test
    @DisplayName("getBookingStats computes totals, cancellation rate (BigDecimal scale=2), and daily series")
    void shouldComputeBookingStats() {
        AppUser owner = new AppUser();
        owner.setId(ownerId);
        owner.setRole(UserRole.OWNER);

        Booking b1 = new Booking();
        b1.setRestaurantId(restaurantId);
        b1.setPartySize(4);
        b1.setStatus(BookingStatus.CONFIRMED);
        b1.setSource(BookingSource.WEB);
        b1.setStartsAt(Instant.parse("2026-11-05T13:00:00Z")); // 2026-11-05 19:00 Bishkek

        Booking b2 = new Booking();
        b2.setRestaurantId(restaurantId);
        b2.setPartySize(2);
        b2.setStatus(BookingStatus.CANCELLED);
        b2.setSource(BookingSource.TELEGRAM);
        b2.setStartsAt(Instant.parse("2026-11-05T14:00:00Z"));

        when(authService.requireActiveUser("owner1@tablemint.local")).thenReturn(owner);
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(bookingRepository.findByRestaurantIdInAndStartsAtBetweenOrderByStartsAtAsc(any(), any(), any()))
                .thenReturn(List.of(b1, b2));

        StatsService.BookingStatsDto stats = statsService.getBookingStats(
                restaurantId,
                LocalDate.of(2026, 11, 5),
                LocalDate.of(2026, 11, 6),
                "owner1@tablemint.local"
        );

        assertEquals(2, stats.totalBookings());
        assertEquals(4, stats.totalCovers());
        assertEquals(1, stats.cancelledBookings());
        assertEquals(new BigDecimal("0.50"), stats.cancellationRate());
        assertEquals(1, stats.webBookings());
        assertEquals(1, stats.telegramBookings());
        assertEquals(2, stats.dailySeries().size());
        assertEquals(2, stats.dailySeries().get(0).bookings());
        assertEquals(4, stats.dailySeries().get(0).covers());
    }
}
