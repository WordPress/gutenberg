<?php
/**
 * Start: Include for phase 2
 * REST API: WP_REST_Menus_Controller class
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
		$this->namespace = '__experimental';
		$this->rest_base = '/image-editor/(?P<media_id>[\d]+)';
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
			$this->rest_base . '/apply',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'apply_edits' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'x'        => array(
							'type'     => 'number',
							'minimum'  => 0,
							'required' => true,
						),
						'y'        => array(
							'type'     => 'number',
							'minimum'  => 0,
							'required' => true,
						),
						'width'    => array(
							'type'     => 'number',
							'minimum'  => 1,
							'required' => true,
						),
						'height'   => array(
							'type'     => 'number',
							'minimum'  => 1,
							'required' => true,
						),
						'rotation' => array(
							'type' => 'integer',
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
		if ( ! current_user_can( 'edit_post', $request['media_id'] ) ) {
			$error = __( 'Sorry, you are not allowed to edit images.', 'gutenberg' );
			return new WP_Error( 'rest_cannot_edit_image', $error, array( 'status' => rest_authorization_required_code() ) );
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

		$params        = $request->get_params();
		$attachment_id = $params['media_id'];

		// This also confirms the attachment is an image.
		$image_file = wp_get_original_image_path( $attachment_id );
		$image_meta = wp_get_attachment_metadata( $attachment_id );

		if ( ! $image_meta || ! $image_file ) {
			$error = __( 'Unable to get meta information for file.', 'gutenberg' );
			return new WP_Error( 'rest_unknown_attachment', $error, array( 'status' => 404 ) );
		}

		// Check if we need to do anything.
		$rotate = 0;
		$crop   = false;

		if ( ! empty( $params['rotation'] ) ) {
			// Rotation direction: clockwise vs. counter clockwise.
			$rotate = 0 - (int) $params['rotation'];
		}

		if ( isset( $params['x'], $params['y'], $params['width'], $params['height'] ) ) {
			// The crop script may return some very small, sub-pixel values when the image was not cropped.
			// Crop only when the cropping coordinates values are changed by more than 0.1%.
			if (
				floatval( $params['x'] ) > 0.1 ||
				floatval( $params['y'] ) > 0.1 ||
				floatval( $params['width'] ) < 99.9 ||
				floatval( $params['height'] ) < 99.9
			) {
				$crop = true;
			}
		}

		if ( ! $rotate && ! $crop ) {
			$error = __( 'The image was not erdited. Edit the image before applying the changes.', 'gutenberg' );
			return new WP_Error( 'rest_image_not_edited', $error, array( 'status' => 400 ) );
		}

		$image_editor = wp_get_image_editor( $image_file );

		if ( is_wp_error( $image_editor ) ) {
			// This image cannot be edited.
			$error = __( 'Unable to edit this image.', 'gutenberg' );
			return new WP_Error( 'rest_unknown_image_file_type', $error, array( 'status' => 500 ) );
		}

		if ( $rotate !== 0 ) {
			$result = $image_editor->rotate( $rotate );

			if ( is_wp_error( $result ) ) {
				$error = __( 'Unable to rotate this image.', 'gutenberg' );
				return new WP_Error( 'rest_image_rotation_failed', $error, array( 'status' => 500 ) );
			}
		}

		if ( $crop ) {
			$size = $image_editor->get_size();

			$crop_x = round( ( $size['width'] * floatval( $params['x'] ) ) / 100.0 );
			$crop_y = round( ( $size['height'] * floatval( $params['y'] ) ) / 100.0 );
			$width  = round( ( $size['width'] * floatval( $params['width'] ) ) / 100.0 );
			$height = round( ( $size['height'] * floatval( $params['height'] ) ) / 100.0 );

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

		$new_attachment_id = wp_insert_attachment( $attachment_post, $saved['path'], 0, true );

		if ( is_wp_error( $new_attachment_id ) ) {
			if ( 'db_update_error' === $new_attachment_id->get_error_code() ) {
				$new_attachment_id->add_data( array( 'status' => 500 ) );
			} else {
				$new_attachment_id->add_data( array( 'status' => 400 ) );
			}

			return $new_attachment_id;
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

		wp_update_attachment_metadata( $new_attachment_id, $new_image_meta );

		$path     = '/wp/v2/media/' . $new_attachment_id;
		$response = rest_do_request( $path );

		if ( ! $response->is_error() ) {
			$response->set_status( 201 );
			$response->header( 'Location', rest_url( $path ) );
		}

		return $response;
	}
}
