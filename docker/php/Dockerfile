FROM ubuntu:20.04

#LABEL about the custom image
LABEL maintainer="pushkin"
LABEL version="1.0"
LABEL description="This is custom Docker Image for \
the PHP-FPM and Nginx Services."


ARG uid

RUN apt-get update \
    && apt-get install -y locales \
    && locale-gen ru_RU.utf8 en_US.UTF-8 \
    && ln -sf /usr/share/zoneinfo/Europe/Moscow /etc/localtime

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

RUN apt-get update \
    && apt-get install -y curl zip unzip git software-properties-common acl gettext \
    && add-apt-repository -y ppa:ondrej/php \
    && apt-get update \
    && apt-get install -y php7.2-fpm php7.2-cli php7.2-gd \
       php7.2-pgsql php7.2-imap php7.2-mbstring php-xml php7.2-xml php7.2-curl \
       php7.2-bcmath php7.2-intl php7.2-zip php7.2-redis php-json \
    && apt-get install -y php-memcache php7.2-xdebug php-imagick \
    && apt-get install -y php7.2-memcached \
    && php -r "readfile('http://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer \
    && update-alternatives --set php /usr/bin/php7.2 \
    && mkdir /run/php \
    && apt-get remove -y --purge software-properties-common \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ADD php-fpm.conf /etc/php/7.2/fpm/php-fpm.conf
ADD www.conf /etc/php/7.2/fpm/pool.d/www.conf

RUN sed -i "s/;date.timezone =.*/date.timezone = Europe\/Moscow/" /etc/php/7.2/fpm/php.ini \
    && sed -i "s/;date.timezone =.*/date.timezone = Europe\/Moscow/" /etc/php/7.2/cli/php.ini \
    && sed -i "s/short_open_tag = Off/short_open_tag = On/" /etc/php/7.2/fpm/php.ini \
    && sed -i "s/short_open_tag = Off/short_open_tag = On/" /etc/php/7.2/cli/php.ini \
    && sed -i "s/mbstring.func_overload = 7/mbstring.func_overload = 6/" /etc/php/7.2/cli/php.ini \
    && echo "xdebug.mode = debug" >> /etc/php/7.2/mods-available/xdebug.ini \
    && echo "xdebug.discover_client_host = 1" >> /etc/php/7.2/mods-available/xdebug.ini \
    && echo "xdebug.client_port = 9800" >> /etc/php/7.2/mods-available/xdebug.ini \
    && echo "xdebug.idekey=PHPSTORM" >> /etc/php/7.2/mods-available/xdebug.ini

ADD ./mods-available/*.ini /etc/php/7.2/mods-available/

#RUN usermod -u ${uid} www-data

COPY ./docker.sh /
ENTRYPOINT ["/docker.sh"]

EXPOSE 9000
CMD ["php-fpm7.2"]
