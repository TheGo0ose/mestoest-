import type { PlatformUser, CreateOwnerResult, PlatformRestaurant } from './moderator';

type Db = {
  users: PlatformUser[];
  restaurants: PlatformRestaurant[];
};
const g = globalThis as typeof globalThis & { __tmPlatformUsers?: Db };

function seedUsers(): PlatformUser[] {
  return [
    {
      id: 'mod-1',
      displayName: 'Алина Орлова',
      email: 'alina.mod@example.com',
      role: 'MODERATOR',
      status: 'ACTIVE',
      locale: 'ru',
    },
    {
      id: 'owner-1',
      displayName: 'Айбек Садыков',
      email: 'aibek.owner@example.com',
      role: 'OWNER',
      status: 'ACTIVE',
      locale: 'ru',
    },
    {
      id: 'owner-2',
      displayName: 'Мира Асанова',
      email: 'mira.owner@example.com',
      role: 'OWNER',
      status: 'ACTIVE',
      locale: 'ru',
    },
    {
      id: 'client-1',
      displayName: 'Яна Мирова',
      email: 'yana.guest@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      locale: 'ru',
    },
    {
      id: 'client-2',
      displayName: 'Тимур Осмонов',
      email: 'timur.guest@example.com',
      role: 'CUSTOMER',
      status: 'DISABLED',
      locale: 'ru',
    },
    {
      id: 'client-3',
      displayName: 'Данияр Асанов',
      email: 'daniyar.guest@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      locale: 'ru',
    },
    {
      id: 'mod-2',
      displayName: 'Элина Ким',
      email: 'elina.mod@example.com',
      role: 'MODERATOR',
      status: 'DISABLED',
      locale: 'ru',
    },
  ];
}

function seedRestaurants(): PlatformRestaurant[] {
  return [
    {
      id: 'rest-1',
      name: 'Мята и свет',
      city: 'Бишкек',
      address: 'ул. Токтогула, 120',
      phone: '+996 312 000 101',
      description: 'Современная кухня и светлый зал.',
      ownerId: 'owner-1',
      ownerName: 'Айбек Садыков',
      ownerEmail: 'aibek.owner@example.com',
      status: 'PUBLISHED',
      createdAt: '2026-01-10T10:00:00+06:00',
    },
    {
      id: 'rest-2',
      name: 'Тёплый двор',
      city: 'Бишкек',
      address: 'ул. Исанова, 42',
      phone: '+996 312 000 102',
      description: 'Уютный дворик для семейных встреч.',
      ownerId: 'owner-2',
      ownerName: 'Мира Асанова',
      ownerEmail: 'mira.owner@example.com',
      status: 'PUBLISHED',
      createdAt: '2026-01-12T11:00:00+06:00',
    },
    {
      id: 'rest-3',
      name: 'Карагач',
      city: 'Бишкек',
      address: 'ул. Киевская, 85',
      phone: '+996 312 000 103',
      description: 'Традиционная и авторская кухня.',
      ownerId: 'owner-1',
      ownerName: 'Айбек Садыков',
      ownerEmail: 'aibek.owner@example.com',
      status: 'DRAFT',
      createdAt: '2026-02-01T14:30:00+06:00',
    },
    {
      id: 'rest-4',
      name: 'Утро в горах',
      city: 'Ош',
      address: 'ул. Ленина, 18',
      phone: '+996 322 000 104',
      description: 'Панорамный вид и горные травы.',
      ownerId: 'owner-2',
      ownerName: 'Мира Асанова',
      ownerEmail: 'mira.owner@example.com',
      status: 'HIDDEN',
      createdAt: '2026-02-05T09:15:00+06:00',
    },
    {
      id: 'rest-5',
      name: 'Лист и зерно',
      city: 'Бишкек',
      address: 'ул. Боконбаева, 64',
      phone: '+996 312 000 105',
      description: 'Свежая выпечка и спешелти кофе.',
      ownerId: 'owner-2',
      ownerName: 'Мира Асанова',
      ownerEmail: 'mira.owner@example.com',
      status: 'DRAFT',
      createdAt: '2026-02-10T16:00:00+06:00',
    },
    {
      id: 'rest-6',
      name: 'Соседи',
      city: 'Бишкек',
      address: 'ул. Московская, 92',
      phone: '+996 312 000 106',
      description: 'Городское бистро на каждый день.',
      ownerId: 'owner-1',
      ownerName: 'Айбек Садыков',
      ownerEmail: 'aibek.owner@example.com',
      status: 'DRAFT',
      createdAt: '2026-02-15T12:00:00+06:00',
    },
  ];
}

const db: Db = (g.__tmPlatformUsers ??= {
  users: seedUsers(),
  restaurants: seedRestaurants(),
});

// Если при HMR ресторанов ещё не было в db
if (!db.restaurants) {
  db.restaurants = seedRestaurants();
}

/** Все пользователи платформы (клоны) */
export function listPlatformUsers(): PlatformUser[] {
  return db.users.map((u) => ({ ...u }));
}

/** Список активных владельцев для формы назначения */
export function listActiveOwners(): PlatformUser[] {
  return db.users.filter((u) => u.role === 'OWNER' && u.status === 'ACTIVE').map((u) => ({ ...u }));
}

/** Переключить статус пользователя */
export function toggleUserStatus(id: string): PlatformUser | null {
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  user.status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  return { ...user };
}

// Генерация временного пароля: 12 символов, буквы + цифры + спецсимволы
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

let ownerCounter = db.users.filter((u) => u.role === 'OWNER').length;

/** Создать аккаунт владельца */
export function createOwnerAccount(input: {
  displayName: string;
  email: string;
  phone?: string;
  locale: 'ru' | 'en';
}): CreateOwnerResult {
  ownerCounter++;
  const user: PlatformUser = {
    id: `owner-${ownerCounter}`,
    displayName: input.displayName,
    email: input.email,
    phone: input.phone || undefined,
    role: 'OWNER',
    status: 'ACTIVE',
    locale: input.locale,
  };
  db.users.push(user);
  return { user: { ...user }, tempPassword: generateTempPassword() };
}

/** Все рестораны платформы (клоны) */
export function listPlatformRestaurants(): PlatformRestaurant[] {
  return db.restaurants.map((r) => ({ ...r }));
}

let restaurantCounter = db.restaurants.length;

/** Создать черновик ресторана платформы */
export function createPlatformRestaurant(input: {
  name: string;
  city: string;
  address: string;
  phone: string;
  ownerId: string;
  description?: string;
}): PlatformRestaurant {
  restaurantCounter++;
  const owner = db.users.find((u) => u.id === input.ownerId);

  const restaurant: PlatformRestaurant = {
    id: `rest-${restaurantCounter}`,
    name: input.name,
    city: input.city,
    address: input.address,
    phone: input.phone,
    description: input.description,
    ownerId: input.ownerId,
    ownerName: owner?.displayName ?? 'Неизвестный владелец',
    ownerEmail: owner?.email ?? '',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
  };

  db.restaurants.push(restaurant);
  return { ...restaurant };
}
