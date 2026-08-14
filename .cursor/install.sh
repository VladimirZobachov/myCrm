#!/usr/bin/env bash
# Idempotent dependency + local-state setup for the myCRM v2 stack
# (Laravel API in backend/ and Next.js app in frontend/).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "== Backend (Laravel API) =="
cd "$repo_root/backend"
composer install --no-interaction --prefer-dist --no-progress

[ -f .env ] || cp .env.example .env
grep -qE '^APP_KEY=.+' .env || php artisan key:generate --force
grep -qE '^JWT_SECRET=.+' .env || php artisan jwt:secret --force

mkdir -p database
touch database/database.sqlite
php artisan migrate --force

echo "== Frontend (Next.js) =="
cd "$repo_root/frontend"
npm ci

echo "== Setup complete =="
