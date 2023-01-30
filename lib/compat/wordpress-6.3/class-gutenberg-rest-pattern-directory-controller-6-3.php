<?php
/**
 * REST API: Gutenberg_REST_Pattern_Directory_Controller_6_3 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for block patterns from wordpress.org/patterns.
 */
class Gutenberg_REST_Pattern_Directory_Controller_6_3 extends Gutenberg_REST_Pattern_Directory_Controller_6_2 {
	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 5.8.0
	 * @since 6.3.0 Added pattern directory categories endpoint.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/categories',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_pattern_categories' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		parent::register_routes();
	}

	/**
	 * Retrieve block patterns categories.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_pattern_categories( $request ) {
		$query_args    = array( 'locale' => get_user_locale() );
		$transient_key = 'wp_remote_block_pattern_categories_' . md5( serialize( $query_args ) );

		/**
		 * Use network-wide transient to improve performance. The locale is the only site
		 * configuration that affects the response, and it's included in the transient key.
		 */
		$raw_pattern_categories = get_site_transient( $transient_key );

		if ( ! $raw_pattern_categories ) {
			$api_url = 'http://api.wordpress.org/patterns/1.0/?categories&' . build_query( $query_args );
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
			$cache_ttl              = 5;
			$wporg_response         = wp_remote_get( $api_url );
			$raw_pattern_categories = json_decode( wp_remote_retrieve_body( $wporg_response ) );
			if ( is_wp_error( $wporg_response ) ) {
				$raw_pattern_categories = $wporg_response;

			} elseif ( ! is_array( $raw_pattern_categories ) ) {
				// HTTP request succeeded, but response data is invalid.
				$raw_pattern_categories = new WP_Error(
					'pattern_directory_api_failed',
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

			set_site_transient( $transient_key, $raw_pattern_categories, $cache_ttl );
		}

		if ( is_wp_error( $raw_pattern_categories ) ) {
			$raw_pattern_categories->add_data( array( 'status' => 500 ) );

			return $raw_pattern_categories;
		}

		$response = array();

		if ( $raw_pattern_categories ) {
			foreach ( $raw_pattern_categories as $category ) {
				$response[] = $this->prepare_response_for_collection(
					$this->prepare_pattern_category_for_response( $category, $request )
				);
			}
		}

		return new WP_REST_Response( $response );
	}

	/**
	 * Prepare a raw block pattern category before it gets output in a REST API response.
	 *
	 * @since 6.3.0
	 *
	 * @param object          $item    Raw pattern category from api.wordpress.org, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function prepare_pattern_category_for_response( $item, $request ) {
		$raw_pattern_category = array(
			'id'   => absint( $item->id ),
			'name' => sanitize_text_field( $item->name ),
			'slug' => sanitize_title_with_dashes( $item->slug ),
		);

		$prepared_pattern_category = $this->add_additional_fields_to_object( $raw_pattern_category, $request );

		return new WP_REST_Response( $prepared_pattern_category );
	}
}
