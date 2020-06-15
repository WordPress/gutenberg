set -Eeuo pipefail

# Test versions. use `wp core version` in the future:
# Sample versions:
# wp_version=5.4.2
wp_version=5.5-alpha-48034
# wp_version=5.4-beta-47422
# wp_version=5.4-beta3
# wp_version=5.4-RC1

if [[ $wp_version =~ ^[0-9]+\.[0-9]+\-(beta|RC)[0-9]+$ ]]; then
	branch=${wp_version%\-*}
	wp_svn_tag="branches/$branch"

elif [[ $wp_version =~ ^[0-9]+\.[0-9]+$ ]]; then
	wp_svn_tag="branches/$wp_version"
elif [[ $wp_version =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
	if [[ $wp_version =~ [0-9]+\.[0-9]+\.[0] ]]; then
		# version x.x.0 means the first release of the major version, so strip off the .0 and download version x.x
		wp_svn_tag="tags/${wp_version%??}"
	else
		wp_svn_tag="tags/$wp_version"
	fi
elif [[ $wp_version == 'nightly' || $wp_version == 'trunk' ]]; then
	wp_svn_tag="trunk"
elif [[ $wp_version =~ \-[0-9]+$ ]]; then
	# Remove everything up to and including the last dash character.
	# 5.5-alpha-48034 becomes 48034
	wp_svn_revision=${wp_version##*\-}
fi


get_svn_path() {
	if [ ! -z ${wp_svn_tag+x} ]; then
		echo "https://develop.svn.wordpress.org/${wp_svn_tag}/$1/"
	elif [ ! -z ${wp_svn_revision+x} ]; then
		echo "https://develop.svn.wordpress.org/trunk/$1/?p=$wp_svn_revision"
	else
		echo "Could not parse version."
		exit 1
	fi
}

include_path=$(get_svn_path tests/phpunit/includes)
data_path=$(get_svn_path tests/phpunit/data)

dl_location=~/Desktop
download_files() {
	# Neither svn nor apt-get is available in the docker environment; use wget.
	wget --waitretry=5 -m -np -P $dl_location "$1"
}

download_files $include_path
download_files $data_path

# Wget includes query params in the filename; remove them.
if [ ! -z ${wp_svn_revision+x} ]; then
	find $dl_location -name "*?p=$wp_svn_revision" -exec sh -c 'mv "$0" "${0%%\?*}"' {} \;
fi

# set up testing suite if it doesn't yet exist
# if [ ! -d $WP_TESTS_DIR ]; then
# 	# set up testing suite
# 	mkdir -p $WP_TESTS_DIR
# 	svn co --quiet --ignore-externals $include_path $WP_TESTS_DIR/includes
# 	svn co --quiet --ignore-externals $data_path $WP_TESTS_DIR/data
# fi