#!/bin/bash
NVM_VERSION="v0.33.8"

# Exit if any command fails
set -e

# Include useful functions
. "$(dirname "$0")/includes.sh"

# Load NVM
if [ -n $NVM_DIR ]; then
	# The --no-use option ensures loading NVM doesn't switch the current version.
	. "$NVM_DIR/nvm.sh" --no-use
fi

# Change to the expected directory
cd "$(dirname "$0")/.."

# Check if nvm is installed
if ! command_exists "nvm"; then
	if ask "$(error_message "NVM isn't installed, would you like to download and install it?")" Y; then
		# The .bash_profile file needs to exist for NVM to install
		if [ ! -e ~/.bash_profile ]; then
			touch ~/.bash_profile
		fi

		download "https://raw.githubusercontent.com/creationix/nvm/$NVM_VERSION/install.sh" | bash
		if [ -n $CURRENT_NVM_BIN ]; then
			NVM_BIN=$CURRENT_NVM_BIN
		fi

		# Something failed when installing NVM, refer to the manual.
		if ! [ -x "$(command -v nvm)" ]; then
			echo -e $(error_message "NVM couldn't be found after installing, please close this terminal window, re-open it and again. If this error continues to appear, please consult the NVM manual for more help: https://github.com/creationix/nvm")
		fi
	else
		exit 1
	fi
fi

# Check if the current node version is up to date.
if [ "$(nvm current)" != "$(nvm version-remote --lts)" ]; then
	nvm install
fi
