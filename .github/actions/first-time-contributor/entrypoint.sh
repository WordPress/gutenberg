#!/bin/bash
set -e

# 1. Get the author and pr number for the pull request.
author=$(jq -r '.pull_request.user.login' $GITHUB_EVENT_PATH)
pr_number=$(jq -r '.number' $GITHUB_EVENT_PATH)

if [ "$pr_number" = "null" ] || [ "$author" = "null" ]; then
	echo "Could not find PR number or author. $pr_number / $author"
	exit 78
fi

# 2. Fetch the author's commit count for the repo to determine if they're a first-time contributor.
commit_count=$(
	curl \
		--silent \
		-H "Accept: application/vnd.github.cloak-preview" \
		"https://api.github.com/search/commits?q=repo:$GITHUB_REPOSITORY+author:$author" \
		| jq -r '.total_count'
)

# 3. If the response has a commit count of zero, exit early, the author is not a first time contributor.
if [ "$commit_count" != "0" ]; then
	echo "Pull request #$pr_number was not created by a first-time contributor ($author)."
	exit 78
fi

# 4. Assign the 'First Time Contributor' label.
curl \
	--silent \
	-X POST \
	-H "Authorization: token $GITHUB_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"labels":["First-time Contributor"]}' \
	"https://api.github.com/repos/$GITHUB_REPOSITORY/issues/$pr_number/labels" > /dev/null
