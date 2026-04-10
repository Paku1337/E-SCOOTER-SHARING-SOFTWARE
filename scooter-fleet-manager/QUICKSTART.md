# 🚀 Quick Start Guide

## 5-minutowa konfiguracja lokalnie

### 1. Instalacja wymagań

```bash
# macOS
brew install node@18
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y nodejs postgresql postgresql-contrib

# Windows
# Pobierz z: https://nodejs.org i https://www.postgresql.org/download/windows/
```

### 2. Przygotowanie projektu

```bash
# Klonowanie/kopia plików
mkdir -p ~/projects/scooter-fleet && cd ~/projects/scooter-fleet

# Skopiuj wszystkie pliki backend:
# - package.json
# - server.js
# - db.js
# - init-db.js
# - reset-db.js
# - seed-db.js
# - .env
# - docker-compose.yml
# - Dockerfile
# - fly.toml
# - README.md
# - DEPLOYMENT_GUIDE.md
# - routes/ (folder)
# - middleware/ (folder)

npm install
```

### 3. Uruchomienie bazy danych

#### Opcja A: Docker (najszybciej)

```bash
docker-compose up -d

# Czekaj aż będzie gotowe (30 sekund)
docker logs scooter-fleet-db

# Powinno wyświetlić: "database system is ready to accept connections"
```

#### Opcja B: Systemowa PostgreSQL

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows - PostgreSQL powinien być uruchomiony automatycznie
```

### 4. Inicjalizacja bazy danych

```bash
# Tworzenie schemy
npm run db:init

# Lub jeśli chcesz resetować istniejącą bazę
npm run db:reset

# Dodaj testowe dane
node seed-db.js
```

### 5. Uruchomienie serwera

```bash
# Development mode z hot-reload
npm run dev

# Production mode
npm start

# Powinno wyświetlić:
# 🛴 Scooter Fleet Manager running on port 3001
```

### 6. Test API (w nowym terminalu)

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleet.com",
    "password": "admin123"
  }'

# Będzie zwrócony JWT token
```

### 7. Frontend (opcjonalnie, w nowym terminalu)

```bash
# Utwórz React app
npx create-react-app scooter-fleet-frontend
cd scooter-fleet-frontend

# Skopiuj frontend.jsx do src/App.jsx

# Zainstaluj zależności
npm install lucide-react

# Uruchom
npm start

# Otwórz: http://localhost:3000
```

---

## 📊 Testowe dane

Po uruchomieniu `seed-db.js` będą dostępne:

### Użytkownicy:
```
Admin:     admin@fleet.com / admin123
Service 1: service1@fleet.com / service123
Service 2: service2@fleet.com / service123
Client:    client@fleet.com / client123
```

### Hulajnogi:
```
SC-001 - SC-006 (stan: available, in_use, charging, maintenance)
```

### Spoty:
```
1. Central Station - Centralna 1, Warszawa
2. Park Łazienki - Al. Wśród Jezior
3. Shopping Mall - Aleje Jerozolimskie
4. Business District - Miodowa 10
```

### Zadania:
```
- Rebalance (pending)
- Collect (pending, in_progress)
- Deploy (pending)
```

---

## 🔧 Zmienne środowiskowe (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scooter_fleet
DB_USER=scooter_admin
DB_PASSWORD=scooter_secure_pass

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Flespi API
FLESPI_TOKEN=your_flespi_api_token

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Zmień wartości w produkcji!**

---

## 📱 API Endpoints do testowania

### Auth

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@fleet.com",
    "password": "password123",
    "fullName": "New User",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleet.com",
    "password": "admin123"
  }'
```

### Scooters (wymaga tokenu z logowania!)

```bash
# Get all
curl http://localhost:3001/api/scooters \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get single
curl http://localhost:3001/api/scooters/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update status
curl -X PATCH http://localhost:3001/api/scooters/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "maintenance"
  }'
```

### Spots

```bash
# Get all
curl http://localhost:3001/api/spots \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get with scooters
curl http://localhost:3001/api/spots/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Tasks

```bash
# Get all
curl http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create (admin/service only)
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scooterId": 1,
    "taskType": "rebalance",
    "priority": "normal",
    "description": "Move to spot 2",
    "fromSpotId": 1,
    "toSpotId": 2
  }'

# Get my tasks
curl http://localhost:3001/api/tasks/my-tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin (admin only)

```bash
# Get all users
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get system stats
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ Troubleshooting

### "database does not exist"

```bash
# Sprawdź czy PostgreSQL jest uruchomiony
psql -U scooter_admin -d postgres -c "SELECT 1"

# Utwórz bazę ręcznie
createdb -U scooter_admin scooter_fleet

# Ponownie inicjalizuj
npm run db:init
```

### "Connection refused"

```bash
# PostgreSQL nie jest uruchomiony. Restart:

# Docker
docker-compose restart postgres

# System
brew services restart postgresql  # macOS
sudo systemctl restart postgresql  # Linux
```

### "Port 3001 already in use"

```bash
# Zmień port w .env
PORT=3002

# Lub zabij proces
lsof -ti:3001 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3001    # Windows (pokaż PID)
taskkill /PID <PID> /F          # Windows (zabij)
```

### "Invalid token"

```bash
# Token wygasł lub JWT_SECRET się zmienił
# Zaloguj się ponownie:

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fleet.com", "password": "admin123"}'

# Skopiuj token z odpowiedzi i używaj w nagłówku:
# Authorization: Bearer <TOKEN>
```

---

## 🗄️ Baza danych

### Podłączenie się do bazy

```bash
# Docker
psql -h localhost -U scooter_admin -d scooter_fleet

# System PostgreSQL
psql -U scooter_admin -d scooter_fleet

# Password: scooter_secure_pass
```

### Przydatne SQL queries

```sql
-- Wylistuj tabele
\dt

-- Wyświetl schemę tabeli
\d scooters

-- Liczba hulajnóg
SELECT COUNT(*) FROM scooters;

-- Status hulajnóg
SELECT status, COUNT(*) FROM scooters GROUP BY status;

-- Aktywne zadania
SELECT * FROM tasks WHERE status != 'completed' ORDER BY created_at DESC;

-- Przychody
SELECT SUM(amount) FROM billing_records WHERE status = 'pending';

-- Wyjście
\q
```

---

## 🚀 Przygotowanie do Fly.io

Zanim wdrożysz na Fly.io:

1. Zmień `PORT` w `server.js` z 3001 na 3000
2. Wygeneruj losowy JWT_SECRET (min 32 znaki)
3. Pobierz Flespi API token
4. Zainstaluj `flyctl` CLI
5. Zaloguj się: `flyctl auth login`
6. Uruchom: `fly deploy`

Szczegóły w pliku **DEPLOYMENT_GUIDE.md**

---

## 📚 Dokumentacja

- **README.md** - Kompletna dokumentacja
- **DEPLOYMENT_GUIDE.md** - Wdrażanie na Fly.io
- **API Dokumentacja** - W README.md sekcja "API Dokumentacja"

---

## 🎯 Kolejne kroki

1. ✅ Backend i baza danych działają lokalnie
2. 🔄 Frontend React działa lokalnie
3. ✅ Integracja z Flespi API skonfigurowana
4. 🚀 Deploy na Fly.io
5. 🌐 Konfiguracja domeny Custom
6. 📱 Mobile app (React Native)
7. 📊 Advanced analytics

---

## 💡 Tips

- Używaj `npm run dev` do testowania (hot-reload)
- Sprawdzaj logi: `tail -f nohup.out`
- Commit `.env` do `.gitignore` na produkcji
- Backup bazy co dzień
- Monitoruj logi aplikacji
- Test API za pomocą Postman lub Insomnia

---

## ❓ Pytania?

- Dokumentacja: https://nodejs.org/docs/
- PostgreSQL: https://www.postgresql.org/docs/
- Fly.io: https://fly.io/docs/

**Powodzenia! 🚀**
