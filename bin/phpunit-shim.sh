#!/bin/bash

PHP_VERSION=`php -v`

if [[ ${PHP_VERSION:0:7} == "PHP 5.2" ]]; then 
	phpunit-3.6 "$@" 
elif [[ ${PHP_VERSION:0:7} == "PHP 5.3" ]]; then
	phpunit-4.8 "$@"
fi

exit $?
