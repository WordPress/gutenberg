#!/bin/bash
# Publish a prepared release, then verify its contents independently of the
# commit response. Requires Subversion and GNU diff/timeout, as on Ubuntu runners.
set -euo pipefail

if (( $# != 2 )); then
	echo "Usage: $0 <source-dir> <trunk|tag>" >&2
	exit 1
fi

source_dir="$(cd "$1" && pwd)"
mode="$2"
: "${PLUGIN_REPO_URL:?}" "${VERSION:?}" "${SVN_USERNAME:?}" "${SVN_PASSWORD:?}"
if [[ "$mode" != trunk && "$mode" != tag ]]; then
	echo 'Expected publish mode trunk or tag.' >&2
	exit 1
fi
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	echo 'Expected a stable release version.' >&2
	exit 1
fi

verify_timeout="${SVN_VERIFY_TIMEOUT:-900}"
retry_interval="${SVN_VERIFY_RETRY_INTERVAL:-30}"
if [[ ! "$verify_timeout" =~ ^[1-9][0-9]*$ || ! "$retry_interval" =~ ^[1-9][0-9]*$ ]]; then
	echo 'SVN verification timeout and retry interval must be positive seconds.' >&2
	exit 1
fi

svn_args=(--no-auth-cache --non-interactive --username "$SVN_USERNAME" --password "$SVN_PASSWORD")
tag_url="$PLUGIN_REPO_URL/tags/$VERSION"
verification_dir="$(mktemp -d)"
trap 'rm -rf "$verification_dir"' EXIT
mkdir "$verification_dir/expected"
# Preserve the exact prepared payload before SVN can change the working copy.
tar -C "$source_dir" --exclude=.svn -cf - . | tar -C "$verification_dir/expected" -xf -

# Bound and retry all remote reads. A transient tag lookup failure must not
# force a manual rerun, while a persistent failure must not trigger a write.
read_svn() {
	local deadline="$1"
	shift
	local remaining=$((deadline - SECONDS))
	if (( remaining <= 0 )); then
		return 1
	fi
	timeout "$remaining" svn "$@" "${svn_args[@]}" --config-option=servers:global:http-timeout=60
}

# Listing the parent must succeed. An authentication or network error must not
# be mistaken for an absent tag and trigger a new write.
lookup_deadline=$((SECONDS + verify_timeout))
retry_delay="$retry_interval"
while ! read_svn "$lookup_deadline" list "$PLUGIN_REPO_URL/tags" > "$verification_dir/tags"; do
	remaining=$((lookup_deadline - SECONDS))
	if (( remaining <= 0 )); then
		echo "::error::Could not read SVN tags within $verify_timeout seconds. No publication was attempted. Check SVN access, then rerun the workflow."
		exit 1
	fi
	delay="$retry_delay"
	if (( delay > remaining )); then
		delay="$remaining"
	fi
	echo "Could not read SVN tags. Retrying in $delay seconds; $remaining seconds remain."
	sleep "$delay"
	if (( retry_delay <= verify_timeout / 2 )); then
		retry_delay=$((retry_delay * 2))
	else
		retry_delay="$verify_timeout"
	fi
done
if grep -Fxq "$VERSION/" "$verification_dir/tags"; then
	echo "SVN tag tags/$VERSION already exists. Verifying its contents before accepting the release."
else
	if [[ "$mode" == trunk ]]; then
		svn add --force "$source_dir"
		while IFS= read -r missing; do
			svn rm "$missing"
		done < <(svn status "$source_dir" | sed -n 's/^! *//p')
		tag_dir="$(dirname "$source_dir")/tags/$VERSION"
		svn copy "$source_dir" "$tag_dir"
		publish_command=(commit "$source_dir" "$tag_dir" -m "Releasing version $VERSION")
	else
		publish_command=(import "$source_dir" "$tag_url" -m "Committing version $VERSION")
	fi
	if ! svn "${publish_command[@]}" "${svn_args[@]}" --config-option=servers:global:http-timeout=600; then
		echo '::warning::SVN reported a publish error. Checking the repository to determine whether the release was committed.'
	fi
fi

# A commit may have succeeded even when SVN returned an error. Retry only reads;
# never repeat a write whose outcome is uncertain. Each attempt pins all exports
# to one revision, so trunk and tag cannot be verified at different revisions.
deadline=$((SECONDS + verify_timeout))

verify_release() {
	local revision remote_path
	if ! revision=$(read_svn "$deadline" info --show-item revision "$PLUGIN_REPO_URL"); then
		return 1
	fi
	if [[ ! "$revision" =~ ^[0-9]+$ ]]; then
		echo 'SVN did not return a valid revision.' >&2
		return 1
	fi
	local paths=("tags/$VERSION")
	if [[ "$mode" == trunk ]]; then
		paths+=(trunk)
	fi
	for remote_path in "${paths[@]}"; do
		rm -rf "$verification_dir/actual"
		if ! read_svn "$deadline" export --quiet --ignore-externals --ignore-keywords \
			-r "$revision" "$PLUGIN_REPO_URL/$remote_path@$revision" "$verification_dir/actual"; then
			return 1
		fi
		if ! ( cd "$verification_dir" && diff --recursive --brief --no-dereference expected actual ); then
			echo "SVN $remote_path at revision $revision does not match the prepared release." >&2
			return 1
		fi
	done
	echo "Verified SVN release $VERSION at revision $revision: ${paths[*]} match the prepared release."
	if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
		echo "Verified SVN release $VERSION at revision $revision. All files in ${paths[*]} match the prepared release." >> "$GITHUB_STEP_SUMMARY"
	fi
}

retry_delay="$retry_interval"
while (( SECONDS < deadline )); do
	if verify_release; then
		exit 0
	fi
	remaining=$((deadline - SECONDS))
	if (( remaining <= 0 )); then
		break
	fi
	delay="$retry_delay"
	if (( delay > remaining )); then
		delay="$remaining"
	fi
	echo "Release not yet verified. Retrying in $delay seconds; $remaining seconds remain."
	sleep "$delay"
	if (( retry_delay <= verify_timeout / 2 )); then
		retry_delay=$((retry_delay * 2))
	else
		retry_delay="$verify_timeout"
	fi
done

echo "::error::Could not verify SVN release $VERSION within $verify_timeout seconds. Inspect the SVN tag and trunk against the prepared release before retrying publication."
exit 1
