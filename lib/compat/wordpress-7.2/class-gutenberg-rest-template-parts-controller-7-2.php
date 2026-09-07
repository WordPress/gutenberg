<?php
/**
 * REST API: Gutenberg_REST_Template_Parts_Controller_7_2 class.
 *
 * @package gutenberg
 */

/**
 * Serves `/wp/v2/template-parts` now that template parts are registered
 * patterns: reads come from the parts' patterns and customizations through
 * `get_block_template(s)()`, and writes go to the customization, a `wp_block`
 * post, instead of a `wp_template_part` post.
 *
 * Note: there are no changes in this class that need to be backported to
 * core as is; it stands in for the template parts route while parts are
 * patterns in the plugin only.
 */
class Gutenberg_REST_Template_Parts_Controller_7_2 extends Gutenberg_REST_Templates_Controller_7_2 {
	/**
	 * Updates a template part: writes its customization, creating it on the
	 * first edit, or removes it when reverting to the theme version.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$template = get_block_template( $request['id'], $this->post_type );
		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}
		list( $theme, $slug ) = explode( '//', $template->id, 2 );

		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			$copy = gutenberg_get_template_part_customization( $theme, $slug );
			if ( $copy ) {
				wp_trash_post( $copy->ID );
			}
			$request->set_param( 'context', 'edit' );
			$template = get_block_template( $request['id'], $this->post_type );
			return rest_ensure_response( $this->prepare_item_for_response( $template, $request ) );
		}

		$fields = $this->get_customization_fields( $request );
		if ( is_wp_error( $fields ) ) {
			return $fields;
		}
		$result = gutenberg_save_template_part( $theme, $slug, $fields );
		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 'db_update_error' === $result->get_error_code() ? 500 : 400 ) );
			return $result;
		}

		$template      = get_block_template( $request['id'], $this->post_type );
		$fields_update = $this->update_additional_fields_for_object( $template, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}
		$request->set_param( 'context', 'edit' );
		return rest_ensure_response( $this->prepare_item_for_response( $template, $request ) );
	}

	/**
	 * Creates a template part: a user pattern filed under the part's area,
	 * referenced by its slug.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$theme  = $request['theme'] ?? get_stylesheet();
		$slug   = gutenberg_get_unique_template_part_slug( $theme, sanitize_title( $request['slug'] ) );
		$fields = $this->get_customization_fields( $request );
		if ( is_wp_error( $fields ) ) {
			return $fields;
		}
		$fields = wp_parse_args(
			$fields,
			array(
				'title'   => $slug,
				'content' => '',
			)
		);
		$result = gutenberg_save_template_part( $theme, $slug, $fields );
		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 'db_insert_error' === $result->get_error_code() ? 500 : 400 ) );
			return $result;
		}

		$template = get_block_template( $theme . '//' . $slug, $this->post_type );
		if ( ! $template ) {
			return new WP_Error( 'rest_template_insert_error', __( 'No templates exist with that id.', 'gutenberg' ), array( 'status' => 400 ) );
		}
		$fields_update = $this->update_additional_fields_for_object( $template, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}
		$request->set_param( 'context', 'edit' );
		$response = rest_ensure_response( $this->prepare_item_for_response( $template, $request ) );
		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $template->id ) ) );
		return $response;
	}

	/**
	 * Deletes a template part: trashes (or force-deletes) its customization.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$template = get_block_template( $request['id'], $this->post_type );
		if ( ! $template ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}
		if ( 'custom' !== $template->source ) {
			return new WP_Error( 'rest_invalid_template', __( 'Templates based on theme files can\'t be removed.', 'gutenberg' ), array( 'status' => 400 ) );
		}
		$request->set_param( 'context', 'edit' );

		if ( (bool) $request['force'] ) {
			$previous = $this->prepare_item_for_response( $template, $request );
			$result   = wp_delete_post( $template->wp_id, true );
			$response = new WP_REST_Response();
			$response->set_data(
				array(
					'deleted'  => true,
					'previous' => $previous->get_data(),
				)
			);
		} else {
			$result           = wp_trash_post( $template->wp_id );
			$template->status = 'trash';
			$response         = $this->prepare_item_for_response( $template, $request );
		}
		if ( ! $result ) {
			return new WP_Error( 'rest_cannot_delete', __( 'The template cannot be deleted.', 'gutenberg' ), array( 'status' => 500 ) );
		}
		return $response;
	}

	/**
	 * Reads the customization fields off a request.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error Fields for `gutenberg_save_template_part()`, or an error.
	 */
	private function get_customization_fields( $request ) {
		$fields = array();
		if ( isset( $request['content'] ) ) {
			if ( is_string( $request['content'] ) ) {
				$fields['content'] = $request['content'];
			} elseif ( isset( $request['content']['raw'] ) ) {
				$fields['content'] = $request['content']['raw'];
			}
		}
		if ( isset( $request['title'] ) ) {
			if ( is_string( $request['title'] ) ) {
				$fields['title'] = $request['title'];
			} elseif ( ! empty( $request['title']['raw'] ) ) {
				$fields['title'] = $request['title']['raw'];
			}
		}
		if ( isset( $request['description'] ) ) {
			$fields['description'] = $request['description'];
		}
		if ( isset( $request['area'] ) ) {
			$fields['area'] = $request['area'];
		}
		if ( ! empty( $request['author'] ) ) {
			$author = (int) $request['author'];
			if ( get_current_user_id() !== $author && ! get_userdata( $author ) ) {
				return new WP_Error( 'rest_invalid_author', __( 'Invalid author ID.', 'gutenberg' ), array( 'status' => 400 ) );
			}
			$fields['author'] = $author;
		}
		return $fields;
	}
}
