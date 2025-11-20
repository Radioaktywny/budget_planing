# PostgreSQL Migration Fix

## Problem

Jeśli widzisz błąd podczas deployment:
```
ERROR: type "datetime" does not exist
Migration name: 20251108183934_migration
```

To znaczy, że próbujesz użyć migracji wygenerowanych dla SQLite na bazie PostgreSQL.

## Rozwiązanie

### Opcja 1: Użyj `db push` (ZALECANE dla pierwszego deployment)

W konfiguracji deployment (Railway, Render, Heroku) zmień build command:

**Zamiast:**
```bash
npx prisma migrate deploy
```

**Użyj:**
```bash
npx prisma db push
```

To utworzy tabele bezpośrednio ze schema.prisma bez używania plików migracji.

### Opcja 2: Wygeneruj nowe migracje dla PostgreSQL

Jeśli chcesz używać systemu migracji:

1. **Usuń stare migracje:**
   ```bash
   rm -rf backend/prisma/migrations
   ```

2. **Skonfiguruj lokalnie PostgreSQL:**
   
   Zaktualizuj `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/budget_manager"
   ```

3. **Wygeneruj nowe migracje:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

4. **Commituj i push:**
   ```bash
   git add prisma/migrations
   git commit -m "Generate PostgreSQL migrations"
   git push
   ```

5. **Teraz możesz używać `migrate deploy` w deployment**

## Dlaczego to się dzieje?

- SQLite używa typu `DATETIME`
- PostgreSQL używa typu `TIMESTAMP`
- Prisma generuje różne SQL dla różnych baz danych
- Lokalna development używa SQLite (`file:./dev.db`)
- Produkcja używa PostgreSQL

## Rekomendacja

Dla prostoty, używaj:
- **Lokalnie:** SQLite (szybkie, bez konfiguracji)
- **Produkcja:** PostgreSQL z `db push` (bez zarządzania migracjami)

Jeśli potrzebujesz pełnej kontroli nad migracjami, przejdź na PostgreSQL również lokalnie.
