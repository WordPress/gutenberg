<?php
/**
 * REST API: Gutenberg_REST_Attachments_Controller_7_2 class
 *
 * @package gutenberg
 */

/**
 * Adds a `resize` image modifier to the attachment `/edit` endpoint.
 *
 * Core's `edit_media_item()` understands three modifiers — `flip`, `rotate`
 * and `crop`. There is no way to change the pixel dimensions of the saved
 * image, which is what the classic Edit Image screen's "Scale Image" panel
 * does. This class adds a fourth modifier that calls
 * `WP_Image_Editor::resize()`.
 *
 * Core offers no hook inside the modifier loop, so `edit_media_item()` is
 * copied here in full and one `case` is added to the switch. Requests that
 * carry no `resize` modifier are handed straight back to core, so the copied
 * body only runs for the new feature.
 *
 * Both of Gutenberg's attachment controllers extend this class, because which
 * one serves the route depends on whether client-side media processing is
 * enabled. See `lib/media/load.php` and `lib/compat/wordpress-7.1/rest-api.php`.
 *
 * @since 7.2.0
 *
 * @see WP_REST_Attachments_Controller
 */
class Gutenberg_REST_Attachments_Controller_7_2 extends WP_REST_Attachments_Controller {

	/**
	 * Applies edits to a media item and creates a new attachment record.
	 *
	 * Identical to the parent implementation apart from the `resize` case in
	 * the modifier loop. Modifiers are applied in the order they arrive, so a
	 * client that wants to scale before cropping sends `resize` first. Because
	 * core expresses crop arguments as percentages, a preceding resize does not
	 * change where a crop lands.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function edit_media_item( $request ) {
		// Nothing to add for the existing modifiers — let core handle it.
		if ( ! $this->has_resize_modifier( $request ) ) {
			return parent::edit_media_item( $request );
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';

		$attachment_id = $request['id'];

		// This also confirms the attachment is an image.
		$image_file = wp_get_original_image_path( $attachment_id );
		$image_meta = wp_get_attachment_metadata( $attachment_id );

		if (
			! $image_meta ||
			! $image_file ||
			! wp_image_file_matches_image_meta( $request['src'], $image_meta, $attachment_id )
		) {
			return new WP_Error(
				'rest_unknown_attachment',
				__( 'Unable to get meta information for file.' ),
				array( 'status' => 404 )
			);
		}

		$supported_types = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic' );
		$mime_type       = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime_type, $supported_types, true ) ) {
			return new WP_Error(
				'rest_cannot_edit_file_type',
				__( 'This type of file cannot be edited.' ),
				array( 'status' => 400 )
			);
		}

		$modifiers = $request['modifiers'];

		/*
		 * If the file doesn't exist, attempt a URL fopen on the src link.
		 * This can occur with certain file replication plugins.
		 * Keep the original file path to get a modified name later.
		 */
		$image_file_to_edit = $image_file;
		if ( ! file_exists( $image_file_to_edit ) ) {
			$image_file_to_edit = _load_image_to_edit_path( $attachment_id );
		}

		$image_editor = wp_get_image_editor( $image_file_to_edit );

		if ( is_wp_error( $image_editor ) ) {
			return new WP_Error(
				'rest_unknown_image_file_type',
				__( 'Unable to edit this image.' ),
				array( 'status' => 500 )
			);
		}

		// Apply any unapplied EXIF orientation so edits run in the upright frame the client previewed.
		$image_editor->maybe_exif_rotate();

		foreach ( $modifiers as $modifier ) {
			$args = $modifier['args'];
			switch ( $modifier['type'] ) {
				case 'flip':
					/*
					 * Flips the current image.
					 * The vertical flip is the first argument (flip along horizontal axis), the horizontal flip is the second argument (flip along vertical axis).
					 * See: WP_Image_Editor::flip()
					 */
					$result = $image_editor->flip( $args['flip']['vertical'], $args['flip']['horizontal'] );
					if ( is_wp_error( $result ) ) {
						return new WP_Error(
							'rest_image_flip_failed',
							__( 'Unable to flip this image.' ),
							array( 'status' => 500 )
						);
					}
					break;
				case 'rotate':
					// Rotation direction: clockwise vs. counterclockwise.
					$rotate = 0 - $args['angle'];

					if ( 0 !== $rotate ) {
						$result = $image_editor->rotate( $rotate );

						if ( is_wp_error( $result ) ) {
							return new WP_Error(
								'rest_image_rotation_failed',
								__( 'Unable to rotate this image.' ),
								array( 'status' => 500 )
							);
						}
					}

					break;

				case 'crop':
					$size = $image_editor->get_size();

					$crop_x = (int) round( ( $size['width'] * $args['left'] ) / 100.0 );
					$crop_y = (int) round( ( $size['height'] * $args['top'] ) / 100.0 );
					$width  = (int) round( ( $size['width'] * $args['width'] ) / 100.0 );
					$height = (int) round( ( $size['height'] * $args['height'] ) / 100.0 );

					if ( $size['width'] !== $width || $size['height'] !== $height ) {
						$result = $image_editor->crop( $crop_x, $crop_y, $width, $height );

						if ( is_wp_error( $result ) ) {
							return new WP_Error(
								'rest_image_crop_failed',
								__( 'Unable to crop this image.' ),
								array( 'status' => 500 )
							);
						}
					}

					break;

				case 'resize':
					$size = $image_editor->get_size();

					$resize_width  = (int) $args['width'];
					$resize_height = (int) $args['height'];

					/*
					 * Enlarging cannot add detail, so it is refused — the same
					 * rule the classic Edit Image screen applies. The check runs
					 * against the size at this point in the chain, which is the
					 * upright original unless an earlier modifier already
					 * changed it.
					 */
					if ( $resize_width > $size['width'] || $resize_height > $size['height'] ) {
						return new WP_Error(
							'rest_image_resize_too_large',
							__( 'Images cannot be scaled to a size larger than the original.' ),
							array( 'status' => 400 )
						);
					}

					if ( $resize_width !== $size['width'] || $resize_height !== $size['height'] ) {
						// `crop` is false, so this fits the image inside the
						// box and keeps the source aspect ratio. Dimensions
						// that don't match that ratio get the best fit rather
						// than a stretched image.
						$result = $image_editor->resize( $resize_width, $resize_height, false );

						if ( is_wp_error( $result ) ) {
							return new WP_Error(
								'rest_image_resize_failed',
								__( 'Unable to scale this image.' ),
								array( 'status' => 500 )
							);
						}
					}

					break;

			}
		}

		// Calculate the file name.
		$image_ext  = pathinfo( $image_file, PATHINFO_EXTENSION );
		$image_name = wp_basename( $image_file, ".{$image_ext}" );

		/*
		 * Do not append multiple `-edited` to the file name.
		 * The user may be editing a previously edited image.
		 */
		if ( preg_match( '/-edited(-\d+)?$/', $image_name ) ) {
			// Remove any `-1`, `-2`, etc. `wp_unique_filename()` will add the proper number.
			$image_name = preg_replace( '/-edited(-\d+)?$/', '-edited', $image_name );
		} else {
			// Append `-edited` before the extension.
			$image_name .= '-edited';
		}

		$filename = "{$image_name}.{$image_ext}";

		// Create the uploads subdirectory if needed.
		$uploads = wp_upload_dir();

		// Make the file name unique in the (new) upload directory.
		$filename = wp_unique_filename( $uploads['path'], $filename );

		// Save to disk.
		$saved = $image_editor->save( $uploads['path'] . "/$filename" );

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		// Grab original attachment post so we can use it to set defaults.
		$original_attachment_post = get_post( $attachment_id );

		// Check request fields and assign default values.
		$new_attachment_post                 = $this->prepare_item_for_database( $request );
		$new_attachment_post->post_mime_type = $saved['mime-type'];
		$new_attachment_post->guid           = $uploads['url'] . "/$filename";

		// Unset ID so wp_insert_attachment generates a new ID.
		unset( $new_attachment_post->ID );

		// Set new attachment post title with fallbacks.
		$new_attachment_post->post_title = $new_attachment_post->post_title ?? $original_attachment_post->post_title ?? $image_name;

		// Set new attachment post caption (post_excerpt).
		$new_attachment_post->post_excerpt = $new_attachment_post->post_excerpt ?? $original_attachment_post->post_excerpt ?? '';

		// Set new attachment post description (post_content) with fallbacks.
		$new_attachment_post->post_content = $new_attachment_post->post_content ?? $original_attachment_post->post_content ?? '';

		// Set post parent if set in request, else the default of `0` (no parent).
		$new_attachment_post->post_parent = $new_attachment_post->post_parent ?? 0;

		// Insert the new attachment post.
		$new_attachment_id = wp_insert_attachment( wp_slash( (array) $new_attachment_post ), $saved['path'], 0, true );

		if ( is_wp_error( $new_attachment_id ) ) {
			if ( 'db_update_error' === $new_attachment_id->get_error_code() ) {
				$new_attachment_id->add_data( array( 'status' => 500 ) );
			} else {
				$new_attachment_id->add_data( array( 'status' => 400 ) );
			}

			return $new_attachment_id;
		}

		// First, try to use the alt text from the request. If not set, copy the image alt text from the original attachment.
		$image_alt = isset( $request['alt_text'] ) ? sanitize_text_field( $request['alt_text'] ) : get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );

		if ( ! empty( $image_alt ) ) {
			// update_post_meta() expects slashed.
			update_post_meta( $new_attachment_id, '_wp_attachment_image_alt', wp_slash( $image_alt ) );
		}

		if ( wp_is_serving_rest_request() ) {
			/*
			 * Set a custom header with the attachment_id.
			 * Used by the browser/client to resume creating image sub-sizes after a PHP fatal error.
			 */
			header( 'X-WP-Upload-Attachment-ID: ' . $new_attachment_id );
		}

		// Generate image sub-sizes and meta.
		$new_image_meta = wp_generate_attachment_metadata( $new_attachment_id, $saved['path'] );

		// Copy the EXIF metadata from the original attachment if not generated for the edited image.
		if ( isset( $image_meta['image_meta'] ) && isset( $new_image_meta['image_meta'] ) && is_array( $new_image_meta['image_meta'] ) ) {
			// Merge but skip empty values.
			foreach ( (array) $image_meta['image_meta'] as $key => $value ) {
				if ( empty( $new_image_meta['image_meta'][ $key ] ) && ! empty( $value ) ) {
					$new_image_meta['image_meta'][ $key ] = $value;
				}
			}
		}

		// Reset orientation. At this point the image is edited and orientation is correct.
		if ( ! empty( $new_image_meta['image_meta']['orientation'] ) ) {
			$new_image_meta['image_meta']['orientation'] = 1;
		}

		// The attachment_id may change if the site is exported and imported.
		$new_image_meta['parent_image'] = array(
			'attachment_id' => $attachment_id,
			// Path to the originally uploaded image file relative to the uploads directory.
			'file'          => _wp_relative_upload_path( $image_file ),
		);

		/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-attachments-controller.php */
		$new_image_meta = apply_filters( 'wp_edited_image_metadata', $new_image_meta, $new_attachment_id, $attachment_id );

		wp_update_attachment_metadata( $new_attachment_id, $new_image_meta );

		$response = $this->prepare_item_for_response( get_post( $new_attachment_id ), $request );
		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $new_attachment_id ) ) );

		return $response;
	}

	/**
	 * Reports whether the request carries a `resize` modifier.
	 *
	 * Only the `modifiers` array is inspected. The older top-level `rotation`,
	 * `x`, `y`, `width` and `height` parameters have no resize equivalent, so a
	 * request using that format always goes to core.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool Whether a `resize` modifier is present.
	 */
	private function has_resize_modifier( $request ) {
		if ( ! isset( $request['modifiers'] ) || ! is_array( $request['modifiers'] ) ) {
			return false;
		}

		foreach ( $request['modifiers'] as $modifier ) {
			if ( isset( $modifier['type'] ) && 'resize' === $modifier['type'] ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Retrieves the supported arguments for the `/edit` endpoint.
	 *
	 * Adds the `resize` modifier to the schema. Core validates `modifiers`
	 * with a `oneOf` list, so an unknown type is rejected before the request
	 * reaches `edit_media_item()`.
	 *
	 * @since 7.2.0
	 *
	 * @return array Supported arguments.
	 */
	protected function get_edit_media_item_args() {
		$args = parent::get_edit_media_item_args();

		if ( ! isset( $args['modifiers']['items']['oneOf'] ) ) {
			return $args;
		}

		$args['modifiers']['items']['oneOf'][] = array(
			'title'      => __( 'Resize' ),
			'properties' => array(
				'type' => array(
					'description' => __( 'Resize type.' ),
					'type'        => 'string',
					'enum'        => array( 'resize' ),
				),
				'args' => array(
					'description' => __( 'Resize arguments.' ),
					'type'        => 'object',
					'required'    => array(
						'width',
						'height',
					),
					'properties'  => array(
						'width'  => array(
							'description' => __( 'New width in pixels. Cannot be larger than the current width.' ),
							'type'        => 'integer',
							'minimum'     => 1,
						),
						'height' => array(
							'description' => __( 'New height in pixels. Cannot be larger than the current height.' ),
							'type'        => 'integer',
							'minimum'     => 1,
						),
					),
				),
			),
		);

		return $args;
	}
}
