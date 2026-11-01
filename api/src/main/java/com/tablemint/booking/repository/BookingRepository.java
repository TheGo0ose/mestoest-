package com.tablemint.booking.repository;

import com.tablemint.booking.model.Booking;
import com.tablemint.booking.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    Optional<Booking> findByReference(String reference);

    Page<Booking> findByCustomerIdOrderByStartsAtDesc(UUID customerId, Pageable pageable);

    List<Booking> findByRestaurantIdAndStartsAtBetweenOrderByStartsAtAsc(UUID restaurantId, Instant from, Instant to);

    @Query(value = """
            SELECT t.id FROM dining_table t
            WHERE t.restaurant_id = :restaurantId
              AND t.active = true
              AND t.seats >= :partySize
              AND NOT EXISTS (
                SELECT 1 FROM booking b
                WHERE b.table_id = t.id
                  AND b.status = 'CONFIRMED'
                  AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(:startsAt, :endsAt, '[)')
              )
            ORDER BY t.seats ASC, t.label ASC
            LIMIT 1
            """, nativeQuery = true)
    Optional<UUID> findAvailableTable(
            @Param("restaurantId") UUID restaurantId,
            @Param("partySize") int partySize,
            @Param("startsAt") Instant startsAt,
            @Param("endsAt") Instant endsAt
    );

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.tableId = :tableId AND b.status = 'CONFIRMED' AND b.startsAt >= :now")
    boolean existsFutureConfirmedBookingsForTable(@Param("tableId") UUID tableId, @Param("now") Instant now);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.restaurantId = :restaurantId AND b.startsAt BETWEEN :from AND :to")
    long countBookingsInPeriod(@Param("restaurantId") UUID restaurantId, @Param("from") Instant from, @Param("to") Instant to);
}
