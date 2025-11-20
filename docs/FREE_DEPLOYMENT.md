# 🆓 Darmowy Deployment - Przewodnik

Jak wdrożyć aplikację Home Budget Manager **całkowicie za darmo**.

## 🎯 Najlepsza Darmowa Opcja

### Vercel (Frontend) + Render (Backend + AI + DB)

**Koszt: $0/miesiąc** ✅

---

## 📋 Plan Deployment

| Komponent | Platforma | Tier | Ograniczenia |
|-----------|-----------|------|--------------|
| **Frontend** | Vercel | Hobby (Free) | Unlimited bandwidth, 100 GB/miesiąc |
| **Backend** | Render | Free | Sleep po 15 min, 750h/miesiąc |
| **AI Service** | Render | Free | Sleep po 15 min, 750h/miesiąc |
| **PostgreSQL** | Render | Free | 1 GB storage, wygasa po 90 dni |

### ⚠️ Ograniczenia Darmowego Tieru:

1. **Backend i AI Service "śpią"** po 15 minutach nieaktywności
   - Pierwsze żądanie po sleep trwa ~30-60 sekund (cold start)
   - Dla osobistego użytku to OK

2. **Baza danych wygasa po 90 dniach**
   - Musisz ją odświeżyć co 90 dni (jeden klik)
   - Lub przejść na płatny tier ($7/miesiąc)

3. **Ograniczona wydajność**
   - 512 MB RAM dla każdego serwisu
   - Wystarczy dla małych projektów

---

## 🚀 Krok po Kroku - Darmowy Deployment

### Krok 1: Przygotowanie Repozytorium

```bash
# Utwórz repo na GitHub (jeśli jeszcze nie masz)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/home-budget-manager.git
git push -u origin main
```

### Krok 2: Deploy Frontend na Vercel (DARMOWY)

1. **Zaloguj się na [vercel.com](https://vercel.com)** (możesz użyć GitHub)

2. **Kliknij "Add New Project"**

3. **Importuj repo z GitHub**

4. **Konfiguracja:**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **Environment Variables** (dodaj później, po deployment backendu):
   ```
   REACT_APP_API_BASE_URL=https://your-backend.onrender.com/api
   ```

6. **Deploy!** - Vercel da Ci URL typu `your-app.vercel.app`

### Krok 3: Deploy Backend na Render (DARMOWY)

1. **Zaloguj się na [render.com](https://render.com)** (możesz użyć GitHub)

2. **Utwórz PostgreSQL Database:**
   - Kliknij "New +" → "PostgreSQL"
   - Name: `budget-db`
   - Database: `budget_manager`
   - User: `budget_user`
   - Region: Frankfurt (najbliżej Polski)
   - **Plan: Free** ✅
   - Kliknij "Create Database"
   - **Skopiuj "Internal Database URL"** (będzie potrzebny)

3. **Deploy Backend:**
   - Kliknij "New +" → "Web Service"
   - Connect your GitHub repo
   - **Settings:**
     ```
     Name: budget-backend
     Region: Frankfurt
     Branch: main
     Root Directory: backend
     Runtime: Node
     Build Command: npm install && npx prisma generate && npx prisma migrate deploy
     Start Command: npm start
     Plan: Free ✅
     ```

   - **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=3001
     DATABASE_URL=<paste-internal-database-url-from-step-2>
     JWT_SECRET=<wygeneruj: openssl rand -base64 32>
     ALLOWED_ORIGINS=https://your-app.vercel.app
     AI_SERVICE_URL=https://budget-ai.onrender.com
     ```

   - Kliknij "Create Web Service"
   - **Skopiuj URL** (np. `https://budget-backend.onrender.com`)

4. **Dodaj Procfile** (opcjonalnie, dla pewności):
   
   Utwórz plik `backend/Procfile`:
   ```
   web: npm start
   release: npx prisma migrate deploy
   ```

### Krok 4: Deploy AI Service na Render (DARMOWY)

1. **Kliknij "New +" → "Web Service"**

2. **Connect your GitHub repo**

3. **Settings:**
   ```
   Name: budget-ai
   Region: Frankfurt
   Branch: main
   Root Directory: ai-service
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   Plan: Free ✅
   ```

4. **Environment Variables:**
   ```
   PORT=8001
   GEMINI_API_KEY=<twoj-klucz-gemini>
   LOG_LEVEL=WARNING
   ```

5. **Kliknij "Create Web Service"**

6. **Skopiuj URL** (np. `https://budget-ai.onrender.com`)

### Krok 5: Aktualizacja Konfiguracji

1. **Zaktualizuj Backend na Render:**
   - Przejdź do Environment Variables
   - Ustaw `AI_SERVICE_URL` na URL AI Service z kroku 4
   - Kliknij "Save Changes" (auto-redeploy)

2. **Zaktualizuj Frontend na Vercel:**
   - Przejdź do Settings → Environment Variables
   - Dodaj:
     ```
     REACT_APP_API_BASE_URL=https://budget-backend.onrender.com/api
     ```
   - Kliknij "Save"
   - Przejdź do Deployments → Redeploy

### Krok 6: Uruchom Migracje Bazy Danych

Render automatycznie uruchomi migracje podczas buildu, ale możesz też ręcznie:

1. Przejdź do backend service na Render
2. Kliknij "Shell" (w menu po prawej)
3. Uruchom:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed  # opcjonalnie, dla przykładowych danych
   ```

---

## ✅ Gotowe!

Twoja aplikacja jest teraz dostępna pod:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://budget-backend.onrender.com`
- **AI Service**: `https://budget-ai.onrender.com`

---

## 🔧 Rozwiązywanie Problemów

### Problem: Backend/AI Service nie odpowiada

**Przyczyna:** Serwis "śpi" po 15 minutach nieaktywności (darmowy tier)

**Rozwiązanie:**
- Pierwsze żądanie po sleep trwa 30-60 sekund
- Poczekaj cierpliwie
- Możesz użyć usługi "keep-alive" (patrz poniżej)

### Problem: Baza danych wygasła po 90 dniach

**Rozwiązanie:**
1. Przejdź do Render Dashboard
2. Znajdź swoją bazę danych
3. Kliknij "Refresh" lub "Extend"
4. Lub przejdź na płatny tier ($7/miesiąc) dla permanentnej bazy

### Problem: CORS errors

**Rozwiązanie:**
- Sprawdź czy `ALLOWED_ORIGINS` w backendzie zawiera dokładny URL Vercel
- Upewnij się, że nie ma trailing slash

---

## 💡 Optymalizacje dla Darmowego Tieru

### 1. Keep-Alive Service (Zapobiega Sleep)

Użyj darmowej usługi ping, która będzie odpytywać Twój backend co 14 minut:

**Opcja A: UptimeRobot (Darmowy)**
1. Zarejestruj się na [uptimerobot.com](https://uptimerobot.com)
2. Dodaj monitor:
   - Type: HTTP(s)
   - URL: `https://budget-backend.onrender.com/health`
   - Monitoring Interval: 5 minutes
3. Powtórz dla AI Service

**Opcja B: Cron-job.org (Darmowy)**
1. Zarejestruj się na [cron-job.org](https://cron-job.org)
2. Utwórz cron job:
   - URL: `https://budget-backend.onrender.com/health`
   - Interval: Every 14 minutes

⚠️ **Uwaga:** To zużywa Twoje 750h/miesiąc, ale dla jednego użytkownika wystarczy.

### 2. Optymalizacja Cold Starts

Dodaj endpoint health check w backendzie (już masz):

```typescript
// backend/src/index.ts
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 3. Loading State w Frontend

Dodaj informację o cold start dla użytkownika:

```typescript
// frontend/src/services/api.ts
// Dodaj timeout i retry logic
```

---

## 📊 Limity Darmowego Tieru

### Vercel (Frontend)
- ✅ Unlimited requests
- ✅ 100 GB bandwidth/miesiąc
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Unlimited deployments

### Render (Backend + AI + DB)
- ⚠️ 750 hours/miesiąc per service (wystarczy dla 1 serwisu 24/7)
- ⚠️ Sleep po 15 min nieaktywności
- ⚠️ 512 MB RAM
- ⚠️ Shared CPU
- ⚠️ PostgreSQL: 1 GB storage, wygasa po 90 dni
- ✅ Automatic SSL
- ✅ Unlimited bandwidth

---

## 🎓 Alternatywne Darmowe Opcje

### Opcja 2: Vercel + Supabase

**Supabase** oferuje darmowy PostgreSQL (2 projekty, 500 MB):

1. **Frontend**: Vercel (Free)
2. **Backend**: Vercel Serverless Functions (Free, ale wymaga refaktoryzacji)
3. **Database**: Supabase (Free)
4. **AI Service**: Problematyczne (Python, potrzebuje serwera)

**Wada:** Wymaga przepisania backendu na serverless functions

### Opcja 3: Netlify + Railway

1. **Frontend**: Netlify (Free)
2. **Backend + AI + DB**: Railway (Free tier: $5 credit/miesiąc)

**Wada:** Railway free tier kończy się po zużyciu $5 credit

### Opcja 4: GitHub Pages + Własny Komputer

1. **Frontend**: GitHub Pages (Free)
2. **Backend + AI + DB**: Twój komputer z ngrok/localtunnel

**Wada:** Komputer musi być zawsze włączony

---

## 🚀 Upgrade Path (Gdy Aplikacja Rośnie)

Gdy przekroczysz limity darmowego tieru:

### Tier 1: Hobby ($5-10/miesiąc)
- Vercel: Free (wystarczy)
- Railway: $5/miesiąc (bez sleep, lepsze zasoby)

### Tier 2: Production ($20-30/miesiąc)
- Vercel Pro: $20/miesiąc
- Railway: $10-15/miesiąc
- Lub VPS: Hetzner €8/miesiąc

---

## ✅ Checklist Darmowego Deployment

- [ ] Repo na GitHub
- [ ] Frontend na Vercel
- [ ] PostgreSQL na Render (Free)
- [ ] Backend na Render (Free)
- [ ] AI Service na Render (Free)
- [ ] Environment variables skonfigurowane
- [ ] Migracje bazy danych uruchomione
- [ ] CORS skonfigurowany
- [ ] SSL działa (automatyczne)
- [ ] Keep-alive service (opcjonalnie)
- [ ] Przetestowano rejestrację i logowanie

---

## 🎉 Podsumowanie

**Całkowicie darmowy deployment jest możliwy!**

**Zalety:**
- $0/miesiąc
- Automatyczne SSL
- Łatwy deployment
- Dobre dla projektów osobistych

**Wady:**
- Cold starts (30-60s po sleep)
- Baza danych wygasa po 90 dni
- Ograniczone zasoby

**Dla kogo:**
- Projekty osobiste
- Portfolio
- Prototypy
- Małe aplikacje (do ~10 użytkowników)

Jeśli aplikacja zacznie rosnąć, zawsze możesz upgrade'ować do płatnego tieru! 🚀
