package com.tablemint.auth.controller;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.model.UserStatus;
import com.tablemint.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 10) String password,
            @NotBlank String displayName,
            String phone,
            boolean consentAccepted,
            @NotBlank String consentVersion
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 10) String newPassword
    ) {}

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

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        if (!req.consentAccepted()) {
            throw new DomainException(ErrorCode.CONSENT_REQUIRED);
        }

        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new DomainException(ErrorCode.EMAIL_ALREADY_REGISTERED);
        }

        AppUser user = new AppUser();
        user.setEmail(req.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName().trim());
        user.setPhone(req.phone());
        user.setRole(UserRole.CUSTOMER);
        user.setLocale("ru");
        user.setStatus(UserStatus.ACTIVE);
        user.setMustChangePassword(false);
        user.setConsentVersion(req.consentVersion());
        user.setConsentAt(Instant.now());

        AppUser saved = userRepository.save(user);

        // Auto login customer
        establishSession(saved, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.fromEntity(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        AppUser user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new DomainException(ErrorCode.INVALID_CREDENTIALS));

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new DomainException(ErrorCode.FORBIDDEN);
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new DomainException(ErrorCode.INVALID_CREDENTIALS);
        }

        establishSession(user, request);

        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }

        String email = authentication.getName();
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));

        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }

        AppUser user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new DomainException(ErrorCode.UNAUTHENTICATED));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new DomainException(ErrorCode.CURRENT_PASSWORD_INVALID);
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setMustChangePassword(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.noContent().build();
    }

    private void establishSession(AppUser user, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }
}
