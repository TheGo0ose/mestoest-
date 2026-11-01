package com.tablemint.restaurant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "dining_table", uniqueConstraints = {
        @UniqueConstraint(name = "uq_restaurant_table_label", columnNames = {"restaurant_id", "label"})
})
@Getter
@Setter
@NoArgsConstructor
public class DiningTable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "restaurant_id", nullable = false)
    private UUID restaurantId;

    @Column(nullable = false, length = 64)
    private String label;

    @Column(nullable = false)
    private int seats;

    @Column(nullable = false)
    private boolean active = true;
}
