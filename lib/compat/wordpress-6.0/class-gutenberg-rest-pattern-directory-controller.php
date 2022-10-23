<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for block patterns.
 */
class Gutenberg_REST_Pattern_Directory_Controller extends WP_REST_Pattern_Directory_Controller {
	/**
	 * Search and retrieve block patterns metadata
	 *
	 * @since 6.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
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

		$query_args = array(
			'locale'            => get_user_locale(),
			'wp-version'        => $wp_version, // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- it's defined in `version.php` above.
			'gutenberg-version' => $gutenberg_data['Version'],
		);

		$category_id = $request['category'];
		$keyword_id  = $request['keyword'];
		$search_term = $request['search'];
		$slug        = $request['slug'];

		if ( $category_id ) {
			$query_args['pattern-categories'] = $category_id;
		}

		if ( $keyword_id ) {
			$query_args['pattern-keywords'] = $keyword_id;
		}

		if ( $search_term ) {
			$query_args['search'] = $search_term;
		}

		if ( $slug ) {
			$query_args['slug'] = $slug;
		}

		$transient_key = $this->get_transient_key( $query_args );

		/**
		 * Use network-wide transient to improve performance. The locale is the only site
		 * configuration that affects the response, and it's included in the transient key.
		 */
		$raw_patterns = get_site_transient( $transient_key );

		if ( ! $raw_patterns ) {
			$api_url = 'http://api.wordpress.org/patterns/1.0/?' . build_query( $query_args );
			if ( wp_http_supports( array( 'ssl' ) ) ) {
				$api_url = set_url_scheme( $api_url, 'https' );
			}

			/**
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

	/**
	 * Include a hash of the query args, so that different requests are stored in
	 * separate caches.
	 *
	 * MD5 is chosen for its speed, low-collision rate, universal availability, and to stay
	 * under the character limit for `_site_transient_timeout_{...}` keys.
	 *
	 * @link https://stackoverflow.com/questions/3665247/fastest-hash-for-non-cryptographic-uses
	 *
	 * @since 6.0.0
	 * @todo This should be removed when the minimum required WordPress version is >= 6.0.
	 *
	 * @param array $query_args Query arguments to generate a transient key from.
	 * @return string Transient key.
	 */
	protected function get_transient_key( $query_args ) {
		if ( method_exists( get_parent_class( $this ), __FUNCTION__ ) ) {
			return parent::get_transient_key( $query_args );
		}

		if ( isset( $query_args['slug'] ) ) {
			// This is an additional precaution because the "sort" function expects an array.
			$query_args['slug'] = wp_parse_list( $query_args['slug'] );

			// Empty arrays should not affect the transient key.
			if ( empty( $query_args['slug'] ) ) {
				unset( $query_args['slug'] );
			} else {
				// Sort the array so that the transient key doesn't depend on the order of slugs.
				sort( $query_args['slug'] );
			}
		}

		return 'wp_remote_block_patterns_' . md5( serialize( $query_args ) );
	}
}
