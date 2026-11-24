package com.tablemint.user.service;

import com.tablemint.auth.service.AuthService.UserDto;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.model.UserStatus;
import com.tablemint.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class UserAdminService {

    private static final String TEMP_PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public UserAdminService(UserRepository userRepository, PasswordEncoder passwordEncoder, Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public record UserPageDto(List<UserDto> items, int page, int size, long totalItems) {}

    public record CreateOwnerCmd(String email, String displayName, String phone) {}

    public record CreateOwnerResponse(UserDto user, String temporaryPassword) {}

    @Transactional(readOnly = true)
    public UserPageDto listUsers(String query, UserRole role, UserStatus status, int page, int size) {
        int boundedSize = Math.min(Math.max(size, 1), 100);
        String trimmedQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        Page<AppUser> result = userRepository.searchUsers(trimmedQuery, role, status, PageRequest.of(Math.max(page, 0), boundedSize));
        List<UserDto> items = result.getContent().stream()
                .map(UserDto::fromEntity)
                .toList();
        return new UserPageDto(items, result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional
    public CreateOwnerResponse createOwner(CreateOwnerCmd cmd) {
        String normalizedEmail = cmd.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DomainException(ErrorCode.EMAIL_ALREADY_REGISTERED);
        }

        String temporaryPassword = generateTemporaryPassword();
        Instant now = Instant.now(clock);

        AppUser owner = new AppUser();
        owner.setEmail(normalizedEmail);
        owner.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        owner.setDisplayName(cmd.displayName().trim());
        owner.setPhone(cmd.phone());
        owner.setRole(UserRole.OWNER);
        owner.setLocale("ru");
        owner.setStatus(UserStatus.ACTIVE);
        owner.setMustChangePassword(true);
        owner.setConsentVersion("1.0");
        owner.setConsentAt(now);
        owner.setCreatedAt(now);
        owner.setUpdatedAt(now);

        AppUser saved = userRepository.save(owner);
        return new CreateOwnerResponse(UserDto.fromEntity(saved), temporaryPassword);
    }

    @Transactional
    public UserDto updateUserStatus(UUID userId, UserStatus status) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        user.setStatus(status);
        user.setUpdatedAt(Instant.now(clock));
        AppUser saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    public static String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder("Tm!");
        for (int i = 0; i < 10; i++) {
            sb.append(TEMP_PASS_CHARS.charAt(RANDOM.nextInt(TEMP_PASS_CHARS.length())));
        }
        return sb.toString();
    }
}
