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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AvailabilityService {

    private final RestaurantRepository restaurantRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final DiningTableRepository tableRepository;
    private final BookingRepository bookingRepository;
    private final Clock clock;

    public AvailabilityService(
            RestaurantRepository restaurantRepository,
            OpeningHoursRepository openingHoursRepository,
            DiningTableRepository tableRepository,
            BookingRepository bookingRepository,
            Clock clock
    ) {
        this.restaurantRepository = restaurantRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.tableRepository = tableRepository;
        this.bookingRepository = bookingRepository;
        this.clock = clock;
    }

    public record AvailabilityResponse(LocalDate date, int partySize, List<String> slots) {}

    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(UUID restaurantId, LocalDate date, int partySize) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        ZoneId zone = ZoneId.of(restaurant.getTimeZone());
        LocalDate today = LocalDate.now(clock.withZone(zone));

        if (date.isAfter(today.plusDays(restaurant.getMaxAdvanceDays()))) {
            throw new DomainException(ErrorCode.BOOKING_TOO_FAR, restaurant.getMaxAdvanceDays());
        }

        int maxSeats = tableRepository.findMaxActiveSeats(restaurantId);
        if (partySize > maxSeats) {
            throw new DomainException(ErrorCode.BOOKING_PARTY_SIZE, maxSeats);
        }

        int dayOfWeek = date.getDayOfWeek().getValue();
        Optional<OpeningHours> hoursOpt = openingHoursRepository.findByRestaurantIdAndDayOfWeek(restaurantId, dayOfWeek);
        if (hoursOpt.isEmpty()) {
            return new AvailabilityResponse(date, partySize, Collections.emptyList());
        }

        OpeningHours hours = hoursOpt.get();
        LocalTime openTime = hours.getOpensAt();
        LocalTime closeTime = hours.getClosesAt();

        int sittingMinutes = restaurant.getSittingMinutes();
        int slotMinutes = restaurant.getSlotMinutes();
        LocalTime lastSlotStart = closeTime.minusMinutes(sittingMinutes);

        if (lastSlotStart.isBefore(openTime)) {
            return new AvailabilityResponse(date, partySize, Collections.emptyList());
        }

        Instant now = Instant.now(clock);
        Instant minLeadInstant = now.plus(restaurant.getMinLeadMinutes(), ChronoUnit.MINUTES);

        List<String> availableSlots = new ArrayList<>();
        LocalTime current = openTime;

        while (!current.isAfter(lastSlotStart)) {
            ZonedDateTime slotZoned = ZonedDateTime.of(date, current, zone);
            Instant slotInstant = slotZoned.toInstant();

            if (!slotInstant.isBefore(minLeadInstant)) {
                Instant slotEndInstant = slotInstant.plus(sittingMinutes, ChronoUnit.MINUTES);
                Optional<UUID> freeTable = bookingRepository.findAvailableTable(restaurantId, partySize, slotInstant, slotEndInstant);
                if (freeTable.isPresent()) {
                    availableSlots.add(slotZoned.toString());
                }
            }

            current = current.plusMinutes(slotMinutes);
        }

        return new AvailabilityResponse(date, partySize, availableSlots);
    }
}
