package com.tablemint.menu.repository;

import com.tablemint.menu.model.MenuSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuSectionRepository extends JpaRepository<MenuSection, UUID> {

    List<MenuSection> findByRestaurantIdOrderByPositionAsc(UUID restaurantId);

    void deleteByRestaurantId(UUID restaurantId);
}
