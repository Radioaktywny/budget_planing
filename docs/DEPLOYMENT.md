# Deployment Guide

Przewodnik wdrożenia aplikacji Home Budget Manager do produkcji.

## Spis treści

- [Opcje Hostingu](#opcje-hostingu)
- [Rekomendowane Rozwiązania](#rekomendowane-rozwiązania)
- [Deployment na Vercel + Railway](#deployment-na-vercel--railway)
- [Deployment na Heroku](#deployment-na-heroku)
- [Deployment na VPS (DigitalOcean/Hetzner)](#deployment-na-vps)
- [Deployment na AWS](#deployment-na-aws)
- [Konfiguracja Bazy Danych](#konfiguracja-bazy-danych)
- [Zmienne Środowiskowe](#zmienne-środowiskowe)
- [SSL/HTTPS](#sslhttps)
- [Monitoring](#monitoring)

---

## Opcje Hostingu

### 🌟 Najlepsze dla Twojej aplikacji:

| Platforma | Frontend | Backend | AI Service | Baza Danych | Koszt/miesiąc | Trudność |
|-----------|----------|---------|------------|-------------|---------------|----------|
| **Vercel + Railway** | ✅ | ✅ | ✅ | ✅ | $5-20 | ⭐⭐ |
| **Heroku** | ✅ | ✅ | ✅ | ✅ | $7-25 | ⭐⭐ |
| **Render** | ✅ | ✅ | ✅ | ✅ | $7-21 | ⭐⭐ |
| **DigitalOcean** | ✅ | ✅ | ✅ | ✅ | $6-12 | ⭐⭐⭐⭐ |
| **AWS** | ✅ | ✅ | ✅ | ✅ | $10-50 | ⭐⭐⭐⭐⭐ |
| **Netlify + Railway** | ✅ | ✅ | ✅ | ✅ | $5-20 | ⭐⭐ |

---

## Rekomendowane Rozwiązania

### 🥇 Opcja 1: Vercel + Railway (NAJŁATWIEJSZA)

**Zalety:**
- Bardzo łatwy deployment
- Automatyczne CI/CD z GitHub
- Darmowy tier dla małych projektów
- Świetna wydajność
- Automatyczne SSL

**Koszty:**
- Vercel: Darmowy (hobby) lub $20/miesiąc (Pro)
- Railway: $5/miesiąc za backend + AI service + PostgreSQL

**Dla kogo:** Idealne dla szybkiego startu i małych/średnich projektów

---

### 🥈 Opcja 2: Render (WSZYSTKO W JEDNYM)

**Zalety:**
- Wszystko w jednym miejscu
- Łatwa konfiguracja
- Automatyczne SSL
- Darmowy tier dostępny

**Koszty:**
- Web Services: $7/miesiąc każdy (backend, AI service)
- PostgreSQL: $7/miesiąc
- Static Site: Darmowy (frontend)
- **Razem: ~$21/miesiąc**

**Dla kogo:** Dobre dla tych, którzy chcą wszystko w jednym miejscu

---

### 🥉 Opcja 3: VPS (DigitalOcean/Hetzner)

**Zalety:**
- Pełna kontrola
- Najniższy koszt dla większych projektów
- Można hostować wszystko na jednym serwerze

**Koszty:**
- DigitalOcean Droplet: $6-12/miesiąc
- Hetzner VPS: €4-8/miesiąc (~$5-10)

**Dla kogo:** Dla osób z doświadczeniem w administracji serwerami

---

## Deployment na Vercel + Railway

### Krok 1: Przygotowanie Repozytorium

```bash
# Upewnij się, że masz repozytorium Git
git init
git add .
git commit -m "Initial commit"

# Utwórz repo na GitHub
gh repo create home-budget-manager --public --source=. --remote=origin --push
```

### Krok 2: Deploy Frontend na Vercel

1. **Zaloguj się na [vercel.com](https://vercel.com)**
2. **Kliknij "Add New Project"**
3. **Importuj swoje repo z GitHub**
4. **Konfiguracja:**
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

5. **Environment Variables:**
   ```
   REACT_APP_API_BASE_URL=https://your-backend.railway.app/api
   ```

6. **Deploy!**

### Krok 3: Deploy Backend + AI Service na Railway

1. **Zaloguj się na [railway.app](https://railway.app)**

2. **Utwórz nowy projekt**

3. **Dodaj PostgreSQL:**
   - Kliknij "+ New"
   - Wybierz "Database" → "PostgreSQL"
   - Railway automatycznie utworzy bazę i zmienną `DATABASE_URL`

4. **Deploy Backend:**
   - Kliknij "+ New"
   - Wybierz "GitHub Repo"
   - Wybierz swoje repo
   - **Settings:**
     - Root Directory: `backend`
     - Build Command: `npm install && npx prisma generate && npx prisma db push`
     - Start Command: `npm start`
     - Watch Paths: `backend/**`
     
     **Uwaga:** Używamy `db push` zamiast `migrate deploy` ponieważ lokalne migracje są dla SQLite, a produkcja używa PostgreSQL.

   - **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=3001
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     JWT_SECRET=<wygeneruj-silny-klucz>
     ALLOWED_ORIGINS=https://your-app.vercel.app
     AI_SERVICE_URL=https://your-ai-service.railway.app
     ```

5. **Deploy AI Service:**
   - Kliknij "+ New"
   - Wybierz "GitHub Repo"
   - Wybierz swoje repo
   - **Settings:**
     - Root Directory: `ai-service`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `python main.py`
     - Watch Paths: `ai-service/**`

   - **Environment Variables:**
     ```
     PORT=8001
     GEMINI_API_KEY=<twoj-klucz>
     ```

6. **Wygeneruj domeny:**
   - Railway automatycznie wygeneruje domeny dla każdego serwisu
   - Skopiuj URL backendu i AI service
   - Zaktualizuj zmienne środowiskowe

### Krok 4: Aktualizacja Konfiguracji

1. **Zaktualizuj frontend na Vercel:**
   - Ustaw `REACT_APP_API_BASE_URL` na URL Railway backendu
   - Redeploy

2. **Zaktualizuj backend na Railway:**
   - Ustaw `AI_SERVICE_URL` na URL Railway AI service
   - Ustaw `ALLOWED_ORIGINS` na URL Vercel frontendu

---

## Deployment na Heroku

### Przygotowanie

```bash
# Zainstaluj Heroku CLI
# Windows: https://devcenter.heroku.com/articles/heroku-cli
# Mac: brew tap heroku/brew && brew install heroku

heroku login
```

### Deploy Backend

```bash
cd backend

# Utwórz aplikację
heroku create your-app-backend

# Dodaj PostgreSQL
heroku addons:create heroku-postgresql:mini

# Ustaw zmienne środowiskowe
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set ALLOWED_ORIGINS=https://your-app-frontend.herokuapp.com
heroku config:set AI_SERVICE_URL=https://your-app-ai.herokuapp.com

# Utwórz Procfile
echo "web: npm start" > Procfile
echo "release: npx prisma migrate deploy" >> Procfile

# Deploy
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a your-app-backend
git push heroku main
```

### Deploy AI Service

```bash
cd ai-service

# Utwórz aplikację
heroku create your-app-ai

# Ustaw buildpack dla Python
heroku buildpacks:set heroku/python

# Ustaw zmienne środowiskowe
heroku config:set GEMINI_API_KEY=your-key

# Utwórz Procfile
echo "web: python main.py" > Procfile

# Deploy
git init
git add .
git commit -m "Deploy AI service"
heroku git:remote -a your-app-ai
git push heroku main
```

### Deploy Frontend

```bash
cd frontend

# Utwórz aplikację
heroku create your-app-frontend

# Ustaw buildpack
heroku buildpacks:set mars/create-react-app

# Ustaw zmienne środowiskowe
heroku config:set REACT_APP_API_BASE_URL=https://your-app-backend.herokuapp.com/api

# Deploy
git init
git add .
git commit -m "Deploy frontend"
heroku git:remote -a your-app-frontend
git push heroku main
```

---

## Deployment na VPS

### Wymagania

- VPS z Ubuntu 22.04 LTS
- Minimum 2GB RAM
- Node.js 18+, Python 3.9+, PostgreSQL 14+
- Nginx jako reverse proxy

### Krok 1: Przygotowanie Serwera

```bash
# Połącz się z serwerem
ssh root@your-server-ip

# Aktualizuj system
apt update && apt upgrade -y

# Zainstaluj wymagane pakiety
apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx python3-pip git

# Zainstaluj PM2 (process manager)
npm install -g pm2

# Utwórz użytkownika dla aplikacji
adduser budgetapp
usermod -aG sudo budgetapp
su - budgetapp
```

### Krok 2: Konfiguracja PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE budget_manager;
CREATE USER budgetapp WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE budget_manager TO budgetapp;
\q
```

### Krok 3: Deploy Aplikacji

```bash
# Sklonuj repo
cd /home/budgetapp
git clone https://github.com/your-username/home-budget-manager.git
cd home-budget-manager

# Backend
cd backend
npm install
cp .env.example .env
# Edytuj .env z właściwymi wartościami
nano .env

npx prisma generate
npx prisma migrate deploy
npm run build

# Uruchom z PM2
pm2 start dist/index.js --name budget-backend
pm2 save
pm2 startup

# AI Service
cd ../ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edytuj .env
nano .env

pm2 start main.py --name budget-ai --interpreter python3

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Edytuj .env
nano .env

npm run build
```

### Krok 4: Konfiguracja Nginx

```bash
sudo nano /etc/nginx/sites-available/budget-manager
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    root /home/budgetapp/home-budget-manager/frontend/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# AI Service (opcjonalnie, jeśli chcesz osobną domenę)
server {
    listen 80;
    server_name ai.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktywuj konfigurację
sudo ln -s /etc/nginx/sites-available/budget-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Krok 5: SSL z Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Konfiguracja Bazy Danych

### PostgreSQL (Produkcja)

**Railway/Heroku:** Automatycznie skonfigurowane

**VPS:**
```bash
# Edytuj pg_hba.conf dla zdalnego dostępu (jeśli potrzebne)
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Dodaj:
# host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Connection String:**
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### Migracje

**WAŻNE:** Jeśli dostajesz błąd `type "datetime" does not exist` podczas deployment na PostgreSQL, to znaczy że masz stare migracje wygenerowane dla SQLite.

**Rozwiązanie dla pierwszego deployment:**

```bash
# Zamiast migrate deploy, użyj db push dla pierwszego deployment
npx prisma db push

# To utworzy tabele bezpośrednio ze schema.prisma bez używania plików migracji
```

**Dla kolejnych deploymentów:**

```bash
# Normalnie używaj migrate deploy
npx prisma migrate deploy

# Seed danych (opcjonalnie)
npx prisma db seed
```

**Jeśli chcesz używać migracji od początku:**

1. Usuń folder `prisma/migrations`
2. Wygeneruj nowe migracje dla PostgreSQL:
   ```bash
   # Lokalnie z PostgreSQL DATABASE_URL
   npx prisma migrate dev --name init
   ```
3. Commituj nowe migracje do repo
4. Deploy z `npx prisma migrate deploy`

---

## Zmienne Środowiskowe

### Backend (.env)

```env
# Produkcja
NODE_ENV=production
PORT=3001

# Baza danych
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# Autentykacja - WYGENERUJ NOWY KLUCZ!
JWT_SECRET=<użyj: openssl rand -base64 32>
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# AI Service
AI_SERVICE_URL=https://your-ai-service-url.com
AI_SERVICE_TIMEOUT=30000

# Bezpieczeństwo
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (opcjonalnie)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Pliki
UPLOAD_DIR=/var/app/uploads
MAX_FILE_SIZE=10485760
```

### Frontend (.env)

```env
REACT_APP_API_BASE_URL=https://yourdomain.com/api
```

### AI Service (.env)

```env
PORT=8001
GEMINI_API_KEY=your-gemini-api-key
LOG_LEVEL=WARNING
```

---

## SSL/HTTPS

### Automatyczne (Vercel/Railway/Heroku)
✅ SSL jest automatycznie skonfigurowane

### VPS z Let's Encrypt

```bash
# Zainstaluj certbot
sudo apt install certbot python3-certbot-nginx

# Uzyskaj certyfikat
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (już skonfigurowane)
sudo certbot renew --dry-run
```

---

## Monitoring

### Podstawowy Monitoring

**PM2 (VPS):**
```bash
pm2 monit
pm2 logs
pm2 status
```

**Railway/Heroku:**
- Wbudowane logi w dashboardzie
- `heroku logs --tail -a your-app-name`

### Zaawansowany Monitoring

**Rekomendowane narzędzia:**
- **Sentry** - Error tracking (darmowy tier)
- **LogRocket** - Session replay
- **UptimeRobot** - Uptime monitoring (darmowy)
- **Google Analytics** - User analytics

---

## Checklist Przed Deployment

- [ ] Wygenerowano silny `JWT_SECRET`
- [ ] Skonfigurowano `ALLOWED_ORIGINS`
- [ ] Ustawiono `NODE_ENV=production`
- [ ] Skonfigurowano PostgreSQL
- [ ] Uruchomiono migracje bazy danych
- [ ] Skonfigurowano SSL/HTTPS
- [ ] Przetestowano wszystkie endpointy
- [ ] Skonfigurowano backup bazy danych
- [ ] Ustawiono monitoring
- [ ] Przetestowano rejestrację i logowanie
- [ ] Sprawdzono rate limiting
- [ ] Zweryfikowano CORS
- [ ] Skonfigurowano email service (opcjonalnie)

---

## Koszty Miesięczne - Porównanie

### Hobby/Małe Projekty (do 100 użytkowników)

| Opcja | Koszt | Uwagi |
|-------|-------|-------|
| Vercel (Free) + Railway ($5) | **$5/miesiąc** | Najlepszy stosunek ceny do łatwości |
| Render (Free tier) | **$0** | Ograniczenia: sleep po 15 min nieaktywności |
| Hetzner VPS | **€4/miesiąc (~$5)** | Wymaga konfiguracji |

### Średnie Projekty (100-1000 użytkowników)

| Opcja | Koszt | Uwagi |
|-------|-------|-------|
| Vercel Pro + Railway | **$25-30/miesiąc** | Profesjonalne, łatwe w zarządzaniu |
| Render | **$21/miesiąc** | Wszystko w jednym miejscu |
| DigitalOcean Droplet | **$12/miesiąc** | Dobra wydajność, wymaga zarządzania |

---

## Wsparcie

Jeśli masz pytania dotyczące deployment:
1. Sprawdź logi aplikacji
2. Zweryfikuj zmienne środowiskowe
3. Sprawdź połączenie z bazą danych
4. Sprawdź konfigurację CORS

---

## Następne Kroki

Po deployment:
1. Skonfiguruj backup bazy danych
2. Ustaw monitoring i alerty
3. Skonfiguruj CI/CD pipeline
4. Dodaj domenę własną
5. Skonfiguruj email service dla password reset
6. Rozważ CDN dla statycznych plików

Powodzenia! 🚀
