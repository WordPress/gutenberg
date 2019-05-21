#!/usr/bin/env bash

# Exit if any command fails
set -e

npm ci

npm run build

# Set up environment variables
. "$(dirname "$0")/bootstrap-env.sh"

# Include useful functions
. "$(dirname "$0")/includes.sh"

cd "$(dirname "$0")/../"

export PATH="$HOME/.composer/vendor/bin:$PATH"
if [[ $DOCKER = "true" ]]; then
	# Download image updates.
	echo -e $(status_message "Downloading Docker image updates...")
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS pull composer mysql wordpress_phpunit

	# Launch the containers.
	echo -e $(status_message "Starting Docker containers...")
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS up -d composer mysql wordpress_phpunit >/dev/null

	# Install the PHPUnit test scaffolding.
	echo -e $(status_message "Installing PHPUnit test scaffolding...")
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm wordpress_phpunit /app/bin/install-wp-tests.sh wordpress_test root example mysql $WP_VERSION false > /dev/null

	# Install Composer. This is only used to run WordPress Coding Standards checks.
	echo -e $(status_message "Installing and updating Composer modules...")
	docker-compose $DOCKER_COMPOSE_FILE_OPTIONS run --rm composer install
else
	bash bin/install-wp-tests.sh wordpress_test root '' localhost $WP_VERSION
	source bin/install-php-phpunit.sh

	# Run the build because otherwise there will be a bunch of warnings about
	# failed `stat` calls from `filemtime()`.
	composer install
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
	npm run test-php
	npm run test-unit-php-multisite
else
	phpunit
	WP_MULTISITE=1 phpunit
fi
