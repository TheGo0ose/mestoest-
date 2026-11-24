package com.tablemint.user.repository;

import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<AppUser, UUID> {

    @Query("SELECT u FROM AppUser u WHERE lower(u.email) = lower(:email)")
    Optional<AppUser> findByEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM AppUser u WHERE lower(u.email) = lower(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    @Query("""
            SELECT u FROM AppUser u
            WHERE (:query IS NULL OR :query = ''
                   OR lower(u.email) LIKE lower(concat('%', :query, '%'))
                   OR lower(u.displayName) LIKE lower(concat('%', :query, '%')))
              AND (:role IS NULL OR u.role = :role)
              AND (:status IS NULL OR u.status = :status)
            ORDER BY u.createdAt DESC
            """)
    Page<AppUser> searchUsers(
            @Param("query") String query,
            @Param("role") UserRole role,
            @Param("status") UserStatus status,
            Pageable pageable
    );
}
