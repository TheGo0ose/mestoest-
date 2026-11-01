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
```

---

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
