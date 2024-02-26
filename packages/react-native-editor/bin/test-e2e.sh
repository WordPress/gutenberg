#!/bin/bash -e

set -o pipefail

# If TEST_RN_PLATFORM is empty or equal to "android" and not the CI server, launch the Android emulator.
if [ -z "$TEST_RN_PLATFORM" ] || [ "$TEST_RN_PLATFORM" = "android" ] && [ -z "$GITHUB_ACTIONS" ]; then
	# Load configurations from JSON file
	CONFIG_FILE="$(pwd)/__device-tests__/helpers/device-config.json"
	ANDROID_DEVICE_NAME=$(jq -r '.android.local.deviceName' "$CONFIG_FILE")

	# Start the emulator if it is not already running
	if [ -z "$(pgrep -f "$ANDROID_DEVICE_NAME")" ]; then
		echo "[info] Starting the Android emulator..."
		emulator -avd "$ANDROID_DEVICE_NAME" -noaudio 2>&1 >/dev/null &
		ANDROID_PID=$!

		# Wait for the emulator to be ready.
		echo "[info] Waiting for the Android emulator to be ready..."
		adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done; input keyevent 82'
	fi
fi

# Pass along all arguments to Jest.
cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit --config ./jest_ui.config.js "$@"
