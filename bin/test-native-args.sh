#!/usr/bin/env bash

# Test native arg forwarding cases.
# Only shows the expanded command npm resolves — suppresses actual test output.

BOLD="\033[1m"
RESET="\033[0m"

run_case() {
	local num="$1"
	local desc="$2"
	local expected="$3"
	shift 3

	echo ""
	echo "--------------------------------------"
	echo -e "${BOLD}${num}. ${desc}${RESET}"
	echo "   Expected: ${expected}"
	echo "--------------------------------------"
	# Run the command, only show lines npm prints before handing off to jest
	# (the "> script" and "> command" lines), suppress everything after
	"$@" 2>&1 | grep -E "^>" || true
	echo ""
}

echo ""
echo "======================================"
echo " Native Test Arg Forwarding Test Cases"
echo "======================================"

run_case 1 \
	"test:native -- --testPathPattern" \
	"jest receives --testPathPattern=<pattern>" \
	npm run test:native -- --testPathPattern='packages/react-native-editor' --passWithNoTests

run_case 2 \
	"test:native -- --testNamePattern" \
	"jest receives --testNamePattern=<pattern>" \
	npm run test:native -- --testNamePattern='should render' --passWithNoTests

run_case 3 \
	"test:native -- --verbose" \
	"jest receives --verbose" \
	npm run test:native -- --verbose --passWithNoTests

run_case 4 \
	"test:native -- --runInBand" \
	"jest receives --runInBand" \
	npm run test:native -- --runInBand --passWithNoTests

run_case 5 \
	"test:native:update -- --testPathPattern (critical: hardcoded + forwarded args)" \
	"jest receives --updateSnapshot AND --testPathPattern" \
	npm run test:native:update -- --testPathPattern='packages/react-native-editor' --passWithNoTests

run_case 6 \
	"test:native:watch (skipped - interactive)" \
	"jest receives --watch" \
	echo "   Skipped (interactive mode)"

run_case 7 \
	"test:native:clean" \
	"jest --clearCache runs" \
	npm run test:native:clean

run_case 8 \
	"test:native -- TEST_RN_PLATFORM=ios" \
	"jest config logs: Setting RN platform to: ios" \
	bash -c "TEST_RN_PLATFORM=ios npm run test:native -- --passWithNoTests 2>&1 | grep -E '^>|RN platform'"

run_case 9 \
	"test:native -- TEST_RN_PLATFORM=android" \
	"jest config logs: Setting RN platform to: android" \
	bash -c "TEST_RN_PLATFORM=android npm run test:native -- --passWithNoTests 2>&1 | grep -E '^>|RN platform'"

echo "======================================"
echo " Done. Review expanded commands above."
echo "======================================"
echo ""
