#!/bin/bash

# Exit if any command fails
set -e

npm ci

# Force reduced motion in e2e tests
FORCE_REDUCED_MOTION=true npm run build
