package com.tablemint.menu.service;

import com.tablemint.auth.service.AuthService;
import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.menu.model.MenuItem;
import com.tablemint.menu.model.MenuSection;
import com.tablemint.menu.repository.MenuItemRepository;
import com.tablemint.menu.repository.MenuSectionRepository;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.repository.RestaurantRepository;
import com.tablemint.user.model.AppUser;
import com.tablemint.user.model.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MenuService {

    private final MenuSectionRepository sectionRepository;
    private final MenuItemRepository itemRepository;
    private final RestaurantRepository restaurantRepository;
    private final AuthService authService;

    public MenuService(
            MenuSectionRepository sectionRepository,
            MenuItemRepository itemRepository,
            RestaurantRepository restaurantRepository,
            AuthService authService
    ) {
        this.sectionRepository = sectionRepository;
        this.itemRepository = itemRepository;
        this.restaurantRepository = restaurantRepository;
        this.authService = authService;
    }

    public record MenuSectionDto(
            UUID id,
            UUID restaurantId,
            String name,
            int position
    ) {
        public static MenuSectionDto fromEntity(MenuSection sec) {
            return new MenuSectionDto(sec.getId(), sec.getRestaurantId(), sec.getName(), sec.getPosition());
        }
    }

    public record MenuItemDto(
            UUID id,
            UUID sectionId,
            String name,
            String description,
            String priceAmount,
            String currency,
            boolean available,
            int position
    ) {
        public static MenuItemDto fromEntity(MenuItem item) {
            return new MenuItemDto(
                    item.getId(),
                    item.getSectionId(),
                    item.getName(),
                    item.getDescription(),
                    item.getPriceAmount().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                    item.getCurrency(),
                    item.isAvailable(),
                    item.getPosition()
            );
        }
    }

    public record MenuSectionWithItemsDto(
            UUID id,
            UUID restaurantId,
            String name,
            int position,
            List<MenuItemDto> items
    ) {}

    public record ManagedMenuDto(
            List<MenuSectionWithItemsDto> sections
    ) {}

    @Transactional(readOnly = true)
    public ManagedMenuDto getManagedMenu(UUID restaurantId, String currentUserEmail) {
        verifyRestaurantAccess(restaurantId, currentUserEmail);

        List<MenuSection> sections = sectionRepository.findByRestaurantIdOrderByPositionAsc(restaurantId);
        List<MenuSectionWithItemsDto> sectionDtos = new ArrayList<>();

        for (MenuSection sec : sections) {
            List<MenuItemDto> items = itemRepository.findBySectionIdOrderByPositionAsc(sec.getId()).stream()
                    .map(MenuItemDto::fromEntity)
                    .toList();
            sectionDtos.add(new MenuSectionWithItemsDto(
                    sec.getId(),
                    sec.getRestaurantId(),
                    sec.getName(),
                    sec.getPosition(),
                    items
            ));
        }

        return new ManagedMenuDto(sectionDtos);
    }

    @Transactional
    public MenuSectionDto createSection(UUID restaurantId, String name, Integer position, String currentUserEmail) {
        verifyRestaurantAccess(restaurantId, currentUserEmail);

        MenuSection sec = new MenuSection();
        sec.setRestaurantId(restaurantId);
        sec.setName(name.trim());
        sec.setPosition(position != null ? position : 0);
        MenuSection saved = sectionRepository.save(sec);
        return MenuSectionDto.fromEntity(saved);
    }

    @Transactional
    public MenuSectionDto updateSection(UUID sectionId, String name, Integer position, String currentUserEmail) {
        MenuSection sec = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(sec.getRestaurantId(), currentUserEmail);

        if (name != null && !name.isBlank()) {
            sec.setName(name.trim());
        }
        if (position != null) {
            sec.setPosition(position);
        }
        MenuSection saved = sectionRepository.save(sec);
        return MenuSectionDto.fromEntity(saved);
    }

    @Transactional
    public void deleteSection(UUID sectionId, String currentUserEmail) {
        MenuSection sec = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(sec.getRestaurantId(), currentUserEmail);

        itemRepository.deleteBySectionId(sectionId);
        sectionRepository.delete(sec);
    }

    @Transactional
    public MenuItemDto createItem(
            UUID sectionId,
            String name,
            String description,
            String priceAmountStr,
            Boolean available,
            Integer position,
            String currentUserEmail
    ) {
        MenuSection sec = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(sec.getRestaurantId(), currentUserEmail);

        BigDecimal price = parsePrice(priceAmountStr);

        MenuItem item = new MenuItem();
        item.setSectionId(sectionId);
        item.setName(name.trim());
        item.setDescription(description);
        item.setPriceAmount(price);
        item.setCurrency("KGS");
        item.setAvailable(available == null || available);
        item.setPosition(position != null ? position : 0);

        MenuItem saved = itemRepository.save(item);
        return MenuItemDto.fromEntity(saved);
    }

    @Transactional
    public MenuItemDto updateItem(
            UUID itemId,
            String name,
            String description,
            String priceAmountStr,
            Boolean available,
            Integer position,
            String currentUserEmail
    ) {
        MenuItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        MenuSection sec = sectionRepository.findById(item.getSectionId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(sec.getRestaurantId(), currentUserEmail);

        if (name != null && !name.isBlank()) {
            item.setName(name.trim());
        }
        if (description != null) {
            item.setDescription(description);
        }
        if (priceAmountStr != null) {
            item.setPriceAmount(parsePrice(priceAmountStr));
        }
        if (available != null) {
            item.setAvailable(available);
        }
        if (position != null) {
            item.setPosition(position);
        }

        MenuItem saved = itemRepository.save(item);
        return MenuItemDto.fromEntity(saved);
    }

    @Transactional
    public void deleteItem(UUID itemId, String currentUserEmail) {
        MenuItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        MenuSection sec = sectionRepository.findById(item.getSectionId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
        verifyRestaurantAccess(sec.getRestaurantId(), currentUserEmail);

        itemRepository.delete(item);
    }

    private BigDecimal parsePrice(String priceAmountStr) {
        try {
            BigDecimal price = new BigDecimal(priceAmountStr.trim()).setScale(2, RoundingMode.HALF_UP);
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED);
            }
            return price;
        } catch (NumberFormatException | NullPointerException e) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED);
        }
    }

    private Restaurant verifyRestaurantAccess(UUID restaurantId, String currentUserEmail) {
        AppUser user = authService.requireActiveUser(currentUserEmail);
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (user.getRole() == UserRole.OWNER && !restaurant.getOwnerId().equals(user.getId())) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }
        return restaurant;
    }
}
