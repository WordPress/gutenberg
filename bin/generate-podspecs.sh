#!/bin/sh

# Exit if any command fails
set -e

# Change to the expected directory.
cd "$( dirname $0 )"
cd ..

# Check for cocoapods & jq
command -v pod > /dev/null || ( echo Cocoapods is required to generate podspecs; exit 1 )
command -v jq > /dev/null || ( echo jq is required to generate podspecs; exit 1 )

WD=$(pwd)
DEST="${WD}/react-native-gutenberg-bridge/third-party-podspecs"

# Generate the external (non-RN podspecs)
EXTERNAL_PODSPECS=$(find "node_modules/react-native/third-party-podspecs" \
                         "node_modules/react-native-svg" \
                         "node_modules/react-native-keyboard-aware-scroll-view" \
                         "node_modules/react-native-safe-area" \
                         "node_modules/react-native-dark-mode" -type f -name "*.podspec" -print)

for podspec in $EXTERNAL_PODSPECS
do
    pod=$(basename "$podspec" .podspec)

    echo "Generating podspec for $pod"
    pod ipc spec $podspec > "$DEST/$pod.podspec.json"
done

# Generate the React Native podspecs
# Change to the React Native directory to get relative paths for the RN podspecs
cd "node_modules/react-native"

RN_PODSPECS=$(find * -type f -name "*.podspec" -not -path "third-party-podspecs/*" -not -path "*Fabric*" -print)
TMP_DEST=$(mktemp -d)

for podspec in $RN_PODSPECS
do
    pod=$(basename "$podspec" .podspec)
    path=$(dirname "$podspec")

    echo "Generating podspec for $pod with path $path"
    pod ipc spec $podspec > "$TMP_DEST/$pod.podspec.json"
    cat "$TMP_DEST/$pod.podspec.json" | jq > "$DEST/$pod.podspec.json"

    # Add a "prepare_command" entry to each podspec so that 'pod install' will fetch sources from the correct directory
    # and retains the existing prepare_command if it exists
    prepare_command="TMP_DIR=\$(mktemp -d); mv * \$TMP_DIR; cp -R \"\$TMP_DIR/${path}\"/* ."
    cat "$TMP_DEST/$pod.podspec.json" | jq --arg CMD "$prepare_command" '.prepare_command = "\($CMD) && \(.prepare_command // true)"' > "$DEST/$pod.podspec.json"
done
