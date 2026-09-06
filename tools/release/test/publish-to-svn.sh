#!/bin/bash
# Integration tests against a disposable SVN repository. Requires svn, svnadmin,
# and GNU diff/timeout. No WordPress.org credentials or network access are used.
set -euo pipefail

SCRIPT="${PUBLISH_SCRIPT:-$(cd "$(dirname "$0")/.." && pwd)/publish-to-svn.sh}"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
REAL_SVN="$(command -v svn)"
export REAL_SVN
mkdir "$TEST_ROOT/bin"
cat > "$TEST_ROOT/bin/svn" <<'WRAPPER'
#!/bin/bash
set -euo pipefail
case "$1" in
	list)
		if [[ "${SCENARIO:-}" == list-error ]]; then
			echo 'svn: E170001: Authorization failed' >&2
			exit 1
		fi
		;;
	commit|import)
		if [[ "${SCENARIO:-}" == reject-write ]]; then
			echo 'svn: E170001: Authorization failed' >&2
			exit 1
		fi
		"$REAL_SVN" "$@"
		if [[ "${SCENARIO:-}" == commit-error ]]; then
			echo "svn: E160013: '/gutenberg' path not found" >&2
			exit 1
		fi
		exit 0
		;;
	info|export)
		if [[ "${SCENARIO:-}" == stalled-read ]]; then
			sleep 30
		fi
		if [[ "${SCENARIO:-}" == delayed-content && "$1" == info ]]; then
			count=$(cat "$READ_COUNT")
			echo "$((count + 1))" > "$READ_COUNT"
			if (( count == 1 )); then
				"$REAL_SVN" checkout "$PLUGIN_REPO_URL/tags/$VERSION" "$MUTATION_DIR" -q
				cp -R "$PAYLOAD/." "$MUTATION_DIR/"
				"$REAL_SVN" add --force "$MUTATION_DIR" >/dev/null
				"$REAL_SVN" commit "$MUTATION_DIR" -m 'Release becomes available' -q
			fi
		fi
		if [[ "${SCENARIO:-}" == read-error ]]; then
			echo 'svn: E175012: Connection timed out' >&2
			exit 1
		fi
		if [[ "${SCENARIO:-}" == delayed-read && "$1" == info ]]; then
			count=$(cat "$READ_COUNT")
			echo "$((count + 1))" > "$READ_COUNT"
			if (( count < 2 )); then
				echo 'svn: E160013: Revision not yet available' >&2
				exit 1
			fi
		fi
		;;
esac
if [[ "${SCENARIO:-}" == mixed-revisions && "$1" == export && ! -f "$READ_COUNT.changed" ]]; then
	"$REAL_SVN" "$@"
	touch "$READ_COUNT.changed"
	"$REAL_SVN" checkout "$PLUGIN_REPO_URL" "$MUTATION_DIR" -q
	cp -R "$PAYLOAD/." "$MUTATION_DIR/trunk/"
	echo 'wrong release' > "$MUTATION_DIR/tags/$VERSION/gutenberg.php"
	"$REAL_SVN" add --force "$MUTATION_DIR" >/dev/null
	"$REAL_SVN" commit "$MUTATION_DIR" -m 'Concurrent change' -q
	exit 0
fi
exec "$REAL_SVN" "$@"
WRAPPER
chmod +x "$TEST_ROOT/bin/svn"
export PATH="$TEST_ROOT/bin:$PATH"
export SVN_USERNAME=test SVN_PASSWORD=test VERSION=23.9.0
export SVN_VERIFY_TIMEOUT=3 SVN_VERIFY_RETRY_INTERVAL=1

setup() {
	CASE_ROOT="$TEST_ROOT/$1"
	mkdir -p "$CASE_ROOT/release/build"
	svnadmin create "$CASE_ROOT/repository"
	export PLUGIN_REPO_URL="file://$CASE_ROOT/repository"
	"$REAL_SVN" mkdir "$PLUGIN_REPO_URL/trunk" "$PLUGIN_REPO_URL/tags" -m init -q
	printf 'Version: 23.9.0\n' > "$CASE_ROOT/release/gutenberg.php"
	printf 'Stable tag: 23.9.0\n' > "$CASE_ROOT/release/readme.txt"
	printf 'release code\n' > "$CASE_ROOT/release/build/file with spaces.js"
	printf 'Release notes\n' > "$CASE_ROOT/release/changelog.txt"
	export READ_COUNT="$CASE_ROOT/reads" MUTATION_DIR="$CASE_ROOT/mutation" PAYLOAD="$CASE_ROOT/release"
	echo 0 > "$READ_COUNT"
	unset SCENARIO
}

prepare_trunk() {
	"$REAL_SVN" checkout "$PLUGIN_REPO_URL/trunk" "$CASE_ROOT/trunk" -q
	"$REAL_SVN" checkout "$PLUGIN_REPO_URL/tags" "$CASE_ROOT/tags" --depth=immediates -q
	cp -R "$CASE_ROOT/release/." "$CASE_ROOT/trunk/"
}

publish() {
	bash "$SCRIPT" "$@" > "$CASE_ROOT/output" 2>&1
}

expect_success() {
	if ! publish "$@"; then
		cat "$CASE_ROOT/output"
		exit 1
	fi
	grep -q 'Verified SVN release 23.9.0 at revision' "$CASE_ROOT/output"
}

expect_failure() {
	if publish "$@"; then
		echo 'Unexpected success'
		cat "$CASE_ROOT/output"
		exit 1
	fi
	if grep -q 'Verified SVN release' "$CASE_ROOT/output"; then
		echo 'Failed deployment was reported as verified'
		exit 1
	fi
}

setup successful-trunk
"$REAL_SVN" checkout "$PLUGIN_REPO_URL/trunk" "$CASE_ROOT/old-trunk" -q
echo obsolete > "$CASE_ROOT/old-trunk/removed file.js"
"$REAL_SVN" add "$CASE_ROOT/old-trunk/removed file.js" -q
"$REAL_SVN" commit "$CASE_ROOT/old-trunk" -m old -q
prepare_trunk
rm "$CASE_ROOT/trunk/removed file.js"
expect_success "$CASE_ROOT/trunk" trunk
"$REAL_SVN" export "$PLUGIN_REPO_URL/tags/$VERSION" "$CASE_ROOT/export" -q
diff -r "$CASE_ROOT/release" "$CASE_ROOT/export"
echo 'PASS: publish and verify both trunk and tag'
before=$("$REAL_SVN" info --show-item revision "$PLUGIN_REPO_URL")
expect_success "$CASE_ROOT/trunk" trunk
[[ $("$REAL_SVN" info --show-item revision "$PLUGIN_REPO_URL") == "$before" ]]
echo 'PASS: accept an identical existing trunk release without a write'

setup lost-commit-response
prepare_trunk
export SCENARIO=commit-error
expect_success "$CASE_ROOT/trunk" trunk
grep -q 'E160013' "$CASE_ROOT/output"
echo 'PASS: recover after a committed release reports failure'

setup existing-tag
"$REAL_SVN" import "$CASE_ROOT/release" "$PLUGIN_REPO_URL/tags/$VERSION" -m tag -q
before=$("$REAL_SVN" info --show-item revision "$PLUGIN_REPO_URL")
expect_success "$CASE_ROOT/release" tag
[[ $("$REAL_SVN" info --show-item revision "$PLUGIN_REPO_URL") == "$before" ]]
echo 'PASS: accept an identical existing tag without a write'

for difference in missing changed extra; do
	setup "$difference-file"
	"$REAL_SVN" import "$CASE_ROOT/release" "$PLUGIN_REPO_URL/tags/$VERSION" -m tag -q
	case "$difference" in
		missing) echo 'not deployed' > "$CASE_ROOT/release/missing.js" ;;
		changed) echo 'different code' > "$CASE_ROOT/release/build/file with spaces.js" ;;
		extra) rm "$CASE_ROOT/release/build/file with spaces.js" ;;
	esac
	expect_failure "$CASE_ROOT/release" tag
	echo "PASS: reject $difference files despite matching version headers"
done

setup missing-trunk
prepare_trunk
"$REAL_SVN" import "$CASE_ROOT/release" "$PLUGIN_REPO_URL/tags/$VERSION" -m tag -q
expect_failure "$CASE_ROOT/trunk" trunk
echo 'PASS: a matching tag cannot hide an incomplete trunk release'

setup rejected-write
export SCENARIO=reject-write
expect_failure "$CASE_ROOT/release" tag
grep -q 'Authorization failed' "$CASE_ROOT/output"
echo 'PASS: a rejected write with no deployment remains a failure'

setup unreadable-deployment
export SCENARIO=read-error
expect_failure "$CASE_ROOT/release" tag
grep -q 'Connection timed out' "$CASE_ROOT/output"
echo 'PASS: a successful write cannot hide failed verification reads'

setup delayed-visibility
prepare_trunk
export SCENARIO=delayed-read SVN_VERIFY_TIMEOUT=10
expect_success "$CASE_ROOT/trunk" trunk
[[ $(cat "$READ_COUNT") -ge 3 ]]
echo 'PASS: retry verification until SVN reads become available'

setup tag-only
export SCENARIO=commit-error
trunk_revision=$("$REAL_SVN" info --show-item last-changed-revision "$PLUGIN_REPO_URL/trunk")
expect_success "$CASE_ROOT/release" tag
[[ $("$REAL_SVN" info --show-item last-changed-revision "$PLUGIN_REPO_URL/trunk") == "$trunk_revision" ]]
echo 'PASS: recover tag-only imports without changing trunk'

setup failed-tag-lookup
export SCENARIO=list-error
before=$("$REAL_SVN" info --show-item revision "$PLUGIN_REPO_URL")
expect_failure "$CASE_ROOT/release" tag
[[ $("$REAL_SVN" info --show-item revision "$PLUGIN_REPO_URL") == "$before" ]]
echo 'PASS: failed tag lookup cannot trigger publication'

setup mixed-revisions
prepare_trunk
"$REAL_SVN" import "$CASE_ROOT/release" "$PLUGIN_REPO_URL/tags/$VERSION" -m tag -q
export SCENARIO=mixed-revisions SVN_VERIFY_TIMEOUT=3
expect_failure "$CASE_ROOT/trunk" trunk
[[ -f "$READ_COUNT.changed" ]]
echo 'PASS: never combine matching trees from different revisions'

setup delayed-content
"$REAL_SVN" import "$CASE_ROOT/release" "$PLUGIN_REPO_URL/tags/$VERSION" -m tag -q
echo 'new file' > "$CASE_ROOT/release/new.js"
export SCENARIO=delayed-content SVN_VERIFY_TIMEOUT=10
expect_success "$CASE_ROOT/release" tag
[[ $(cat "$READ_COUNT") -ge 2 ]]
echo 'PASS: retry content differences against a fresh revision'

setup stalled-read
export SCENARIO=stalled-read SVN_VERIFY_TIMEOUT=3
started=$SECONDS
expect_failure "$CASE_ROOT/release" tag
(( SECONDS - started < 10 ))
echo 'PASS: bound a stalled SVN read by the verification deadline'
