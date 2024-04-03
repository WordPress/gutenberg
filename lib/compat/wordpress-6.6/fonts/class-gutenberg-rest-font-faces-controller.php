<?php
/**
 * REST API: WP_REST_Font_Faces_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.5.0
 */

if ( class_exists( 'WP_REST_Font_Faces_Controller' ) ) {

	/**
	 * Class to access font faces through the REST API.
	 */
	class Gutenberg_REST_Font_Faces_Controller extends WP_REST_Font_Faces_Controller {
		/**
		 * Creates a font face for the parent font family.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		 */
		public function create_item( $request ) {
			$font_family = $this->get_parent_font_family_post( $request['font_family_id'] );
			if ( is_wp_error( $font_family ) ) {
				return $font_family;
			}

			// Settings have already been decoded by ::sanitize_font_face_settings().
			$settings    = $request->get_param( 'font_face_settings' );
			$file_params = $request->get_file_params();

			// Check that the necessary font face properties are unique.
			$query = new WP_Query(
				array(
					'post_type'              => $this->post_type,
					'posts_per_page'         => 1,
					'title'                  => WP_Font_Utils::get_font_face_slug( $settings ),
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);
			if ( ! empty( $query->posts ) ) {
				return new WP_Error(
					'rest_duplicate_font_face',
					__( 'A font face matching those settings already exists.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			// Move the uploaded font asset from the temp folder to the fonts directory.
			if ( ! function_exists( 'wp_handle_upload' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			$srcs           = is_string( $settings['src'] ) ? array( $settings['src'] ) : $settings['src'];
			$processed_srcs = array();
			$font_file_meta = array();

			// @core-merge: add the next line to the body of the create_item method in WP_REST_Font_Faces_Controller.
			$font_family_slug = $this->get_parent_font_family_post( $request['font_family_id'] )->post_name;

			foreach ( $srcs as $src ) {
				// If src not a file reference, use it as is.
				if ( ! isset( $file_params[ $src ] ) ) {
					$processed_srcs[] = $src;
					continue;
				}

				$file = $file_params[ $src ];
				// @core-merge: modify the the signature of handle_font_file_upload to accept a second parameter.
				$font_file = $this->handle_font_file_upload_with_subdir( $file, $font_family_slug );
				if ( is_wp_error( $font_file ) ) {
					return $font_file;
				}

				$processed_srcs[] = $font_file['url'];
				$font_file_meta[] = $this->relative_fonts_path( $font_file['file'] );
			}

			// Store the updated settings for prepare_item_for_database to use.
			$settings['src'] = count( $processed_srcs ) === 1 ? $processed_srcs[0] : $processed_srcs;
			$request->set_param( 'font_face_settings', $settings );

			// Ensure that $settings data is slashed, so values with quotes are escaped.
			// WP_REST_Posts_Controller::create_item uses wp_slash() on the post_content.
			$font_face_post = parent::create_item( $request );

			if ( is_wp_error( $font_face_post ) ) {
				return $font_face_post;
			}

			$font_face_id = $font_face_post->data['id'];

			foreach ( $font_file_meta as $font_file_path ) {
				add_post_meta( $font_face_id, '_wp_font_face_file', $font_file_path );
			}

			return $font_face_post;
		}

		/**
		 * Handles the upload of a font file using wp_handle_upload().
		 *
		 * @param array $file Single file item from $_FILES.
		 * @return array|WP_Error Array containing uploaded file attributes on success, or WP_Error object on failure.
		 */
		protected function handle_font_file_upload_with_subdir( $file, $subdir ) {
			add_filter( 'upload_mimes', array( 'WP_Font_Utils', 'get_allowed_font_mime_types' ) );
			// Filter the upload directory to return the fonts directory.

			// @core-merge: add the following filter function directly to handle_font_file_upload to use a subdirectory for uploading fonts.
			$upload_filter = function ( $dir ) use ( $subdir ) {
				$font_dir = _wp_filter_font_directory( $dir );

				$font_dir['path']    = $font_dir['path'] . '/' . $subdir;
				$font_dir['url']     = $font_dir['url'] . '/' . $subdir;
				$font_dir['basedir'] = $font_dir['basedir'] . '/' . $subdir;
				$font_dir['baseurl'] = $font_dir['baseurl'] . '/' . $subdir;

				return $font_dir;
			};
			add_filter( 'upload_dir', $upload_filter );

			$overrides = array(
				'upload_error_handler' => array( $this, 'handle_font_file_upload_error' ),
				// Not testing a form submission.
				'test_form'            => false,
				// Only allow uploading font files for this request.
				'mimes'                => WP_Font_Utils::get_allowed_font_mime_types(),
			);

			// Bypasses is_uploaded_file() when running unit tests.
			if ( defined( 'DIR_TESTDATA' ) && DIR_TESTDATA ) {
				$overrides['action'] = 'wp_handle_mock_upload';
			}

			$uploaded_file = wp_handle_upload( $file, $overrides );
			remove_filter( 'upload_dir', $upload_filter );
			remove_filter( 'upload_mimes', array( 'WP_Font_Utils', 'get_allowed_font_mime_types' ) );

			return $uploaded_file;
		}
	}
}
