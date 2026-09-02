<?php
/**
 * Block pattern registration fixes for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Registers remote theme patterns on init so they are available on the front end.
 *
 * Remote theme patterns (from the Pattern Directory) were previously only registered
 * within the REST API endpoint (WP_REST_Block_Patterns_Controller::get_items()),
 * meaning they were available in the Site Editor but not on the front end when
 * referenced in template files via the pattern block.
 *
 * The core function _register_remote_theme_patterns() cannot be reused here because
 * it relies on rest_do_request(), which enforces the edit_posts permission check on
 * the Pattern Directory endpoint — causing it to silently fail for anonymous visitors.
 *
 * This function fetches patterns directly from the WordPress.org API, bypassing the
 * REST permission layer while sharing the same transient cache used by the REST
 * controller (WP_REST_Pattern_Directory_Controller).
 *
 * @since 7.2.0
 *
 * @see https://github.com/WordPress/gutenberg/issues/64104
 */
function gutenberg_register_remote_theme_patterns() {
	/** This filter is documented in wp-includes/block-patterns.php */
	if ( ! apply_filters( 'should_load_remote_block_patterns', true ) ) {
		return;
	}

	if ( ! wp_theme_has_theme_json() ) {
		return;
	}

	$pattern_settings = wp_get_theme_directory_pattern_slugs();
	if ( empty( $pattern_settings ) ) {
		return;
	}

	$patterns_registry = WP_Block_Patterns_Registry::get_instance();

	// Build query args matching the format used by WP_REST_Pattern_Directory_Controller.
	$query_args = array(
		'slug'       => $pattern_settings,
		'locale'     => get_user_locale(),
		'wp-version' => wp_get_wp_version(),
	);

	// Compute the transient key using the same logic as the REST controller
	// so that the cache is shared between the editor and the front end.
	$slugs = wp_parse_list( $query_args['slug'] );
	sort( $slugs );
	$cache_query_args         = $query_args;
	$cache_query_args['slug'] = $slugs;
	$transient_key            = 'wp_remote_block_patterns_' . md5( serialize( $cache_query_args ) );

	$raw_patterns = get_site_transient( $transient_key );

	if ( ! $raw_patterns ) {
		$api_url = 'http://api.wordpress.org/patterns/1.0/?' . build_query( $query_args );
		if ( wp_http_supports( array( 'ssl' ) ) ) {
			$api_url = set_url_scheme( $api_url, 'https' );
		}

		// Default to a short TTL to mitigate cache stampedes on high-traffic sites.
		$cache_ttl      = 5;
		$wporg_response = wp_remote_get( $api_url );
		$raw_patterns   = json_decode( wp_remote_retrieve_body( $wporg_response ) );

		if ( is_wp_error( $wporg_response ) ) {
			$raw_patterns = $wporg_response;
		} elseif ( ! is_array( $raw_patterns ) ) {
			$raw_patterns = new WP_Error(
				'pattern_api_failed',
				sprintf(
					/* translators: %s: Support forums URL. */
					__( 'An unexpected error occurred. Something may be wrong with WordPress.org or this server&#8217;s configuration. If you continue to have problems, please try the <a href="%s">support forums</a>.', 'gutenberg' ),
					__( 'https://wordpress.org/support/forums/', 'gutenberg' )
				)
			);
		} else {
			$cache_ttl = HOUR_IN_SECONDS;
		}

		set_site_transient( $transient_key, $raw_patterns, $cache_ttl );
	}

	if ( is_wp_error( $raw_patterns ) ) {
		return;
	}

	foreach ( $raw_patterns as $raw_pattern ) {
		// Transform from the raw API response format to the format expected
		// by wp_normalize_remote_block_pattern(), matching the sanitization
		// performed by WP_REST_Pattern_Directory_Controller::prepare_item_for_response().
		$pattern = array(
			'title'          => sanitize_text_field( $raw_pattern->title->rendered ),
			'content'        => wp_kses_post( $raw_pattern->pattern_content ),
			'categories'     => array_map( 'sanitize_title', $raw_pattern->category_slugs ),
			'keywords'       => array_map( 'sanitize_text_field', explode( ',', $raw_pattern->meta->wpop_keywords ) ),
			'description'    => sanitize_text_field( $raw_pattern->meta->wpop_description ),
			'viewport_width' => absint( $raw_pattern->meta->wpop_viewport_width ),
			'block_types'    => array_map( 'sanitize_text_field', $raw_pattern->meta->wpop_block_types ),
			'source'         => 'pattern-directory/theme',
		);

		$normalized_pattern = wp_normalize_remote_block_pattern( $pattern );
		$pattern_name       = sanitize_title( $normalized_pattern['title'] );

		// Some patterns might be already registered as core patterns with the `core` prefix.
		$is_registered = $patterns_registry->is_registered( $pattern_name ) || $patterns_registry->is_registered( "core/$pattern_name" );
		if ( ! $is_registered ) {
			register_block_pattern( $pattern_name, $normalized_pattern );
		}
	}
}
add_action( 'init', 'gutenberg_register_remote_theme_patterns' );
