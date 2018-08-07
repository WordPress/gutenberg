#!/bin/bash

# Exit if any command fails.
set -e

# Gutenberg script includes.
. "$(dirname "$0")/includes.sh"

# These are the containers and values for the development site.
CLI='cli'
CONTAINER='wordpress'
SITE_TITLE='Gutenberg Dev'
WP_VERSION=${WP_VERSION-latest}

# If we're installing/re-installing the test site, change the containers used.
if [ "$1" == '--e2e_tests' ]; then
	CLI="${CLI}_e2e_tests"
	CONTAINER="${CONTAINER}_e2e_tests"
	SITE_TITLE='Gutenberg Testing'

	if ! docker ps | grep -q $CONTAINER; then
		echo -e $(error_message "WordPress e2e tests run in their own Docker container, but that container wasn't found.")
		echo "Please restart your Docker containers by running 'docker-compose down && docker-compose up -d' or"
		echo "by running './bin/setup-local-env.sh' again."
		echo ""
		exit 1
	fi
fi

# Get the host port for the WordPress container.
HOST_PORT=$(docker-compose port $CONTAINER 80 | awk -F : '{printf $2}')

# Wait until the Docker containers are running and the WordPress site is
# responding to requests.
echo -en $(status_message "Attempting to connect to WordPress...")
until $(curl -L http://localhost:$HOST_PORT -so - 2>&1 | grep -q "WordPress"); do
    echo -n '.'
    sleep 5
done
echo ''

# If this is the test site, we reset the database so no posts/comments/etc.
# dirty up the tests.
if [ "$1" == '--e2e_tests' ]; then
	echo -e $(status_message "Resetting test database...")
	docker-compose run --rm $CLI db reset --yes >/dev/null
fi

# Install WordPress.
echo -e $(status_message "Installing WordPress...")
# The `-u 33` flag tells Docker to run the command as a particular user and
# prevents permissions errors. See: https://github.com/WordPress/gutenberg/pull/8427#issuecomment-410232369
docker-compose run --rm -u 33 $CLI core install --title="$SITE_TITLE" --admin_user=admin --admin_password=password --admin_email=test@test.com --skip-email --url=http://localhost:$HOST_PORT >/dev/null

if [ "$WP_VERSION" == "latest" ]; then
	# Check for WordPress updates, to make sure we're running the very latest version.
	docker-compose run --rm -u 33 $CLI core update >/dev/null
fi

# If the 'wordpress' volume wasn't during the down/up earlier, but the post port has changed, we need to update it.
CURRENT_URL=$(docker-compose run -T --rm $CLI option get siteurl)
if [ "$CURRENT_URL" != "http://localhost:$HOST_PORT" ]; then
	docker-compose run --rm $CLI option update home "http://localhost:$HOST_PORT" >/dev/null
	docker-compose run --rm $CLI option update siteurl "http://localhost:$HOST_PORT" >/dev/null
fi

# Activate Gutenberg.
echo -e $(status_message "Activating Gutenberg...")
docker-compose run --rm $CLI plugin activate gutenberg >/dev/null
