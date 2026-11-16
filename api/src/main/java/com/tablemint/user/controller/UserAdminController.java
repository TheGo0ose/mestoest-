package com.tablemint.user.controller;

import com.tablemint.auth.service.AuthService.UserDto;
import com.tablemint.user.model.UserRole;
import com.tablemint.user.model.UserStatus;
import com.tablemint.user.service.UserAdminService;
import com.tablemint.user.service.UserAdminService.CreateOwnerResponse;
import com.tablemint.user.service.UserAdminService.UserPageDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
@PreAuthorize("hasRole('MODERATOR')")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    public record CreateOwnerRequest(
            @NotBlank @Email String email,
            @NotBlank String displayName,
            String phone
    ) {}

    public record UpdateUserRequest(
            @NotNull UserStatus status
    ) {}

    @GetMapping("/users")
    public ResponseEntity<UserPageDto> listUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(userAdminService.listUsers(query, role, status, page, size));
    }

    @PostMapping("/owners")
    public ResponseEntity<CreateOwnerResponse> createOwner(@Valid @RequestBody CreateOwnerRequest req) {
        CreateOwnerResponse response = userAdminService.createOwner(
                new UserAdminService.CreateOwnerCmd(req.email(), req.displayName(), req.phone())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRequest req
    ) {
        return ResponseEntity.ok(userAdminService.updateUserStatus(userId, req.status()));
    }
}
