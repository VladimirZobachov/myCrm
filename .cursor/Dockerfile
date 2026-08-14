FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Base tooling (git/curl/unzip are required for composer, node setup and checkout).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates curl git unzip gnupg software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# PHP 8.4 + extensions.
# backend/composer.lock pins Symfony 8.1 packages that require php >=8.4.1, so
# PHP 8.4 (from the ondrej/php PPA) is required — Ubuntu 24.04 only ships 8.3.
RUN add-apt-repository -y ppa:ondrej/php \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
       php8.4-cli php8.4-sqlite3 php8.4-mbstring php8.4-xml php8.4-curl \
       php8.4-bcmath php8.4-gd php8.4-zip php8.4-intl \
    && rm -rf /var/lib/apt/lists/* \
    && update-alternatives --set php /usr/bin/php8.4

# Composer.
RUN curl -sS https://getcomposer.org/installer \
      | php -- --install-dir=/usr/local/bin --filename=composer

# Node.js 22 (Next.js 16 requires >=22.19.0).
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

USER ubuntu
