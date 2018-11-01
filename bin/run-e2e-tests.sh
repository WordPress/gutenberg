# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")/../"

# Setup local environement
( ./bin/setup-local-env.sh )

if [ "$E2E_ROLE" = "author" ]; then
	# Set up an author, and run the tests with that user, and don't error if the user is already there
	WP_PASSWORD=authpass WP_USERNAME=author npm run test-e2e
else
	npm run test-e2e
fi
