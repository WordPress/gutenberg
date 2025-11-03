<?php
/**
 * Boot package - Minimal admin page with router and sidebar.
 *
 * @package gutenberg
 */

// Include route and menu APIs.
require_once __DIR__ . '/boot-menu-items.php';
require_once __DIR__ . '/preload.php';

/**
 * Initialize boot admin page.
 */
function gutenberg_boot_admin_page() {
	// Set current screen.
	set_current_screen();

	// Remove unwanted deprecated handler.
	remove_action( 'admin_head', 'wp_admin_bar_header' );

	// Remove unwanted scripts and styles that were enqueued during `admin_init`.
	foreach ( wp_scripts()->queue as $script ) {
		wp_dequeue_script( $script );
	}
	foreach ( wp_styles()->queue as $style ) {
		wp_dequeue_style( $style );
	}

	// Fire init action for extensions to register routes and menu items.
	do_action( 'gutenberg_boot_init' );

	// Register some default menu items for demonstration.
	gutenberg_register_boot_menu_item( 'home', __( 'Home', 'gutenberg' ), '/', '' );
	gutenberg_register_boot_menu_item( 'about', __( 'About', 'gutenberg' ), '/', '' );
	gutenberg_register_boot_menu_item( 'settings', __( 'Settings', 'gutenberg' ), '/', '' );

	// Get routes and menu items.
	$menu_items = gutenberg_get_boot_menu_items();

	// Get boot module asset file for dependencies.
	$asset_file = gutenberg_dir_path() . 'build/modules/boot/index.min.asset.php';
	if ( file_exists( $asset_file ) ) {
		$asset = require $asset_file;

		// This script serves two purposes:
		// 1. It ensures all the globals that are made available to the modules are loaded.
		// 2. It initializes the boot module as an inline script.
		wp_register_script( 'gutenberg-boot-prerequisites', '', $asset['dependencies'], $asset['version'], true );

		// Add inline script to initialize the app.
		wp_add_inline_script(
			'gutenberg-boot-prerequisites',
			sprintf(
				'import("@wordpress/boot").then(mod => mod.init({menuItems: %s}));',
				wp_json_encode( $menu_items, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
			)
		);

		// Register prerequisites style by filtering script dependencies to find registered styles.
		$style_dependencies = array_filter(
			$asset['dependencies'],
			function ( $handle ) {
				return wp_style_is( $handle, 'registered' );
			}
		);
		wp_register_style( 'gutenberg-boot-prerequisites', false, $style_dependencies, $asset['version'] );

		// Dummy script module to ensure dependencies are loaded.
		wp_register_script_module(
			'gutenberg-boot',
			gutenberg_url( 'lib/experimental/boot/loader.js' ),
			array(
				'import' => 'static',
				'id'     => '@wordpress/boot',
			)
		);

		// Enqueue the boot scripts a,d styles.
		wp_enqueue_script( 'gutenberg-boot-prerequisites' );
		wp_enqueue_script_module( 'gutenberg-boot' );
		wp_enqueue_style( 'gutenberg-boot-prerequisites' );
	}

	// Output the HTML.
	?>
	<!DOCTYPE html>
	<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title><?php esc_html_e( 'Boot Demo', 'gutenberg' ); ?></title>
		<style>
			html {
				background: #f1f1f1;
				color: #444;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				font-size: 13px;
				line-height: 1.4em;
			}
			body {
				margin: 0;
			}
			#wpadminbar { display: none; }
		</style>
	<?php
	global $hook_suffix;
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	$hook_suffix = 'gutenberg-boot';

	// BEGIN see wp-admin/admin-header.php.
	print_admin_styles();
	print_head_scripts();

	/**
	 * Fires in head section for a specific admin page.
	 *
	 * @since 2.1.0
	 */
	do_action( "admin_head-{$hook_suffix}" ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores

	/**
	 * Fires in head section for all admin pages.
	 *
	 * @since 2.1.0
	 */
	do_action( 'admin_head' );
	// END see wp-admin/admin-header.php.
	?>
	</head>
	<body class="gutenberg-boot">
		<div id="gutenberg-boot-app" style="height: 100vh; box-sizing: border-box;"></div>
	<?php
	// BEGIN see wp-admin/admin-footer.php.

	/**
	 * Prints scripts or data before the default footer scripts.
	 *
	 * @since 1.2.0
	 */
	do_action( 'admin_footer', '' );

	// Print import map first so it's available for inline scripts.
	wp_script_modules()->print_import_map();
	print_footer_scripts();
	wp_script_modules()->print_enqueued_script_modules();
	wp_script_modules()->print_script_module_preloads();
	wp_script_modules()->print_script_module_data();

	/**
	 * Prints scripts or data after the default footer scripts.
	 *
	 * @since 2.8.0
	 */
	do_action( "admin_footer-{$hook_suffix}" ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
	// END see wp-admin/admin-footer.php.
	?>
	</body>
	</html>
	<?php
	exit;
}

/**
 * Register boot admin page in WordPress admin menu.
 */
function gutenberg_register_boot_admin_page() {
	add_submenu_page(
		'nothing',
		__( 'Boot Demo', 'gutenberg' ),
		__( 'Boot Demo', 'gutenberg' ),
		'manage_options',
		'gutenberg-boot',
		''
	);
}

/**
 * Render the boot admin page.
 *
 * This function checks if the current request is for the boot admin page
 * and renders it, bypassing the default WordPress admin template.
 */
function gutenberg_boot_render_page() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['page'] ) && 'gutenberg-boot' === $_GET['page'] ) {
		gutenberg_boot_admin_page();
		exit;
	}
}

add_action( 'admin_menu', 'gutenberg_register_boot_admin_page' );
add_action( 'admin_init', 'gutenberg_boot_render_page' );
