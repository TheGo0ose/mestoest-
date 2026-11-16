package com.tablemint.stats.service;

import com.tablemint.auth.service.AuthService;
import com.tablemint.booking.model.Booking;
import com.tablemint.booking.model.BookingSource;
import com.tablemint.booking.model.BookingStatus;
import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class StatsService {

    private final BookingRepository bookingRepository;
    private final RestaurantRepository restaurantRepository;
    private final AuthService authService;

    public StatsService(
            BookingRepository bookingRepository,
            RestaurantRepository restaurantRepository,
            AuthService authService
    ) {
        this.bookingRepository = bookingRepository;
        this.restaurantRepository = restaurantRepository;
        this.authService = authService;
    }

    public record DailyStatsPointDto(
            LocalDate date,
            int bookings,
            int covers
    ) {}

    public record BookingStatsDto(
            int totalBookings,
            int totalCovers,
            int cancelledBookings,
            BigDecimal cancellationRate,
            int webBookings,
            int telegramBookings,
            List<DailyStatsPointDto> dailySeries
    ) {}

    @Transactional(readOnly = true)
    public BookingStatsDto getBookingStats(
            UUID restaurantId,
            LocalDate fromDate,
            LocalDate toDate,
            String currentUserEmail
    ) {
        if (fromDate == null || toDate == null || toDate.isBefore(fromDate)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        AppUser user = authService.requireActiveUser(currentUserEmail);

        List<Restaurant> targetRestaurants;
        if (restaurantId != null) {
            Restaurant r = restaurantRepository.findById(restaurantId)
                    .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
            if (user.getRole() == UserRole.OWNER && !r.getOwnerId().equals(user.getId())) {
                throw new DomainException(ErrorCode.NOT_FOUND);
            }
            targetRestaurants = List.of(r);
        } else {
            if (user.getRole() == UserRole.MODERATOR) {
                targetRestaurants = restaurantRepository.findAll();
            } else {
                targetRestaurants = restaurantRepository.findByOwnerId(user.getId());
            }
        }

        ZoneId zone = targetRestaurants.isEmpty()
                ? ZoneId.of("Asia/Bishkek")
                : ZoneId.of(targetRestaurants.get(0).getTimeZone());

        Instant fromInstant = fromDate.atStartOfDay(zone).toInstant();
        Instant toInstant = toDate.plusDays(1).atStartOfDay(zone).toInstant();

        List<Booking> bookings = targetRestaurants.isEmpty()
                ? Collections.emptyList()
                : bookingRepository.findByRestaurantIdInAndStartsAtBetweenOrderByStartsAtAsc(
                        targetRestaurants.stream().map(Restaurant::getId).toList(),
                        fromInstant,
                        toInstant
                );

        int totalBookings = bookings.size();
        int totalCovers = 0;
        int cancelledBookings = 0;
        int webBookings = 0;
        int telegramBookings = 0;

        Map<LocalDate, int[]> dailyMap = new LinkedHashMap<>();
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            dailyMap.put(cursor, new int[]{0, 0});
            cursor = cursor.plusDays(1);
        }

        for (Booking b : bookings) {
            if (b.getSource() == BookingSource.WEB) {
                webBookings++;
            } else if (b.getSource() == BookingSource.TELEGRAM) {
                telegramBookings++;
            }

            if (b.getStatus() == BookingStatus.CANCELLED) {
                cancelledBookings++;
            } else {
                totalCovers += b.getPartySize();
            }

            LocalDate bookingDate = b.getStartsAt().atZone(zone).toLocalDate();
            int[] counts = dailyMap.get(bookingDate);
            if (counts != null) {
                counts[0] += 1;
                if (b.getStatus() != BookingStatus.CANCELLED) {
                    counts[1] += b.getPartySize();
                }
            }
        }

        BigDecimal cancellationRate = totalBookings == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(cancelledBookings)
                        .divide(BigDecimal.valueOf(totalBookings), 2, RoundingMode.HALF_UP);

        List<DailyStatsPointDto> dailySeries = dailyMap.entrySet().stream()
                .map(e -> new DailyStatsPointDto(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        return new BookingStatsDto(
                totalBookings,
                totalCovers,
                cancelledBookings,
                cancellationRate,
                webBookings,
                telegramBookings,
                dailySeries
        );
    }
}
