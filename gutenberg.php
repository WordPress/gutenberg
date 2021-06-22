<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core.
 * Requires at least: 5.6
 * Requires PHP: 5.6
 * Version: 10.9.0-rc.1
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
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/getting-started-with-code-contribution.md">contributing</a> file for more information.', 'gutenberg' );
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

/**
 * Displays a warning that deactivating Gutenberg is not recommended when the theme depends
 * on the FSE functionality found in the plugin.
 *
 * @since 10.9.0
 *
 * @param string $plugin_file Path to the plugin file relative to the plugins directory.
 * @param array  $plugin_data An array of plugin data.
 */
function gutenberg_theme_relies_on_notice( $plugin_file, $plugin_data ) {
	if ( ! current_user_can( 'update_plugins' ) ) {
		return;
	}

	$theme = wp_get_theme();
	$theme_tags = $theme->get( 'Tags' );

	// Only display a notice for themes that require FSE.
	if ( empty( $theme_tags ) || ! in_array( 'full-site-editing', $theme_tags, true ) ) {
		return;
	}

	$wp_list_table = _get_list_table(
		'WP_Plugins_List_Table',
		array(
			'screen' => get_current_screen(),
		)
	);

	printf(
		'<tr class="plugin-update-tr active" id="%s" data-slug="%s" data-plugin="%s">' .
		'<td colspan="%s" class="plugin-update colspanchange">' .
		'<div class="notice inline notice-warning notice-alt"><p>%s</p></div></td></tr>',
		esc_attr( $plugin_data['slug'] . '-update' ),
		esc_attr( $plugin_data['slug'] ),
		esc_attr( $plugin_file ),
		esc_attr( $wp_list_table->get_column_count() ),
		__( 'This plugin is required for the active theme to work correctly. Deactivating is not recommended.', 'gutenberg' )
	);
}
add_action( 'after_plugin_row_gutenberg/gutenberg.php', 'gutenberg_theme_relies_on_notice', 10, 2 );
