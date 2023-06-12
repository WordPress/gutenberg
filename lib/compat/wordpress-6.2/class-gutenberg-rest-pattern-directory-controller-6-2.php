<?php
/**
 * REST API: Gutenberg_REST_Pattern_Directory_Controller_6_2 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for block patterns from wordpress.org/patterns.
 */
class Gutenberg_REST_Pattern_Directory_Controller_6_2 extends WP_REST_Pattern_Directory_Controller {
	/**
	 * Search and retrieve block patterns metadata
	 *
	 * @since 5.8.0
	 * @since 6.0.0 Added 'slug' to request.
	 * @since 6.2.0 Added 'per_page', 'page', 'offset', 'order', and 'orderby' to request.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		/**
		 * Include an unmodified `$wp_version`, so the API can craft a response that's tailored to
		 * it. Some plugins modify the version in a misguided attempt to improve security by
		 * obscuring the version, which can cause invalid requests.
		 */
		require ABSPATH . WPINC . '/version.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$gutenberg_data = get_plugin_data( dirname( dirname( dirname( __DIR__ ) ) ) . '/gutenberg.php', false );

		$valid_query_args = array(
			'offset'   => true,
			'order'    => true,
			'orderby'  => true,
			'page'     => true,
			'per_page' => true,
			'search'   => true,
			'slug'     => true,
		);

		$query_args = array_intersect_key( $request->get_params(), $valid_query_args );

		$query_args['locale']             = get_user_locale();
		$query_args['wp-version']         = $wp_version; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- it's defined in `version.php` above.
		$query_args['gutenberg-version']  = $gutenberg_data['Version'];
		$query_args['pattern-categories'] = isset( $request['category'] ) ? $request['category'] : false;
		$query_args['pattern-keywords']   = isset( $request['keyword'] ) ? $request['keyword'] : false;

		$query_args = array_filter( $query_args );

		$transient_key = $this->get_transient_key( $query_args );

		/*
		 * Use network-wide transient to improve performance. The locale is the only site
		 * configuration that affects the response, and it's included in the transient key.
		 */
		$raw_patterns = get_site_transient( $transient_key );

		if ( ! $raw_patterns ) {
			$api_url = 'http://api.wordpress.org/patterns/1.0/?' . build_query( $query_args );
			if ( wp_http_supports( array( 'ssl' ) ) ) {
				$api_url = set_url_scheme( $api_url, 'https' );
			}

			/*
			 * Default to a short TTL, to mitigate cache stampedes on high-traffic sites.
			 * This assumes that most errors will be short-lived, e.g., packet loss that causes the
			 * first request to fail, but a follow-up one will succeed. The value should be high
			 * enough to avoid stampedes, but low enough to not interfere with users manually
			 * re-trying a failed request.
			 */
			$cache_ttl      = 5;
			$wporg_response = wp_remote_get( $api_url );
			$raw_patterns   = json_decode( wp_remote_retrieve_body( $wporg_response ) );

			if ( is_wp_error( $wporg_response ) ) {
				$raw_patterns = $wporg_response;

			} elseif ( ! is_array( $raw_patterns ) ) {
				// HTTP request succeeded, but response data is invalid.
				$raw_patterns = new WP_Error(
					'pattern_api_failed',
					sprintf(
						/* translators: %s: Support forums URL. */
						__( 'An unexpected error occurred. Something may be wrong with WordPress.org or this server&#8217;s configuration. If you continue to have problems, please try the <a href="%s">support forums</a>.', 'gutenberg' ),
						__( 'https://wordpress.org/support/forums/', 'gutenberg' )
					),
					array(
						'response' => wp_remote_retrieve_body( $wporg_response ),
					)
				);

			} else {
				// Response has valid data.
				$cache_ttl = HOUR_IN_SECONDS;
			}

			set_site_transient( $transient_key, $raw_patterns, $cache_ttl );
		}

		if ( is_wp_error( $raw_patterns ) ) {
			$raw_patterns->add_data( array( 'status' => 500 ) );

			return $raw_patterns;
		}

		$response = array();

		if ( $raw_patterns ) {
			foreach ( $raw_patterns as $pattern ) {
				$response[] = $this->prepare_response_for_collection(
					$this->prepare_item_for_response( $pattern, $request )
				);
			}
		}

		return new WP_REST_Response( $response );
	}
}
