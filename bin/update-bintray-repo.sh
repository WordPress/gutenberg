#!/bin/sh

# Check for jfrog-cli-go
command -v jfrog > /dev/null || { echo "jfrog-cli-go is required to update the repo. Install it with 'brew install jfrog-cli-go'" >&2; exit 1; }
# Check for xmlstarlet
command -v xmlstarlet > /dev/null || { echo "xmlstarlet is required to update the repo. Install it with 'brew install xmlstarlet'" >&2; exit 1; }

# Exit if any command fails
set -e

# Change to the expected directory.
cd "$( dirname $0 )"
cd ..

TMP_WORKING_DIRECTORY=$(mktemp -d)

BINTRAY_REPO="wordpress-mobile/react-native-mirror"
PACKAGE_PATHS=("node_modules/react-native/android/com/facebook/react/react-native" "node_modules/jsc-android/dist/org/webkit/android-jsc")

package_name () {
    local PACKAGE_PATH="$1"
    xmlstarlet sel -t -v "/metadata/artifactId" "$PACKAGE_PATH/maven-metadata.xml"
}

package_version () {
    local PACKAGE_PATH="$1"
    xmlstarlet sel -t -v "/metadata/versioning/versions/version" "$PACKAGE_PATH/maven-metadata.xml"
}

check_bintray_version () {
    local PACKAGE_NAME="$1"
    local PACKAGE_VERSION="$2"

    jfrog bt version-show "${BINTRAY_REPO}/${PACKAGE_NAME}/${PACKAGE_VERSION}" &> /dev/null && echo "0" || echo "1"
}

create_bintray_version () {
    local PACKAGE_NAME="$1"
    local PACKAGE_VERSION="$2"
    local PACKAGE_PATH="$3"

    local BINTRAY_VERSION="${BINTRAY_REPO}/${PACKAGE_NAME}/${PACKAGE_VERSION}"
    local GROUP_PATH=$(xmlstarlet sel -t -v "/metadata/groupId" "$PACKAGE_PATH/maven-metadata.xml" | tr "." "/")

    jfrog bt version-create "${BINTRAY_VERSION}"
    jfrog bt upload "${PACKAGE_PATH}/${PACKAGE_VERSION}/*" "${BINTRAY_VERSION}" "${GROUP_PATH}/${PACKAGE_NAME}/${PACKAGE_VERSION}/"
    jfrog bt version-publish "${BINTRAY_VERSION}"
}

# Sign into Bintray
echo "Please sign into Bintray..."
echo "You can find your Bintray API key here: https://bintray.com/profile/edit"
jfrog bt config

# Yarn install
echo "Running yarn install in '${TMP_WORKING_DIRECTORY}'..."
cp "package.json" "${TMP_WORKING_DIRECTORY}/"
cp "yarn.lock" "${TMP_WORKING_DIRECTORY}/"
cp -Ra "i18n-cache" "${TMP_WORKING_DIRECTORY}/"
cd "${TMP_WORKING_DIRECTORY}"
yarn install --silent

# Find local packages in node_modules/
echo "Getting local package details..."
for PACKAGE_PATH in "${PACKAGE_PATHS[@]}"; do
    PACKAGE_NAME=$(package_name "${PACKAGE_PATH}")
    PACKAGE_VERSION=$(package_version "${PACKAGE_PATH}")

    echo "Checking ${PACKAGE_NAME}@${PACKAGE_VERSION} on Bintray..."
    NEEDS_UPDATE=$(check_bintray_version "${PACKAGE_NAME}" "${PACKAGE_VERSION}")
    if [ "$NEEDS_UPDATE" == "0" ]; then
        echo "${PACKAGE_NAME}@${PACKAGE_VERSION} is already up to date on Bintray"
    else
        echo "Uploading ${PACKAGE_NAME}@${PACKAGE_VERSION} to Bintray..."
        create_bintray_version "${PACKAGE_NAME}" "${PACKAGE_VERSION}" "${PACKAGE_PATH}"
    fi
done
