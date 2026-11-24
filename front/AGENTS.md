<<<<<<< HEAD
# AGENTS.md — Инструкция для ИИ-ассистентов по проекту TableMint

Добро пожаловать в кодовую базу **TableMint**. Данный документ содержит критически важные правила, инварианты и архитектурные соглашения, которым обязан следовать любой ИИ-ассистент при работе с репозиторием.

---

## 1. Главные правила и инварианты (Strict Rules)

1. **Единый источник истины — `contract/openapi.yaml`:**
   - Никаких самовольных эндпоинтов, полей или форматов ответов.
   - Любое изменение API начинается с правки `contract/openapi.yaml`.
2. **Проверки предметной области живут ТОЛЬКО в API:**
   - Клиенты (Frontend и Telegram-бот) **не должны дублировать бизнес-логику**. Они показывают локализованные сообщения об ошибках, пришедшие из API.
3. **Строгий порядок блокировок при бронировании (Deadlock & Overlap Prevention):**
   - **Первый шаг:** Заблокировать строку в `idempotency_record` по `(scope, idem_key)`.
   - **Второй шаг:** Заблокировать строку ресторана `SELECT ... FROM restaurant WHERE id = :id FOR UPDATE`.
   - **Никогда** не блокировать ресторан до строки идемпотентности!
   - Не обходить и не удалять исключающее ограничение `booking_no_overlap` в PostgreSQL.
   - Исключение SQLSTATE `23P01` обязательно транслировать в HTTP 409 `BOOKING_NO_AVAILABILITY`.
4. **Безопасность и персональные данные:**
   - Пароли хешируются только через `BCrypt`.
   - Токен Telegram-бота (`TELEGRAM_BOT_TOKEN`) хранится **только** в окружении сервиса бота. Его нет в базе данных, нет в образе API и он **никогда не пишется в логи**.
   - API принимает вызовы от бота по заголовку `Authorization: Bearer <APP_BOT_SERVICE_TOKEN>`.
   - В логах (SLF4J) разрешено выводить только технические идентификаторы (UUID, reference). **Запрещено** логировать email, телефоны, имена, сообщения, токены и пароли.
5. **Двуязычность (i18n):**
   - Каждая строка интерфейса и ошибок существует на **двух языках**: `ru` (по умолчанию) и `en`.
   - Если ключ добавлен в один файл (`messages_ru.properties` или `ru.json`) и отсутствует во втором — CI упадет с ошибкой.
6. **Миграции базы данных:**
   - Схему меняют **только** новыми миграциями Flyway (`V{n}__{what}.sql`).
   - Уже примененные миграции изменять строго запрещено.
   - `spring.jpa.hibernate.ddl-auto` всегда установлен в `validate`.

---

## 2. Структура проекта (Monorepo)

```
tablemint/
├── AGENTS.md                  # Этот файл — правила для ИИ-ассистентов
├── README.md                  # Общее описание и быстрый старт
├── contract/
│   └── openapi.yaml           # Контракт API (OpenAPI 3.0.3)
├── docs/
│   └── SPECIFICATION.md       # Полная спецификация проекта TableMint 1.1
├── api/                       # Бэкенд-сервис на Spring Boot 4.1.1 (Java 21)
│   ├── src/main/java/com/tablemint/
│   │   ├── auth/              # Регистрация, сессии, пароли
│   │   ├── restaurant/        # Рестораны, часы работы, столики
│   │   ├── menu/              # Разделы и позиции меню
│   │   ├── booking/           # Движок бронирования с конкурентной защитой
│   │   ├── contact/           # Запросы на обратную связь
│   │   ├── stats/             # Аналитика и статистика (StatsDashboard)
│   │   ├── user/              # Управление пользователями (модерация)
│   │   └── common/            # Ошибки RFC 9457, идемпотентность, безопасность
│   └── src/main/resources/
│       ├── application.yml
│       ├── messages_en.properties
│       ├── messages_ru.properties
│       └── db/migration/      # Flyway SQL-миграции
├── bot/                       # Telegram-бот на Java 21 (Spring Boot, long polling)
├── web/                       # Фронтенд на Next.js (App Router, TypeScript)
└── deploy/                    # Docker Compose, Caddyfile, .env.example
```

---

## 3. Матрица ошибок API (Problem Details RFC 9457)

Все ответы об ошибках имеют тип `application/problem+json` следующей структуры:
```json
{
  "type": "about:blank",
  "status": 409,
  "code": "BOOKING_NO_AVAILABILITY",
  "title": "На это время нет свободных столиков. Выберите другое время.",
  "detail": "...",
  "fieldErrors": []
}
```

Всего в системе **21 фиксированный код ошибки**:
1. `VALIDATION_FAILED` (400)
2. `UNAUTHENTICATED` (401)
3. `INVALID_CREDENTIALS` (401)
4. `FORBIDDEN` (403)
5. `PASSWORD_CHANGE_REQUIRED` (403)
6. `NOT_FOUND` (404)
7. `EMAIL_ALREADY_REGISTERED` (409)
8. `BOOKING_NO_AVAILABILITY` (409)
9. `BOOKING_NOT_MODIFIABLE` (409)
10. `TABLE_IN_USE` (409)
11. `CURRENT_PASSWORD_INVALID` (422)
12. `RESTAURANT_NOT_BOOKABLE` (422)
13. `RESTAURANT_NOT_READY` (422)
14. `BOOKING_SLOT_INVALID` (422)
15. `BOOKING_OUTSIDE_HOURS` (422)
16. `BOOKING_TOO_SOON` (422)
17. `BOOKING_TOO_FAR` (422)
18. `BOOKING_PARTY_SIZE` (422)
19. `CONSENT_REQUIRED` (422)
20. `IDEMPOTENCY_KEY_MISMATCH` (422)
21. `RATE_LIMITED` (429)

---

## 4. Разделение слоев Java Backend

- **Пакеты по бизнес-областям:** `auth`, `restaurant`, `menu`, `booking`, `contact`, `stats`, `user`, `common`.
- **Layers:**
  - Контроллеры (`*Controller`) — тонкие, только транспорт, валидация DTO и маппинг.
  - Сервисы (`*Service`) — бизнес-правила, транзакции `@Transactional`, проверка прав, выброс `DomainException(ErrorCode)`.
  - Репозитории (`*Repository`) — Spring Data JPA + нативные блокирующие запросы. Сущности JPA **не выходят** из слоя сервиса наружу в контроллер.
- **Работа со временем:**
  - Внедрять `java.time.Clock`.
  - **Никогда** не вызывать напрямую `LocalDateTime.now()`, использовать `Instant.now(clock)` или `ZonedDateTime.now(clock).withZoneSameInstant(restaurantZone)`.
  - Хранилище БД использует `TIMESTAMPTZ`.
- **Работа с деньгами:**
  - Только `BigDecimal` со `scale = 2`. Никогда не использовать `double` или `float`.
=======
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
>>>>>>> 58fbdc81fc3619e6160e38d7e13363053b8f07d6
