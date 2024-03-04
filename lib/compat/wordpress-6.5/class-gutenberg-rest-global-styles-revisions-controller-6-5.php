<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Revisions_Controller class, inspired by WP_REST_Revisions_Controller.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.3.0
 */

/**
 * Core class used to access global styles revisions via the REST API.
 *
 * @since 6.3.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Global_Styles_Revisions_Controller_6_5 extends Gutenberg_REST_Global_Styles_Revisions_Controller_6_4 {
	/**
	 * Registers the controller's routes.
	 *
	 * @since 6.3.0
	 * @since 6.5.0 Adds route to fetch individual global styles revisions.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'   => array(
					'parent' => array(
						'description' => __( 'The ID for the parent of the global styles revision.' ),
						'type'        => 'integer',
					),
					'id'     => array(
						'description' => __( 'Unique identifier for the global styles revision.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
		parent::register_routes();
	}

	/**
	 * Retrieves one global styles revision from the collection.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$parent = $this->get_parent( $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}

		$revision = $this->get_revision( $request['id'] );
		if ( is_wp_error( $revision ) ) {
			return $revision;
		}

		if ( (int) $parent->ID !== (int) $revision->post_parent ) {
			return new WP_Error(
				'rest_revision_parent_id_mismatch',
				/* translators: %d: A post id. */
				sprintf( __( 'The revision does not belong to the specified parent with id of "%d"' ), $parent->ID ),
				array( 'status' => 404 )
			);
		}

		$response = $this->prepare_item_for_response( $revision, $request );
		return rest_ensure_response( $response );
	}

	/**
	 * Get the global styles revision, if the ID is valid.
	 *
	 * @since 6.5.0
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Post|WP_Error Revision post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_revision( $id ) {
		$error = new WP_Error(
			'rest_post_invalid_id',
			__( 'Invalid revision ID.' ),
			array( 'status' => 404 )
		);

		if ( (int) $id <= 0 ) {
			return $error;
		}

		$revision = get_post( (int) $id );
		if ( empty( $revision ) || empty( $revision->ID ) || 'revision' !== $revision->post_type ) {
			return $error;
		}

		return $revision;
	}
}
