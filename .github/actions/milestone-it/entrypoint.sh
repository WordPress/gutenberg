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
	exit 78;
fi

# 2. Read current version.

version=$(git show master:package.json | jq -r '.version')

IFS='.' read -ra parts <<< "$version"
major=${parts[0]}
minor=${parts[1]}

# 3. Determine next milestone.

if [[ $minor == 9* ]]; then
	major=$((major+1))
	minor="0"
else
	minor=$((minor+1))
fi

milestone="Gutenberg $major.$minor"

# 4. Calculate next milestone due date, using a static reference of an earlier
#    release (v5.0) as a reference point for the biweekly release schedule.

reference_major=5
reference_minor=0
reference_date=1549238400
num_versions_elapsed=$(((major-reference_major)*10+(minor-reference_minor)))
weeks=$((num_versions_elapsed*2))
due=$(date -u --iso-8601=seconds -d "$(date -d @$(echo $reference_date)) + $(echo $weeks) weeks")

# 5. Create milestone. This may fail for duplicates, which is expected and
#    ignored.

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d "{\"title\":\"$milestone\",\"due_on\":\"$due\",\"description\":\"Tasks to be included in the $milestone plugin release.\"}" \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/milestones" > /dev/null

# 6. Find milestone number. This could be improved to allow for non-open status
#    or paginated results.

number=$(
	curl \
		--silent \
		-H "Authorization: token $GITHUB_TOKEN" \
		"https://api.github.com/repos/$GITHUB_REPOSITORY/milestones" \
		| jq ".[] | select(.title == \"$milestone\") | .number"
)

# 7. Assign pull request to milestone.

curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d "{\"milestone\":$number}" \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$pr" > /dev/null
