#!/bin/sh
set -e

# 1. Read current version.

version=$(jq -r '.version' package.json)

IFS='.' read -ra parts <<< "$version"
major=${parts[0]}
minor=${parts[1]}

# 2. Determine next milestone.

if [ minor == '9' ]; then
	major=$((major+1))
else
	minor=$((minor+1))
fi

milestone="Gutenberg $major.$minor"

# 3. Create milestone. This may fail for duplicates, which is expected and
#    ignored.

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d "{\"title\":\"$milestone\"}" \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/milestones" > /dev/null

# 4. Find milestone number. This could be improved to allow for non-open status
#    or paginated results.

number=$(
	curl \
		--silent \
		-H "Authorization: token $GITHUB_TOKEN" \
		"https://api.github.com/repos/$GITHUB_REPOSITORY/milestones" \
		| jq ".[0] | select(.title == \"$milestone\") | .number"
)

# 5. Assign pull request to milestone.

pr=$(jq -r '.number' $GITHUB_EVENT_PATH)

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d "{\"milestone\":$number}" \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$pr"
