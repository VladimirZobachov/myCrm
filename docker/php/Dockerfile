FROM php:7.4-apache

# Включаем mod_rewrite (нужен для .htaccess)
RUN a2enmod rewrite

# Устанавливаем mysqli (нужен для db.class.php)
RUN docker-php-ext-install mysqli pdo_mysql
