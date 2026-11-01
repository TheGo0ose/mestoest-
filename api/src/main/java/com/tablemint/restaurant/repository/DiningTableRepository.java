package com.tablemint.restaurant.repository;

import com.tablemint.restaurant.model.DiningTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiningTableRepository extends JpaRepository<DiningTable, UUID> {

    List<DiningTable> findByRestaurantIdOrderByLabelAsc(UUID restaurantId);

    List<DiningTable> findByRestaurantIdAndActiveTrueOrderBySeatsAscLabelAsc(UUID restaurantId);

    Optional<DiningTable> findByRestaurantIdAndLabel(UUID restaurantId, String label);

    @Query("SELECT COALESCE(MAX(t.seats), 0) FROM DiningTable t WHERE t.restaurantId = :restaurantId AND t.active = true")
    int findMaxActiveSeats(@Param("restaurantId") UUID restaurantId);
}
