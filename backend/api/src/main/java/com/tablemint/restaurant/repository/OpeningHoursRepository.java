package com.tablemint.restaurant.repository;

import com.tablemint.restaurant.model.OpeningHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpeningHoursRepository extends JpaRepository<OpeningHours, UUID> {

    List<OpeningHours> findByRestaurantIdOrderByDayOfWeekAsc(UUID restaurantId);

    Optional<OpeningHours> findByRestaurantIdAndDayOfWeek(UUID restaurantId, int dayOfWeek);

    void deleteByRestaurantId(UUID restaurantId);
}
