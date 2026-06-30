<?php
/**
 * REST API: Gutenberg_REST_Attachments_Controller_With_Mask class
 *
 * @package gutenberg
 */

require_once __DIR__ . '/image-editor-mask.php';

/**
 * Attachment controller base class with experimental mask modifier support.
 *
 * This is an MVP compatibility layer for testing shaped crops before Core has
 * a first-class image-editor mask operation.
 *
 * Intended Core behavior:
 * - `mask` remains an edit modifier accepted by the attachments `/edit` route.
 * - The image editor applies the mask while producing the edited attachment.
 *
 * Temporary Gutenberg behavior:
 * - Non-mask edits keep using Core's `/edit` implementation.
 * - Mask edits use an adapted copy of Core's edit flow so the plugin can run
 *   on older WordPress versions without depending on native Core mask support.
 * - The circular PNG is created before the new attachment is inserted, so the
 *   request creates one attachment and one metadata set. This keeps the MVP
 *   close to the eventual Core shape while the implementation remains
 *   self-contained in Gutenberg.
 *
 * @see WP_REST_Attachments_Controller
 */
class Gutenberg_REST_Attachments_Controller_With_Mask extends WP_REST_Attachments_Controller {
	/**
	 * Gets the request args for the edit item route.
	 *
	 * Adds a `mask` modifier to Core's existing flip/rotate/crop schema.
	 *
	 * @return array
	 */
	protected function get_edit_media_item_args() {
		$args = parent::get_edit_media_item_args();

		if ( isset( $args['modifiers']['items']['oneOf'] ) && is_array( $args['modifiers']['items']['oneOf'] ) ) {
			$args['modifiers']['items']['oneOf'][] = array(
				'title'      => __( 'Mask', 'gutenberg' ),
				'type'       => 'object',
				'properties' => array(
					'type' => array(
						'description' => __( 'Mask type.', 'gutenberg' ),
						'type'        => 'string',
						'enum'        => array( 'mask' ),
					),
					'args' => array(
						'description' => __( 'Mask arguments.', 'gutenberg' ),
						'type'        => 'object',
						'required'    => array(
							'shape',
						),
						'properties'  => array(
							'shape' => array(
								'description' => __( 'Mask shape.', 'gutenberg' ),
								'type'        => 'string',
								'enum'        => array( 'circle' ),
							),
						),
					),
				),
			);
		}

		return $args;
	}

	/**
	 * Applies edits to a media item and creates a new attachment record.
	 *
	 * Non-mask requests are delegated to Core. Mask requests use a contained
	 * copy of Core's edit flow with the mask applied before attachment insert.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function edit_media_item( $request ) {
		if ( ! $this->gutenberg_has_circle_mask_modifier( $request ) ) {
			return parent::edit_media_item( $request );
		}

		return $this->gutenberg_edit_media_item_with_mask( $request );
	}

	/**
	 * Applies Core-supported edits and a circle mask before inserting the new attachment.
	 *
	 * This intentionally mirrors Core's edit_media_item() flow instead of
	 * calling it as a black box. Gutenberg needs to support masks before the
	 * site is running a Core version with native mask support, but the eventual
	 * Core implementation should apply the mask inside Core's image-editor
	 * pipeline rather than as a post-insert replacement.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	protected function gutenberg_edit_media_item_with_mask( $request ) {
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
				__( 'Unable to get meta information for file.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$supported_types = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic' );
		$mime_type       = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime_type, $supported_types, true ) ) {
			return new WP_Error(
				'rest_cannot_edit_file_type',
				__( 'This type of file cannot be edited.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// The `modifiers` param takes precedence over the older format.
		if ( isset( $request['modifiers'] ) ) {
			$modifiers = $request['modifiers'];
		} else {
			$modifiers = array();

			if ( isset( $request['flip']['horizontal'] ) || isset( $request['flip']['vertical'] ) ) {
				$flip_args = array(
					'vertical'   => isset( $request['flip']['vertical'] ) ? (bool) $request['flip']['vertical'] : false,
					'horizontal' => isset( $request['flip']['horizontal'] ) ? (bool) $request['flip']['horizontal'] : false,
				);

				$modifiers[] = array(
					'type' => 'flip',
					'args' => array(
						'flip' => $flip_args,
					),
				);
			}

			if ( ! empty( $request['rotation'] ) ) {
				$modifiers[] = array(
					'type' => 'rotate',
					'args' => array(
						'angle' => $request['rotation'],
					),
				);
			}

			if ( isset( $request['x'], $request['y'], $request['width'], $request['height'] ) ) {
				$modifiers[] = array(
					'type' => 'crop',
					'args' => array(
						'left'   => $request['x'],
						'top'    => $request['y'],
						'width'  => $request['width'],
						'height' => $request['height'],
					),
				);
			}

			if ( 0 === count( $modifiers ) ) {
				return new WP_Error(
					'rest_image_not_edited',
					__( 'The image was not edited. Edit the image before applying the changes.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}
		}

		/*
		 * If the file doesn't exist, attempt a URL fopen on the src link.
		 * This can occur with certain file replication plugins.
		 * Keep the original file path to get a modified name later.
		 */
		$image_file_to_edit = $image_file;
		if ( ! file_exists( $image_file_to_edit ) ) {
			$image_file_to_edit = _load_image_to_edit_path( $attachment_id );
		}

		$image_editor = wp_get_image_editor(
			$image_file_to_edit,
			array(
				'methods'          => array( 'mask' ),
				'mime_type'        => $mime_type,
				'output_mime_type' => 'image/png',
			)
		);

		if ( is_wp_error( $image_editor ) ) {
			return new WP_Error(
				'rest_image_mask_unsupported',
				__( 'Unable to mask this image.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		$has_mask_modifier = false;
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
							__( 'Unable to flip this image.', 'gutenberg' ),
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
								__( 'Unable to rotate this image.', 'gutenberg' ),
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
								__( 'Unable to crop this image.', 'gutenberg' ),
								array( 'status' => 500 )
							);
						}
					}

					break;

				case 'mask':
					$result = $image_editor->mask( $args );
					if ( is_wp_error( $result ) ) {
						return new WP_Error(
							'rest_image_mask_failed',
							__( 'Unable to mask this image.', 'gutenberg' ),
							array( 'status' => 500 )
						);
					}

					$has_mask_modifier = true;
					break;
			}
		}

		if ( ! $has_mask_modifier ) {
			return new WP_Error(
				'rest_image_mask_failed',
				__( 'Unable to mask this image.', 'gutenberg' ),
				array( 'status' => 400 )
			);
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

		$filename = "{$image_name}.png";

		// Create the uploads subdirectory if needed.
		$uploads = wp_upload_dir();

		// Make the file name unique in the (new) upload directory.
		$filename = wp_unique_filename( $uploads['path'], $filename );

		// Save to disk as PNG so the circle mask can preserve transparency.
		$saved = $image_editor->save( $uploads['path'] . "/$filename", 'image/png' );

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		$saved['mime-type'] = 'image/png';

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
			wp_delete_file( $saved['path'] );

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

		/**
		 * Filters the meta data for the new image created by editing an existing image.
		 *
		 * @since 5.5.0
		 *
		 * @param array $new_image_meta    Meta data for the new image.
		 * @param int   $new_attachment_id Attachment post ID for the new image.
		 * @param int   $attachment_id     Attachment post ID for the edited (parent) image.
		 */
		$new_image_meta = apply_filters( 'wp_edited_image_metadata', $new_image_meta, $new_attachment_id, $attachment_id );

		wp_update_attachment_metadata( $new_attachment_id, $new_image_meta );

		$response = $this->prepare_item_for_response( get_post( $new_attachment_id ), $request );
		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $new_attachment_id ) ) );

		return $response;
	}

	/**
	 * Checks whether a request contains the experimental circle mask modifier.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool Whether the request has a circle mask modifier.
	 */
	protected function gutenberg_has_circle_mask_modifier( $request ) {
		if ( empty( $request['modifiers'] ) || ! is_array( $request['modifiers'] ) ) {
			return false;
		}

		foreach ( $request['modifiers'] as $modifier ) {
			if (
				is_array( $modifier ) &&
				'mask' === ( $modifier['type'] ?? null ) &&
				'circle' === ( $modifier['args']['shape'] ?? null )
			) {
				return true;
			}
		}

		return false;
	}
}
