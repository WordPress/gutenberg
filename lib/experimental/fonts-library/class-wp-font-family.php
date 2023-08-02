<?php
/**
 * Font Family class.
 *
 * This file contains the Font Family class definition.
 *
 * @package    Gutenberg
 * @subpackage Fonts Library
 * @since      X.X.X
 */

if ( class_exists( 'WP_Font_Family' ) ) {
	return;
}


/**
 * Fonts Library class.
 */
class WP_Font_Family {

	/**
	 * Font family data
	 *
	 * @var array
	 */
	private $data;


	/**
	 * WP_Font_Family constructor.
	 *
	 * @param array $font_family Font family data.
	 */
	public function __construct( $font_family = array() ) {
		$this->data = $font_family;
	}

	/**
	 * Returns the font family data.
	 *
	 * @return array An array in fontFamily theme.json format.
	 */
	public function get_data() {
		return $this->data;
	}

	/**
	 * Returns the font family data.
	 *
	 * @return string fontFamily in theme.json format as stringified JSON.
	 */
	public function get_data_as_json() {
		return wp_json_encode( $this->get_data() );
	}

	/**
	 * Returns if the font family has font faces defined.
	 *
	 * @return bool true if the font family has font faces defined, false otherwise.
	 */
	public function has_font_faces() {
		return ! empty( $this->data['fontFace'] ) && is_array( $this->data['fontFace'] );
	}

	/**
	 * Removes font family assets.
	 *
	 * @return bool True if assets were removed, false otherwise.
	 */
	private function remove_font_family_assets() {
		if ( $this->has_font_faces() ) {
			foreach ( $this->data['fontFace'] as $font_face ) {
				$were_assets_removed = $this->delete_font_face_assets( $font_face );
				if ( false === $were_assets_removed ) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Removes a font family from the database and deletes its assets.
	 *
	 * @return bool|WP_Error True if the font family was uninstalled, WP_Error otherwise.
	 */
	public function uninstall() {
		$post = $this->get_data_from_post();
		if ( null === $post ) {
			return new WP_Error( 'font_family_not_found', __( 'The font family could not be found.', 'gutenberg' ) );
		}
		if ( ! $this->remove_font_family_assets() || ! wp_delete_post( $post->ID, true ) ) {
			return new WP_Error( 'font_family_not_deleted', __( 'The font family could not be deleted.', 'gutenberg' ) );
		}
		return true;
	}

	/**
	 * Deletes a specified font asset file from the fonts directory.
	 *
	 * @param string $src The path of the font asset file to delete.
	 * @return bool Whether the file was deleted.
	 */
	private static function delete_asset( $src ) {
		$filename  = basename( $src );
		$file_path = path_join( WP_Fonts_Library::get_fonts_dir(), $filename );
		wp_delete_file( $file_path );
		return ! file_exists( $file_path );
	}

	/**
	 * Deletes all font face asset files associated with a given font face.
	 *
	 * @param array $font_face The font face array containing the 'src' attribute with the file path(s) to be deleted.
	 */
	private static function delete_font_face_assets( $font_face ) {
		$sources = (array) $font_face['src'];
		foreach ( $sources as $src ) {
			$was_asset_removed = self::delete_asset( $src );
			if ( ! $was_asset_removed ) {
				// Bail if any of the assets could not be removed.
				return false;
			}
		}
		return true;
	}

	/**
	 * Downloads a font asset.
	 *
	 * Downloads a font asset from a specified source URL and saves it to the font directory.
	 *
	 * @param string $src The source URL of the font asset to be downloaded.
	 * @param string $filename The filename to save the downloaded font asset as.
	 * @return string|bool The relative path to the downloaded font asset. False if the download failed.
	 */
	private function download_asset( $src, $filename ) {
		// Checks if the file to be downloaded has a font mime type.
		if ( ! WP_Font_Family_Utils::has_font_mime_type( $filename ) ) {
			return false;
		}

		// Include file with download_url() if function doesn't exist.
		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		// Downloads the font asset or returns false.
		$temp_file = download_url( $src );
		if ( is_wp_error( $temp_file ) ) {
			return false;
		}

		$overrides = array(
			'action'                   => 'wp_handle_font_upload', // Arbitrary string to avoid the is_uploaded_file() check applied when using 'wp_handle_upload'.
			'test_form'                => false, // We are not testing a form submission.
			'test_type'                => false, // Seems like we can not test mime type for files that are not images. See this function docs: https://developer.wordpress.org/reference/functions/wp_check_filetype_and_ext/
			'unique_filename_callback' => function () use ( $filename ) {
				return $filename; }, // We want to keep the original filename.
		);

		$file = array(
			'tmp_name' => $temp_file,
			'name'     => $filename,
		);

		$handled_file = wp_handle_upload( $file, $overrides );

		// Cleans the temp file.
		@unlink( $temp_file );

		if ( ! isset( $handled_file['url'] ) ) {
			return false;
		}

		// Returns the relative path to the downloaded font asset to be used as font face src.
		return $handled_file['url'];
	}

	/**
	 * Move an uploaded font face asset from temp folder to the wp fonts directory.
	 *
	 * This is used when uploading local fonts.
	 *
	 * @param array $font_face Font face to download.
	 * @param array $file Uploaded file.
	 * @return array New font face with all assets downloaded and referenced in the font face definition
	 */
	private function move_font_face_asset( $font_face, $file ) {
		$new_font_face = $font_face;
		$filename      = WP_Font_Family_Utils::get_filename_from_font_face( $this->data['slug'], $font_face, $file['name'] );

		// Remove the uploaded font asset reference from the font face definition because it is no longer needed.
		unset( $new_font_face['uploaded_file'] );

		// If the filename has not a font mime type, we don't move the file and return the font face definition without src to be ignored later.
		if ( ! WP_Font_Family_Utils::has_font_mime_type( $filename ) ) {
			return $new_font_face;
		}

		// Move the uploaded font asset from the temp folder to the wp fonts directory.
		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$overrides = array(
			'action'                   => 'wp_handle_font_upload', // Arbitrary string to avoid the is_uploaded_file() check applied when using 'wp_handle_upload'.
			'test_form'                => false, // We are not testing a form submission.
			'test_type'                => false, // Seems like we can not test mime type for files that are not images. See this function docs: https://developer.wordpress.org/reference/functions/wp_check_filetype_and_ext/
			'unique_filename_callback' => function () use ( $filename ) {
				return $filename; }, // We want to keep the original filename.
		);

		$handled_file = wp_handle_upload( $file, $overrides );

		if ( isset( $handled_file['url'] ) ) {
			// If the file was successfully moved, we update the font face definition to reference the new file location.
			$new_font_face['src'] = $handled_file['url'];
		}

		return $new_font_face;
	}

	/**
	 * Sanitizes the font family data using WP_Theme_JSON.
	 *
	 * @return array A sanitized font family definition.
	 */
	private function sanitize() {
		// Creates the structure of theme.json array with the new fonts.
		$fonts_json = array(
			'version'  => '2',
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array( $this->data ),
				),
			),
		);
		// Creates a new WP_Theme_JSON object with the new fonts to leverage sanitization and validation.
		$theme_json     = new WP_Theme_JSON_Gutenberg( $fonts_json );
		$theme_data     = $theme_json->get_data();
		$sanitized_font = ! empty( $theme_data['settings']['typography']['fontFamilies'] )
			? $theme_data['settings']['typography']['fontFamilies'][0]
			: array();
		$this->data     = $sanitized_font;
		return $this->data;
	}

	/**
	 * Downloads font face assets.
	 *
	 * Downloads the font face asset(s) associated with a font face. It works with both single
	 * source URLs and arrays of multiple source URLs.
	 *
	 * @param array $font_face The font face array containing the 'src' attribute with the source URL(s) of the assets.
	 * @return array The modified font face array with the new source URL(s) to the downloaded assets.
	 */
	private function download_font_face_assets( $font_face ) {
		$new_font_face        = $font_face;
		$sources              = (array) $font_face['download_from_url'];
		$new_font_face['src'] = array();
		$index                = 0;
		foreach ( $sources as $src ) {
			$suffix   = $index++ > 0 ? $index : '';
			$filename = WP_Font_Family_Utils::get_filename_from_font_face( $this->data['slug'], $font_face, $src, $suffix );
			$new_src  = $this->download_asset( $src, $filename );
			if ( $new_src ) {
				$new_font_face['src'][] = $new_src;
			}
		}
		if ( count( $new_font_face['src'] ) === 1 ) {
			$new_font_face['src'] = $new_font_face['src'][0];
		}
		// Remove the download url reference from the font face definition because it is no longer needed.
		unset( $new_font_face['download_from_url'] );
		return $new_font_face;
	}


	/**
	 * Downloads font face assets if the font family is a Google font, or moves them if it is a local font.
	 *
	 * @param array $files An array of files to be installed.
	 * @return bool
	 */
	private function download_or_move_font_faces( $files ) {
		if ( ! $this->has_font_faces() ) {
			return true;
		}
		$new_font_faces = array();
		foreach ( $this->data['fontFace'] as $font_face ) {
			// If the fonts is not meant to be dowloaded or uploaded (for example to install fonts that use a remote url)
			$new_font_face = $font_face;

			// If we are installing google fonts, we need to download the font face assets.
			if ( ! empty( $font_face['download_from_url'] ) ) {
				$new_font_face = $this->download_font_face_assets( $new_font_face );
			}

			// If we are installing local fonts, we need to move the font face assets from the temp folder to the wp fonts directory.
			if ( ! empty( $font_face['uploaded_file'] ) && ! empty( $files ) ) {
				$new_font_face = $this->move_font_face_asset( $new_font_face, $files[ $new_font_face['uploaded_file'] ] );
			}

			/*
			* If the font face assets were successfully downloaded, we add the font face to the new font.
			* Font faces with failed downloads are not added to the new font.
			*/
			if ( ! empty( $new_font_face['src'] ) ) {
				$new_font_faces[] = $new_font_face;
			}
		}
		if ( ! empty( $new_font_faces ) ) {
			$this->data['fontFace'] = $new_font_faces;
			return true;
		}
		return false;
	}

	/**
	 * Get the post for a font family.
	 *
	 * @return WP_Post|null The post for this font family object or null if the post does not exist.
	 */
	public function get_font_post() {
		$args = array(
			'post_type'      => 'wp_font_family',
			'post_name'      => $this->data['slug'],
			'name'           => $this->data['slug'],
			'posts_per_page' => 1,
		);

		$posts_query = new WP_Query( $args );

		if ( $posts_query->have_posts() ) {
			return $posts_query->posts[0];
		}

		return null;
	}

	/**
	 * Get the data for this object from the database and set it to the data property.
	 *
	 * @return WP_Post|null The post for this font family object or null if the post does not exist.
	 */
	private function get_data_from_post() {
		$post = $this->get_font_post();
		if ( $post ) {
			$this->data = json_decode( $post->post_content, true );
			return $post;
		}
		return null;
	}

	/**
	 * Create a post for a font family.
	 *
	 * @return int|WP_Error Post ID.
	 */
	private function create_font_post() {
		$post    = array(
			'post_title'   => $this->data['name'],
			'post_name'    => $this->data['slug'],
			'post_type'    => 'wp_font_family',
			'post_content' => $this->get_data_as_json(),
			'post_status'  => 'publish',
		);
		$post_id = wp_insert_post( $post );
		if ( 0 === $post_id || is_wp_error( $post_id ) ) {
			return new WP_Error( 'font_post_creation_failed', __( 'Font post creation failed', 'gutenberg' ) );
		}
		return $post_id;
	}

	/**
	 * Update a post for a font family.
	 *
	 * @param WP_Post $post The post to update.
	 * @return int|WP_Error Post ID if the update was successful, WP_Error otherwise.
	 */
	private function update_font_post( $post ) {
		$post_font_data = json_decode( $post->post_content, true );
		$new_data       = WP_Font_Family_Utils::merge_fonts_data( $post_font_data, $this->data );
		$this->data     = $new_data;

		$post = array(
			'ID'           => $post->ID,
			'post_content' => $this->get_data_as_json(),
		);

		$post_id = wp_update_post( $post );

		if ( 0 === $post_id || is_wp_error( $post_id ) ) {
			return new WP_Error( 'font_post_update_failed', __( 'Font post update failed', 'gutenberg' ) );
		}

		return $post_id;
	}

	/**
	 * Creates a post for a font in the fonts library if it doesn't exist, or updates it if it does.
	 *
	 * @return int post id
	 */
	private function create_or_update_font_post() {
		$this->sanitize();
		$post = $this->get_font_post();
		if ( $post ) {
			return $this->update_font_post( $post );
		}
		return $this->create_font_post();
	}

	/**
	 * Install the font family into the library
	 *
	 * @param array $files An array of files to be installed, default is null.
	 * @return array|WP_Error
	 */
	public function install( $files = null ) {
		add_filter( 'upload_dir', array( 'WP_Fonts_Library', 'set_upload_dir' ) );
		$were_assets_written = $this->download_or_move_font_faces( $files );
		remove_filter( 'upload_dir', array( 'WP_Fonts_Library', 'set_upload_dir' ) );

		if ( ! $were_assets_written ) {
			return new WP_Error( 'font_face_download_failed', __( 'The font face assets could not be written.', 'gutenberg' ) );
		}

		$post_id = $this->create_or_update_font_post();

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return $this->get_data();
	}

}
