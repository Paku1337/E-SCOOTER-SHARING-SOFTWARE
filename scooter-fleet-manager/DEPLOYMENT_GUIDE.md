# 🛴 Poradnik Wdrażania - Fleet Manager na Fly.io

## Spis treści
1. [Przygotowanie](#przygotowanie)
2. [Instalacja i konfiguracja lokalna](#instalacja-lokalna)
3. [Wdrażanie na Fly.io](#wdrażanie-flyio)
4. [Konfiguracja bazy danych](#baza-danych)
5. [Rozwiązywanie problemów](#troubleshooting)

---

## Przygotowanie

### Wymagania
- Node.js 18+
- Docker & Docker Compose (opcjonalnie do testów lokalnych)
- Git
- Konto Fly.io (https://fly.io)
- Flespi API Token (https://flespi.io)

### Instalacja CLI Fly.io

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

Zaloguj się:
```bash
flyctl auth login
```

---

## Instalacja Lokalna

### 1. Klonowanie i instalacja zależności

```bash
# Stwórz katalog projektu
mkdir scooter-fleet-manager && cd scooter-fleet-manager

# Skopiuj pliki backend (package.json, server.js, routes/, middleware/
# Skopiuj plik .env i docker-compose.yml
```

### 2. Uruchomienie bazy danych PostgreSQL

```bash
# Uruchom PostgreSQL w Docker
docker-compose up -d

# Czekaj aż postgresql będzie gotowy (60 sekund)
```

### 3. Instalacja zależności Node.js

```bash
npm install
```

### 4. Inicjalizacja bazy danych

```bash
# Tworzenie schemy bazy danych
npm run db:init

# Powinno wyświetlić: ✅ Database initialized successfully
```

### 5. Uruchomienie serwera lokalnie

```bash
# Development mode
npm run dev

# Powinno wyświetlić: 🛴 Scooter Fleet Manager running on port 3001
```

### 6. Testowanie API

Otwórz w przeglądarce lub użyj curl:

```bash
# Health check
curl http://localhost:3001/health

# DB check
curl http://localhost:3001/db-health

# Rejestracja testowego użytkownika
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleet.com",
    "password": "password123",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

---

## Wdrażanie Fly.io

### 1. Przygotowanie projektu do Fly.io

#### a) Utwórz plik `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### b) Utwórz plik `.dockerignore`

```
node_modules
npm-debug.log
.env
.git
.gitignore
docker-compose.yml
README.md
.DS_Store
```

#### c) Zmień port w `server.js`

```javascript
const PORT = process.env.PORT || 3000; // zmień z 3001 na 3000
```

### 2. Inicjalizacja Fly.io

```bash
# Stwórz aplikację Fly.io
flyctl app create

# Zostaniesz poproszony o nazwę
# Przykład: scooter-fleet-manager
```

### 3. Konfiguracja zmiennych środowiska na Fly.io

Stwórz plik `fly.toml` (powinien być automatycznie stworzony):

```toml
app = "scooter-fleet-manager"
primary_region = "waw" # Warszawa (najblizej Polski)

[build]
  image = "scooter-fleet-manager:latest"

[env]
  NODE_ENV = "production"
  FLESPI_TOKEN = "" # Będzie dodane później

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[services]]
  protocol = "tcp"
  internal_port = 3000
  
  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 100
```

### 4. Ustawienie zmiennych sekretnych

```bash
# Ustawienie Flespi Token
flyctl secrets set FLESPI_TOKEN="your_flespi_api_token"

# Ustawienie JWT Secret
flyctl secrets set JWT_SECRET="your-production-jwt-secret-key-min-32-chars"

# Ustawienie Database URL (będzie dodany po konfiguracji PostgreSQL)
```

### 5. Konfiguracja PostgreSQL na Fly.io

#### Opcja A: Postgres na Fly.io (zalecane)

```bash
# Stwórz PostgreSQL na Fly.io
fly postgres create --name scooter-fleet-db --region waw

# Zostaniesz poproszony o hasło główne
# Zapisz to gdzie bezpiecznym miejscu!

# Dołącz do głównej aplikacji
fly postgres attach scooter-fleet-db --app scooter-fleet-manager

# To automatycznie ustawi zmienną DATABASE_URL
```

#### Opcja B: External PostgreSQL (np. AWS RDS, DigitalOcean)

```bash
# Ustawienie zmiennych
flyctl secrets set \
  DB_HOST="your-db-host.rds.amazonaws.com" \
  DB_PORT="5432" \
  DB_NAME="scooter_fleet" \
  DB_USER="scooter_admin" \
  DB_PASSWORD="your-secure-password"
```

### 6. Skrypt inicjalizacji bazy danych

Utwórz plik `scripts/init-db-prod.js`:

```javascript
import pool from '../db.js';

const initDB = async () => {
  try {
    console.log('🔧 Initializing production database...');

    // [Skopiuj całą zawartość z init-db.js]

    console.log('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

initDB();
```

Dodaj do `package.json`:

```json
{
  "scripts": {
    "db:init:prod": "node scripts/init-db-prod.js"
  }
}
```

### 7. Wdrożenie aplikacji

```bash
# Build i deploy
fly deploy

# To potrwa 2-5 minut

# Po wdrożeniu, uruchom inicjalizację bazy danych
fly ssh console -a scooter-fleet-manager
npm run db:init:prod
exit
```

### 8. Sprawdzenie statusu

```bash
# Wyświetl informacje o aplikacji
fly info -a scooter-fleet-manager

# Wyświetl logi
fly logs -a scooter-fleet-manager

# Test URL (będzie coś w stylu: https://scooter-fleet-manager.fly.dev)
curl https://your-app-name.fly.dev/health
```

---

## Konfiguracja Frontend

### 1. Utwórz React aplikację

```bash
npx create-react-app scooter-fleet-frontend
cd scooter-fleet-frontend
```

### 2. Zainstaluj zależności

```bash
npm install lucide-react
```

### 3. Skopiuj kod frontend.jsx do `src/App.jsx`

### 4. Stwórz `.env.production`

```
REACT_APP_API_URL=https://your-app-name.fly.dev/api
```

### 5. Build i deploy (dla Vercel/Netlify)

```bash
# Build
npm run build

# Deploy na Vercel
npm i -g vercel
vercel
```

Lub na Fly.io (drugi serwis w tej samej aplikacji):

```bash
# Stwórz osobny Dockerfile dla frontend
# Utwórz nginx.conf do servowania static files
# Deploy razem z backend
```

---

## Baza Danych

### Schemat tabel

Wszystkie tabele są tworzone automatycznie przez `init-db.js`:

- **users** - Konta użytkowników (admin, service, client)
- **scooters** - Hulajnogi w flocie
- **spots** - Punkty parkowania
- **tasks** - Zadania do realizacji
- **billing_records** - Rachunek i rozliczenia
- **device_telemetry** - Historia danych z urządzeń
- **audit_logs** - Log wszystkich akcji

### Backupy PostgreSQL

```bash
# Backup bazy danych
fly pg:dump scooter-fleet-db > backup.sql

# Restore z backupu
fly pg:restore scooter-fleet-db < backup.sql
```

---

## Integracja z Flespi

### Pobranie Flespi Token

1. Zaloguj się na https://flespi.io
2. Przejdź do Settings > Tokens
3. Stwórz nowy token z uprawnieniami do `/gw/devices`
4. Ustaw token:

```bash
flyctl secrets set FLESPI_TOKEN="your_token_here"
```

### API Endpoints dla Flespi

Twoja aplikacja automatycznie parsuje dane z:

```
GET /api/scooters/:id/telemetry
POST /api/scooters/:id/command
```

Przykład - wysłanie komendy:

```bash
curl -X POST https://your-app.fly.dev/api/scooters/1/command \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "instructionType": "S6",
    "payload": ""
  }'
```

---

## Troubleshooting

### Problem: Błąd połączenia z bazą danych

```bash
# Sprawdź status PostgreSQL
fly pg:status scooter-fleet-db

# Wyświetl logi
fly logs -a scooter-fleet-manager

# Reconnect do bazy
fly postgres attach scooter-fleet-db --app scooter-fleet-manager
```

### Problem: 502 Bad Gateway

```bash
# Restart aplikacji
fly restart -a scooter-fleet-manager

# Sprawdź health check
fly checks status -a scooter-fleet-manager
```

### Problem: Tajne zmienne nie działają

```bash
# Wylistuj wszystkie zmienne
flyctl secrets list

# Usuń i przywróć zmienną
flyctl secrets unset FLESPI_TOKEN
flyctl secrets set FLESPI_TOKEN="new_value"

# Restart po zmianie
fly deploy
```

### Problem: Baza danych jest pełna

```bash
# Sprawdź rozmiar
fly pg:stat scooter-fleet-db

# Wyczyszcz stare telemetry
fly ssh console -a scooter-fleet-manager
psql $DATABASE_URL
DELETE FROM device_telemetry WHERE received_at < NOW() - INTERVAL '30 days';
```

---

## Skalowanie i Performance

### Skalowanie replika bazy danych

```bash
# Utwórz read replica
fly pg:replica create scooter-fleet-db --region waw
```

### Zwiększenie maszyn

```bash
# Skalowanie aplikacji
fly scale count 2 -a scooter-fleet-manager

# Zwiększenie RAM
fly scale memory 512 -a scooter-fleet-manager
```

### Monitoring

```bash
# Wyświetl metryki
fly status -a scooter-fleet-manager

# Real-time monitoring
watch -n 5 'fly status -a scooter-fleet-manager'
```

---

## Produkcyjne Best Practices

- ✅ Ustaw `NODE_ENV=production`
- ✅ Zmień JWT_SECRET na losowy, długi string
- ✅ Włącz HTTPS (domyślnie na Fly.io)
- ✅ Używaj secret variables dla FLESPI_TOKEN
- ✅ Regularne backupy bazy danych
- ✅ Monitoruj logi aplikacji
- ✅ Rate limiting na API endpoints
- ✅ Validuj wszystkie dane wejściowe

---

## Przydatne komendy

```bash
# Deploy nową wersję
fly deploy

# Wyświetl statusy maszyn
fly machines list

# SSH do aplikacji
fly ssh console

# Logi w real-time
fly logs -a scooter-fleet-manager --follow

# Zatrzymaj aplikację
fly apps destroy scooter-fleet-manager

# Kopia zapasowa bazy
fly pg:dump scooter-fleet-db > backup-$(date +%Y%m%d).sql
```

---

## Support & Help

- Fly.io Docs: https://fly.io/docs/
- Flespi Docs: https://flespi.com/kb
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

## Licencja

Mit License - Swobodnie używaj, modyfikuj i dystrybuuj.

Powodzenia! 🚀
