#!/bin/bash

# Exit if any command fails
set -e

EXAMPLES_DIR="$(cd `dirname $0` && pwd)/../../gutenberg-examples"
# Install examples if needed 
if [ $INSTALL_GUTENBERG_EXAMPLES ] && [ ! -d $EXAMPLES_DIR ] && [ GIT ]; then
	git clone https://github.com/WordPress/gutenberg-examples.git $EXAMPLES_DIR 
	find $EXAMPLES_DIR  -type d -name "*esnext" -print0 | xargs -0  -I @@ bash -c "npm install --prefix @@; npm run build --prefix @@;" bash;
fi

# Change to the expected directory
cd "$(dirname "$0")/../docker"

# Launch the WordPress docker
if [ $INSTALL_GUTENBERG_EXAMPLES ]; then
	docker-compose -f docker-compose.yml -f examples-compose.yml up -d	
else
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


# Activate Gutenberg Examples if present 
if [ -d $EXAMPLES_DIR ]; then
	docker run -it --rm --volumes-from wordpress-dev --network container:wordpress-dev wordpress:cli plugin activate gutenberg-examples
fi
