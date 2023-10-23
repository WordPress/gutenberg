#!/bin/bash -eu

set -o pipefail

if command -v appium >/dev/null 2>&1; then
    APPIUM_CMD="appium"
else
    # Use relative path to access the locally installed appium
    APPIUM_CMD="../../../node_modules/.bin/appium"
fi

output=$($APPIUM_CMD driver list --installed --json)

if echo "$output" | grep -q 'uiautomator2'; then
    echo 'UiAutomator2 is installed, skipping installation.'
else
    echo 'UiAutomator2 not found, installing...'
    $APPIUM_CMD driver install uiautomator2
fi

if echo "$output" | grep -q 'xcuitest'; then
    echo 'XCUITest is installed, skipping installation.'
else
    echo 'XCUITest not found, installing...'
    $APPIUM_CMD driver install xcuitest
fi

# Mitigate conflicts between development server caches and E2E tests
npm run clean:runtime > /dev/null
echo 'Runtime cache cleaned.'
