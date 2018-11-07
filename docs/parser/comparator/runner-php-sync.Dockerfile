FROM php:7.2-alpine

RUN mkdir /web
WORKDIR /web
COPY ./runner-php-sync.php /web/index.php

EXPOSE 80
CMD [ "php", "-S", "0.0.0.0:80", "-t", "/web" ]
