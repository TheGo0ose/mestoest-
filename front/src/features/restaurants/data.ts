import { menu, restaurants } from '@/mocks/restaurants';
import { getOwnerRestaurant } from '@/features/owner/store';

// Сейчас данные берутся из мока.
// Когда появится API, меняем только тело этих трёх функций.

export async function fetchRestaurants() {
  return restaurants;
}

export async function fetchRestaurant(id: string) {
  return restaurants.find((r) => r.id === id) ?? null;
}

export async function fetchMenu(restaurantId: string) {
  void restaurantId; // пока меню одно на всех
  return menu;
}

// ВРЕМЕННО. Заменится запросом listManagedRestaurants (рестораны вызывающего).
export async function fetchManagedRestaurant() {
  return getOwnerRestaurant();
}
