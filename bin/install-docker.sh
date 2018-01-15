#!/bin/bash
NVM_VERSION="v0.33.8"

# Exit if any command fails
set -e

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Check that Docker is installed
if ! command_exists "docker"; then
	echo -e $(error_message "Docker doesn't seem to be installed. Please head on over to the Docker site to download it: https://www.docker.com/community-edition#/download" )
	exit 1
fi

# Check that Docker is running
if ! docker info >/dev/null 2>&1; then
	echo -e $(error_message "Docker isn't running. Please check that you've started your Docker app, and see it in your system tray.")
	exit 1
fi

# Launch the containers
echo -e $(status_message "Updating and starting Docker containers...")
if ! docker-compose up -d; then
	# Launching may fail due to the docker config file directory having changed.
	# Remove the old wordpress-dev container, and try again.
	docker container rm -fv wordpress-dev
	docker-compose up -d
fi

# Wait until the docker containers are setup properely
echo -en $(status_message "Attempting to connect to wordpress...")
until $(curl -L http://localhost:8888 -so - 2>&1 | grep -q "WordPress"); do
    echo -n '.'
    sleep 5
done
echo ' done!'

# Install WordPress
echo -en $(status_message "Installing WordPress...")
docker run -it --rm --volumes-from wordpress-dev --network container:wordpress-dev wordpress:cli core install --url=localhost:8888 --title=Gutenberg --admin_user=admin --admin_password=password --admin_email=test@test.com >/dev/null
echo ' done!'

# Activate Gutenberg
echo -en $(status_message "Activating Gutenberg...")
docker run -it --rm --volumes-from wordpress-dev --network container:wordpress-dev wordpress:cli plugin activate gutenberg >/dev/null
echo ' done!'

# Install the PHPUnit test scaffolding
echo -en $(status_message "Installing PHPUnit test scaffolding...")
docker-compose run --rm wordpress_phpunit /app/bin/install-wp-tests.sh wordpress_test root example mysql latest false >/dev/null
echo ' done!'

# Install Composer
echo -en $(status_message "Installing Composer...")
docker-compose run --rm composer install >/dev/null
echo ' done!'
