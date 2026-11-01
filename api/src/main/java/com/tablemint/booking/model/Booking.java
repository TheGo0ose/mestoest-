package com.tablemint.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "booking")
@Getter
@Setter
@NoArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String reference;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(name = "table_id", nullable = false)
    private UUID tableId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "guest_name")
    private String guestName;

    @Column(name = "guest_phone", length = 50)
    private String guestPhone;

    @Column(name = "telegram_user_id")
    private Long telegramUserId;

    @Column(name = "party_size", nullable = false)
    private int partySize;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BookingStatus status = BookingStatus.CONFIRMED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BookingSource source = BookingSource.WEB;

    @Column(name = "consent_version", nullable = false, length = 32)
    private String consentVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by", length = 32)
    private String cancelledBy;
}
