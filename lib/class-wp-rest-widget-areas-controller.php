<?php
/**
 * Start: Include for phase 2
 * Widget Areas REST API: WP_REST_Widget_Areas_Controller class
 *
 * @package gutenberg
 * @since 5.7.0
 */

/**
 * Controller which provides REST endpoint for the widget areas.
 *
 * @since 5.2.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Widget_Areas_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'widget-areas';
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
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		$id_argument = array(
			'description'       => __( 'The sidebar’s ID.', 'gutenberg' ),
			'type'              => 'string',
			'required'          => true,
			'validate_callback' => 'Experimental_WP_Widget_Blocks_Manager::is_valid_sidabar_id',
		);

		$content_argument = array(
			'description' => __( 'Sidebar content.', 'gutenberg' ),
			'type'        => 'string',
			'required'    => true,
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>.+)',
			array(
				'args'   => array(
					'id' => $id_argument,
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'id'      => $id_argument,
						'content' => $content_argument,
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read widget areas.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_user_cannot_view',
				__( 'Sorry, you are not allowed to read sidebars.', 'gutenberg' )
			);
		}

		return true;
	}

	/**
	 * Retrieves all widget areas.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		global $wp_registered_sidebars;

		$data = array();

		foreach ( array_keys( $wp_registered_sidebars ) as $sidebar_id ) {
			$data[ $sidebar_id ] = $this->get_sidebar_data( $sidebar_id );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves a specific widget area.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		return rest_ensure_response( $this->get_sidebar_data( $request['id'] ) );
	}

	/**
	 * Checks if a given REST request has access to update a widget area.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has access to update the item, error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_user_cannot_edit',
				__( 'Sorry, you are not allowed to edit sidebars.', 'gutenberg' )
			);
		}

		return true;
	}

	/**
	 * Updates a single widget area.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$sidebar_id      = $request->get_param( 'id' );
		$sidebar_content = $request->get_param( 'content' );

		$id_referenced_in_sidebar = Experimental_WP_Widget_Blocks_Manager::get_post_id_referenced_in_sidebar( $sidebar_id );

		$post_id = wp_insert_post(
			array(
				'ID'           => $id_referenced_in_sidebar,
				'post_content' => $sidebar_content,
				'post_type'    => 'wp_area',
			)
		);

		if ( 0 === $id_referenced_in_sidebar ) {
			Experimental_WP_Widget_Blocks_Manager::reference_post_id_in_sidebar( $sidebar_id, $post_id );
		}

		return rest_ensure_response( $this->get_sidebar_data( $request['id'] ) );
	}

	/**
	 * Returns the sidebar data together with a content array containing the blocks present in the sidebar.
	 * The bocks may be legacy widget blocks representing the widgets currently present in the sidebar, or the content of a wp_area post that the sidebar references.
	 *
	 * @since 5.7.0
	 *
	 * @param string $sidebar_id Indentifier of the sidebar.
	 * @return object Sidebar data with a content array.
	 */
	protected function get_sidebar_data( $sidebar_id ) {
		$content_string = '';

		$post_id_referenced_in_sidebar = Experimental_WP_Widget_Blocks_Manager::get_post_id_referenced_in_sidebar( $sidebar_id );

		if ( 0 !== $post_id_referenced_in_sidebar ) {
			$post           = get_post( $post_id_referenced_in_sidebar );
			$content_string = $post->post_content;
		} else {
			$blocks         = Experimental_WP_Widget_Blocks_Manager::get_sidebar_as_blocks( $sidebar_id );
			$content_string = Experimental_WP_Widget_Blocks_Manager::serialize_blocks( $blocks );
		}

		return array_merge(
			Experimental_WP_Widget_Blocks_Manager::get_wp_registered_sidebars_sidebar( $sidebar_id ),
			array(
				'content' => array(
					'raw'           => $content_string,
					'rendered'      => apply_filters( 'the_content', $content_string ),
					'block_version' => block_version( $content_string ),
				),
			)
		);
	}
}
