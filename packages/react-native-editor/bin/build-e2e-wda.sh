#!/bin/bash -eu

set -o pipefail

# Load configurations from JSON file
CONFIG_FILE="$(pwd)/__device-tests__/helpers/device-config.json"
IOS_DEVICE_NAME=$(jq -r '.ios.local.deviceName' "$CONFIG_FILE")
# Use the value from the environment variable if set, otherwise use the value from the JSON file
IOS_PLATFORM_VERSION="${IOS_PLATFORM_VERSION:-$(jq -r '.ios.local.platformVersion' "$CONFIG_FILE")}"

xcodebuild -project ~/.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent/WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination "platform=iOS Simulator,name=$IOS_DEVICE_NAME,OS=$IOS_PLATFORM_VERSION" -derivedDataPath ios/build/WDA
