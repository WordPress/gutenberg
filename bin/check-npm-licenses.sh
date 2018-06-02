#!/bin/bash

# Include useful functions
. "$(dirname "$0")/includes.sh"

ALLOWED_LICENSES=(
	"GPL-2.0-or-later"
	"GPL-2.0+"
	"LGPL-2.1"
	"(GPL-2.0 OR MIT)"
	"MIT"
	"ISC"
	"BSD"
	"BSD-2-Clause"
	"BSD-3-Clause"
	"CC0-1.0"
)

FOUND_INCOMPATIBLE_MODULE=false


for MODULE_DIR in $(npm ls --production --parseable); do
	PACKAGE_JSON="${MODULE_DIR}/package.json"

	PACKAGE_NAME=$(jq --raw-output '.name' $PACKAGE_JSON)
	PACKAGE_LICENSE=$(jq --raw-output '( .license // .licenses[0].type )' $PACKAGE_JSON)

	if ! in_array "${PACKAGE_LICENSE}" "${ALLOWED_LICENSES[@]}"; then
		if ! $FOUND_INCOMPATIBLE_MODULE; then
			FOUND_INCOMPATIBLE_MODULE=true;
			echo "These modules have incompatible licences:"
		fi
		echo "${PACKAGE_NAME}: ${PACKAGE_LICENSE}"
	fi
done

if ! $FOUND_INCOMPATIBLE_MODULE; then
	echo "All module licenses are compatible."
else
	exit 1;
fi
