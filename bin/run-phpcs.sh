#!/bin/sh

# Note: Before this script can successfully run `phpcs`, you will need to
# install version 2.9.x.  phpcs versions 3.x are not yet compatible with the
# WordPress coding standards, see:
#
# https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards/issues/718
#
# The easiest way to download it is to download the .phar archive from the
# latest 2.9.x release on GitHub:
#
# https://github.com/squizlabs/PHP_CodeSniffer/releases
#
# For example:
#   wget https://github.com/squizlabs/PHP_CodeSniffer/releases/download/2.9.1/phpcs.phar \
#       -O ~/bin/phpcs
#   chmod +x ~/bin/phpcs
#
# If ~/bin is not in your $PATH, pick another directory that is.
#
# Then you must install the WordPress-Coding-Standards repository and tell
# `phpcs` where it lives.  See instructions here:
#
# https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#standalone

# Change to the expected directory
cd "$(dirname "$0")"
cd ..

find . \
	-not \( -path './node_modules' \) \
	-not \( -path './vendor' \) \
	-name '*.php' \
| xargs -d'\n' phpcs --standard=phpcs.ruleset.xml -s
