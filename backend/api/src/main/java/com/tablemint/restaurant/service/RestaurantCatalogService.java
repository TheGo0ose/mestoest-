package com.tablemint.restaurant.service;

import com.tablemint.common.error.DomainException;
import com.tablemint.common.error.ErrorCode;
import com.tablemint.menu.model.MenuItem;
import com.tablemint.menu.model.MenuSection;
import com.tablemint.menu.repository.MenuItemRepository;
import com.tablemint.menu.repository.MenuSectionRepository;
import com.tablemint.restaurant.model.OpeningHours;
import com.tablemint.restaurant.model.Restaurant;
import com.tablemint.restaurant.model.RestaurantStatus;
import com.tablemint.restaurant.repository.OpeningHoursRepository;
import com.tablemint.restaurant.repository.RestaurantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class RestaurantCatalogService {

    private final RestaurantRepository restaurantRepository;
    private final OpeningHoursRepository openingHoursRepository;
    private final MenuSectionRepository menuSectionRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantCatalogService(
            RestaurantRepository restaurantRepository,
            OpeningHoursRepository openingHoursRepository,
            MenuSectionRepository menuSectionRepository,
            MenuItemRepository menuItemRepository
    ) {
        this.restaurantRepository = restaurantRepository;
        this.openingHoursRepository = openingHoursRepository;
        this.menuSectionRepository = menuSectionRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public record OpeningHoursDto(int dayOfWeek, String opensAt, String closesAt) {
        public static OpeningHoursDto fromEntity(OpeningHours oh) {
            return new OpeningHoursDto(oh.getDayOfWeek(), oh.getOpensAt().toString(), oh.getClosesAt().toString());
        }
    }

    public record RestaurantDetailDto(
            UUID id,
            String name,
            String description,
            String address,
            String phone,
            String timeZone,
            int sittingMinutes,
            int slotMinutes,
            List<OpeningHoursDto> openingHours
    ) {
        public static RestaurantDetailDto fromEntity(Restaurant r, List<OpeningHours> hours) {
            return new RestaurantDetailDto(
                    r.getId(),
                    r.getName(),
                    r.getDescription(),
                    r.getAddress(),
                    r.getPhone(),
                    r.getTimeZone(),
                    r.getSittingMinutes(),
                    r.getSlotMinutes(),
                    hours.stream().map(OpeningHoursDto::fromEntity).toList()
            );
        }
    }

    public record RestaurantPageDto(
            List<RestaurantDetailDto> items,
            int page,
            int size,
            long totalItems
    ) {}

    public record PublicMenuItemDto(
            UUID id,
            String name,
            String description,
            String priceAmount,
            String currency
    ) {}

    public record PublicMenuSectionDto(
            UUID id,
            String name,
            List<PublicMenuItemDto> items
    ) {}

    public record PublicMenuDto(
            List<PublicMenuSectionDto> sections
    ) {}

    @Transactional(readOnly = true)
    public RestaurantPageDto listRestaurants(String query, int page, int size) {
        int boundedSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), boundedSize);

        Page<Restaurant> result;
        if (query != null && !query.isBlank()) {
            result = restaurantRepository.findByStatusAndNameContainingIgnoreCase(
                    RestaurantStatus.PUBLISHED,
                    query.trim(),
                    pageRequest
            );
        } else {
            result = restaurantRepository.findByStatus(RestaurantStatus.PUBLISHED, pageRequest);
        }

        List<RestaurantDetailDto> items = result.getContent().stream()
                .map(r -> RestaurantDetailDto.fromEntity(r, Collections.emptyList()))
                .toList();

        return new RestaurantPageDto(items, result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public RestaurantDetailDto getRestaurant(UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        List<OpeningHours> hours = openingHoursRepository.findByRestaurantIdOrderByDayOfWeekAsc(restaurantId);
        return RestaurantDetailDto.fromEntity(restaurant, hours);
    }

    @Transactional(readOnly = true)
    public PublicMenuDto getMenu(UUID restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));

        if (restaurant.getStatus() != RestaurantStatus.PUBLISHED) {
            throw new DomainException(ErrorCode.NOT_FOUND);
        }

        List<MenuSection> sections = menuSectionRepository.findByRestaurantIdOrderByPositionAsc(restaurantId);
        List<PublicMenuSectionDto> sectionDtos = new ArrayList<>();

        for (MenuSection sec : sections) {
            List<MenuItem> items = menuItemRepository.findBySectionIdAndAvailableTrueOrderByPositionAsc(sec.getId());
            List<PublicMenuItemDto> itemDtos = items.stream()
                    .map(i -> new PublicMenuItemDto(
                            i.getId(),
                            i.getName(),
                            i.getDescription(),
                            i.getPriceAmount().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                            i.getCurrency()
                    ))
                    .toList();
            sectionDtos.add(new PublicMenuSectionDto(sec.getId(), sec.getName(), itemDtos));
        }

        return new PublicMenuDto(sectionDtos);
    }
}
