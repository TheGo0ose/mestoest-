package com.tablemint.contact.repository;

import com.tablemint.contact.model.ContactRequest;
import com.tablemint.contact.model.ContactRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContactRequestRepository extends JpaRepository<ContactRequest, UUID> {

    List<ContactRequest> findByRestaurantIdOrderByCreatedAtDesc(UUID restaurantId);

    List<ContactRequest> findByRestaurantIdAndStatusOrderByCreatedAtDesc(UUID restaurantId, ContactRequestStatus status);
}
