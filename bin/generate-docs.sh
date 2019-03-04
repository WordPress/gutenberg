#!/bin/bash

declare -a packages=(
	"e2e-test-utils"
)

for package in "${packages[@]}"
do
	npx docgen packages/${package}/src/index.js --output packages/${package}/README.md --to-token;
done
