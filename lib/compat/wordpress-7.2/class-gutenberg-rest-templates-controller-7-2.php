<?php

/**
 * Core class used to access templates via the REST API before WordPress 7.2.
 *
 * This class extension exists to prevent a fatal error when a `null` template
 * reaches `prepare_item_for_response`, which reads and assigns properties on
 * it. Core's `update_item` can pass `null` there from either of its two
 * unchecked `get_block_template()` refetches: after writing an update, and on
 * its "revert to theme" path, which force-deletes the template's post before
 * checking that a theme or plugin version of the template exists.
 *
 *
 * @see WP_REST_Templates_Controller
 */
class Gutenberg_REST_Templates_Controller_7_2 extends WP_REST_Templates_Controller {
	/**
	 * Retrieves the query parameters for the templates collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();
		if ( 'wp_template' === $this->post_type ) {
			$params['post_id'] = array(
				'description'       => __( 'Post to get the available templates for.', 'gutenberg' ),
				'type'              => 'integer',
				'minimum'           => 1,
				'validate_callback' => static function ( $value, $request, $param ) {
					$valid = rest_validate_request_arg( $value, $request, $param );
					if ( is_wp_error( $valid ) ) {
						return $valid;
					}
					if ( isset( $request['post_type'] ) ) {
						return new WP_Error(
							'rest_invalid_param',
							__( 'Use either post_id or post_type, not both.', 'gutenberg' )
						);
					}
					return true;
				},
			);
		}
		return $params;
	}

	/**
	 * Checks access to the post whose templates are requested.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if access is allowed, or an error otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$permission = parent::get_items_permissions_check( $request );
		if ( is_wp_error( $permission ) || 'wp_template' !== $this->post_type || ! isset( $request['post_id'] ) ) {
			return $permission;
		}

		$post = get_post( $request['post_id'] );
		if ( ! $post ) {
			return new WP_Error( 'rest_post_invalid_id', __( 'Invalid post ID.' ), array( 'status' => 404 ) );
		}
		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error(
				'rest_cannot_edit',
				__( 'Sorry, you are not allowed to edit this post.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * Returns the complete, ordered list of templates available to a post.
	 *
	 * The first template is the default. A single result determines the effective
	 * template, independently of the post's saved assignment.
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		if ( 'wp_template' !== $this->post_type || ! isset( $request['post_id'] ) || $request->is_method( 'HEAD' ) ) {
			return parent::get_items( $request );
		}

		$query = array(
			'post_id' => $request['post_id'],
		);
		if ( isset( $request['wp_id'] ) ) {
			$query['wp_id'] = $request['wp_id'];
		}
		$items = get_block_templates( $query, $this->post_type );

		if ( ! is_array( $items ) ) {
			$items = array();
		}

		$templates = array();
		foreach ( $items as $template ) {
			if ( ! $template instanceof WP_Block_Template || ! is_string( $template->id ) || '' === $template->id || ( isset( $request['wp_id'] ) && (int) $template->wp_id !== $request['wp_id'] ) ) {
				continue;
			}
			$data                       = $this->prepare_item_for_response( $template, $request );
			$templates[ $template->id ] = $this->prepare_response_for_collection( $data );
		}
		return rest_ensure_response( array_values( $templates ) );
	}

	/**
	 * Prepares a single template output for response.
	 *
	 * @since 5.8.0
	 * @since 7.2.0 Answers with an error response instead of a fatal error
	 *              when the template is `null`.
	 *
	 * @param WP_Block_Template|null $item    Template instance.
	 * @param WP_REST_Request        $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error when the template is `null`.
	 */
	public function prepare_item_for_response( $item, $request ) {
		//////////////////////////////
		// START CORE MODIFICATIONS //
		//////////////////////////////
		/*
		 * Core's `update_item` passes its `get_block_template()` refetches
		 * here unchecked, both after writing an update and after deleting
		 * the post on its revert path. Reading `$item->content` on `null`
		 * is a fatal error, so answer with an error response instead.
		 */
		if ( ! $item ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}
		//////////////////////////////
		// END CORE MODIFICATIONS //
		//////////////////////////////

		return parent::prepare_item_for_response( $item, $request );
	}
}
