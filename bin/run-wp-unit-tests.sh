#!/usr/bin/env bash


# Set up environment variables
. "$(dirname "$0")/bootstrap-env.sh"

cd "$(dirname "$0")/../"

export PATH="$HOME/.composer/vendor/bin:$PATH"
if [[ $DOCKER = "true" ]]; then
	bin/setup-local-env.sh
else
	bash bin/install-wp-tests.sh wordpress_test root '' localhost $WP_VERSION
	source bin/install-php-phpunit.sh

	# Run the build because otherwise there will be a bunch of warnings about
	# failed `stat` calls from `filemtime()`.
	composer install || exit 1
fi

echo Running with the following versions:
if [[ $DOCKER = "true" ]]; then
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm wordpress_phpunit php -v
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm wordpress_phpunit phpunit --version
else
	php -v
	phpunit --version
fi

# Run PHPUnit tests
if [[ $DOCKER = "true" ]]; then
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm composer run-script lint
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm wordpress_phpunit phpunit
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm wordpress_phpunit -e WP_MULTISITE=1 phpunit
else
	phpunit || exit 1
	WP_MULTISITE=1 phpunit || exit 1
fi
