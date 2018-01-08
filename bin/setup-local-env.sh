#!/bin/bash

# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")/../docker"

# Launch the containers
docker-compose up -d

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
