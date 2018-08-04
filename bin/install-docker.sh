#!/bin/bash

# Exit if any command fails.
set -e

WP_VERSION=${WP_VERSION-latest}

# Include useful functions.
. "$(dirname "$0")/includes.sh"

# Check that Docker is installed.
if ! command_exists "docker"; then
	echo -e $(error_message "Docker doesn't seem to be installed. Please head on over to the Docker site to download it: $(action_format "https://www.docker.com/community-edition#/download")")
	exit 1
fi

# Check that Docker is running.
if ! docker info >/dev/null 2>&1; then
	echo -e $(error_message "Docker isn't running. Please check that you've started your Docker app, and see it in your system tray.")
	exit 1
fi

# Stop existing containers.
echo -e $(status_message "Stopping Docker containers...")
docker-compose down --remove-orphans >/dev/null 2>&1

# Download image updates.
echo -e $(status_message "Downloading Docker image updates...")
docker-compose pull

# Launch the containers.
echo -e $(status_message "Starting Docker containers...")
docker-compose up -d >/dev/null

# Set up WordPress Development site.
# Note: we don't bother installing the test site right now, because that's
# done on every time `npm run test-e2e` is run.
. "$(dirname "$0")/install-wordpress.sh"

# Install the PHPUnit test scaffolding.
echo -e $(status_message "Installing PHPUnit test scaffolding...")
docker-compose run --rm wordpress_phpunit /app/bin/install-wp-tests.sh wordpress_test root example mysql $WP_VERSION false > /dev/null

# Install Composer. This is only used to run WordPress Coding Standards checks.
echo -e $(status_message "Installing and updating Composer modules...")
docker-compose run --rm composer install
