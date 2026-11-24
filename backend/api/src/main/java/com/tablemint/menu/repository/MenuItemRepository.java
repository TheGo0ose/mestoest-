package com.tablemint.menu.repository;

import com.tablemint.menu.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {

    List<MenuItem> findBySectionIdOrderByPositionAsc(UUID sectionId);

    List<MenuItem> findBySectionIdAndAvailableTrueOrderByPositionAsc(UUID sectionId);

    void deleteBySectionId(UUID sectionId);
}
