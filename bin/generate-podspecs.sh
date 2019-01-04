#!/bin/sh

# Exit if any command fails
set -e

# Change to the expected directory.
cd "$( dirname $0 )"
cd ..

# Check for cocoapods
command -v pod > /dev/null || ( echo Cocoapods is required to generate podspecs; exit 1 )

PODSPECS=$(cat <<EOP
node_modules/react-native/React.podspec
node_modules/react-native/ReactCommon/yoga/yoga.podspec
node_modules/react-native/third-party-podspecs/Folly.podspec
node_modules/react-native/third-party-podspecs/DoubleConversion.podspec
node_modules/react-native/third-party-podspecs/glog.podspec
react-native-aztec/RNTAztecView.podspec
EOP
)

DEST="react-native-gutenberg-bridge/third-party-podspecs"

for podspec in $PODSPECS
do
    pod=`basename $podspec .podspec`
    echo "Generating podspec for $pod"
    INSTALL_YOGA_WITHOUT_PATH_OPTION=1 pod ipc spec $podspec > "$DEST/$pod.podspec.json"
done