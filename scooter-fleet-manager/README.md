# 🛴 Scooter Fleet Manager

Nowoczesny panel zarządzania flotą hulajnóg elektrycznych do modeli e-scooter sharing. System obsługuje zarządzanie pojazdem, tworzenie zadań, zarządzanie użytkownikami oraz rozliczenia.

**Demo:** https://scooter-fleet-manager.fly.dev

## 🚀 Cechy

### 📊 Dashboard
- Przegląd statystyk floty
- Monitorowanie stanu hulajnóg
- Analiza zadań i wychodów
- Przychody i rozliczenia

### 🛴 Zarządzanie hulajnogami
- Zarządzanie flotą hulajnóg
- Śledzenie pozycji GPS (via Flespi)
- Monitoring stanu baterii
- Status blokady i dostępności
- Oznaczanie zaginionych hulajnóg

### 📍 Punkty parkowania (Spots)
- Tworzenie i edycja spotów
- Zarządzanie pojemnością
- Geolokalizacja
- Przypisywanie hulajnóg do spotów

### ⚡ Zadania i zarządzanie
- **Rebalance** - przeniesienie hulajnóg między spotami
- **Collect** - zebranie hulajnóg do konserwacji
- **Deploy** - rozmieszczenie hulajnóg
- **Lost** - oznaczenie zaginionych

### 👥 Zarządzanie użytkownikami
- 3 typy kont:
  - **Admin** - pełny dostęp do systemu
  - **Service** - zarządzanie zadaniami i hulajnogami
  - **Client** - użytkownik (przychody, rozliczenia)

### 💳 Rozliczenia
- Generowanie faktur
- Śledzenie płatności
- Raporty przychodów
- Historia transakcji

### 🔐 Bezpieczeństwo
- JWT authentication
- Role-based access control (RBAC)
- Szyfrowanie haseł (bcrypt)
- Audit logs

---

## 📋 Wymagania

### Lokalne testowanie
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (opcjonalnie)

### Production (Fly.io)
- Konto Fly.io
- Flespi API token
- PostgreSQL (tworzony przez Fly.io)

---

## 🔧 Szybki start

### 1. Instalacja lokalna

```bash
# Klonowanie/przygotowanie
mkdir scooter-fleet-manager && cd scooter-fleet-manager
# Skopiuj wszystkie pliki

# Instalacja zależności
npm install

# Uruchom PostgreSQL
docker-compose up -d

# Czekaj 30 sekund aż DB będzie gotowa
sleep 30

# Inicjalizacja bazy danych
npm run db:init

# Uruchomienie serwera
npm run dev
```

### 2. Testowe dane

```bash
# Rejestracja admina
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleet.com",
    "password": "password123",
    "fullName": "Admin User",
    "role": "admin"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleet.com",
    "password": "password123"
  }'
```

### 3. Uruchomienie frontendu

```bash
# W osobnym terminalu
cd frontend

# Instalacja
npm install

# Development
npm start

# Otwórz: http://localhost:3000
```

---

## 📡 Integracja z Flespi

### Konfiguracja

1. **Załóż konto na https://flespi.io**
2. **Pobierz API Token:**
   - Settings → Tokens
   - Create New Token
   - Uprawnienia: `/gw/devices`

3. **Ustaw w `.env`:**
```
FLESPI_TOKEN=your_token_here
```

### Obsługiwane urządzenia

Głównie **OMNI OT303BL** - hulajnoga z:
- GPS + GLONASS + BDS
- LTE connectivity
- Smart lock
- Battery monitoring
- Anti-theft protection

[Dokumentacja OMNI OT303BL](https://flespi.com/devices/omni-ot303bl)

### API Endpoints

```javascript
// Pobierz telemetrię hulajnogi
GET /api/scooters/:id/telemetry

// Wyślij komendę do hulajnogi
POST /api/scooters/:id/command
Body: {
  "instructionType": "S6",  // lub D0, L0, R0, etc.
  "payload": ""  // zależy od typu
}

// Dostępne komendy:
// D0 - Get position (single time)
// D1 - Set positioning interval
// L0/L1 - Lock/Unlock
// R0 - Lock/Unlock request
// S4, S5, S7 - Settings
// S6 - Get scooter info
// V0/V1 - Beep commands
```

---

## 🗄️ Struktura bazy danych

### Tabele

```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── full_name
├── role (admin|service|client)
├── status (active|inactive|suspended)
└── timestamps

scooters
├── id (PK)
├── device_id (UNIQUE) - Flespi channel ID
├── name
├── model
├── serial_number
├── battery_level
├── status (available|in_use|maintenance|charging)
├── latitude, longitude
├── is_lost
└── timestamps

spots
├── id (PK)
├── name
├── latitude, longitude
├── capacity
├── area_radius
├── status
└── timestamps

tasks
├── id (PK)
├── scooter_id (FK)
├── task_type (rebalance|collect|deploy|lost)
├── status (pending|assigned|in_progress|completed)
├── assigned_to (FK users)
├── priority
└── timestamps

billing_records
├── id (PK)
├── user_id (FK)
├── scooter_id (FK)
├── amount
├── type
├── status (pending|paid)
└── timestamps

device_telemetry
├── id (PK)
├── scooter_id (FK)
├── latitude, longitude
├── battery_level
├── speed
└── received_at

audit_logs
├── id (PK)
├── user_id (FK)
├── action
├── entity_type, entity_id
└── created_at
```

---

## 🌐 API Dokumentacja

### Authentication

```bash
# Register
POST /api/auth/register
Body: { email, password, fullName, role }
Response: { user, token }

# Login
POST /api/auth/login
Body: { email, password }
Response: { user, token }
```

### Scooters

```bash
# Get all scooters
GET /api/scooters
Query: ?status=available&spotId=1

# Get single scooter
GET /api/scooters/:id

# Create scooter (admin)
POST /api/scooters
Body: { deviceId, name, model, serialNumber, imei, flespiChannelId }

# Update status
PATCH /api/scooters/:id/status
Body: { status }

# Mark as lost (admin/service)
POST /api/scooters/:id/mark-lost

# Send command (admin/service)
POST /api/scooters/:id/command
Body: { instructionType, payload }

# Get telemetry
GET /api/scooters/:id/telemetry
```

### Spots

```bash
# Get all spots
GET /api/spots

# Get spot with scooters
GET /api/spots/:id

# Create spot (admin)
POST /api/spots
Body: { name, latitude, longitude, capacity, address }

# Update spot (admin)
PATCH /api/spots/:id
Body: { name, capacity, status, ... }

# Delete spot (admin)
DELETE /api/spots/:id
```

### Tasks

```bash
# Get all tasks
GET /api/tasks
Query: ?status=pending&type=rebalance&assignedTo=1

# Create task (admin/service)
POST /api/tasks
Body: {
  scooterId,
  taskType,      // rebalance|collect|deploy|lost
  priority,      // normal|high|urgent
  description,
  fromSpotId,
  toSpotId
}

# Assign task
PATCH /api/tasks/:id/assign
Body: { userId }

# Update status
PATCH /api/tasks/:id/status
Body: { status }  // pending|assigned|in_progress|completed

# Get my tasks (service workers)
GET /api/tasks/my-tasks

# Task stats
GET /api/tasks/stats/overview
```

### Billing

```bash
# Get billing records
GET /api/billing
Query: ?userId=1&status=pending

# Get summary
GET /api/billing/summary/user/:userId

# Create record (admin)
POST /api/billing
Body: { userId, scooterId, amount, type, description }

# Mark as paid
PATCH /api/billing/:id/mark-paid

# Get dashboard stats (admin)
GET /api/billing/stats/dashboard
```

### Admin

```bash
# Get all users
GET /api/admin/users
Query: ?role=service&status=active

# Update user role (admin)
PATCH /api/admin/users/:id/role
Body: { role }

# Update user status (admin)
PATCH /api/admin/users/:id/status
Body: { status }

# Get audit logs (admin)
GET /api/admin/audit-logs
Query: ?userId=1&action=MARK_LOST

# Get system stats (admin)
GET /api/admin/stats
```

---

## 🚀 Wdrażanie na Fly.io

Szczegółowy poradnik znajduje się w pliku **DEPLOYMENT_GUIDE.md**

### Szybko:

```bash
# Zainstaluj Fly CLI
brew install flyctl  # macOS

# Zaloguj się
flyctl auth login

# Wdróż
flyctl launch
fly deploy

# Ustaw secrets
fly secrets set FLESPI_TOKEN="your_token"
fly secrets set JWT_SECRET="your_secret_key"

# Inicjalizuj DB
fly ssh console
npm run db:init
exit

# Sprawdź
fly logs
fly status
```

---

## 📊 Przykładowe scenariusze

### Scenariusz 1: Rebalance

1. Admin widzi, że spot A ma za dużo hulajnóg
2. Admin tworzy zadanie `rebalance` dla hulajnogi
3. Service worker dostaje powiadomienie
4. Worker transportuje hulajnogę do spot B
5. Worker aktualizuje status zadania na `completed`

### Scenariusz 2: Zaginiona hulajnoga

1. Użytkownik zgłasza zaginięcie
2. Admin kliknie "Mark as Lost" na hulajnodze
3. System automatycznie tworzy zadanie `lost`
4. Service worker szuka hulajnogi
5. Po znalezieniu: `lost` → `found` (custom status)

### Scenariusz 3: Rozliczenia

1. Client korzysta z hulajnogi
2. System automatycznie generuje fakturę
3. Admin zatwierdza rachunek
4. Client płaci
5. Admin oznacza jako `paid`

---

## 🛠️ Troubleshooting

### "Cannot connect to database"

```bash
# Sprawdź czy PostgreSQL działa
docker ps | grep postgres

# Restart
docker-compose restart postgres

# Ponownie inicjalizuj
npm run db:init
```

### "Invalid token"

```bash
# Token wygasł (24h TTL)
# Zaloguj się ponownie
```

### "Flespi API error"

```bash
# Sprawdź FLESPI_TOKEN
echo $FLESPI_TOKEN

# Zweryfikuj token na https://flespi.io
```

### "Port 3000/3001 already in use"

```bash
# Zmień port w .env
PORT=3002

# Lub zabij proces
lsof -ti:3000 | xargs kill -9
```

---

## 🔒 Bezpieczeństwo

### Best Practices

- ✅ Zmień domyślne hasła
- ✅ Generuj losowy JWT_SECRET (min 32 znaki)
- ✅ Używaj HTTPS (Fly.io robi to automatycznie)
- ✅ Nie commituj `.env` do Git
- ✅ Regularnie backupuj bazę danych
- ✅ Monitoruj audit logs
- ✅ Implement rate limiting
- ✅ Validate all inputs

### GDPR/Privacy

- Dane użytkownika przechowywane w `users`
- Logging w `audit_logs`
- Możliwość eksportu danych
- Możliwość usunięcia konta

---

## 📈 Performance Tips

1. **Indexing:** Wszystkie ważne kolumny są zaindeksowane
2. **Pagination:** Implementuj dla dużych list
3. **Caching:** Rozważ Redis dla sesji
4. **Database:** Regular VACUUM & ANALYZE
5. **Load Balancing:** Fly.io obsługuje automatycznie

```bash
# Skalowanie na Fly.io
fly scale count 2       # 2 instancje
fly scale memory 512    # 512 MB RAM
```

---

## 📝 Logging

```javascript
// Wszystkie akcje są logowane w audit_logs
// Sprawdzenie logów:
GET /api/admin/audit-logs?userId=1&action=MARK_LOST

// W logach aplikacji:
fly logs -a scooter-fleet-manager --follow
```

---

## 🤝 Współpraca

Bazy danych i typy danych są gotowe do integracji z:
- Mobile apps (React Native)
- Web dashboards
- Third-party APIs
- Analytics platforms

---

## 📄 Licencja

MIT License - Swobodnie używaj w projektach komercyjnych i prywatnych.

---

## 📞 Support

- Dokumentacja Fly.io: https://fly.io/docs/
- Flespi Docs: https://flespi.com/kb
- PostgreSQL: https://www.postgresql.org/docs/
- Node.js: https://nodejs.org/docs/

---

## 🎯 Roadmap

- [ ] Real-time WebSocket updates
- [ ] Mobile app (React Native)
- [ ] AI-powered route optimization
- [ ] Predictive maintenance
- [ ] Integration z payment gateways
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Email notifications

---

**Wersja:** 1.0.0  
**Ostatnia aktualizacja:** 2026-04-10  
**Status:** Production Ready 🚀
