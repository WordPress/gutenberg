<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core.
 * Requires at least: 5.3
 * Requires PHP: 5.6
 * Version: 8.3.0-rc.1
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
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	global $submenu;

	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'edit_posts',
		'gutenberg',
		'',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg'
	);

	if ( get_option( 'gutenberg-experiments' ) ) {
		if ( array_key_exists( 'gutenberg-widget-experiments', get_option( 'gutenberg-experiments' ) ) ) {
			add_submenu_page(
				'gutenberg',
				__( 'Widgets (beta)', 'gutenberg' ),
				__( 'Widgets (beta)', 'gutenberg' ),
				'edit_theme_options',
				'gutenberg-widgets',
				'the_gutenberg_widgets'
			);
		}
		if ( array_key_exists( 'gutenberg-navigation', get_option( 'gutenberg-experiments' ) ) ) {
			add_submenu_page(
				'gutenberg',
				__( 'Navigation (beta)', 'gutenberg' ),
				__( 'Navigation (beta)', 'gutenberg' ),
				'edit_theme_options',
				'gutenberg-navigation',
				'gutenberg_navigation_page'
			);
		}
		if ( array_key_exists( 'gutenberg-full-site-editing', get_option( 'gutenberg-experiments' ) ) ) {
			add_menu_page(
				__( 'Site Editor (beta)', 'gutenberg' ),
				__( 'Site Editor (beta)', 'gutenberg' ),
				'edit_theme_options',
				'gutenberg-edit-site',
				'gutenberg_edit_site_page',
				'dashicons-layout'
			);
		}
	}

	if ( current_user_can( 'edit_posts' ) ) {
		$submenu['gutenberg'][] = array(
			__( 'Support', 'gutenberg' ),
			'edit_posts',
			__( 'https://wordpress.org/support/plugin/gutenberg', 'gutenberg' ),
		);

		$submenu['gutenberg'][] = array(
			__( 'Documentation', 'gutenberg' ),
			'edit_posts',
			'https://developer.wordpress.org/block-editor/',
		);
	}

	add_submenu_page(
		'gutenberg',
		__( 'Experiments Settings', 'gutenberg' ),
		__( 'Experiments', 'gutenberg' ),
		'edit_posts',
		'gutenberg-experiments',
		'the_gutenberg_experiments'
	);
}
add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	/* translators: %s: Minimum required version */
	printf( __( 'Gutenberg requires WordPress %s or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' ), '5.3.0' );
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
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/master/docs/contributors/getting-started.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 */
function gutenberg_pre_init() {
	global $wp_version;
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( dirname( __FILE__ ) . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	if ( version_compare( $version, '5.3.0', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return;
	}

	require_once dirname( __FILE__ ) . '/lib/load.php';
}

/**
 * Outputs a WP REST API nonce.
 */
function gutenberg_rest_nonce() {
	exit( wp_create_nonce( 'wp_rest' ) );
}
add_action( 'wp_ajax_gutenberg_rest_nonce', 'gutenberg_rest_nonce' );

/**
 * Prints TinyMCE scripts when we're outside of the block editor using
 * the default behavior by calling to the default action function from core.
 * Otherwise, when in the block editor, only print TinyMCE support scripts.
 *
 * Support scripts include translations and a full list of the URIs of
 * TinyMCE JS scripts that need to be loaded for the full dependency.
 *
 * Under some compression settings, TinyMCE may be split into two
 * separate scripts, so we handle that programatically here by checking
 * the `deps` list on the WP_Dependency instance for wp-tinymce.
 *
 * @since 7.9.1
 */
function gutenberg_print_tinymce_scripts() {
	global $wp_meta_boxes, $post_type;
	$current_screen = get_current_screen();

	if ( ! $current_screen->is_block_editor() ) {
		wp_print_tinymce_scripts();
		return;
	}

	foreach ( $wp_meta_boxes[$post_type] as $position ) {
		foreach ( $position as $priority ) {
			foreach ( $priority as $box ) {
				if ( ! $box ) {
					continue;
				}

				$is_back_compat_box = isset( $box['args']['__back_compat_meta_box'] ) && true === $box['args']['__back_compat_meta_box'];

				if ( ! $is_back_compat_box ) {
					// we've found a true meta box which may depend on TinyMCE
					wp_print_tinymce_scripts();
					return;
				}
			}
		}
	}

	// Otherwise we're in the block editor and should only print support scripts.

	// Translations
	echo "<script type='text/javascript'>\n" .
		"window.wpMceTranslation = function() {\n" .
			_WP_Editors::wp_mce_translation() .
		"\n};\n";

	// Full list of TinyMCE JS scripts to load in order
	$wp_scripts  = wp_scripts();
	$tinymce_dep = $wp_scripts->registered['wp-tinymce'];

	echo "window.wpTinyMCEOrderedScriptURIs = [];\n";

	foreach ( $tinymce_dep->deps as $handle ) {
		$url = $wp_scripts->get_url( $handle );
		echo "window.wpTinyMCEOrderedScriptURIs.push( \"$url\");\n";
	}

	$url = $wp_scripts->get_url( $tinymce_dep->handle );
	echo "window.wpTinyMCEOrderedScriptURIs.push( \"$url\" );\n" .
		"</script>";
}

remove_action( 'print_tinymce_scripts', 'wp_print_tinymce_scripts' );
add_action( 'print_tinymce_scripts', 'gutenberg_print_tinymce_scripts' );

// function gutenberg_print_tinymce_when_meta_boxes_are_present( $post_type, $position, $post ) {
// 	global $wp_meta_boxes;

// 	if ( ! empty( $wp_meta_boxes ) ) {
// 		wp_print_tinymce_scripts();
// 	}
// }

// add_action( 'do_meta_boxes', 'gutenberg_print_tinymce_when_meta_boxes_are_present', 10, 3 );
