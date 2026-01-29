#!/bin/bash -e

# =================================================================
# Appium Drivers
#
# NOTE: Please update the following versions when upgrading Appium.
# =================================================================
UI_AUTOMATOR_2_VERSION="2.32.3"
XCUITEST_VERSION="5.7.0"

set -o pipefail

if command -v appium >/dev/null 2>&1; then
	APPIUM_CMD="appium"
else
	# Use relative path to access the locally installed appium
	APPIUM_CMD="../../../node_modules/.bin/appium"
fi

function log_info() {
	printf "ℹ️  $1\n"
}

function log_success {
	printf "✅ $1\n"
}

function log_error() {
	printf "❌ $1\n"
}

output=$($APPIUM_CMD driver list --installed --json)

# UiAutomator2 driver installation
matched_version=$(echo "$output" | jq -r '.uiautomator2.version // empty')
if [ -z "$matched_version" ]; then
	log_info "UiAutomator2 not installed, installing version $UI_AUTOMATOR_2_VERSION..."
	$APPIUM_CMD driver install "uiautomator2@$UI_AUTOMATOR_2_VERSION"
elif [ "$matched_version" = "$UI_AUTOMATOR_2_VERSION" ]; then
	log_info "UiAutomator2 version $UI_AUTOMATOR_2_VERSION is available."
else
	log_info "UiAutomator2 version $matched_version is installed, replacing it with version $UI_AUTOMATOR_2_VERSION..."
	$APPIUM_CMD driver uninstall uiautomator2
	$APPIUM_CMD driver install "uiautomator2@$UI_AUTOMATOR_2_VERSION"
fi

# XCUITest driver installation
matched_version=$(echo "$output" | jq -r '.xcuitest.version // empty')
if [ -z "$matched_version" ]; then
	log_info "XCUITest not installed, installing version $XCUITEST_VERSION..."
	$APPIUM_CMD driver install "xcuitest@$XCUITEST_VERSION"
elif [ "$matched_version" = "$XCUITEST_VERSION" ]; then
	log_info "XCUITest version $XCUITEST_VERSION is available."
else
	log_info "XCUITest version $matched_version is installed, replacing it with version $XCUITEST_VERSION..."
	$APPIUM_CMD driver uninstall xcuitest
	$APPIUM_CMD driver install "xcuitest@$XCUITEST_VERSION"
fi

CONFIG_FILE="$(pwd)/__device-tests__/helpers/device-config.json"
IOS_PLATFORM_VERSION=$(jq -r '.ios.local.platformVersion' "$CONFIG_FILE")

# Throw an error if the required iOS runtime is not installed
IOS_RUNTIME_INSTALLED=$(xcrun simctl list runtimes -j | jq -r --arg version "$IOS_PLATFORM_VERSION" '.runtimes | to_entries[] | select(.value.version | contains($version))')
if [[ -z $IOS_RUNTIME_INSTALLED ]]; then
	log_error "iOS $IOS_PLATFORM_VERSION runtime not found! Please install the iOS $IOS_PLATFORM_VERSION runtime using Xcode.\n    https://developer.apple.com/documentation/xcode/installing-additional-simulator-runtimes#Install-and-manage-Simulator-runtimes-in-settings"
	exit 1;
fi

function detect_or_create_simulator() {
	local simulator_name=$1
	local runtime_name_display=$(echo "iOS $IOS_PLATFORM_VERSION")
	local runtime_name=$(echo "$runtime_name_display" | sed 's/ /-/g; s/\./-/g')
	local simulators=$(xcrun simctl list devices -j | jq -r --arg runtime "$runtime_name" '.devices | to_entries[] | select(.key | contains($runtime)) | .value[] | .name + "," + .udid')

	if ! echo "$simulators" | grep -q "$simulator_name"; then
		log_info "$simulator_name ($runtime_name_display) not found, creating..."
		xcrun simctl create "$simulator_name" "$simulator_name" "com.apple.CoreSimulator.SimRuntime.$runtime_name" > /dev/null
		log_success "$simulator_name ($runtime_name_display) created."
	else
		log_info "$simulator_name ($runtime_name_display) available."
	fi
}

IOS_DEVICE_NAME=$(jq -r '.ios.local.deviceName' "$CONFIG_FILE")
IOS_DEVICE_TABLET_NAME=$(jq -r '.ios.local.deviceTabletName' "$CONFIG_FILE")

# Create the required iOS simulators, if they don't exist
detect_or_create_simulator "$IOS_DEVICE_NAME"
detect_or_create_simulator "$IOS_DEVICE_TABLET_NAME"

function detect_or_create_emulator() {
	if [[ "${CI}" ]]; then
		log_info "Detected CI server, skipping Android emulator creation."
		return
	fi

	if [[ -z $(command -v avdmanager) ]]; then
		log_error "avdmanager not found! Please install the Android SDK command-line tools.\n    https://developer.android.com/tools/"
		exit 1;
	fi

	local emulator_name=$1
	local emulator_id=$(echo "$emulator_name" | sed 's/ /_/g; s/\./_/g')
	local device_id=$(echo "$emulator_id" | awk -F '_' '{print tolower($1)"_"tolower($2)"_"tolower($3)}')
	local runtime_api=$(echo "$emulator_id" | awk -F '_' '{print $NF}')
	local emulator=$(emulator -list-avds | grep "$emulator_id")

	if [[ -z $emulator ]]; then
		log_info "$emulator_name not found, creating..."
		avdmanager create avd -n "$emulator_id" -k "system-images;android-$runtime_api;google_apis;arm64-v8a" -d "$device_id" > /dev/null
		log_success "$emulator_name created."
	else
		log_info "$emulator_name available."
	fi
}

ANDROID_DEVICE_NAME=$(jq -r '.android.local.deviceName' "$CONFIG_FILE")

# Create the required Android emulators, if they don't exist
detect_or_create_emulator $ANDROID_DEVICE_NAME

# Mitigate conflicts between development server caches and E2E tests
npm run clean:runtime > /dev/null
log_info 'Runtime cache cleared.'
