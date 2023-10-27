#!/bin/bash -e

set -o pipefail

# If TEST_RN_PLATFORM is empty or equal to "android", launch the Android emulator.
if [ -z "$TEST_RN_PLATFORM" ] || [ "$TEST_RN_PLATFORM" = "android" ]; then
	# Start the emulator if it is not already running
	if [ -z "$(pgrep -f "Pixel_3_XL_API_30")" ]; then
		echo "[info] Starting the Android emulator..."
		emulator -avd Pixel_3_XL_API_30 -noaudio 2>&1 >/dev/null &
		ANDROID_PID=$!

		# Wait for the emulator to be ready.
		echo "[info] Waiting for the Android emulator to be ready..."
		adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done; input keyevent 82'
	fi
fi

# Pass along all arguments to Jest.
cross-env NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit --config ./jest_ui.config.js "$@"
