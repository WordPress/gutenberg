#!/bin/bash
set -e

# 1. Get the author and pr number for the pull request.
author=$(jq -r '.pull_request.user.login' $GITHUB_EVENT_PATH)
pr_number=$(jq -r '.number' $GITHUB_EVENT_PATH)

if [ $pr_number = "null" ] || [ $author = "null" ]; then
    echo "Could not find PR number or author. $pr_number / $author"
	exit 78
fi

# 2. Fetch the author's commits list for the repo to determine if they're a first-time contributor.
echo "Fetching commits for using the url https://github.com/$GITHUB_REPOSITORY/commits?author=$author"
html=$(
	curl \
		--silent \
		"https://github.com/$GITHUB_REPOSITORY/commits?author=$author"
)

# 3. Run a regular expression against the html to check for the 'No commits found' message.
regex='\<p\>[[:space:]]*No[[:space:]]+commits[[:space:]]+found[[:space:]]+for[[:space:]]+"'$author'"[[:space:]]*\<\/p\>'
if ! [[ "$html" =~ $regex ]]; then
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
