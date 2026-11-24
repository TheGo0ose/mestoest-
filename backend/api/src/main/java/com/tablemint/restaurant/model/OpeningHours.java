package com.tablemint.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "opening_hours", uniqueConstraints = {
        @UniqueConstraint(name = "uq_restaurant_day", columnNames = {"restaurant_id", "day_of_week"})
})
@Getter
@Setter
@NoArgsConstructor
public class OpeningHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek; // 1 = Monday, 7 = Sunday

    @Column(name = "opens_at", nullable = false)
    private LocalTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalTime closesAt;
}
