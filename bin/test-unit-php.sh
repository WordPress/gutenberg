#!/bin/bash

npm run wp-env run phpunit "WP_MULTISITE=${WP_MULTISITE-0} phpunit -c /var/www/html/wp-content/plugins/${PWD##*/}/phpunit.xml.dist --verbose"
