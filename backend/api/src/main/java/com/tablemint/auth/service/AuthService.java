package com.tablemint.auth.service;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.common.ratelimit.RateLimitService;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.model.UserStatus;
import com.tablemint.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RateLimitService rateLimitService;
    private final Clock clock;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RateLimitService rateLimitService,
            Clock clock
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.rateLimitService = rateLimitService;
        this.clock = clock;
    }

    public record UserDto(
            UUID id,
            String email,
            String displayName,
            String phone,
            UserRole role,
            String locale,
            UserStatus status,
            boolean mustChangePassword
    ) {
        public static UserDto fromEntity(AppUser user) {
            return new UserDto(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getPhone(),
                    user.getRole(),
                    user.getLocale(),
                    user.getStatus(),
                    user.isMustChangePassword()
            );
        }
    }

    public record RegisterCmd(
            String email,
            String password,
            String displayName,
            String phone,
            boolean consentAccepted,
            String consentVersion
    ) {}

    @Transactional
    public UserDto register(RegisterCmd cmd) {
        if (!cmd.consentAccepted()) {
            throw new DomainException(ErrorCode.CONSENT_REQUIRED);
        }

        String normalizedEmail = cmd.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DomainException(ErrorCode.EMAIL_ALREADY_REGISTERED);
        }

        Instant now = Instant.now(clock);
        AppUser user = new AppUser();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(cmd.password()));
        user.setDisplayName(cmd.displayName().trim());
        user.setPhone(cmd.phone());
        user.setRole(UserRole.CUSTOMER);
        user.setLocale("ru");
        user.setStatus(UserStatus.ACTIVE);
        user.setMustChangePassword(false);
        user.setConsentVersion(cmd.consentVersion());
        user.setConsentAt(now);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        AppUser saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public UserDto login(String email, String password, String clientKey) {
        rateLimitService.checkLoginRateLimit(clientKey);

        AppUser user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new DomainException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new DomainException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }

        return UserDto.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        if (email == null || email.isBlank()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new DomainException(ErrorCode.CURRENT_PASSWORD_INVALID);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setUpdatedAt(Instant.now(clock));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AppUser requireActiveUser(String email) {
        if (email == null || email.isBlank()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }
        if (user.isMustChangePassword()) {
            throw new DomainException(ErrorCode.PASSWORD_CHANGE_REQUIRED);
        }
        return user;
    }
}
