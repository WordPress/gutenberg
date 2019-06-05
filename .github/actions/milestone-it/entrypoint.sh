#!/bin/bash
set -e

# 1. Determine if milestone already exists (don't replace one which has already
#    been assigned).

pr=$(jq -r '.number' $GITHUB_EVENT_PATH)

current_milestone=$(
	curl \
		--silent \
		-H "Authorization: token $GITHUB_TOKEN" \
		"https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$pr" \
		| jq '.milestone'
)

if [ "$current_milestone" != 'null' ]; then
	echo 'Milestone already applied. Aborting.'
	exit 1;
fi

# 2. Read current version.

version=$(jq -r '.version' package.json)

IFS='.' read -ra parts <<< "$version"
major=${parts[0]}
minor=${parts[1]}

# 3. Determine next milestone.

if [ minor == '9' ]; then
	major=$((major+1))
	minor="0"
else
	minor=$((minor+1))
fi

milestone="Gutenberg $major.$minor"

# 4. Create milestone. This may fail for duplicates, which is expected and
#    ignored.

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d "{\"title\":\"$milestone\",description:\"Tasks to be included in the $milestone plugin release.\"}" \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/milestones" > /dev/null

# 5. Find milestone number. This could be improved to allow for non-open status
#    or paginated results.

number=$(
	curl \
		--silent \
		-H "Authorization: token $GITHUB_TOKEN" \
		"https://api.github.com/repos/$GITHUB_REPOSITORY/milestones" \
		| jq ".[0] | select(.title == \"$milestone\") | .number"
)

# 6. Assign pull request to milestone.

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d "{\"milestone\":$number}" \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$pr" > /dev/null
