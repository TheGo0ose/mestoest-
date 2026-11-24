package com.tablemint.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurant")
@Getter
@Setter
@NoArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(name = "time_zone", nullable = false, length = 64)
    private String timeZone = "Asia/Bishkek";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RestaurantStatus status = RestaurantStatus.DRAFT;

    @Column(name = "sitting_minutes", nullable = false)
    private int sittingMinutes = 120;

    @Column(name = "slot_minutes", nullable = false)
    private int slotMinutes = 30;

    @Column(name = "min_lead_minutes", nullable = false)
    private int minLeadMinutes = 60;

    @Column(name = "max_advance_days", nullable = false)
    private int maxAdvanceDays = 60;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
