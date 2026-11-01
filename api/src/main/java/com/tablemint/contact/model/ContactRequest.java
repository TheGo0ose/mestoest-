package com.tablemint.contact.model;

import com.tablemint.booking.model.BookingSource;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contact_request")
@Getter
@Setter
@NoArgsConstructor
public class ContactRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(nullable = false)
    private String name;

    @Column(length = 50)
    private String phone;

    @Column
    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BookingSource source = BookingSource.WEB;

    @Column(name = "telegram_user_id")
    private Long telegramUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ContactRequestStatus status = ContactRequestStatus.NEW;

    @Column(name = "consent_version", nullable = false, length = 32)
    private String consentVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "handled_at")
    private Instant handledAt;
}
