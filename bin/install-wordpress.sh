#!/bin/bash

# Exit if any command fails.
set -e

# Gutenberg script includes.
. "$(dirname "$0")/includes.sh"

# These are the containers and values for the development site.
CLI='cli'
CONTAINER='wordpress'
SITE_TITLE='Gutenberg Dev'

# If we're installing/re-installing the test site, change the containers used.
if [ "$1" == '--e2e_tests' ]; then
	CLI="${CLI}_e2e_tests"
	CONTAINER="${CONTAINER}_e2e_tests"
	SITE_TITLE='Gutenberg Testing'
fi

# Get the host port for the development WordPress container.
HOST_PORT=$(docker-compose port $CONTAINER 80 | awk -F : '{printf $2}')

# Wait until the Docker containers are running and the WordPress site is
# responding to requests.
echo -en $(status_message "Attempting to connect to WordPress ($SITE_TITLE)...")
until $(curl -L http://localhost:$HOST_PORT -so - 2>&1 | grep -q "WordPress"); do
    echo -n '.'
    sleep 5
done
echo ''

# Install WordPress.
echo -e $(status_message "Installing WordPress ($SITE_TITLE)...")
docker-compose run --rm $CLI core install --title="$SITE_TITLE" --admin_user=admin --admin_password=password --admin_email=test@test.com --skip-email --url=http://localhost:$HOST_PORT >/dev/null
# Check for WordPress updates, just in case the WordPress image isn't up to date.
docker-compose run --rm $CLI core update >/dev/null

# If the 'wordpress' volume wasn't during the down/up earlier, but the post port has changed, we need to update it.
CURRENT_URL=$(docker-compose run -T --rm $CLI option get siteurl)
if [ "$CURRENT_URL" != "http://localhost:$HOST_PORT" ]; then
	docker-compose run --rm $CLI option update home "http://localhost:$HOST_PORT" >/dev/null
	docker-compose run --rm $CLI option update siteurl "http://localhost:$HOST_PORT" >/dev/null
fi

# Reset the database so no posts/comments dirty up tests, if any exist.
POSTS=$(docker-compose run --rm $CLI post list --format=ids)
if [ "$POSTS" != '' ]; then
	echo -e $(status_message "Removing posts from database ($SITE_TITLE)...")
	docker-compose run --rm $CLI post delete $POSTS --force --quiet
fi

# Activate Gutenberg.
echo -e $(status_message "Activating Gutenberg ($SITE_TITLE)...")
docker-compose run --rm $CLI plugin activate gutenberg >/dev/null
