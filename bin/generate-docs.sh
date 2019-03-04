#!/bin/bash

declare -a packages=(
	"e2e-test-utils"
	"rich-text"
)

for package in "${packages[@]}"
do
	npx docgen packages/${package}/src/index.js --output packages/${package}/README.md --to-token --ignore "^unstable|^apply$|^changeListType$";
done
