#!/bin/bash
NVM_VERSION="v0.33.8"

# Exit if any command fails
set -e

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Check that Docker is installed
if ! command_exists "docker"; then
	echo "$(error_message "Docker doesn't seem to be installed. Please head on over to the Docker site to download it: https://www.docker.com/community-edition#/download" )"
	exit 1
fi

# Check that Docker is running
if ! docker info >/dev/null 2>&1; then
	echo "$(error_message "Docker isn't running. Please check that you've started your Docker app, and see it in your system tray.")"
	exit 1
fi

# Launch the containers
if ! docker-compose up -d; then
	# Launching may fail due to the docker config file directory having changed.
	# Remove the old wordpress-dev container, and try again.
	docker container rm -fv wordpress-dev
	docker-compose up -d
fi

# Wait until the docker containers are setup properely
echo "Attempting to connect to wordpress"
until $(curl -L http://localhost:8888 -so - | grep -q "WordPress"); do
    printf '.'
    sleep 5
done

# Install WordPress
docker run -it --rm --volumes-from wordpress-dev --network container:wordpress-dev wordpress:cli core install --url=localhost:8888 --title=Gutenberg --admin_user=admin --admin_password=password --admin_email=test@test.com

# Activate Gutenberg
docker run -it --rm --volumes-from wordpress-dev --network container:wordpress-dev wordpress:cli plugin activate gutenberg

# Install the PHPUnit test scaffolding
docker-compose run --rm wordpress_phpunit /app/bin/install-wp-tests.sh wordpress_test root example mysql latest false
