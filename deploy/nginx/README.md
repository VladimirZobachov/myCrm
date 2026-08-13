# nginx для myCRM (crm.vvebmaster.ru)

Задача #62. Конфиг `mycrm.conf` — черновик, **не применялся на живом nginx**.
Ниже — порядок ручной установки на сервере.

## 1. Подключение конфига

```bash
sudo cp deploy/nginx/mycrm.conf /etc/nginx/sites-available/mycrm.conf
sudo ln -s /etc/nginx/sites-available/mycrm.conf /etc/nginx/sites-enabled/mycrm.conf
```

На этом этапе в файле ещё нет сертификата — блок `443 ssl` не запустится,
поэтому сначала проверяем и перезагружаем только с блоком `80`
(или сразу переходим к шагу 2, certbot сам обновит файл).

## 2. Выпуск SSL-сертификата (certbot)

```bash
sudo certbot --nginx -d crm.vvebmaster.ru
```

certbot сам пропишет пути `ssl_certificate` / `ssl_certificate_key`
(они уже указаны в конфиге по аналогии с `n8n.conf`) и добавит редирект
80 → 443. Домен `crm.vvebmaster.ru` должен резолвиться на сервер до запуска.

## 3. Проверка и применение

```bash
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` обязателен перед reload — если синтаксис не прошёл, конфиг
не применяется и старый nginx продолжает работать.

## 4. Переключение ролей v1 → v2 (флаг migrated_to_v2)

По умолчанию `location /` в конфиге проксирует всё на v2 (`127.0.0.1:3000`).
Закомментированный блок ниже — роутинг по cookie `mycrm_token`: пользователи
с legacy-значением куки уходят на старый бэкенд (`127.0.0.1:8080`), остальные —
на v2 (`127.0.0.1:3000`).

Флаг `migrated_to_v2` у пользователей переключается артизан-командой:

```bash
# перевести всех пользователей роли <role> на v2
php artisan migrate:flag-role <role> --on

# откатить роль <role> обратно на legacy (v1)
php artisan migrate:flag-role <role> --off
```

где `<role>` — числовое значение `type_user`. Команда массово обновляет
`migrated_to_v2` для всех пользователей этой роли (см.
`backend/app/Console/Commands/MigrateFlagRole.php`).

Порядок включения роутинга по куке:

1. Раскомментировать блок `map $cookie_mycrm_token ...` и второй `location /`
   в `mycrm.conf`, закомментировать (или удалить) первый `location /`.
2. `sudo nginx -t && sudo systemctl reload nginx`.
3. Убедиться, что backend при аутентификации ставит cookie `mycrm_token`
   в значение `legacy` для пользователей с `migrated_to_v2 = 0` и любое
   другое значение (либо не ставит) для `migrated_to_v2 = 1`.

## Примечания

- Файл не проверялся на реальном сервере — перед первым применением
  свериться с актуальным `n8n.conf` (тот же сервер, тот же способ выпуска
  сертификата) и с реальными портами v1/v2 бэкендов.
- `client_max_body_size 20m` — под загрузку фото заявок (см. итерацию 10,
  `PhotoUploader`); при необходимости скорректировать.
