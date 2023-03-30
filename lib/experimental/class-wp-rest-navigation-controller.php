<?php
/**
 * REST API: Gutenberg_REST_Navigation_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

require __DIR__ . '/class-wp-navigation-fallbacks-gutenberg.php';


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
			'/' . $this->rest_base . '/fallback',
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

	/**
	 * Checks if a given request has access to read fallbacks.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_fallbacks_permissions_check( $request ) {

		$post_type = get_post_type_object( $this->post_type );

		// Getting fallbacks also requires creating `wp_navigation` posts.
		if ( ! current_user_can( $post_type->cap->create_posts ) ) {
			return new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to create Navigation Menus as this user.', 'default' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// Getting fallbacks requires reading `wp_navigation` posts.
		return $this->check_has_read_only_access( $request, $post_type );
	}

	/**
	 * Gets the most appropriate fallback Navigation Menu.
	 *
	 * @return WP_Post|null the fallback Navigation Post or null.
	 */
	public function get_fallbacks() {
		// Todo - see if we can inject this dependency.
		return WP_Navigation_Fallbacks_Gutenberg::get_fallback_menu();
	}

	/**
	 * Checks whether the current user has read only access to the post type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @param WP_Post_Type    $post_type Post type object.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	protected function check_has_read_only_access( $request, $post_type ) {
		if ( current_user_can( 'edit_theme_options' ) ) {
			return true;
		}

		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		if ( 'edit' === $request['context'] && ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to edit Navigation Menus as this user.', 'default' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}
}
