<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the block editor, site editor, and other future WordPress core functionality.
 * Requires at least: 6.5
 * Requires PHP: 7.2
 * Version: 19.2.0
 * Author: Gutenberg Team
 * Text Domain: gutenberg
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
defined( 'GUTENBERG_DEVELOPMENT_MODE' ) or define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

gutenberg_pre_init();

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 17.9.0
 */
function gutenberg_version_notice() {
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
	$requirements = validate_plugin_requirements( 'gutenberg/gutenberg.php' );
	$errors       = $requirements->errors;

	if ( isset( $errors['plugin_wp_php_incompatible'][0] ) ) {
		echo '<div class="error">' . $errors['plugin_wp_php_incompatible'][0] . '</div>';
	} elseif ( isset( $errors['plugin_wp_incompatible'][0] ) ) {
		echo '<div class="error">' . $errors['plugin_wp_incompatible'][0] . '</div>';
	} elseif ( isset( $errors['plugin_php_incompatible'][0] ) ) {
		echo '<div class="error">' . $errors['plugin_php_incompatible'][0] . '</div>';
	}

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Display a build notice.
 *
 * @since 0.1.0
 */
function gutenberg_build_files_notice() {
	echo '<div class="error"><p>';
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/getting-started-with-code-contribution.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 * @since 17.9.0 Use `validate_plugin_requirements()` to validate WordPress
 *               version and PHP version requirements.
 */
function gutenberg_pre_init() {
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( __DIR__ . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	require_once ABSPATH . 'wp-admin/includes/plugin.php';
	$requirements = validate_plugin_requirements( 'gutenberg/gutenberg.php' );

	if ( is_wp_error( $requirements ) ) {
		add_action( 'admin_notices', 'gutenberg_version_notice' );
		return;
	}

	require_once __DIR__ . '/lib/load.php';
}
