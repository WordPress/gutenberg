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
		return $this->block_core_navigation_create_fallback();
	}

	private function block_core_navigation_create_fallback() {

		$should_skip = apply_filters( 'block_core_navigation_skip_fallback', false );

		if ( $should_skip ) {
			return;
		}

		// Get the most recently published Navigation post.
		$navigation_post = block_core_navigation_get_most_recently_published_navigation();

		// If there are no navigation posts then try to find a classic menu
		// and convert it into a block based navigation menu.
		if ( ! $navigation_post ) {
			$navigation_post = block_core_navigation_maybe_use_classic_menu_fallback();
		}

		// If there are no navigation posts then default to a list of Pages.
		if ( ! $navigation_post ) {
			// $navigation_post = block_core_navigation_get_default_fallback();
			$navigation_post = new WP_Post(
				(object) array(
					'post_title'   => 'Default Fallback',
					'post_content' => 'Default Fallback',
					'post_type'    => `wp_navigation`,
				)
			);
		}

		return $navigation_post;
	}






}
