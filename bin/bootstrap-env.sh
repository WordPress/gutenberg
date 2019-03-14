#!/usr/bin/env bash

WP_VERSION=${WP_VERSION-latest}
WP_DEBUG=${WP_DEBUG-true}
SCRIPT_DEBUG=${SCRIPT_DEBUG-true}
DOCKER=${DOCKER-false}
DOCKER_ENV=${DOCKER_ENV-ci}
DOCKER_COMPOSE_FILE_OPTIONS="-f docker-compose.yml"

if [ "$DOCKER_ENV" == "localwpdev" ]; then
	DOCKER_COMPOSE_FILE_OPTIONS="${DOCKER_COMPOSE_FILE_OPTIONS} -f docker-compose-localdev.yml"
fi
