<?php
/**
 * WP_REST_Menu_Custom_Items_Controller class.
 *
 * @package gutenberg
 */

/**
 * Class that returns the menu items added via the
 * `customize_nav_menu_available_items` filter.
 */
class WP_REST_Menu_Custom_Items_Controller extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'menu-custom-items';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_menu_custom_items' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read menu items if they have access to edit them.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permissions_check() {
		$post_type = get_post_type_object( 'nav_menu_item' );
		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error( 'rest_forbidden_context', __( 'Sorry, you are not allowed to view menu items.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}
		return true;
	}

	/**
	 * Retrieves the menu custom items' schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'menu-custom-items',
			'type'       => 'object',
			'properties' => array(

				'id'         => array(
					'description' => __( 'Unique identifier for the menu item.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'post-editor', 'site-editor', 'widgets-editor' ),
				),
				'title'      => array(
					'description' => __( 'Human-readable name identifying the menu item.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'post-editor', 'site-editor', 'widgets-editor' ),
				),
				'type_label' => array(
					'description' => __( 'Type of link.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'post-editor', 'site-editor', 'widgets-editor' ),
				),
				'url'        => array(
					'description' => __( 'URL of the link.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'post-editor', 'site-editor', 'widgets-editor' ),
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Returns the menu items added via the
	 * `customize_nav_menu_available_item_types` filter.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Menu custom items, or WP_Error if type could not be found.
	 */
	public function get_menu_custom_items( $request ) {
		$requested_type = $request->get_param( 'type' );
		$item_types     = apply_filters( 'customize_nav_menu_available_item_types', array() );

		if ( is_array( $item_types ) ) {
			foreach ( $item_types as $item_type ) {
				if ( $item_type['type'] === $requested_type ) {
					return $this->prepare_item_for_response( $item_type, $request );
				}
			}
		}

		return new WP_Error( 'rest_invalid_menu_item_type', __( 'This item type could not be found.', 'gutenberg' ), array( 'status' => 404 ) );
	}

	/**
	 * Prepares a menu list of items for serialization.
	 *
	 * @param stdClass        $item_type Item type data.
	 * @param WP_REST_Request $request   Full details about the request.
	 *
	 * @return WP_REST_Response List of menu items.
	 */
	public function prepare_item_for_response( $item_type, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return rest_ensure_response(
			apply_filters( 'customize_nav_menu_available_items', array(), $item_type['type'], $item_type['object'], 0 )
		);
	}
}
