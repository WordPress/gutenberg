# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")"

# Setup local environement
./setup-local-env.sh

# Run the tests
cd "$(dirname "$0")"
cd ../
npx cypress run
