<?php
/**
 * REST API: Gutenberg_REST_Revisions_Controller_7_2 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoint for revisions.
 *
 * This extends Gutenberg_REST_Revisions_Controller to supply the revision
 * author's display name and avatar URLs alongside the numeric `author` field,
 * mirroring WP_REST_Comments_Controller.
 *
 * A client can then render a revision's author without a follow-up request to
 * `/wp/v2/users/<id>`. That request is made in the `edit` context, which
 * WP_REST_Users_Controller::get_item_permissions_check() refuses for anyone
 * who cannot `edit_user` the target, so every non-administrator received a
 * 403 and no author name.
 *
 * @since 7.2.0
 *
 * @see Gutenberg_REST_Revisions_Controller
 * @see WP_REST_Comments_Controller
 */
class Gutenberg_REST_Revisions_Controller_7_2 extends Gutenberg_REST_Revisions_Controller {

	/**
	 * Prepares the revision for the REST response.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Post         $item    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		// The parent does not prepare a response body for HEAD requests.
		if ( $request->is_method( 'HEAD' ) ) {
			return $response;
		}

		$fields = $this->get_fields_for_response( $request );
		$schema = $this->get_item_schema();
		$data   = $response->get_data();

		if ( in_array( 'author_name', $fields, true ) ) {
			$author              = get_userdata( $item->post_author );
			$data['author_name'] = $author ? $author->display_name : '';
		}

		// The schema only declares author_avatar_urls when avatars are enabled.
		if ( ! empty( $schema['properties']['author_avatar_urls'] ) && in_array( 'author_avatar_urls', $fields, true ) ) {
			$data['author_avatar_urls'] = rest_get_avatar_urls( (int) $item->post_author );
		}

		$response->set_data( $data );

		return $response;
	}

	/**
	 * Retrieves the revision's schema, conforming to JSON Schema.
	 *
	 * Adds `author_name` and `author_avatar_urls` alongside the existing numeric
	 * `author` field, mirroring WP_REST_Comments_Controller.
	 *
	 * @since 7.2.0
	 *
	 * @see WP_REST_Comments_Controller::get_item_schema()
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		// Populates $this->schema with the core revision schema.
		parent::get_item_schema();

		$this->schema['properties']['author_name'] = array(
			'description' => __( 'Display name for the revision author.', 'gutenberg' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		if ( get_option( 'show_avatars' ) ) {
			$avatar_properties = array();

			foreach ( rest_get_avatar_sizes() as $size ) {
				$avatar_properties[ $size ] = array(
					/* translators: %d: Avatar image size in pixels. */
					'description' => sprintf( __( 'Avatar URL with image size of %d pixels.', 'gutenberg' ), $size ),
					'type'        => 'string',
					'format'      => 'uri',
					'context'     => array( 'view', 'edit', 'embed' ),
				);
			}

			$this->schema['properties']['author_avatar_urls'] = array(
				'description' => __( 'Avatar URLs for the revision author.', 'gutenberg' ),
				'type'        => 'object',
				'context'     => array( 'view', 'edit', 'embed' ),
				'readonly'    => true,
				'properties'  => $avatar_properties,
			);
		}

		return $this->add_additional_fields_schema( $this->schema );
	}
}
