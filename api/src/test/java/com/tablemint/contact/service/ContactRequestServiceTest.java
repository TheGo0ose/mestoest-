package com.tablemint.contact.service;

import com.tablemint.auth.service.AuthService;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.common.ratelimit.RateLimitService;
import com.tablemint.contact.model.ContactRequest;
import com.tablemint.contact.model.ContactRequestStatus;
import com.tablemint.contact.repository.ContactRequestRepository;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContactRequestServiceTest {

    @Mock private ContactRequestRepository contactRequestRepository;
    @Mock private RestaurantRepository restaurantRepository;
    @Mock private AuthService authService;

    private Clock clock;
    private RateLimitService rateLimitService;
    private ContactRequestService contactRequestService;
    private UUID restaurantId;
    private Restaurant publishedRestaurant;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-11-02T06:00:00Z"), ZoneId.of("Asia/Bishkek"));
        rateLimitService = new RateLimitService(clock);
        contactRequestService = new ContactRequestService(
                contactRequestRepository,
                restaurantRepository,
                authService,
                rateLimitService,
                clock
        );

        restaurantId = UUID.randomUUID();
        publishedRestaurant = new Restaurant();
        publishedRestaurant.setId(restaurantId);
        publishedRestaurant.setOwnerId(UUID.randomUUID());
        publishedRestaurant.setStatus(RestaurantStatus.PUBLISHED);
    }

    @Test
    @DisplayName("createContactRequest saves and returns ContactRequestDto")
    void shouldCreateContactRequest() {
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(publishedRestaurant));
        when(contactRequestRepository.save(any(ContactRequest.class))).thenAnswer(inv -> {
            ContactRequest cr = inv.getArgument(0);
            cr.setId(UUID.randomUUID());
            return cr;
        });

        ContactRequestService.CreateContactRequestCmd cmd = new ContactRequestService.CreateContactRequestCmd(
                "Азамат", "+996555112233", null, "Здравствуйте, есть ли банкетный зал?", true, "1.0"
        );

        ContactRequestService.ContactRequestDto dto = contactRequestService.createContactRequest(restaurantId, cmd, "127.0.0.1");

        assertNotNull(dto.id());
        assertEquals("NEW", dto.status());
        assertEquals("WEB", dto.source());
        assertEquals("Азамат", dto.name());
    }

    @Test
    @DisplayName("createContactRequest throws VALIDATION_FAILED when neither phone nor email is provided")
    void shouldRejectWithoutPhoneOrEmail() {
        ContactRequestService.CreateContactRequestCmd cmd = new ContactRequestService.CreateContactRequestCmd(
                "Азамат", " ", "", "Вопрос", true, "1.0"
        );

        DomainException ex = assertThrows(
                DomainException.class,
                () -> contactRequestService.createContactRequest(restaurantId, cmd, "127.0.0.1")
        );
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("updateContactRequestStatus sets status to HANDLED and populates handledAt")
    void shouldHandleContactRequest() {
        UUID requestId = UUID.randomUUID();
        ContactRequest cr = new ContactRequest();
        cr.setId(requestId);
        cr.setRestaurantId(restaurantId);
        cr.setName("Азамат");
        cr.setPhone("+996555112233");
        cr.setMessage("Вопрос");
        cr.setStatus(ContactRequestStatus.NEW);

        AppUser owner = new AppUser();
        owner.setId(publishedRestaurant.getOwnerId());
        owner.setRole(UserRole.OWNER);

        when(authService.requireActiveUser("owner1@tablemint.local")).thenReturn(owner);
        when(contactRequestRepository.findById(requestId)).thenReturn(Optional.of(cr));
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(publishedRestaurant));
        when(contactRequestRepository.save(any(ContactRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactRequestService.ContactRequestDto updated = contactRequestService.updateContactRequestStatus(
                requestId,
                ContactRequestStatus.HANDLED,
                "owner1@tablemint.local"
        );

        assertEquals("HANDLED", updated.status());
        assertNotNull(updated.handledAt());
    }
}
