#!/bin/bash

# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")/.."

# Check Node and NVM are installed
. "$(dirname "$0")/install-node-nvm.sh"

# Check Docker is installed and running
. "$(dirname "$0")/install-docker.sh"

GUTENBERG=$(cat <<EOT
,---.     |              |                   
|  _..   .|--- ,---.,---.|---.,---.,---.,---.
|   ||   ||    |---'|   ||   ||---'|    |   |
\`---'\`---'\`---'\`---'\`   '\`---'\`---'\`    \`---|
                                        \`---'
EOT
)

CURRENT_URL=$(docker run -it --rm --volumes-from wordpress-dev --network container:wordpress-dev wordpress:cli option get siteurl)
CURRENT_URL="${CURRENT_URL//[[:space:]]/}"

echo -e "\nWelcome to...\n"
echo -e "\033[95m$GUTENBERG\033[0m"
echo -e "Run \033[32mnpm run dev\033[0m, then open \033[32m$CURRENT_URL\033[0m to get started!"
