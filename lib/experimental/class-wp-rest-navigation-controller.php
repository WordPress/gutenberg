<?php
/**
 * REST API: Gutenberg_REST_Navigation_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class WP_REST_Navigation_Controller extends WP_REST_Posts_Controller {

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {

		parent::register_routes();

		// Lists a single nav item based on the given id or slug.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/fallbacks',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fallbacks' ),
					'permission_callback' => array( $this, 'get_fallbacks_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::READABLE ),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_fallbacks_permissions_check( $request ) {
		return true;
	}



	public function get_fallbacks() {

		$should_skip = apply_filters( 'block_core_navigation_skip_fallback', false );

		if ( $should_skip ) {
			return array();
		}

		// Get the most recently published Navigation post.
		$navigation_post = gutenberg_block_core_navigation_get_most_recently_published_navigation();

		// If there are no navigation posts then try to find a classic menu
		// and convert it into a block based navigation menu.
		if ( ! $navigation_post ) {
			$navigation_post = gutenberg_block_core_navigation_maybe_use_classic_menu_fallback();
		}

		// If there are no navigation posts then default to a list of Pages.
		if ( ! $navigation_post ) {
			$navigation_post = static::create_default_fallback();
		}

		// If we could not create a fallback then return an error indicating thus.
		// TODO: include data on the reason for failure in this error.
		if ( is_wp_error( $navigation_post ) ) {
			return new WP_Error( 'no_fallback', __( 'Could not create a fallback navigation menu.' ) );
		}

		// We have to fetch the Post by ID
		return get_post( $navigation_post );
	}

	private static function create_default_fallback() {
		$registry = WP_Block_Type_Registry::get_instance();

		// If `core/page-list` is not registered then use empty blocks.
		$default_blocks = $registry->is_registered( 'core/page-list' ) ? '<!-- wp:page-list /-->' : '';
		// Create a new navigation menu from the fallback blocks.

		$wp_insert_post_result = wp_insert_post(
			array(
				'post_content' => $default_blocks,
				'post_title'   => _x( 'Navigation', 'Title of a Navigation menu', 'gutenberg' ),
				'post_name'    => 'navigation',
				'post_status'  => 'publish',
				'post_type'    => 'wp_navigation',
			),
			true // So that we can check whether the result is an error.
		);

		return $wp_insert_post_result;
	}

}
