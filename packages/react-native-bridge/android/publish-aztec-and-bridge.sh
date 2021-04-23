#!/bin/bash

# 0. Switch to the directory of the script, as gradle commands won't otherwise work
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $DIR

# 1. Check if the script is run from the gutenberg-mobile submodule
PARENT_GIT_REPO_PATH=$(git rev-parse --show-superproject-working-tree)
if [[ -z $PARENT_GIT_REPO_PATH ||
    $(git -C $PARENT_GIT_REPO_PATH config --get remote.origin.url) != *"/gutenberg-mobile.git" ]]; then
    echo "This script can only be used if the 'gutenberg' project is a submodule of the 'gutenberg-mobile' project"
    exit 1
fi

# 2. Verify the version argument is passed. We use the same version for react-native-aztec and react-native-bridge libraries.
VERSION=$1
if [[ -z $VERSION ]]; then
    echo "This script requires the publish version to be passed as an argument."
    echo "Example usage: './publish-aztec-and-bridge.sh \$VERSION'"
    exit 1
fi

# 3. Clean and copy the bundle
./gradlew clean -q
mkdir -p react-native-bridge/build/assets
cp ../../../../bundle/android/App.js ./react-native-bridge/build/assets/index.android.bundle

if [ $? -ne 0 ]; then
    echo "Make sure to run 'npm install' & 'npm run bundle:android' from the root folder of the project before running this script."
    exit 1
fi

# 4. Publish 'react-native-aztec` library to S3
echo "Publishing 'react-native-aztec' version '$VERSION'"
./gradlew :react-native-aztec:publish -q -PpublishReactNativeAztecVersion=$VERSION

if [ $? -eq 0 ]; then
    echo "Wait 30 seconds for the new 'react-native-aztec' version to be available"
    sleep 30
else
    echo "Failed to publish 'react-native-aztec' version '$VERSION'."
    exit 1
fi

# 5. Publish 'react-native-bridge` library to S3
echo "Publishing react-native-bridge version '$VERSION'"
./gradlew :react-native-bridge:publish -q -PpublishReactNativeBridgeVersion=$VERSION -PreactNativeAztecVersion=$VERSION

if [ $? -ne 0 ]; then
    echo "Failed to publish 'react-native-bridge' version '$VERSION'."
    exit 1
fi
