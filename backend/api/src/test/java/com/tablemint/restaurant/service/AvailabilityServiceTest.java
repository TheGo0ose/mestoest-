package com.tablemint.restaurant.service;

import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.restaurant.model.OpeningHours;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.DiningTableRepository;
import com.tablemint.restaurant.repository.OpeningHoursRepository;
import com.tablemint.restaurant.repository.RestaurantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock private RestaurantRepository restaurantRepository;
    @Mock private OpeningHoursRepository openingHoursRepository;
    @Mock private DiningTableRepository tableRepository;
    @Mock private BookingRepository bookingRepository;

    private AvailabilityService availabilityService;
    private UUID restaurantId;
    private Restaurant restaurant;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-11-02T06:00:00Z"), ZoneId.of("Asia/Bishkek"));
        availabilityService = new AvailabilityService(
                restaurantRepository,
                openingHoursRepository,
                tableRepository,
                bookingRepository,
                clock
        );

        restaurantId = UUID.randomUUID();
        restaurant = new Restaurant();
        restaurant.setId(restaurantId);
        restaurant.setTimeZone("Asia/Bishkek");
        restaurant.setStatus(RestaurantStatus.PUBLISHED);
        restaurant.setSittingMinutes(120);
        restaurant.setSlotMinutes(30);
        restaurant.setMinLeadMinutes(60);
        restaurant.setMaxAdvanceDays(60);
    }

    @Test
    @DisplayName("getAvailability returns RFC 3339 formatted slots when tables are free")
    void shouldReturnAvailableSlots() {
        LocalDate date = LocalDate.of(2026, 11, 5);
        OpeningHours hours = new OpeningHours();
        hours.setRestaurantId(restaurantId);
        hours.setDayOfWeek(date.getDayOfWeek().getValue());
        hours.setOpensAt(LocalTime.of(18, 0));
        hours.setClosesAt(LocalTime.of(21, 0));

        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(tableRepository.findMaxActiveSeats(restaurantId)).thenReturn(6);
        when(openingHoursRepository.findByRestaurantIdAndDayOfWeek(restaurantId, date.getDayOfWeek().getValue()))
                .thenReturn(Optional.of(hours));
        when(bookingRepository.findAvailableTable(eq(restaurantId), eq(4), any(), any()))
                .thenReturn(Optional.of(UUID.randomUUID()));

        AvailabilityService.AvailabilityResponse response = availabilityService.getAvailability(restaurantId, date, 4);

        assertEquals(3, response.slots().size());
        assertEquals("2026-11-05T18:00:00+06:00", response.slots().get(0));
        assertEquals("2026-11-05T18:30:00+06:00", response.slots().get(1));
        assertEquals("2026-11-05T19:00:00+06:00", response.slots().get(2));
    }

    @Test
    @DisplayName("getAvailability throws BOOKING_PARTY_SIZE when partySize exceeds max table seats")
    void shouldThrowPartySizeWhenExceedingMaxSeats() {
        LocalDate date = LocalDate.of(2026, 11, 5);
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(tableRepository.findMaxActiveSeats(restaurantId)).thenReturn(6);

        DomainException ex = assertThrows(
                DomainException.class,
                () -> availabilityService.getAvailability(restaurantId, date, 10)
        );
        assertEquals(ErrorCode.BOOKING_PARTY_SIZE, ex.getErrorCode());
    }
}
