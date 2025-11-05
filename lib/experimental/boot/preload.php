<?php
/**
 * Boot package REST API preloading.
 *
 * @package gutenberg
 */

/**
 * Preload REST API data for boot admin page.
 *
 * Manually implements preloading without block editor dependencies.
 */
function gutenberg_boot_preload_site_data() {
	// Define paths to preload - must match exact fields from entities.js
	$preload_paths = array(
		'/?_fields=description,gmt_offset,home,name,site_icon,site_icon_url,site_logo,timezone_string,url,page_for_posts,page_on_front,show_on_front',
		array( '/wp/v2/settings', 'OPTIONS' ),
	);

	// Use rest_preload_api_request to gather the preloaded data
	$preload_data = array_reduce(
		$preload_paths,
		'rest_preload_api_request',
		array()
	);

	// Register the preloading middleware with wp-api-fetch
	wp_add_inline_script(
		'wp-api-fetch',
		sprintf(
			'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
			wp_json_encode( $preload_data )
		),
		'after'
	);
}
add_action( 'gutenberg_boot_init', 'gutenberg_boot_preload_site_data', 5 );
