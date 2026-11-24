<<<<<<< HEAD
# TableMint (Baseline 1.1)

Единая платформа для ресторанов Кыргызстана: онлайн-меню, бронирование столиков с гарантией отсутствия наложений, запросы на связь и аналитика в Web и Telegram.

---

## 📁 Структура проекта

Репозиторий организован как монорепозиторий в соответствии с архитектурной спецификацией:

```text
mestoest/ (tablemint)
├── AGENTS.md                  # Правила, инварианты и архитектурные ограничения для ИИ
├── README.md                  # Документация проекта и инструкция по запуску
├── contract/
│   └── openapi.yaml           # Контракт API (OpenAPI 3.0.3, 40 операций, x-access)
├── docs/
│   └── SPECIFICATION.md       # Преобразованная в Markdown полная спецификация (v1.1)
├── deploy/
│   ├── docker-compose.yml     # Сборка всех сервисов (db, api, web, bot, caddy)
│   ├── docker-compose.local.yml # Локальный оверрайд (порты 5432, 8080, 3000, профили mock и bot)
│   ├── Caddyfile              # Конфигурация TLS, заголовков безопасности и маршрутизации
│   └── .env.example           # Шаблон переменных окружения
├── api/                       # Spring Boot 4.1.1 (Java 21) бэкенд-сервис
│   ├── build.gradle           # Зависимости, JaCoCo правила покрытия (>=85% общий, >=95% booking/contact)
│   ├── Dockerfile             # Multi-stage Dockerfile
│   └── src/
│       ├── main/
│       │   ├── java/com/tablemint/
│       │   │   ├── TableMintApplication.java
│       │   │   ├── auth/      # Регистрация, сессии, пароли
│       │   │   ├── restaurant/# Каталог ресторанов, часы работы, столики, расчет доступности
│       │   │   ├── menu/      # Управление разделами и позициями меню
│       │   │   ├── booking/   # Движок бронирования с двухфазной блокировкой и защитой от гонок
│       │   │   ├── contact/   # Обработка заявок на обратную связь
│       │   │   ├── stats/     # Статистика бронирований для StatsDashboard
│       │   │   ├── user/      # Модели пользователей и ролевой доступ
│       │   │   └── common/    # ProblemDetail RFC 9457, ErrorCode (21 код), идемпотентность, безопасность
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-local.yml
│       │       ├── messages_en.properties # Локализация ошибок (EN)
│       │       ├── messages_ru.properties # Локализация ошибок (RU)
│       │       └── db/
│       │           ├── migration/
│       │           │   └── V1__init.sql   # Полная схема PostgreSQL 16 с btree_gist
│       │           └── seed/
│       │               └── R__seed_dev_data.sql # Тестовые данные для локального запуска
│       └── test/              # Модульные и интеграционные тесты
├── bot/                       # Telegram-бот на Java 21 (long polling)
└── web/                       # Веб-приложение Next.js (App Router, TypeScript)
=======
# 🍽️ TableMint — Frontend

Веб-приложение платформы **TableMint** для бронирования столиков в ресторанах.  
Включает публичный каталог, кабинет владельца ресторана и панель модератора.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Скрипты](#скрипты)
- [Структура проекта](#структура-проекта)
- [Маршруты (страницы)](#маршруты-страницы)
- [Роли и авторизация](#роли-и-авторизация)
- [Интернационализация (i18n)](#интернационализация-i18n)
- [Feature-модули](#feature-модули)
- [Архитектурные решения](#архитектурные-решения)
- [Демо-аккаунты](#демо-аккаунты)
- [Деплой](#деплой)
- [Лицензия](#лицензия)

---

## Стек технологий

| Категория      | Технология                                                     | Версия       |
| -------------- | -------------------------------------------------------------- | ------------ |
| Фреймворк      | [Next.js](https://nextjs.org/) (App Router)                    | 16.4         |
| UI             | [React](https://react.dev/)                                    | 19.3         |
| Язык           | [TypeScript](https://www.typescriptlang.org/)                  | 5.x          |
| Стили          | [Tailwind CSS](https://tailwindcss.com/) v4 (PostCSS)          | 4.3          |
| Иконки         | [Lucide React](https://lucide.dev/)                            | 1.66+        |
| i18n           | [next-intl](https://next-intl.dev/)                            | 4.14         |
| Шрифт          | [Inter](https://rsms.me/inter/) (latin + cyrillic)             | Google Fonts |
| Линтер         | [ESLint](https://eslint.org/) + eslint-config-next             | 9.x          |
| Форматирование | [Prettier](https://prettier.io/) + prettier-plugin-tailwindcss | 3.9          |

---

## Требования

- **Node.js** ≥ 20
- **npm** ≥ 10

---

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd frontend/web

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер
npm run dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

---

## Скрипты

| Команда                | Описание                                         |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Запуск dev-сервера с HMR                         |
| `npm run build`        | Продакшн-сборка (`standalone` output)            |
| `npm start`            | Запуск продакшн-сервера                          |
| `npm run lint`         | ESLint — проверка кода                           |
| `npm run typecheck`    | TypeScript — проверка типов без эмиссии          |
| `npm run i18n:check`   | Проверка совпадения ключей `ru.json` и `en.json` |
| `npm run format`       | Prettier — форматирование всех файлов            |
| `npm run format:check` | Prettier — проверка форматирования               |

---

## Структура проекта

```
web/
├── messages/               # Файлы переводов
│   ├── ru.json             # Русский (основной)
│   └── en.json             # English
├── public/
│   └── images/             # Статические изображения
├── scripts/
│   └── check-i18n.mjs      # Скрипт проверки i18n-ключей
├── src/
│   ├── api/                # API-утилиты (problem details)
│   ├── app/
│   │   └── [locale]/       # Локализованные маршруты
│   │       ├── layout.tsx  # Root layout (Inter, NextIntlClientProvider)
│   │       ├── page.tsx    # Главная (каталог ресторанов)
│   │       ├── login/      # Вход
│   │       ├── register/   # Регистрация
│   │       ├── restaurants/ # Публичные страницы ресторанов
│   │       ├── bookings/   # Мои бронирования (клиент)
│   │       └── admin/      # Защищённая зона (owner + moderator)
│   ├── components/         # Общие UI-компоненты
│   ├── features/           # Feature-модули (см. ниже)
│   ├── i18n/               # Конфигурация next-intl
│   ├── lib/                # Утилиты (time, uuid)
│   └── mocks/              # Моковые данные ресторанов
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── tailwind — через @tailwindcss/postcss v4
├── tsconfig.json
└── package.json
>>>>>>> 58fbdc81fc3619e6160e38d7e13363053b8f07d6
```

---

<<<<<<< HEAD
## ⚡ Ключевые архитектурные решения

1. **Гарантия отсутствия наложений (Zero-Overlap Guarantee):**
   - Уровень 1: Строгая последовательность блокировок — сначала строка `idempotency_record`, затем строка ресторана `SELECT ... FOR UPDATE`.
   - Уровень 2: Исключающее ограничение на уровне PostgreSQL:
     ```sql
     ALTER TABLE booking ADD CONSTRAINT booking_no_overlap EXCLUDE USING gist (
         table_id WITH =,
         tstzrange(starts_at, ends_at, '[)') WITH &&
     ) WHERE (status = 'CONFIRMED');
     ```
   - На уровне Spring Boot: перехват SQLSTATE `23P01` в `GlobalExceptionHandler` с трансляцией в HTTP 409 `BOOKING_NO_AVAILABILITY`.
2. **21 фиксированный код ошибки (RFC 9457):**
   - Единый формат `application/problem+json` с полями `code`, `title`, `detail`, `fieldErrors`.
   - Локализация на лету по заголовку `Accept-Language` (`ru` / `en`).
3. **Безопасность сессий и CSRF:**
   - Серверные сессии в базе (`Spring Session JDBC`) в cookie `SESSION` (HttpOnly, Secure, SameSite=Lax).
   - Защита от CSRF через `CookieCsrfTokenRepository` (токен `XSRF-TOKEN`).
   - Telegram-бот авторизуется через сервисный Bearer-токен `APP_BOT_SERVICE_TOKEN` без доступа к учетным записям пользователей.

---

## 🚀 Быстрый старт

### 1. Подготовка переменных окружения
```bash
cp deploy/.env.example deploy/.env
```

### 2. Запуск через Docker Compose
```bash
# Запуск полного стека (База данных, API, Web, Caddy)
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml up --build
```

### 3. Локальный запуск только базы данных для разработки в IDE
```bash
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml up db
```

### 4. Запуск Spring Boot API локально
```bash
cd api
./gradlew bootRun --args='--spring.profiles.active=local'
```

API будет доступен по адресу: `http://localhost:8080/api/v1`  
Метрики здоровья Actuator: `http://localhost:8080/actuator/health`

---

## 🧪 Тестовые учетные записи (при `APP_SEED_ENABLED=true`)
- **Модератор:** `moderator@tablemint.local` / `Password123!`
- **Владелец ресторана:** `owner1@tablemint.local` / `Password123!`
- **Клиент:** `customer1@tablemint.local` / `Password123!`
=======
## Маршруты (страницы)

### 🌐 Публичные

| Маршрут                          | Экран               | Описание                             |
| -------------------------------- | ------------------- | ------------------------------------ |
| `/`                              | Главная             | Каталог ресторанов с поиском         |
| `/about`                         | О сервисе           | Информация о платформе, преимущества |
| `/login`                         | Вход                | Аутентификация по email/паролю       |
| `/register`                      | Регистрация         | Создание аккаунта клиента            |
| `/restaurants/[id]`              | Ресторан            | Карточка ресторана, меню, информация |
| `/restaurants/[id]/book`         | Бронирование        | Выбор даты, времени, кол-ва гостей   |
| `/restaurants/[id]/book/confirm` | Подтверждение       | Финальное подтверждение брони        |
| `/restaurants/[id]/contact`      | Связаться           | Форма обратной связи                 |
| `/bookings`                      | Мои бронирования    | Список бронирований клиента          |
| `/bookings/[id]`                 | Детали бронирования | Статус, действия (отмена, перенос)   |
| `/bookings/[id]/success`         | Успех               | Подтверждение создания брони         |

### 🔐 Кабинет владельца (Owner)

| Маршрут             | Экран               | Описание                        |
| ------------------- | ------------------- | ------------------------------- |
| `/admin`            | Онбординг / Дашборд | Точка входа, редирект по роли   |
| `/admin/details`    | A2 · Детали         | Информация о ресторане          |
| `/admin/password`   | A3 · Пароль         | Смена пароля                    |
| `/admin/hours`      | A4 · Часы работы    | Настройка расписания            |
| `/admin/tables`     | A5 · Столики        | Управление столиками            |
| `/admin/menu`       | A6 · Меню           | Редактор меню                   |
| `/admin/bookings`   | A7 · Бронирования   | Список бронирований ресторана   |
| `/admin/contacts`   | A8 · Обращения      | Входящие контактные запросы     |
| `/admin/statistics` | Статистика          | Статистика ресторана (заглушка) |

### 🛡️ Панель модератора (Moderator)

| Маршрут               | Экран                   | Описание                                                               |
| --------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `/admin/users`        | M1 · Пользователи       | Все пользователи платформы, фильтры, активация/деактивация             |
| `/admin/users/create` | M2 · Создание владельца | Форма создания аккаунта владельца с временным паролем                  |
| `/admin/restaurants`  | M3 · Рестораны          | Все рестораны, фильтры, создание черновика                             |
| `/admin/stats`        | S1 · Статистика         | Статистика бронирований по всей платформе, графики, таблица источников |
| `/admin/guide`        | KT · Гайд состояний     | Справочная страница UI-состояний (loading, empty, 403, 404, и т.д.)    |

> Все маршруты автоматически префиксируются локалью: `/ru/admin/users`, `/en/admin/users`

---

## Роли и авторизация

Платформа поддерживает три роли:

| Роль        | Описание            | Доступ                                            |
| ----------- | ------------------- | ------------------------------------------------- |
| `CUSTOMER`  | Клиент              | Публичные страницы, бронирования                  |
| `OWNER`     | Владелец ресторана  | Кабинет владельца (`/admin/*` — экраны A2–A8)     |
| `MODERATOR` | Модератор платформы | Панель модератора (`/admin/*` — экраны M1–S1, KT) |

**Механизм авторизации:**

1. `requireStaff()` — проверяет наличие сессии, отклоняет `CUSTOMER`
2. `ownerGate(locale)` — проверяет роль `OWNER`, редирект при несовпадении
3. `moderatorGate(locale)` — проверяет роль `MODERATOR`, редирект при несовпадении

Сессия хранится в cookies (mock-реализация, без бэкенда).

---

## Интернационализация (i18n)

- **Локали:** `ru` (основная), `en`
- **Библиотека:** `next-intl` v4
- **Файлы переводов:** `messages/ru.json`, `messages/en.json`

### Пространства имён (namespaces)

| Namespace    | Описание                                                   |
| ------------ | ---------------------------------------------------------- |
| `common`     | Общие строки (навигация, кнопки, футер)                    |
| `auth`       | Вход и регистрация                                         |
| `home`       | Главная страница                                           |
| `restaurant` | Страница ресторана                                         |
| `booking`    | Бронирование                                               |
| `panel`      | Кабинет — общее (онбординг, детали, пароль)                |
| `cabinet`    | Кабинет владельца (столики, меню, бронирования, обращения) |
| `workspace`  | Рабочий кабинет (часы работы, публикация)                  |
| `moderator`  | Панель модератора (пользователи, рестораны, статистика)    |
| `guide`      | Гайд состояний                                             |

### Проверка ключей

```bash
npm run i18n:check
```

Скрипт сравнивает наборы ключей в `ru.json` и `en.json` — если есть расхождения, возвращает код ошибки и список отсутствующих ключей.

### Использование

```tsx
// Server Component
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('moderator');
t('pageTitle'); // → "Пользователи"

// Client Component
import { useTranslations } from 'next-intl';
const t = useTranslations('booking');
t('confirmButton'); // → "Подтвердить"
```

---

## Feature-модули

Бизнес-логика организована в `src/features/`:

| Модуль        | Описание           | Компоненты                                                                                                                                                               |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth`        | Аутентификация     | LoginForm, RegisterForm, ChangePasswordForm, session, guard                                                                                                              |
| `booking`     | Бронирование       | BookingPicker, ConfirmCard, BookingSummary, StatusBadge, store                                                                                                           |
| `contact`     | Обратная связь     | ContactForm, store, actions                                                                                                                                              |
| `restaurants` | Каталог ресторанов | RestaurantCard, RestaurantGrid, RestaurantHero, MenuSections                                                                                                             |
| `owner`       | Кабинет владельца  | OwnerShell, CabinetShell, HoursForm, TablesForm, MenuEditor, BookingFilters, ContactFilters, PublishControls                                                             |
| `moderator`   | Панель модератора  | ModeratorShell, UserFilters, UserToggleButton, CreateOwnerForm, RestaurantFilters, CreateRestaurantForm, StatsFilters, ModernDailyBarChart, StatsSourcesTable, StateCard |

Каждый модуль содержит:

- `types.ts` — типы и интерфейсы
- `store.ts` — in-memory хранилище (mock)
- `actions.ts` — серверные действия (Server Actions)
- `*.tsx` — React-компоненты

---

## Архитектурные решения

### Паттерн компонентов

```
Server Component (page.tsx)
  → Проверка авторизации
  → Загрузка данных
  → Рендер Shell + Client Components

Client Component ('use client')
  → Интерактивность (формы, фильтры)
  → Вызов Server Actions
```

### Mock-данные

Проект работает **без бэкенда**. Данные хранятся в `globalThis` для персистентности при HMR:

```tsx
const g = globalThis as unknown as { __users?: PlatformUser[] };
if (!g.__users) g.__users = SEED_DATA;
```

### Shell-компоненты

| Компонент        | Назначение                    | Используется в |
| ---------------- | ----------------------------- | -------------- |
| `OwnerShell`     | Оболочка онбординга владельца | A2–A6          |
| `CabinetShell`   | Оболочка рабочего кабинета    | A7–A8          |
| `ModeratorShell` | Оболочка панели модератора    | M1–M3, S1      |

### Стилизация

- **Tailwind CSS v4** через `@tailwindcss/postcss`
- Акцентный цвет: `orange-500` / `orange-600`
- Карточки: `rounded-3xl`, `border`, `shadow-sm`
- Текст: `neutral-900`, `neutral-500`, `neutral-400`
- Фон: `neutral-50`

---

## Демо-аккаунты

| Email                       | Роль      | Пароль |
| --------------------------- | --------- | ------ |
| `moderator@tablemint.local` | Модератор | любой  |
| `owner@tablemint.local`     | Владелец  | любой  |

> Mock-авторизация: пароль не проверяется, достаточно указать email.

---

## Деплой

Проект настроен с `output: 'standalone'` для контейнеризации:

```bash
# Сборка
npm run build

# Запуск
npm start
```

### Docker (пример)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
```

### Vercel

```bash
npx vercel
```

---

## Лицензия

Проект является частной разработкой. Все права защищены.
>>>>>>> 58fbdc81fc3619e6160e38d7e13363053b8f07d6
