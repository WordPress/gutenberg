<?php
/**
 * Content Guidelines Revisions REST API Controller.
 *
 * Extends WP_REST_Revisions_Controller to inherit standard WordPress revision
 * list/get behavior and adds guideline_categories to responses + a restore endpoint.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * REST API controller for Content Guidelines revisions.
 */
class Gutenberg_Content_Guidelines_Revisions_Controller extends WP_REST_Revisions_Controller {

	/**
	 * Registers the routes for content guideline revisions.
	 *
	 * Calls parent to register standard list + single revision routes,
	 * then adds a custom restore endpoint.
	 */
	public function register_routes() {
		parent::register_routes();

		// Register restore revision route.
		register_rest_route(
			$this->namespace,
			'/' . $this->parent_base . '/(?P<parent>[\d]+)/' . $this->rest_base . '/(?P<id>[\d]+)/restore',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'restore_revision' ),
					'permission_callback' => array( $this, 'restore_revision_permissions_check' ),
					'args'                => array(
						'parent' => array(
							'description' => __( 'The ID for the parent of the revision.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'id'     => array(
							'description' => __( 'Unique identifier for the revision to restore.', 'gutenberg' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Prepares the revision for the REST response.
	 *
	 * Adds guideline_categories from revision meta to the standard revision response.
	 *
	 * @param WP_Post         $item    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'guideline_categories', $fields ) ) {
			$data                         = $response->get_data();
			$guideline_categories         = Gutenberg_Content_Guidelines_Post_Type::get_guideline_categories_from_meta( $item->ID );
			$data['guideline_categories'] = ! empty( $guideline_categories ) ? $guideline_categories : new stdClass();
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Retrieves the revision's schema, conforming to JSON Schema.
	 *
	 * Adds guideline_categories to the standard revision schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['guideline_categories'] = array(
			'description' => __( 'The guideline categories and their content.', 'gutenberg' ),
			'type'        => 'object',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
		);

		return $schema;
	}

	/**
	 * Checks if a given request has access to restore a revision.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error object otherwise.
	 */
	public function restore_revision_permissions_check( $request ) {
		$parent = get_post( $request['parent'] );
		if ( ! $parent || $this->parent_post_type !== $parent->post_type ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$post_type = get_post_type_object( $this->parent_post_type );
		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new WP_Error(
				'rest_cannot_restore',
				__( 'Sorry, you are not allowed to restore revisions.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Restores a revision to the main guidelines post.
	 *
	 * Uses WordPress's native wp_restore_post_revision() which restores all
	 * revision fields, sets _edit_last meta, fires hooks, and creates a new
	 * revision for audit trail.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function restore_revision( $request ) {
		$parent = get_post( $request['parent'] );
		if ( ! $parent || $this->parent_post_type !== $parent->post_type ) {
			return new WP_Error(
				'rest_post_not_found',
				__( 'Content guidelines not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$revision = get_post( $request['id'] );
		if ( ! $revision || 'revision' !== $revision->post_type || (int) $revision->post_parent !== (int) $parent->ID ) {
			return new WP_Error(
				'rest_revision_not_found',
				__( 'Revision not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$result = wp_restore_post_revision( $revision->ID );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error(
				'rest_cannot_restore',
				__( 'Could not restore revision.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		// Return the updated parent post data.
		$post                 = get_post( $parent->ID );
		$guideline_categories = Gutenberg_Content_Guidelines_Post_Type::get_guideline_categories_from_meta( $post->ID );

		return rest_ensure_response(
			array(
				'id'                   => $post->ID,
				'status'               => 'publish' === $post->post_status ? 'published' : 'draft',
				'guideline_categories' => ! empty( $guideline_categories ) ? $guideline_categories : new stdClass(),
				'date'                 => mysql_to_rfc3339( $post->post_date ),
				'date_gmt'             => mysql_to_rfc3339( $post->post_date_gmt ),
				'modified'             => mysql_to_rfc3339( $post->post_modified ),
				'modified_gmt'         => mysql_to_rfc3339( $post->post_modified_gmt ),
			)
		);
	}
}
