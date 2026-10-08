<?php

/**
 * Core class used to access templates via the REST API before WordPress 7.2.
 *
 * Extends the templates collection with post-specific choices.
 *
 * This class extension also prevents a fatal error when a `null` template
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
	 * Adds the post ID and edited slug to template collection queries.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();
		if ( 'wp_template' === $this->post_type ) {
			$params['post_id'] = array(
				'description'       => __( 'ID of the post to get available templates for.', 'gutenberg' ),
				'type'              => 'integer',
				'minimum'           => 1,
				'validate_callback' => static function ( $value, $request, $param ) {
					$valid = rest_validate_request_arg( $value, $request, $param );
					if ( is_wp_error( $valid ) ) {
						return $valid;
					}
					$post = get_post( (int) $value );
					if ( ! $post || $post->post_type !== $request['post_type'] ) {
						return new WP_Error( 'rest_invalid_param', __( 'Provide a post ID that matches the requested post type.', 'gutenberg' ) );
					}
					return true;
				},
			);
			$params['slug']    = array(
				'description'       => __( 'Slug of the post to get available templates for.', 'gutenberg' ),
				'type'              => 'string',
				'sanitize_callback' => static function ( $value ) {
					return sanitize_title( $value );
				},
				'validate_callback' => static function ( $value, $request, $param ) {
					$valid = rest_validate_request_arg( $value, $request, $param );
					if ( is_wp_error( $valid ) ) {
						return $valid;
					}
					if ( '' !== sanitize_title( $value ) && ! isset( $request['post_type'] ) ) {
						return new WP_Error( 'rest_invalid_param', __( 'Provide post_type when requesting templates for a post slug.', 'gutenberg' ) );
					}
					return true;
				},
			);
		}
		return $params;
	}

	/**
	 * Retrieves template choices for a post type and edited slug.
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		if ( 'wp_template' !== $this->post_type || ! isset( $request['post_type'] ) || $request->is_method( 'HEAD' ) ) {
			return parent::get_items( $request );
		}

		$query = array(
			// An omitted slug asks for the generic default template.
			'slug'      => isset( $request['slug'] ) ? $request['slug'] : '',
			'post_type' => $request['post_type'],
		);
		if ( isset( $request['post_id'] ) ) {
			$query['post_id'] = $request['post_id'];
		}
		if ( isset( $request['wp_id'] ) ) {
			$query['wp_id'] = $request['wp_id'];
		}
		$items     = get_block_templates( $query, $this->post_type );
		$templates = array();
		foreach ( is_array( $items ) ? $items : array() as $template ) {
			if (
				! $template instanceof WP_Block_Template ||
				! is_string( $template->id ) ||
				'' === $template->id
			) {
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
