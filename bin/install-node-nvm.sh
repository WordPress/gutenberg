#!/bin/bash
NVM_VERSION="v0.33.8"

# Exit if any command fails
set -e

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Load NVM
if [ -n "$NVM_DIR" ]; then
	# The --no-use option ensures loading NVM doesn't switch the current version.
	. "$NVM_DIR/nvm.sh" --no-use
fi

# Change to the expected directory
cd "$(dirname "$0")/.."

# Check if nvm is installed
if ! command_exists "nvm"; then
	if ask "$(error_message "NVM isn't installed, would you like to download and install it automatically?")" Y; then
		# The .bash_profile file needs to exist for NVM to install
		if [ ! -e ~/.bash_profile ]; then
			touch ~/.bash_profile
		fi

		echo -en $(status_message "Installing NVM..." )
		download "https://raw.githubusercontent.com/creationix/nvm/$NVM_VERSION/install.sh" | bash >/dev/null 2>&1
		echo ' done!'

		echo -e $(warning_message "NVM was updated, please run this command to reload it:" )
		echo -e $(warning_message ". \$HOME/.nvm/nvm.sh" )
		echo -e $(warning_message "After that, re-run the setup script to continue." )
	else
		echo -e $(error_message "Please install NVM manually, then re-run the setup script to continue. NVM installation instructions can be found here: https://github.com/creationix/nvm")
	fi

	exit 1
fi

if [ $NVM_VERSION != "v$(nvm --version)" ]; then
	echo -en $(status_message "Updating NVM..." )
	download "https://raw.githubusercontent.com/creationix/nvm/$NVM_VERSION/install.sh" | bash >/dev/null 2>&1
	echo ' done!'

	echo -e $(warning_message "NVM was updated, please run this command to reload it:" )
	echo -e $(warning_message ". \$HOME/.nvm/nvm.sh" )
	echo -e $(warning_message "After that, re-run the setup script to continue." )
	exit 1
fi

# Check if the current node version is up to date.
if [ "$(nvm current)" != "$(nvm version-remote --lts)" ]; then
	echo -en $(status_message "Updating Node..." )
	nvm install >/dev/null 2>&1
	echo ' done!'

	echo -e $(warning_message "A new node version was install, please run this command to use it:" )
	echo -e $(warning_message "nvm use" )
	echo -e $(warning_message "After that, re-run the setup script to continue." )
	exit 1
fi

npm install
