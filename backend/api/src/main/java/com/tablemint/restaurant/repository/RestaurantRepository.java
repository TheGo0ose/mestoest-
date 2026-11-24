package com.tablemint.restaurant.repository;

import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Restaurant r WHERE r.id = :id")
    Optional<Restaurant> findByIdForUpdate(@Param("id") UUID id);

    Page<Restaurant> findByStatus(RestaurantStatus status, Pageable pageable);

    Page<Restaurant> findByStatusAndNameContainingIgnoreCase(RestaurantStatus status, String name, Pageable pageable);

    List<Restaurant> findByOwnerId(UUID ownerId);
}
