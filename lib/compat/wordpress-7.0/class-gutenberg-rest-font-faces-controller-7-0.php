<?php
/**
 * REST API: Gutenberg_REST_Font_Faces_Controller_7_0 class
 *
 * @package gutenberg
 */

/**
 * Controller which overrides the core WP_REST_Font_Faces_Controller
 * to add a file_status field indicating whether font files exist on disk.
 *
 * @since 20.4.0
 *
 * @see WP_REST_Font_Faces_Controller
 */
class Gutenberg_REST_Font_Faces_Controller_7_0 extends WP_REST_Font_Faces_Controller {

	/**
	 * Prepares a single font face output for response.
	 *
	 * Adds a 'file_status' field indicating whether local font files exist on disk.
	 *
	 * @since 20.4.0
	 *
	 * @param WP_Post         $item    Font face post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'file_status', $fields ) ) {
			$data                = $response->get_data();
			$data['file_status'] = $this->get_file_status( $item );
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Determines the file status for a font face post.
	 *
	 * Checks the `_wp_font_face_file` post meta entries against the filesystem.
	 * If the meta is empty (external URL or system font), returns 'none'.
	 * If all referenced files exist on disk, returns 'existing'.
	 * If any are missing, returns 'missing'.
	 *
	 * @since 20.4.0
	 *
	 * @param WP_Post $post Font face post object.
	 * @return string One of 'existing', 'missing', or 'none'.
	 */
	private function get_file_status( $post ) {
		$font_files = get_post_meta( $post->ID, '_wp_font_face_file', false );

		// No local files tracked: external URL or system font.
		if ( empty( $font_files ) ) {
			return 'none';
		}

		$font_dir = wp_get_font_dir();

		// Also check the legacy Gutenberg fonts directory (wp-content/fonts).
		$site_path = '';
		if ( is_multisite() && ! ( is_main_network() && is_main_site() ) ) {
			$site_path = '/sites/' . get_current_blog_id();
		}
		$legacy_font_dir = path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path;

		foreach ( $font_files as $font_file ) {
			$standard_path = path_join( $font_dir['basedir'], $font_file );
			$legacy_path   = $legacy_font_dir . '/' . $font_file;

			if ( ! file_exists( $standard_path ) && ! file_exists( $legacy_path ) ) {
				return 'missing';
			}
		}

		return 'existing';
	}

	/**
	 * Retrieves the font face's schema, conforming to JSON Schema.
	 *
	 * Adds the 'file_status' property to the schema.
	 *
	 * @since 20.4.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['file_status'] = array(
			'description' => __( 'Status of the font file(s) on disk.', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array( 'existing', 'missing', 'none' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		return $schema;
	}
}
