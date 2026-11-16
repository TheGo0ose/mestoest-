package com.tablemint.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tablemint.auth.service.AuthService;
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
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.model.UserStatus;
import com.tablemint.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private RestaurantRepository restaurantRepository;
    @Mock private DiningTableRepository tableRepository;
    @Mock private OpeningHoursRepository openingHoursRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuthService authService;
    @Mock private IdempotencyService idempotencyService;

    private Clock fixedClock;
    private ObjectMapper objectMapper;
    private BookingService bookingService;

    private UUID restaurantId;
    private UUID tableId;
    private UUID customerId;
    private Restaurant publishedRestaurant;
    private OpeningHours openingHours;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-11-02T06:00:00Z"), ZoneId.of("Asia/Bishkek"));
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        bookingService = new BookingService(
                bookingRepository,
                restaurantRepository,
                tableRepository,
                openingHoursRepository,
                userRepository,
                authService,
                idempotencyService,
                fixedClock,
                objectMapper
        );

        restaurantId = UUID.randomUUID();
        tableId = UUID.randomUUID();
        customerId = UUID.randomUUID();

        publishedRestaurant = new Restaurant();
        publishedRestaurant.setId(restaurantId);
        publishedRestaurant.setOwnerId(UUID.randomUUID());
        publishedRestaurant.setName("TableMint Bistro");
        publishedRestaurant.setTimeZone("Asia/Bishkek");
        publishedRestaurant.setStatus(RestaurantStatus.PUBLISHED);
        publishedRestaurant.setSittingMinutes(120);
        publishedRestaurant.setSlotMinutes(30);
        publishedRestaurant.setMinLeadMinutes(60);
        publishedRestaurant.setMaxAdvanceDays(60);

        openingHours = new OpeningHours();
        openingHours.setRestaurantId(restaurantId);
        openingHours.setDayOfWeek(4); // Thursday 2026-11-05
        openingHours.setOpensAt(LocalTime.of(11, 0));
        openingHours.setClosesAt(LocalTime.of(23, 0));
    }

    @Test
    @DisplayName("createBooking enforces strict lock order: idempotency_record FIRST, restaurant FOR UPDATE SECOND")
    void shouldEnforceStrictLockOrderOnCreateBooking() {
        Instant startsAt = Instant.parse("2026-11-05T13:00:00Z"); // 19:00 Asia/Bishkek

        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(publishedRestaurant));
        when(tableRepository.findMaxActiveSeats(restaurantId)).thenReturn(6);
        when(openingHoursRepository.findByRestaurantIdAndDayOfWeek(restaurantId, 4)).thenReturn(Optional.of(openingHours));
        when(idempotencyService.lockAndCheck(anyString(), eq("idem-1"), anyString())).thenReturn(Optional.empty());
        when(restaurantRepository.findByIdForUpdate(restaurantId)).thenReturn(Optional.of(publishedRestaurant));
        when(bookingRepository.findAvailableTable(eq(restaurantId), eq(4), eq(startsAt), any())).thenReturn(Optional.of(tableId));

        DiningTable table = new DiningTable();
        table.setId(tableId);
        table.setLabel("B1");
        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));

        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        BookingService.CreateBookingCmd cmd = new BookingService.CreateBookingCmd(
                restaurantId, startsAt, 4, customerId, null, null, null,
                BookingSource.WEB, true, "1.0", "idem-1"
        );

        BookingService.BookingResult result = bookingService.createBooking(cmd);

        assertFalse(result.isReplayed());
        assertNotNull(result.booking().id());
        assertEquals("B1", result.booking().tableLabel());
        assertTrue(result.booking().reference().startsWith("TM-"));

        InOrder inOrder = inOrder(idempotencyService, restaurantRepository, bookingRepository);
        inOrder.verify(idempotencyService).lockAndCheck(anyString(), eq("idem-1"), anyString());
        inOrder.verify(restaurantRepository).findByIdForUpdate(restaurantId);
        inOrder.verify(bookingRepository).findAvailableTable(eq(restaurantId), eq(4), eq(startsAt), any());
    }

    @Test
    @DisplayName("createBooking throws CONSENT_REQUIRED when consentAccepted is false")
    void shouldThrowConsentRequired() {
        BookingService.CreateBookingCmd cmd = new BookingService.CreateBookingCmd(
                restaurantId, Instant.parse("2026-11-05T13:00:00Z"), 2, customerId, null, null, null,
                BookingSource.WEB, false, "1.0", "idem-2"
        );

        DomainException ex = assertThrows(DomainException.class, () -> bookingService.createBooking(cmd));
        assertEquals(ErrorCode.CONSENT_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("createBooking throws BOOKING_SLOT_INVALID when time is not aligned to slotMinutes")
    void shouldThrowSlotInvalid() {
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(publishedRestaurant));

        BookingService.CreateBookingCmd cmd = new BookingService.CreateBookingCmd(
                restaurantId, Instant.parse("2026-11-05T13:15:00Z"), 2, customerId, null, null, null,
                BookingSource.WEB, true, "1.0", "idem-3"
        );

        DomainException ex = assertThrows(DomainException.class, () -> bookingService.createBooking(cmd));
        assertEquals(ErrorCode.BOOKING_SLOT_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("cancelBooking marks booking CANCELLED and sets cancelledAt")
    void shouldCancelBooking() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setReference("TM-123456");
        booking.setRestaurantId(restaurantId);
        booking.setTableId(tableId);
        booking.setCustomerId(customerId);
        booking.setPartySize(2);
        booking.setStartsAt(Instant.parse("2026-11-05T13:00:00Z"));
        booking.setEndsAt(Instant.parse("2026-11-05T15:00:00Z"));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSource(BookingSource.WEB);

        AppUser customer = new AppUser();
        customer.setId(customerId);
        customer.setEmail("customer1@tablemint.local");
        customer.setRole(UserRole.CUSTOMER);
        customer.setStatus(UserStatus.ACTIVE);

        when(authService.requireActiveUser("customer1@tablemint.local")).thenReturn(customer);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tableRepository.findById(tableId)).thenReturn(Optional.empty());

        BookingService.BookingDto dto = bookingService.cancelBooking(bookingId, "customer1@tablemint.local");

        assertEquals("CANCELLED", dto.status());
        assertNotNull(dto.cancelledAt());
    }
}
