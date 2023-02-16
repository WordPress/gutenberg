#!/usr/bin/env bash
set -e

# Move out of bin directory to Gutenberg project root
cd ../

BASELINE_BRANCH=${BASELINE_BRANCH:="trunk"}

# Required for `git switch` on CI
git fetch origin

# Gather baseline perf measurements
git switch "$BASELINE_BRANCH"
npm --cwd ci --force
npm run native test:perf --baseline

# Gather current perf measurements & compare results
git switch --detach -
npm ci --force
npm run native test:perf