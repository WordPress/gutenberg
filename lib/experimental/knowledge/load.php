<?php
/**
 * Bootstraps the Guidelines page in wp-admin under Settings.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_guidelines_settings_submenu', 10 );
add_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_enqueue_block_registry_scripts', 5 );
add_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_preload_rest', 6 );

/**
 * Registers the Guidelines submenu item under Settings.
 * Uses the same layout/style as the Font Library admin page (wp-admin integrated).
 */
function gutenberg_register_guidelines_settings_submenu() {
	add_submenu_page(
		'options-general.php',
		__( 'Guidelines', 'gutenberg' ),
		__( 'Guidelines', 'gutenberg' ),
		'manage_options',
		'guidelines-wp-admin',
		'gutenberg_guidelines_wp_admin_render_page'
	);
}

/**
 * Enqueues wp-block-library on the Guidelines admin page so
 * registerCoreBlocks() is available when the app bootstraps the block
 * registry (Core blocks only) on the client.
 *
 * Priority 5 ensures this runs before the main asset enqueue (priority 10).
 */
function gutenberg_guidelines_enqueue_block_registry_scripts( $hook_suffix ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'settings_page_guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_script( 'wp-block-library' );
}

/**
 * Preloads the guideline scopes registry on the Guidelines admin page so the
 * client renders its sections without an extra round trip. Mirrors the
 * preloading the generated page template performs for site settings.
 *
 * @param string $hook_suffix The current admin page.
 */
function gutenberg_guidelines_preload_rest( $hook_suffix ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'settings_page_guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	$preload_paths = array(
		'/wp/v2/knowledge/guideline-scopes',
		array( '/wp/v2/knowledge/guideline-scopes', 'OPTIONS' ),
	);

	$preload_data = array_reduce( $preload_paths, 'rest_preload_api_request', array() );

	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
			wp_json_encode( $preload_data )
		),
		'after'
	);
}
