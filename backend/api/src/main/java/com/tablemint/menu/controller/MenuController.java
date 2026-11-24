package com.tablemint.menu.controller;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.menu.service.MenuService;
import com.tablemint.menu.service.MenuService.ManagedMenuDto;
import com.tablemint.menu.service.MenuService.MenuItemDto;
import com.tablemint.menu.service.MenuService.MenuSectionDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
@PreAuthorize("hasAnyRole('OWNER', 'MODERATOR')")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    public record CreateMenuSectionRequest(
            @NotBlank String name,
            Integer position
    ) {}

    public record UpdateMenuSectionRequest(
            String name,
            Integer position
    ) {}

    public record CreateMenuItemRequest(
            @NotBlank String name,
            String description,
            @NotBlank String priceAmount,
            Boolean available,
            Integer position
    ) {}

    public record UpdateMenuItemRequest(
            String name,
            String description,
            String priceAmount,
            Boolean available,
            Integer position
    ) {}

    @GetMapping("/restaurants/{restaurantId}/menu")
    public ResponseEntity<ManagedMenuDto> getManagedMenu(
            @PathVariable UUID restaurantId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(menuService.getManagedMenu(restaurantId, requireUserEmail(authentication)));
    }

    @PostMapping("/restaurants/{restaurantId}/menu-sections")
    public ResponseEntity<MenuSectionDto> createMenuSection(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CreateMenuSectionRequest req,
            Authentication authentication
    ) {
        MenuSectionDto created = menuService.createSection(
                restaurantId,
                req.name(),
                req.position(),
                requireUserEmail(authentication)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/menu-sections/{sectionId}")
    public ResponseEntity<MenuSectionDto> updateMenuSection(
            @PathVariable UUID sectionId,
            @Valid @RequestBody UpdateMenuSectionRequest req,
            Authentication authentication
    ) {
        MenuSectionDto updated = menuService.updateSection(
                sectionId,
                req.name(),
                req.position(),
                requireUserEmail(authentication)
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/menu-sections/{sectionId}")
    public ResponseEntity<Void> deleteMenuSection(
            @PathVariable UUID sectionId,
            Authentication authentication
    ) {
        menuService.deleteSection(sectionId, requireUserEmail(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/menu-sections/{sectionId}/items")
    public ResponseEntity<MenuItemDto> createMenuItem(
            @PathVariable UUID sectionId,
            @Valid @RequestBody CreateMenuItemRequest req,
            Authentication authentication
    ) {
        MenuItemDto created = menuService.createItem(
                sectionId,
                req.name(),
                req.description(),
                req.priceAmount(),
                req.available(),
                req.position(),
                requireUserEmail(authentication)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/menu-items/{itemId}")
    public ResponseEntity<MenuItemDto> updateMenuItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateMenuItemRequest req,
            Authentication authentication
    ) {
        MenuItemDto updated = menuService.updateItem(
                itemId,
                req.name(),
                req.description(),
                req.priceAmount(),
                req.available(),
                req.position(),
                requireUserEmail(authentication)
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/menu-items/{itemId}")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable UUID itemId,
            Authentication authentication
    ) {
        menuService.deleteItem(itemId, requireUserEmail(authentication));
        return ResponseEntity.noContent().build();
    }

    private String requireUserEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new DomainException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }
}
