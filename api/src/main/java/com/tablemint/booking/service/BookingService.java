package com.tablemint.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablemint.booking.model.Booking;
import com.tablemint.booking.model.BookingSource;
import com.tablemint.booking.model.BookingStatus;
import com.tablemint.booking.repository.BookingRepository;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.common.idempotency.IdempotencyRecord;
import com.tablemint.common.idempotency.IdempotencyService;
import com.tablemint.restaurant.model.DiningTable;
import com.tablemint.restaurant.model.OpeningHours;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.DiningTableRepository;
import com.tablemint.restaurant.repository.OpeningHoursRepository;
import com.tablemint.restaurant.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RestaurantRepository restaurantRepository;
    private final DiningTableRepository tableRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final IdempotencyService idempotencyService;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    private static final String REFERENCE_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused
    private static final SecureRandom RANDOM = new SecureRandom();

    public BookingService(
            BookingRepository bookingRepository,
            RestaurantRepository restaurantRepository,
            DiningTableRepository tableRepository,
            OpeningHoursRepository openingHoursRepository,
            IdempotencyService idempotencyService,
            Clock clock,
            ObjectMapper objectMapper
    ) {
        this.bookingRepository = bookingRepository;
        this.restaurantRepository = restaurantRepository;
        this.tableRepository = tableRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.idempotencyService = idempotencyService;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    public record CreateBookingCmd(
            UUID restaurantId,
            Instant startsAt,
            int partySize,
            UUID customerId,
            String guestName,
            String guestPhone,
            Long telegramUserId,
            BookingSource source,
            boolean consentAccepted,
            String consentVersion,
            String idempotencyKey
    ) {}

    public record BookingResult(Booking booking, boolean isReplayed) {}

    @Transactional
    public BookingResult createBooking(CreateBookingCmd cmd) {
        if (!cmd.consentAccepted()) {
            throw new DomainException(ErrorCode.CONSENT_REQUIRED);
        }

        // 1. Предварительная валидация ресторана и правил
        Restaurant restaurant = restaurantRepository.findById(cmd.restaurantId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.RESTAURANT_NOT_BOOKABLE);
        }

        ZoneId zone = ZoneId.of(restaurant.getTimeZone());
        ZonedDateTime bookingStartLocal = cmd.startsAt().atZone(zone);
        ZonedDateTime nowLocal = Instant.now(clock).atZone(zone);

        // Проверка сетки слотов (например, ровно на 00 или 30 минут)
        int slotMinutes = restaurant.getSlotMinutes();
        if (bookingStartLocal.getMinute() % slotMinutes != 0 || bookingStartLocal.getSecond() != 0) {
            throw new DomainException(ErrorCode.BOOKING_SLOT_INVALID);
        }

        // Проверка минимального опережения
        if (cmd.startsAt().isBefore(Instant.now(clock).plus(restaurant.getMinLeadMinutes(), ChronoUnit.MINUTES))) {
            throw new DomainException(ErrorCode.BOOKING_TOO_SOON, restaurant.getMinLeadMinutes());
        }

        // Проверка горизонта бронирования
        if (bookingStartLocal.toLocalDate().isAfter(nowLocal.toLocalDate().plusDays(restaurant.getMaxAdvanceDays()))) {
            throw new DomainException(ErrorCode.BOOKING_TOO_FAR, restaurant.getMaxAdvanceDays());
        }

        // Проверка вместимости столиков
        int maxSeats = tableRepository.findMaxActiveSeats(restaurant.getId());
        if (cmd.partySize() > maxSeats) {
            throw new DomainException(ErrorCode.BOOKING_PARTY_SIZE, maxSeats);
        }

        // Проверка часов работы
        Instant endsAt = cmd.startsAt().plus(restaurant.getSittingMinutes(), ChronoUnit.MINUTES);
        ZonedDateTime bookingEndLocal = endsAt.atZone(zone);

        int dayOfWeek = bookingStartLocal.getDayOfWeek().getValue();
        OpeningHours hours = openingHoursRepository.findByRestaurantIdAndDayOfWeek(restaurant.getId(), dayOfWeek)
                .orElseThrow(() -> new DomainException(ErrorCode.BOOKING_OUTSIDE_HOURS));

        LocalTime startTime = bookingStartLocal.toLocalTime();
        LocalTime endTime = bookingEndLocal.toLocalTime();

        if (startTime.isBefore(hours.getOpensAt()) || endTime.isAfter(hours.getClosesAt()) || bookingStartLocal.toLocalDate().isBefore(bookingEndLocal.toLocalDate())) {
            throw new DomainException(ErrorCode.BOOKING_OUTSIDE_HOURS);
        }

        // 2. Идемпотентность: блокировка строки idempotency_record В ПЕРВУЮ ОЧЕРЕДЬ
        String scope = "CREATE_BOOKING:" + restaurant.getId();
        String payloadToHash = cmd.restaurantId() + ":" + cmd.startsAt() + ":" + cmd.partySize() + ":"
                + (cmd.customerId() != null ? cmd.customerId() : cmd.guestPhone());
        String requestHash = IdempotencyService.computeHash(payloadToHash);

        Optional<IdempotencyRecord> existingRecord = idempotencyService.lockAndCheck(scope, cmd.idempotencyKey(), requestHash);
        if (existingRecord.isPresent() && existingRecord.get().getResponseBody() != null) {
            try {
                Booking cachedBooking = objectMapper.readValue(existingRecord.get().getResponseBody(), Booking.class);
                return new BookingResult(cachedBooking, true);
            } catch (Exception ignored) {
                // fallback to DB lookup if JSON deserialization fails
            }
        }

        // 3. Блокировка строки ресторана ВО ВТОРУЮ ОЧЕРЕДЬ
        restaurantRepository.findByIdForUpdate(restaurant.getId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        // 4. Поиск наименьшего свободного столика без наложений
        UUID tableId = bookingRepository.findAvailableTable(restaurant.getId(), cmd.partySize(), cmd.startsAt(), endsAt)
                .orElseThrow(() -> new DomainException(ErrorCode.BOOKING_NO_AVAILABILITY));

        // 5. Создание и сохранение бронирования
        Booking booking = new Booking();
        booking.setReference(generateReference());
        booking.setRestaurantId(restaurant.getId());
        booking.setTableId(tableId);
        booking.setCustomerId(cmd.customerId());
        booking.setGuestName(cmd.guestName());
        booking.setGuestPhone(cmd.guestPhone());
        booking.setTelegramUserId(cmd.telegramUserId());
        booking.setPartySize(cmd.partySize());
        booking.setStartsAt(cmd.startsAt());
        booking.setEndsAt(endsAt);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSource(cmd.source());
        booking.setConsentVersion(cmd.consentVersion());
        booking.setCreatedAt(Instant.now(clock));

        Booking savedBooking = bookingRepository.save(booking);

        // 6. Сохранение ответа в записи идемпотентности
        try {
            String responseJson = objectMapper.writeValueAsString(savedBooking);
            idempotencyService.saveRecord(scope, cmd.idempotencyKey(), requestHash, 201, responseJson);
        } catch (Exception e) {
            // Log warning, transaction will still complete
        }

        return new BookingResult(savedBooking, false);
    }

    @Transactional
    public Booking cancelBooking(UUID bookingId, String cancelledBy) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStartsAt().isBefore(Instant.now(clock))) {
            throw new DomainException(ErrorCode.BOOKING_NOT_MODIFIABLE);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now(clock));
        booking.setCancelledBy(cancelledBy);

        return bookingRepository.save(booking);
    }

    public static String generateReference() {
        StringBuilder sb = new StringBuilder("TM-");
        for (int i = 0; i < 6; i++) {
            sb.append(REFERENCE_CHARS.charAt(RANDOM.nextInt(REFERENCE_CHARS.length())));
        }
        return sb.toString();
    }
}
