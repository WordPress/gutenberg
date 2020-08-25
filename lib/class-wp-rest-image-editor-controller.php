<?php
/**
 * Start: Include for phase 2
 * REST API: WP_REST_Image_Editor_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Controller which provides REST API endpoints for image editing.
 *
 * @since 7.x ?
 *
 * @see WP_REST_Controller
 */
class WP_REST_Image_Editor_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @since 7.x ?
	 * @access public
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'media';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 7.x ?
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/edit',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'apply_edits' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'rotation' => array(
							'type' => 'integer',
						),

						// Src is required to check for correct $image_meta.
						'src'      => array(
							'type'     => 'string',
							'required' => true,
						),

						// Crop values are in percents.
						'x'        => array(
							'type'    => 'number',
							'minimum' => 0,
							'maximum' => 100,
						),
						'y'        => array(
							'type'    => 'number',
							'minimum' => 0,
							'maximum' => 100,
						),
						'width'    => array(
							'type'    => 'number',
							'minimum' => 0,
							'maximum' => 100,
						),
						'height'   => array(
							'type'    => 'number',
							'minimum' => 0,
							'maximum' => 100,
						),
					),
				),
			)
		);
	}

	/**
	 * Checks if the user has permissions to make the request.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permission_callback( $request ) {
		if ( ! current_user_can( 'edit_post', $request['id'] ) ) {
			$error = __( 'Sorry, you are not allowed to edit images.', 'gutenberg' );
			return new WP_Error( 'rest_cannot_edit_image', $error, array( 'status' => rest_authorization_required_code() ) );
		}

		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'rest_cannot_edit_image', __( 'Sorry, you are not allowed to upload media on this site.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Applies all edits in one go.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error If successful image JSON for the modified image, otherwise a WP_Error.
	 */
	public function apply_edits( $request ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$attachment_id = $request['id'];

		// This also confirms the attachment is an image.
		$image_file = wp_get_original_image_path( $attachment_id );
		$image_meta = wp_get_attachment_metadata( $attachment_id );

		if ( function_exists( 'wp_image_file_matches_image_meta' ) ) {
			if (
				! $image_meta ||
				! $image_file ||
				! wp_image_file_matches_image_meta( $request['src'], $image_meta )
			) {
				return new WP_Error(
					'rest_unknown_attachment',
					__( 'Unable to get meta information for file.', 'gutenberg' ),
					array( 'status' => 404 )
				);
			}
		} else {
			// Back-compat for WP versions < 5.5.
			if ( ! $image_meta || ! $image_file ) {
				return new WP_Error(
					'rest_unknown_attachment',
					__( 'Unable to get meta information for file.', 'gutenberg' ),
					array( 'status' => 404 )
				);
			} else {
				$match     = false;
				$image_src = $request['src'];

				if ( isset( $image_meta['file'] ) && strlen( $image_meta['file'] ) > 4 ) {
					// Remove quiery args.
					list( $image_src ) = explode( '?', $image_src );

					// Check if the relative image path from the image meta is at the end of $image_src.
					if ( strrpos( $image_src, $image_meta['file'] ) === strlen( $image_src ) - strlen( $image_meta['file'] ) ) {
						$match = true;
					}

					if ( ! empty( $image_meta['sizes'] ) ) {
						// Retrieve the uploads sub-directory from the full size image.
						$dirname = _wp_get_attachment_relative_path( $image_meta['file'] );

						if ( $dirname ) {
							$dirname = trailingslashit( $dirname );
						}

						foreach ( $image_meta['sizes'] as $image_size_data ) {
							$relative_path = $dirname . $image_size_data['file'];

							if ( strrpos( $image_src, $relative_path ) === strlen( $image_src ) - strlen( $relative_path ) ) {
								$match = true;
								break;
							}
						}
					}
				}

				if ( ! $match ) {
					return new WP_Error(
						'rest_unknown_attachment',
						__( 'Unable to get meta information for file.', 'gutenberg' ),
						array( 'status' => 404 )
					);
				}
			}
		}

		$supported_types = array( 'image/jpeg', 'image/png', 'image/gif' );
		$mime_type       = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime_type, $supported_types, true ) ) {
			return new WP_Error(
				'rest_cannot_edit_file_type',
				__( 'This type of file cannot be edited.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Check if we need to do anything.
		$rotate = 0;
		$crop   = false;

		if ( ! empty( $request['rotation'] ) ) {
			// Rotation direction: clockwise vs. counter clockwise.
			$rotate = 0 - (int) $request['rotation'];
		}

		if ( isset( $request['x'], $request['y'], $request['width'], $request['height'] ) ) {
			$crop = true;
		}

		if ( ! $rotate && ! $crop ) {
			$error = __( 'The image was not edited. Edit the image before applying the changes.', 'gutenberg' );
			return new WP_Error( 'rest_image_not_edited', $error, array( 'status' => 400 ) );
		}

		// If the file doesn't exist, attempt a URL fopen on the src link.
		// This can occur with certain file replication plugins.
		// Keep the original file path to get a modified name later.
		$image_file_to_edit = $image_file;
		if ( ! file_exists( $image_file_to_edit ) ) {
			$image_file_to_edit = _load_image_to_edit_path( $attachment_id );
		}

		$image_editor = wp_get_image_editor( $image_file_to_edit );

		if ( is_wp_error( $image_editor ) ) {
			// This image cannot be edited.
			$error = __( 'Unable to edit this image.', 'gutenberg' );
			return new WP_Error( 'rest_unknown_image_file_type', $error, array( 'status' => 500 ) );
		}

		if ( 0 !== $rotate ) {
			$result = $image_editor->rotate( $rotate );

			if ( is_wp_error( $result ) ) {
				$error = __( 'Unable to rotate this image.', 'gutenberg' );
				return new WP_Error( 'rest_image_rotation_failed', $error, array( 'status' => 500 ) );
			}
		}

		if ( $crop ) {
			$size = $image_editor->get_size();

			$crop_x = round( ( $size['width'] * floatval( $request['x'] ) ) / 100.0 );
			$crop_y = round( ( $size['height'] * floatval( $request['y'] ) ) / 100.0 );
			$width  = round( ( $size['width'] * floatval( $request['width'] ) ) / 100.0 );
			$height = round( ( $size['height'] * floatval( $request['height'] ) ) / 100.0 );

			$result = $image_editor->crop( $crop_x, $crop_y, $width, $height );

			if ( is_wp_error( $result ) ) {
				$error = __( 'Unable to crop this image.', 'gutenberg' );
				return new WP_Error( 'rest_image_crop_failed', $error, array( 'status' => 500 ) );
			}
		}

		// Calculate the file name.
		$image_ext  = pathinfo( $image_file, PATHINFO_EXTENSION );
		$image_name = wp_basename( $image_file, ".{$image_ext}" );

		// Do not append multiple `-edited` to the file name.
		// The user may be editing a previously edited image.
		if ( preg_match( '/-edited(-\d+)?$/', $image_name ) ) {
			// Remove any `-1`, `-2`, etc. `wp_unique_filename()` will add the proper number.
			$image_name = preg_replace( '/-edited(-\d+)?$/', '-edited', $image_name );
		} else {
			// Append `-edited` before the extension.
			$image_name .= '-edited';
		}

		$filename = "{$image_name}.{$image_ext}";

		// Create the uploads sub-directory if needed.
		$uploads = wp_upload_dir();

		// Make the file name unique in the (new) upload directory.
		$filename = wp_unique_filename( $uploads['path'], $filename );

		// Save to disk.
		$saved = $image_editor->save( $uploads['path'] . "/$filename" );

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		// Create new attachment post.
		$attachment_post = array(
			'post_mime_type' => $saved['mime-type'],
			'guid'           => $uploads['url'] . "/$filename",
			'post_title'     => $filename,
			'post_content'   => '',
		);

		$new_attachment_id = wp_insert_attachment( wp_slash( $attachment_post ), $saved['path'], 0, true );

		if ( is_wp_error( $new_attachment_id ) ) {
			if ( 'db_update_error' === $new_attachment_id->get_error_code() ) {
				$new_attachment_id->add_data( array( 'status' => 500 ) );
			} else {
				$new_attachment_id->add_data( array( 'status' => 400 ) );
			}

			return $new_attachment_id;
		}

		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			// Set a custom header with the attachment_id.
			// Used by the browser/client to resume creating image sub-sizes after a PHP fatal error.
			header( 'X-WP-Upload-Attachment-ID: ' . $new_attachment_id );
		}

		// Generate image sub-sizes and meta.
		$new_image_meta = wp_generate_attachment_metadata( $new_attachment_id, $saved['path'] );

		// Copy the EXIF metadata from the original attachment if not generated for the edited image.
		if ( ! empty( $image_meta['image_meta'] ) ) {
			$empty_image_meta = true;

			if ( isset( $new_image_meta['image_meta'] ) && is_array( $new_image_meta['image_meta'] ) ) {
				$empty_image_meta = empty( array_filter( array_values( $new_image_meta['image_meta'] ) ) );
			}

			if ( $empty_image_meta ) {
				$new_image_meta['image_meta'] = $image_meta['image_meta'];
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
		 * Filters the updated attachment meta data.
		 *
		 * @since 5.5.0
		 *
		 * @param array $data              Array of updated attachment meta data.
		 * @param int   $new_attachment_id Attachment post ID.
		 * @param int   $attachment_id     Original Attachment post ID.
		 */
		$new_image_meta = apply_filters( 'wp_edited_attachment_metadata', $new_image_meta, $new_attachment_id, $attachment_id );

		wp_update_attachment_metadata( $new_attachment_id, $new_image_meta );

		$path        = '/wp/v2/media/' . $new_attachment_id;
		$new_request = new WP_REST_Request( 'GET', $path );
		$new_request->set_query_params( array( 'context' => 'edit' ) );
		$response = rest_do_request( $new_request );

		if ( ! $response->is_error() ) {
			$response->set_status( 201 );
			$response->header( 'Location', rest_url( $path ) );
		}

		return $response;
	}
}
