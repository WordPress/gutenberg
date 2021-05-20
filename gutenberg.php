<?php
/**
 * Plugin Name: Gutenberg - Nightly
 * Plugin URI: https://github.com/bph/gutenberg
 * Description: Zip from trunk (the default branch) of WordPress Gutenberg GitHub repo: Gutenberg This is the development plugin for the new block editor in core. If you have trouble seeing updates, go to <em>GitHub Updater > Settings</em>  and use the button <em>Refresh Cache</em>. Ping @bph on WPSlack for questions. Or <a href="https://github.com/bph/gutenberg/discussions/new">post on the Discussion board</a>.

 * Requires at least: 5.6
 * Requires PHP: 5.6
 * Version: 10.8.0.20210520
 * Author: Gutenberg Team and Birgit Pauli-Haack (Gutenberg Times)
 * Text Domain: gutenberg
 * GitHub Plugin URI: bph/gutenberg
 * Primary Branch: trunk
 * Release Asset: true
 *
 * @package gutenberg
 */

// GitHub Updater filters.
add_filter(
	'github_updater_override_dot_org',
	function ( $overrides ) {
		return array_merge(
			$overrides,
			array( 'gutenberg/gutenberg.php' )
		);
	}
);
add_filter(
	'github_updater_release_asset_rollback',
	function ( $rollback, $file ) {
		if ( $file === plugin_basename( __FILE__ ) ) {
			return [ 'gutenberg-nightly' ];
		}
	},
	10,
	2
);
add_filter( 'github_updater_no_release_asset_branches', '__return_true' );
// End GitHub Updater filters.


### BEGIN AUTO-GENERATED DEFINES
define( 'GUTENBERG_VERSION', '9.6.2.20201230' );
define( 'GUTENBERG_GIT_COMMIT', 'd516050927e6f7d8c4d1917f37c46bab00daacec' );
### END AUTO-GENERATED DEFINES

gutenberg_pre_init();

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	/* translators: %s: Minimum required version */
	printf( __( 'Gutenberg requires WordPress %s or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' ), '5.6' );
	echo '</p></div>';

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Display a build notice.
 *
 * @since 0.1.0
 */
function gutenberg_build_files_notice() {
	echo '<div class="error"><p>';
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/getting-started.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 */
function gutenberg_pre_init() {
	global $wp_version;
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( __DIR__ . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	// Compare against major release versions (X.Y) rather than minor (X.Y.Z)
	// unless a minor release is the actual minimum requirement. WordPress reports
	// X.Y for its major releases.
	if ( version_compare( $version, '5.6', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return;
	}

	require_once __DIR__ . '/lib/load.php';
}
