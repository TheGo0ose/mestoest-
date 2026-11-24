package com.tablemint.auth.controller;

import com.tablemint.auth.service.AuthService;
import com.tablemint.auth.service.AuthService.UserDto;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
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
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        UserDto user = authService.register(new AuthService.RegisterCmd(
                req.email(),
                req.password(),
                req.displayName(),
                req.phone(),
                req.consentAccepted(),
                req.consentVersion()
        ));

        establishSession(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        String clientKey = request.getRemoteAddr() + ":" + req.email().trim().toLowerCase();
        UserDto user = authService.login(req.email(), req.password(), clientKey);

        establishSession(user, request);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
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
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        authService.changePassword(authentication.getName(), req.currentPassword(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    private void establishSession(UserDto user, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user.email(),
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.role().name()))
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }
}
