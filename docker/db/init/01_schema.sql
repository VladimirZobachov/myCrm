-- Инициализация БД myCRM (схема восстановлена из кода, 11.08.2026)
-- Таблицы: users, sessions, orders

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    login VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    fio VARCHAR(255) DEFAULT NULL,
    passwd VARCHAR(255) NOT NULL,
    type_user TINYINT NOT NULL DEFAULT 3 COMMENT '1=админ, 2=менеджер, 3=монтажник',
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_login (login),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    sessid VARCHAR(128) NOT NULL,
    time BIGINT NOT NULL COMMENT 'unixtimestamp',
    PRIMARY KEY (id),
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_sessid (sessid),
    KEY idx_sessions_time (time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    date_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date DATE NOT NULL,
    trc VARCHAR(255) DEFAULT NULL,
    trc_other VARCHAR(255) DEFAULT NULL,
    type_work TEXT,
    brand VARCHAR(255) DEFAULT NULL,
    where_print VARCHAR(255) DEFAULT NULL,
    where_other VARCHAR(255) DEFAULT NULL,
    photo TEXT COMMENT 'текстовые ссылки через пробел (legacy)',
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    price_admin DECIMAL(12,2) DEFAULT NULL COMMENT 'цена для админа (price*0.7)',
    importance VARCHAR(255) DEFAULT NULL,
    importance_other VARCHAR(255) DEFAULT NULL,
    created_by INT UNSIGNED NOT NULL COMMENT 'кто создал (менеджер)',
    created_for INT UNSIGNED DEFAULT NULL COMMENT 'кому назначено (монтажник)',
    comment_admin TEXT,
    comment_mounter TEXT,
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1=В ожидании, 2=Принят, 3=Выполнено',
    is_archived TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_orders_created_by (created_by),
    KEY idx_orders_created_for (created_for),
    KEY idx_orders_status (status),
    KEY idx_orders_is_archived (is_archived),
    KEY idx_orders_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Тестовые пользователи (пароли: admin/manager/mounter, MD5)
INSERT INTO users (login, email, fio, passwd, type_user) VALUES
('admin', 'admin@mycrm.local', 'Админ', MD5('admin'), 1),
('manager', 'manager@mycrm.local', 'Менеджер', MD5('manager'), 2),
('mounter', 'mounter@mycrm.local', 'Монтажник', MD5('mounter'), 3);
