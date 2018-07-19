#!/bin/bash

# Exit if any command fails.
set -e

# Include useful functions.
. "$(dirname "$0")/includes.sh"

# Set up WordPress site used for end-to-end (e2e) tests.
. "$(dirname "$0")/install-wordpress.sh" --e2e_tests
