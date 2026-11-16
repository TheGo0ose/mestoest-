package com.tablemint.contact.service;

import com.tablemint.auth.service.AuthService;
import com.tablemint.booking.model.BookingSource;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class ContactRequestService {

    private final ContactRequestRepository contactRequestRepository;
    private final RestaurantRepository restaurantRepository;
    private final AuthService authService;
    private final RateLimitService rateLimitService;
    private final Clock clock;

    public ContactRequestService(
            ContactRequestRepository contactRequestRepository,
            RestaurantRepository restaurantRepository,
            AuthService authService,
            RateLimitService rateLimitService,
            Clock clock
    ) {
        this.contactRequestRepository = contactRequestRepository;
        this.restaurantRepository = restaurantRepository;
        this.authService = authService;
        this.rateLimitService = rateLimitService;
        this.clock = clock;
    }

    public record CreateContactRequestCmd(
            String name,
            String phone,
            String email,
            String message,
            boolean consentAccepted,
            String consentVersion
    ) {}

    public record ContactRequestDto(
            UUID id,
            UUID restaurantId,
            String name,
            String phone,
            String email,
            String message,
            String source,
            String status,
            Instant createdAt,
            Instant handledAt
    ) {
        public static ContactRequestDto fromEntity(ContactRequest cr) {
            return new ContactRequestDto(
                    cr.getId(),
                    cr.getRestaurantId(),
                    cr.getName(),
                    cr.getPhone(),
                    cr.getEmail(),
                    cr.getMessage(),
                    cr.getSource().name(),
                    cr.getStatus().name(),
                    cr.getCreatedAt(),
                    cr.getHandledAt()
            );
        }
    }

    @Transactional
    public ContactRequestDto createContactRequest(UUID restaurantId, CreateContactRequestCmd cmd, String clientKey) {
        rateLimitService.checkContactRateLimit(clientKey);

        if (!cmd.consentAccepted()) {
            throw new DomainException(ErrorCode.CONSENT_REQUIRED);
        }
        if ((cmd.phone() == null || cmd.phone().isBlank()) && (cmd.email() == null || cmd.email().isBlank())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        ContactRequest cr = new ContactRequest();
        cr.setRestaurantId(restaurant.getId());
        cr.setName(cmd.name().trim());
        cr.setPhone(cmd.phone() != null && !cmd.phone().isBlank() ? cmd.phone().trim() : null);
        cr.setEmail(cmd.email() != null && !cmd.email().isBlank() ? cmd.email().trim() : null);
        cr.setMessage(cmd.message().trim());
        cr.setSource(BookingSource.WEB);
        cr.setStatus(ContactRequestStatus.NEW);
        cr.setConsentVersion(cmd.consentVersion());
        cr.setCreatedAt(Instant.now(clock));

        ContactRequest saved = contactRequestRepository.save(cr);
        return ContactRequestDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ContactRequestDto> listContactRequests(String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);

        if (user.getRole() == UserRole.MODERATOR) {
            return contactRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(ContactRequestDto::fromEntity)
                    .toList();
        }

        List<UUID> restaurantIds = restaurantRepository.findByOwnerId(user.getId()).stream()
                .map(Restaurant::getId)
                .toList();

        if (restaurantIds.isEmpty()) {
            return Collections.emptyList();
        }

        return contactRequestRepository.findByRestaurantIdInOrderByCreatedAtDesc(restaurantIds).stream()
                .map(ContactRequestDto::fromEntity)
                .toList();
    }

    @Transactional
    public ContactRequestDto updateContactRequestStatus(UUID contactRequestId, ContactRequestStatus status, String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);

        ContactRequest cr = contactRequestRepository.findById(contactRequestId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        Restaurant restaurant = restaurantRepository.findById(cr.getRestaurantId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (user.getRole() == UserRole.OWNER && !restaurant.getOwnerId().equals(user.getId())) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        cr.setStatus(status);
        cr.setHandledAt(status == ContactRequestStatus.HANDLED ? Instant.now(clock) : null);

        ContactRequest saved = contactRequestRepository.save(cr);
        return ContactRequestDto.fromEntity(saved);
    }
}
