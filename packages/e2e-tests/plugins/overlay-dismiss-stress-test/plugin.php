<?php
/**
 * Plugin Name: Gutenberg Test Overlay Dismiss Stress Test
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Cross-bundle overlay dismiss coordination stress test. Provides an admin page to test overlay nesting with independent Base UI bundles.
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-overlay-dismiss-stress-test
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the admin page.
 */
function overlay_dismiss_stress_test_admin_menu() {
	add_management_page(
		'Overlay Dismiss Test',
		'Overlay Dismiss Test',
		'manage_options',
		'overlay-dismiss-stress-test',
		'overlay_dismiss_stress_test_render_page'
	);
}
add_action( 'admin_menu', 'overlay_dismiss_stress_test_admin_menu' );

/**
 * Enqueue scripts on the admin page.
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function overlay_dismiss_stress_test_enqueue_scripts( $hook_suffix ) {
	if ( 'tools_page_overlay-dismiss-stress-test' !== $hook_suffix ) {
		return;
	}

	$plugin_dir_url  = plugin_dir_url( __FILE__ );
	$plugin_dir_path = plugin_dir_path( __FILE__ );

	$react_deps = array( 'wp-element', 'react-jsx-runtime' );

	// Bundle A — independent copy of @base-ui/react (IIFE, window.OverlayBundleA)
	wp_enqueue_script(
		'overlay-bundle-a',
		$plugin_dir_url . 'build/bundle-a.iife.js',
		$react_deps,
		filemtime( $plugin_dir_path . 'build/bundle-a.iife.js' ),
		true
	);

	// Bundle B — independent copy of @base-ui/react (IIFE, window.OverlayBundleB)
	wp_enqueue_script(
		'overlay-bundle-b',
		$plugin_dir_url . 'build/bundle-b.iife.js',
		$react_deps,
		filemtime( $plugin_dir_path . 'build/bundle-b.iife.js' ),
		true
	);

	// Playground script (renders the test UI)
	wp_enqueue_script(
		'overlay-dismiss-playground',
		$plugin_dir_url . 'build/playground.iife.js',
		array_merge(
			$react_deps,
			array( 'overlay-bundle-a', 'overlay-bundle-b', 'wp-components' )
		),
		filemtime( $plugin_dir_path . 'build/playground.iife.js' ),
		true
	);

	// Also enqueue @wordpress/components styles for the interop scenarios
	wp_enqueue_style( 'wp-components' );

	// Basic styles for the playground
	wp_enqueue_style(
		'overlay-dismiss-playground-styles',
		$plugin_dir_url . 'src/playground.css',
		array(),
		filemtime( $plugin_dir_path . 'src/playground.css' )
	);
}
add_action( 'admin_enqueue_scripts', 'overlay_dismiss_stress_test_enqueue_scripts' );

/**
 * Render the admin page.
 */
function overlay_dismiss_stress_test_render_page() {
	?>
	<div class="wrap">
		<h1>Cross-Bundle Overlay Dismiss Stress Test</h1>
		<p>
			This page tests overlay dismiss coordination when overlays come from
			two independent <code>@base-ui/react</code> bundles with separate
			React contexts but a shared React instance.
		</p>
		<div id="overlay-dismiss-stress-test-root"></div>
	</div>
	<?php
}
