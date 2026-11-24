# TableMint — Техническая спецификация и руководство по разработке (v1.1)

> **Статус документа:** Зафиксирован владельцем продукта (Ревизия 1.1 от 18 октября 2026).  
> **Контекст репозитория:** Monorepo (`api/`, `web/`, `bot/`, `contract/`, `deploy/`, `docs/`).  
> **Цель этого файла:** Структурированный, машиночитаемый справочник для ИИ-ассистентов и разработчиков.

---

## 1. Метаданные и архитектурные решения (ADR)

### 1.1 Общие параметры
- **Проект:** TableMint — единая платформа для ресторанов (меню, бронирование столиков без наложений, контакты, аналитика в Web и Telegram).
- **Стек API:** Java 21, Spring Boot 4.1.1, Gradle, PostgreSQL 16 (`btree_gist`), Flyway, Spring Security, Spring Session JDBC.
- **Стек Web:** Next.js (App Router), TypeScript (strict), React, next-intl.
- **Стек Bot:** Java 21, Spring Boot, библиотека TelegramBots (long polling).
- **Инфраструктура:** Docker Compose за Caddy 2 (TLS, reverse proxy).
- **Часовой пояс по умолчанию:** `Asia/Bishkek` (UTC+06:00).
- **Валюта по умолчанию:** `KGS` (кыргызский сом), формат чисел `numeric(10, 2)` (например, `"1250.00"`).
- **Языки:** `ru` (по умолчанию) и `en`. Отсутствие локализации в любом из бандлов ломает сборку CI.
- **Базовый путь API:** `/api/v1`

### 1.2 Архитектурные решения (ADR) и правила проекта
| ID | Решение | Описание / Правило |
|---|---|---|
| **ADR-P01** | Монорепозиторий & OpenAPI-first | `contract/openapi.yaml` — единый источник истины. Изменения только через согласованный PR. |
| **ADR-P02** | Гарантия отсутствия наложений (Zero Overlap) | Двухуровневая защита: блокировка строки ресторана `PESSIMISTIC_WRITE` (`SELECT ... FOR UPDATE`) + PostgreSQL Exclude Constraint `gist` по `(table_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE status = 'CONFIRMED'`. |
| **ADR-P03** | Аутентификация и сессии | Сессии в PostgreSQL (`Spring Session JDBC`) в cookie `SESSION` (HttpOnly, Secure, SameSite=Lax). CSRF-токен через `X-XSRF-TOKEN` заголовок. Для бота — Bearer токен `APP_BOT_SERVICE_TOKEN`. |
| **ADR-P04** | Обработка ошибок по RFC 9457 | Все ошибки API возвращаются как Problem Details с фиксированным строковым `code`, локализованными `title`/`detail` и списком `fieldErrors`. |
| **ADR-P05** | Развертывание | Docker Compose (сервисы: `db`, `api`, `web`, `bot`, `caddy`) на одном EC2 инстансе. |
| **ADR-P06** | Telegram-бот на Java | Бот не имеет прямого доступа к БД, взаимодействует исключительно через `/api/v1/*` с токеном бота. `TELEGRAM_BOT_TOKEN` никогда не логируется и не попадает в API. |

---

## 2. Ролевая модель и матрица доступа (x-access)

### 2.1 Роли пользователей
- `ANONYMOUS` (Посетитель): просмотр ресторанов, меню, доступных слотов времени; отправка запроса на связь.
- `CUSTOMER` (Зарегистрированный клиент): вход по email/паролю, бронирование столиков на сайте, отмена и перенос собственных бронирований.
- `OWNER` (Владелец ресторана): создается модератором. Настройка своего ресторана (часы работы, столики, меню), публикация, просмотр и отмена бронирований своего ресторана, обработка входящих запросов, StatsDashboard.
- `MODERATOR` (Администратор платформы): управление пользователями, создание владельцев, создание заготовок ресторанов (статус DRAFT), просмотр всех данных платформы.
- `BOT` (Сервисная роль Telegram-бота): гостевое бронирование без предварительной регистрации клиента.

### 2.2 Правила изоляции данных
- Запрос к чужому ресторану или чужому бронированию возвращает **HTTP 404 Not Found** (а не 403), чтобы скрыть существование ресурса.
- Попытка выполнить запрещенное по роли действие возвращает **HTTP 403 Forbidden**.
- Если у владельца активен флаг `must_change_password`, любой запрос (кроме смены пароля, `/auth/me` и `logout`) отклоняется с ошибкой `403 PASSWORD_CHANGE_REQUIRED`.

---

## 3. Бизнес-правила и числовые константы

```yaml
constants:
  sitting_minutes: 120        # Длительность посадки по умолчанию: 2 часа
  slot_minutes: 30            # Сетка выбора слотов времени: каждые 30 минут
  min_lead_minutes: 60        # Минимальное опережение брони: не менее чем за 1 час до начала
  max_advance_days: 60        # Горизонт бронирования: максимум 60 дней вперед
  table_seats_min: 1          # Мин. количество мест за столиком
  table_seats_max: 50         # Макс. количество мест за столиком
  password_min_length: 10     # Минимальная длина пароля
  idempotency_ttl_hours: 24   # Время жизни ключа идемпотентности
  session_idle_timeout_hours: 2 # Таймаут неактивности сессии
  session_absolute_days: 7    # Абсолютное время жизни сессии
  rate_limit_login: 5         # Лимит попыток логина: 5 попыток в минуту
  rate_limit_contact: 5       # Лимит запросов на связь: 5 запросов в час
  booking_code_format: "TM-XXXXXX" # Префикс TM- и 6 символов [0-9A-Z]
```

### 3.1 Алгоритм поиска доступных слотов (`getAvailability`)
1. Определить день недели для даты (1 = Понедельник ... 7 = Воскресенье).
2. Загрузить `opening_hours` ресторана для этого дня недели. Если ресторан закрыт — слотов нет.
3. Сгенерировать кандидаты на время начала: шаг `slot_minutes` (30 мин), начиная с `opens_at` и заканчивая не позже `closes_at - sitting_minutes`.
4. Отфильтровать слоты:
   - Если дата сегодня: начало слота должно быть `>= now() + min_lead_minutes`.
   - Дата не должна превышать `today + max_advance_days` (иначе ошибка `BOOKING_TOO_FAR`).
   - Число гостей не должно превышать вместимость наибольшего активного столика (иначе ошибка `BOOKING_PARTY_SIZE`).
5. Проверить занятость столиков: столик считается свободным, если нет бронирований со статусом `CONFIRMED`, чей полуоткрытый интервал `[starts_at, ends_at)` пересекается со слотом `[slot_start, slot_start + sitting_minutes)`.
6. Если для времени есть хотя бы один подходящий активный столик с `seats >= party_size`, слот включается в ответ.

### 3.2 Алгоритм создания бронирования (`createBooking` / `createGuestBooking`)
1. **Предварительная валидация (до транзакции):**
   - Ресторан существует и имеет статус `PUBLISHED` (`RESTAURANT_NOT_BOOKABLE`).
   - Дата и время соответствуют сетке слотов ресторана (`BOOKING_SLOT_INVALID`).
   - Посадка полностью умещается в часы работы (`BOOKING_OUTSIDE_HOURS`).
   - Соблюдено минимальное опережение (`BOOKING_TOO_SOON`).
   - Соблюден горизонт планирования (`BOOKING_TOO_FAR`).
   - Число гостей `<= max(active_table.seats)` (`BOOKING_PARTY_SIZE`).
   - Получено согласие на обработку персональных данных (`CONSENT_REQUIRED`).
2. **Транзакция записи (Строгий порядок блокировок):**
   - **Шаг А:** Вставить или заблокировать запись в `idempotency_record` для пары `(scope, idem_key)`.
     - Если ключ уже существует и хеш тела запроса совпадает: если ответ сохранен, вернуть его с заголовком `Idempotent-Replayed: true`.
     - Если ключ существует, но хеш не совпадает: выбросить `422 IDEMPOTENCY_KEY_MISMATCH`.
     - Если первая транзакция еще выполняется: ожидать освобождения строки.
   - **Шаг Б:** Заблокировать строку ресторана: `SELECT id FROM restaurant WHERE id = :id FOR UPDATE;`
     *(ВНИМАНИЕ: никогда не блокировать ресторан раньше строки идемпотентности!)*
   - **Шаг В:** Подобрать столик SQL-запросом с выбором наименьшего подходящего:
     ```sql
     SELECT t.id FROM dining_table t
     WHERE t.restaurant_id = :restaurantId 
       AND t.active = true 
       AND t.seats >= :partySize
       AND NOT EXISTS (
         SELECT 1 FROM booking b
         WHERE b.table_id = t.id 
           AND b.status = 'CONFIRMED'
           AND tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(:startsAt, :endsAt, '[)')
       )
     ORDER BY t.seats ASC, t.label ASC
     LIMIT 1;
     ```
   - Если столик не найден: выбросить `409 BOOKING_NO_AVAILABILITY`.
   - **Шаг Г:** Сохранить бронирование со статусом `CONFIRMED` и уникальным номером `TM-XXXXXX`.
   - **Шаг Д:** Сохранить результат в `idempotency_record` и зафиксировать транзакцию.
   - При перехвате ошибки PostgreSQL `23P01` (exclusion violation) транслировать её в `409 BOOKING_NO_AVAILABILITY`.

---

## 4. Модель данных (PostgreSQL 16)

Схема состоит из 9 таблиц. Включено расширение `btree_gist`.

```sql
-- 1. Пользователи
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(32) NOT NULL, -- CUSTOMER, OWNER, MODERATOR
    locale VARCHAR(10) NOT NULL DEFAULT 'ru',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    consent_version VARCHAR(32) NOT NULL,
    consent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_app_user_email_lower ON app_user (lower(email));

-- 2. Рестораны
CREATE TABLE restaurant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES app_user(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    time_zone VARCHAR(64) NOT NULL DEFAULT 'Asia/Bishkek',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, HIDDEN
    sitting_minutes INT NOT NULL DEFAULT 120,
    slot_minutes INT NOT NULL DEFAULT 30,
    min_lead_minutes INT NOT NULL DEFAULT 60,
    max_advance_days INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Часы работы
CREATE TABLE opening_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    CONSTRAINT chk_opening_hours_order CHECK (closes_at > opens_at),
    CONSTRAINT uq_restaurant_day UNIQUE (restaurant_id, day_of_week)
);

-- 4. Столики
CREATE TABLE dining_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    label VARCHAR(64) NOT NULL,
    seats INT NOT NULL CHECK (seats BETWEEN 1 AND 50),
    active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT uq_restaurant_table_label UNIQUE (restaurant_id, label)
);

-- 5. Разделы меню
CREATE TABLE menu_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0
);

-- 6. Позиции меню
CREATE TABLE menu_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES menu_section(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_amount NUMERIC(10, 2) NOT NULL CHECK (price_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'KGS',
    available BOOLEAN NOT NULL DEFAULT true,
    position INT NOT NULL DEFAULT 0
);

-- 7. Бронирования
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(32) NOT NULL UNIQUE,
    restaurant_id UUID NOT NULL REFERENCES restaurant(id),
    table_id UUID NOT NULL REFERENCES dining_table(id),
    customer_id UUID REFERENCES app_user(id),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    telegram_user_id BIGINT,
    party_size INT NOT NULL CHECK (party_size > 0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL, -- CONFIRMED, CANCELLED
    source VARCHAR(32) NOT NULL, -- WEB, TELEGRAM
    consent_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by VARCHAR(32), -- CUSTOMER, OWNER, SYSTEM
    CONSTRAINT chk_booking_person CHECK (
        (customer_id IS NOT NULL AND guest_name IS NULL AND guest_phone IS NULL) OR
        (customer_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
    ),
    CONSTRAINT chk_booking_time CHECK (ends_at > starts_at)
);

ALTER TABLE booking ADD CONSTRAINT booking_no_overlap EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status = 'CONFIRMED');

-- 8. Запросы на обратную связь
CREATE TABLE contact_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    message TEXT NOT NULL,
    source VARCHAR(32) NOT NULL, -- WEB, TELEGRAM
    telegram_user_id BIGINT,
    status VARCHAR(32) NOT NULL DEFAULT 'NEW', -- NEW, HANDLED
    consent_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    handled_at TIMESTAMPTZ,
    CONSTRAINT chk_contact_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- 9. Идемпотентность
CREATE TABLE idempotency_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(64) NOT NULL,
    idem_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT NOT NULL,
    response_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_idempotency_scope_key UNIQUE (scope, idem_key)
);
```

---

## 5. Полный реестр кодов ошибок (21 код)

| Код ошибки | HTTP | Сообщение EN | Сообщение RU |
|---|:---:|---|---|
| `VALIDATION_FAILED` | 400 | Please check the highlighted fields. | Проверьте отмеченные поля. |
| `UNAUTHENTICATED` | 401 | Please sign in to continue. | Войдите, чтобы продолжить. |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password. | Неверный email или пароль. |
| `FORBIDDEN` | 403 | You don't have access to this action. | У вас нет доступа к этому действию. |
| `PASSWORD_CHANGE_REQUIRED` | 403 | Set a new password to continue. | Задайте новый пароль, чтобы продолжить. |
| `NOT_FOUND` | 404 | This page or item was not found. | Страница или запись не найдена. |
| `EMAIL_ALREADY_REGISTERED` | 409 | An account with this email already exists. | Аккаунт с таким email уже существует. |
| `BOOKING_NO_AVAILABILITY` | 409 | No free table at this time. Please choose another time. | На это время нет свободных столиков. Выберите другое время. |
| `BOOKING_NOT_MODIFIABLE` | 409 | This booking can no longer be changed. | Это бронирование уже нельзя изменить. |
| `TABLE_IN_USE` | 409 | This table has bookings, so it can't be changed this way. | У этого столика есть бронирования, поэтому изменить его так нельзя. |
| `CURRENT_PASSWORD_INVALID` | 422 | The current password is wrong. | Текущий пароль указан неверно. |
| `RESTAURANT_NOT_BOOKABLE` | 422 | This restaurant isn't taking bookings right now. | Этот ресторан сейчас не принимает бронирования. |
| `RESTAURANT_NOT_READY` | 422 | Add opening hours, an active table and a menu item before publishing. | Перед публикацией добавьте часы работы, активный столик и хотя бы одну позицию меню. |
| `BOOKING_SLOT_INVALID` | 422 | Please choose one of the offered times. | Выберите время из предложенных. |
| `BOOKING_OUTSIDE_HOURS` | 422 | This booking falls outside the restaurant's opening hours. | Бронирование выходит за часы работы ресторана. |
| `BOOKING_TOO_SOON` | 422 | Book at least {minutes} minutes in advance. | Бронируйте минимум за {minutes} мин до начала. |
| `BOOKING_TOO_FAR` | 422 | You can book at most {days} days ahead. | Бронировать можно максимум на {days} дн. вперёд. |
| `BOOKING_PARTY_SIZE` | 422 | We can seat at most {max} guests per booking. | В одном бронировании может быть не более {max} гостей. |
| `CONSENT_REQUIRED` | 422 | Please agree to the processing of your personal data to continue. | Чтобы продолжить, дайте согласие на обработку персональных данных. |
| `IDEMPOTENCY_KEY_MISMATCH` | 422 | This request was already used for a different booking. Please try again. | Этот запрос уже использован для другого бронирования. Попробуйте ещё раз. |
| `RATE_LIMITED` | 429 | Too many attempts. Please try again in {seconds} seconds. | Слишком много попыток. Повторите через {seconds} с. |

---

## 6. Каталог эндпоинтов API (`/api/v1`)

### 6.1 Аутентификация и профиль
- `POST /auth/register` — регистрация клиента (`registerCustomer`). Доступ: Anonymous.
- `POST /auth/login` — вход по email и паролю (`login`). Доступ: Anonymous.
- `POST /auth/logout` — завершение сессии (`logout`). Доступ: CUSTOMER, OWNER, MODERATOR.
- `GET /auth/me` — текущий пользователь (`getCurrentUser`). Доступ: CUSTOMER, OWNER, MODERATOR.
- `POST /auth/password` — смена пароля (`changePassword`). Доступ: CUSTOMER, OWNER, MODERATOR.

### 6.2 Публичные данные (Каталог и Меню)
- `GET /restaurants` — список опубликованных ресторанов (`listRestaurants`). Доступ: Everyone.
- `GET /restaurants/{restaurantId}` — карточка ресторана (`getRestaurant`). Доступ: Everyone.
- `GET /restaurants/{restaurantId}/menu` — меню ресторана (`getMenu`). Доступ: Everyone.
- `GET /restaurants/{restaurantId}/availability` — свободные слоты (`getAvailability`). Доступ: Everyone.
- `POST /restaurants/{restaurantId}/contact-requests` — запрос на связь (`createContactRequest`). Доступ: Everyone.

### 6.3 Бронирования клиентов
- `POST /bookings` — создание бронирования клиентом (`createBooking`). Доступ: CUSTOMER. Требует `Idempotency-Key`.
- `GET /me/bookings` — список своих бронирований (`listMyBookings`). Доступ: CUSTOMER.
- `GET /bookings/{bookingId}` — детали бронирования (`getBooking`). Доступ: CUSTOMER (свои), OWNER (свои), MODERATOR.
- `POST /bookings/{bookingId}/cancel` — отмена бронирования (`cancelBooking`). Доступ: CUSTOMER (свои), OWNER (свои), MODERATOR.
- `POST /bookings/{bookingId}/reschedule` — перенос бронирования (`rescheduleBooking`). Доступ: CUSTOMER (свои), OWNER (свои), MODERATOR.

### 6.4 Гостевые бронирования (Telegram-бот)
- `POST /guest/bookings` — гостевое бронирование (`createGuestBooking`). Доступ: BOT (`Authorization: Bearer <APP_BOT_SERVICE_TOKEN>`). Требует `Idempotency-Key`.

### 6.5 Администрирование ресторанов (Владелец / Модератор)
- `GET /admin/restaurants` — управляемые рестораны (`listManagedRestaurants`).
- `POST /admin/restaurants` — создание заготовки ресторана (`createRestaurant`). Только MODERATOR.
- `GET /admin/restaurants/{restaurantId}` — карточка управления (`getManagedRestaurant`).
- `PATCH /admin/restaurants/{restaurantId}` — обновление сведений (`updateRestaurant`).
- `PUT /admin/restaurants/{restaurantId}/publication` — публикация/скрытие (`setPublication`).
- `PUT /admin/restaurants/{restaurantId}/opening-hours` — замена расписания (`replaceOpeningHours`).
- `GET /admin/restaurants/{restaurantId}/tables` — список столиков (`listTables`).
- `POST /admin/restaurants/{restaurantId}/tables` — добавление столика (`createTable`).
- `PATCH /admin/tables/{tableId}` — обновление столика (`updateTable`).
- `DELETE /admin/tables/{tableId}` — удаление столика (`deleteTable`).
- `GET /admin/restaurants/{restaurantId}/menu` — полное меню для управления (`getManagedMenu`).
- `POST /admin/restaurants/{restaurantId}/menu-sections` — создание раздела (`createMenuSection`).
- `PATCH /admin/menu-sections/{sectionId}` — обновление раздела (`updateMenuSection`).
- `DELETE /admin/menu-sections/{sectionId}` — удаление раздела (`deleteMenuSection`).
- `POST /admin/menu-sections/{sectionId}/items` — создание позиции (`createMenuItem`).
- `PATCH /admin/menu-items/{itemId}` — обновление позиции (`updateMenuItem`).
- `DELETE /admin/menu-items/{itemId}` — удаление позиции (`deleteMenuItem`).
- `GET /admin/restaurants/{restaurantId}/bookings` — бронирования за дату (`listRestaurantBookings`).
- `GET /admin/contact-requests` — запросы на обратную связь (`listContactRequests`).
- `PATCH /admin/contact-requests/{contactRequestId}` — смена статуса запроса (`updateContactRequest`).
- `GET /admin/stats/bookings` — статистика бронирований (`getBookingStats`).

### 6.6 Модерация пользователей (Только Модератор)
- `GET /admin/users` — список пользователей (`listUsers`).
- `POST /admin/owners` — создание аккаунта владельца с временным паролем (`createOwner`).
- `PATCH /admin/users/{userId}` — блокировка/активация пользователя (`updateUser`).

---

## 7. Требования к качеству и план тестирования

1. **PermissionCompletenessTest:** Каждый эндпоинт из `contract/openapi.yaml` обязан иметь:
   - `operationId_allows_ROLE`
   - `operationId_denies_ROLE`
2. **BookingConcurrencyIT:** Стресс-тест на 50 параллельных потоков на один слот времени в Testcontainers PostgreSQL:
   - Если свободных столиков N, ровно N бронирований получают статус 200/201 CONFIRMED.
   - Остальные 50 - N получают HTTP 409 `BOOKING_NO_AVAILABILITY`.
   - В БД исключены любые пересечения временных диапазонов на один столик.
3. **Покрытие кода (JaCoCo):**
   - API в целом: `>= 85%` строк.
   - Сервисы бронирования (`booking/`) и запросов (`contact/`): `>= 95%` строк.
4. **Контрактные тесты:** Валидация схемы ответов через `swagger-request-validator`.
