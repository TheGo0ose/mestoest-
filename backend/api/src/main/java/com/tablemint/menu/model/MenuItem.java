package com.tablemint.menu.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "menu_item")
@Getter
@Setter
@NoArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "section_id", nullable = false)
    private UUID sectionId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAmount;

    @Column(nullable = false, length = 3)
    private String currency = "KGS";

    @Column(nullable = false)
    private boolean available = true;

    @Column(nullable = false)
    private int position = 0;
}
