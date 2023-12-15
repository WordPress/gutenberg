<?php
/**
 * Font Family class.
 *
 * This file contains the Font Family class definition.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( class_exists( 'WP_Font_Family' ) ) {
	return;
}

/**
 * Font Library class.
 *
 * @since 6.5.0
 */
class WP_Font_Family {

	/**
	 * Font family data.
	 *
	 * @since 6.5.0
	 *
	 * @var array
	 */

	public $id;
	private $data;

	/**
	 * WP_Font_Family constructor.
	 *
	 * @since 6.5.0
	 *
	 * @param array $font_data Font family data.
	 * @throws Exception If the font family data is missing the slug or if there are errors installing font face resourdces.
	 */
	public function __construct( $font_data = array() ) {
		if ( empty( $font_data['slug'] ) ) {
			throw new Exception( 'Font family data is missing the slug.' );
		}

		$this->data = array(
			'slug'       => $font_data['slug'],
		);

		if( isset( $font_data['id'] ) ) {
			$this->id = $font_data['id'];
		}

		$update_response = $this->update( $font_data, null, true );

		if ( is_wp_error( $update_response ) ) {
			throw new Exception( $update_response->get_error_message() );
		}
	}

	/**
	 * Gets the font family objects that have been persisted.
	 *
	 * @since 6.5.0
	 *
	 * @return WP_Font_Family The Font Family objects that have been persisted
	 */
	public static function get_font_families () {
		$args = array(
			'post_type'      => 'wp_font_family',
		);

		$posts_query = new WP_Query( $args );

		if ( ! $posts_query->have_posts() ) {
			return array();
		}

		$font_families = array();
		foreach( $posts_query->posts as $post ) {
			$post_data = json_decode( $post->post_content, true );
			$post_data['id'] = $post->ID;
			$font_families[] = new WP_Font_Family( $post_data );
		}

		return $font_families;
	}

	/**
	 * Gets the font family object that has been persisted.
	 *
	 * @since 6.5.0
	 *
	 * @return null|WP_Font_Family The Font Family object or null if the font family does not exist.
	 */
	public static function get_font_family_by_id ( $id ) {
		$post = get_post( $id );

		if ( ! $post ) {
			return null;
		}

		$post_data = json_decode( $post->post_content, true );
		$post_data['id'] = $post->ID;
		return new WP_Font_Family( $post_data );
	}

	/**
	 * Gets the font family data.
	 *
	 * @since 6.5.0
	 *
	 * @return array An array in fontFamily theme.json format.
	 */
	public function get_data() {
		return $this->data;
	}

	/**
	 * Update and sanitize the font family data.
	 *
	 * @since 6.5.0
	 *
	 * @return array An array in fontFamily theme.json format.
	 */
	public function update( $data, $files=null, $patch=false ) {

		$current_font_faces = array();
		$font_faces_to_add = array();
		$font_faces_to_remove = array();

		if ( array_key_exists( 'fontFace', $this->data ) && ! empty( $this->data['fontFace'] ) ) {
			$current_font_faces = $this->data['fontFace'];
		}

		if ( array_key_exists( 'fontFace', $data ) && ! empty( $data['fontFace'] ) ) {
			$font_faces_to_add = $data['fontFace'];
		}

		if ( false === $patch ) {
			//If we are UPDATING this object then we need to remove any font faces that were not sent
			foreach ( $current_font_faces as $font_face ) {
				$existing_font_face = $this->get_font_face_from_collection( $font_face['fontWeight'], $font_face['fontStyle'], $font_faces_to_add );
				if ( ! $existing_font_face ) {
					$font_faces_to_remove[] = $font_face;
				}
			}
		}

		//Skip any font faces that are ALREADY installed
		$non_redundant_font_faces_to_add = array();
		$skipped_font_faces = array();
		foreach ( $font_faces_to_add as $font_face ) {
			$existing_font_face = $this->get_font_face_from_collection( $font_face['fontWeight'], $font_face['fontStyle'], $current_font_faces );
			if ( $existing_font_face ) {
				$skipped_font_faces[] = $existing_font_face;
			}
			else {
				$non_redundant_font_faces_to_add[] = $font_face;
			}
		}
		$font_faces_to_add = $non_redundant_font_faces_to_add;


		// Install any assets needed by font faces.
		$prepared_font_faces = array();
		if ( ! empty( $font_faces_to_add ) ) {
			$prepared_font_faces = $this->prepare_font_faces( $font_faces_to_add, $files);
			if ( is_wp_error( $prepared_font_faces ) ) {
				return $prepared_font_faces;
			}
		}

		// Remember to keep the font faces that were already installed that need to stay installed
		$prepared_font_faces = array_merge( $skipped_font_faces, $prepared_font_faces );

		if ( true === $patch ) {
			//If we are PATCHING this object then we need to merge the collection
			$data['fontFace'] = array_merge( $current_font_faces, $prepared_font_faces );
		}
		else {
			//If we are UPDATING this object then we need to use only the items that were sent
			$data['fontFace'] = $prepared_font_faces;
		}

		// If after all that installing and uninstalling our fontFace collection is empty just remove it.
		if ( empty( $data['fontFace'] ) ) {
			unset( $data['fontFace'] );
		}

		// Remove the assets for any font faces that were flagged to be removed.
		//NOTE: This is a 'nice-to-have' operation.  If we got here we have ALREADY sucessfully installed the necessary font faces.
		//If we fail deleting the assets (for some reason) failing the request isn't very nice.
		if ( ! empty( $font_faces_to_remove ) ) {
			foreach ( $font_faces_to_remove as $font_face ) {
				$this->delete_font_face_assets( $font_face );
			}
		}

		$merged_data = array_merge( $this->data, $data);
		$sanitized_data = $this->sanitize( $merged_data );

		$this->data = $sanitized_data;

		return $this->get_data();
	}


	private function get_font_face_from_collection ( $font_weight, $font_style, $collection ) {
		if ( ! $collection ) {
			return null;
		}
		foreach ( $collection as $font_face ) {
			if ( $font_weight === $font_face['fontWeight'] && $font_style === $font_face['fontStyle']) {
				return $font_face;
			}
		}
		return null;
	}

	private function prepare_font_faces( $font_faces, $files ) {
		$ready_font_faces = array();

		foreach ( $font_faces as $font_face ) {

			if ( ! empty( $font_face['uploadedFile'] ) || ! empty( $font_face['downloadFromUrl'] ) ) {

				if ( ! $this->has_write_permission() ) {
					return new WP_Error(
						'font_face_download_failed',
						__( 'The font face assets could not be written.', 'gutenberg' )
					);
				}

				if ( ! empty( $font_face['uploadedFile'] ) ) {
					if ( ! $files || ! array_key_exists( $font_face['uploadedFile'], $files )) {
						return new WP_Error(
							'font_face_upload_file_missing',
							__( 'The font face assets was not provided.', 'gutenberg' )
						);
					}
					$downloaded_font_face_src = $this->move_font_face_asset( $font_face, $files[ $font_face[ 'uploadedFile' ] ] );
					unset( $font_face['uploadedFile'] );
				}


				if ( ! empty( $font_face['downloadFromUrl'] ) ) {
					$downloaded_font_face_src = $this->download_font_face_assets( $font_face );
					unset( $font_face['downloadFromUrl'] );
				}

				if ( is_wp_error( $downloaded_font_face_src ) ) {
					return $downloaded_font_face_src;
				}

				$font_face['src'] = $downloaded_font_face_src;
			}
			$ready_font_faces[] = $font_face;
		}

		return $ready_font_faces;
	}

	public function persist() {
		if ( ! empty( $this->id ) ) {
			return $this->update_font_post( $this->id, wp_json_encode( $this->get_data() ) );
		}
		return $this->create_font_post( wp_json_encode( $this->get_data() ) );
	}

	/**
	 * Creates a post for a font family.
	 *
	 * @since 6.5.0
	 *
	 * @return int|WP_Error Post ID if the post was created, WP_Error otherwise.
	 */
	private function create_font_post( $post_content ) {
		$post = array(
			'post_title'   => $this->data['slug'],
			'post_name'    => $this->data['slug'],
			'post_type'    => 'wp_font_family',
			'post_content' => $post_content,
			'post_status'  => 'publish',
		);

		$post_id = wp_insert_post( $post );
		if ( 0 === $post_id || is_wp_error( $post_id ) ) {
			return new WP_Error(
				'font_post_creation_failed',
				__( 'Font post creation failed', 'gutenberg' )
			);
		}

		$this->id = $post_id;

		return $post_id;
	}

	/**
	 * Updates a post for a font family.
	 *
	 * @since 6.5.0
	 *
	 * @param WP_Post $post The post to update.
	 * @return int|WP_Error Post ID if the update was successful, WP_Error otherwise.
	 */
	private function update_font_post( $id, $post_content ) {

		$post = array(
			'ID'           => $id,
			'post_content' => $post_content,
		);

		$post_id = wp_update_post( $post );

		if ( 0 === $post_id || is_wp_error( $post_id ) ) {
			return new WP_Error(
				'font_post_update_failed',
				__( 'Font post update failed', 'gutenberg' )
			);
		}

		return $post_id;
	}

	/**
	 * Sanitizes the font family data using WP_Theme_JSON.
	 *
	 * @since 6.5.0
	 *
	 * @return array A sanitized font family definition.
	 */
	private function sanitize( $font_data ) {
		// Creates the structure of theme.json array with the new fonts.
		$fonts_json = array(
			'version'  => '2',
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array(
						'custom' => array(
							$font_data,
						),
					),
				),
			),
		);

		// Creates a new WP_Theme_JSON object with the new fonts to
		// leverage sanitization and validation.
		$fonts_json     = WP_Theme_JSON_Gutenberg::remove_insecure_properties( $fonts_json );
		$theme_json     = new WP_Theme_JSON_Gutenberg( $fonts_json );
		$theme_data     = $theme_json->get_data();
		$sanitized_font = ! empty( $theme_data['settings']['typography']['fontFamilies'] )
			? $theme_data['settings']['typography']['fontFamilies'][0]
			: array();

		$sanitized_font['slug']       = _wp_to_kebab_case( $sanitized_font['slug'] );
		$sanitized_font['fontFamily'] = WP_Font_Family_Utils::format_font_family( $sanitized_font['fontFamily'] );

		return $sanitized_font;
	}

	/**
	 * Checks whether the user has write permissions to the temp and fonts directories.
	 *
	 * @since 6.5.0
	 *
	 * @return true|WP_Error True if the user has write permissions, WP_Error object otherwise.
	 */
	private function has_write_permission() {
		// The update endpoints requires write access to the temp and the fonts directories.
		$temp_dir   = get_temp_dir();
		$upload_dir = WP_Font_Library::get_fonts_dir();
		if ( ! is_writable( $temp_dir ) || ! wp_is_writable( $upload_dir ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Downloads font face assets.
	 *
	 * Downloads the font face asset(s) associated with a font face. It works with
	 * both single source URLs and arrays of multiple source URLs.
	 *
	 * @since 6.5.0
	 *
	 * @param array $font_face The font face array containing the 'src' attribute
	 *                         with the source URL(s) of the assets.
	 * @return array The modified font face array with the new source URL(s) to
	 *               the downloaded assets.
	 */
	private function download_font_face_assets( $font_face ) {
		$sources              = (array) $font_face['downloadFromUrl'];
		$index                = 0;
		$new_src_collection = array();
		foreach ( $sources as $src ) {
			$suffix   = $index++ > 0 ? $index : '';
			$filename = WP_Font_Family_Utils::get_filename_from_font_face(
				$this->data['slug'],
				$font_face,
				$src,
				$suffix
			);


			$new_src  = $this->download_asset( $src, $filename );

			if( is_wp_error($new_src)) {
				return $new_src;
			}
			$new_src_collection[] = $new_src;
		}

		if ( count( $new_src_collection ) === 0 ) {
			return '';
		}
		else if ( count( $new_src_collection ) === 1 ) {
			return $new_src_collection[0];
		}

		return $new_src_collection;
	}

	/**
	 * Downloads a font asset from a specified source URL and saves it to
	 * the font directory.
	 *
	 * @since 6.5.0
	 *
	 * @param string $url      The source URL of the font asset to be downloaded.
	 * @param string $filename The filename to save the downloaded font asset as.
	 * @return string|WP_Error The relative path to the downloaded font asset.
	 *                      WP_Error if the download failed.
	 */
	private function download_asset( $url, $filename ) {
		// Checks if the file to be downloaded has a font mime type.
		if ( ! WP_Font_Family_Utils::has_font_mime_type( $filename ) ) {
			return false;
		}


		// Include file with download_url() if function doesn't exist.
		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		// Downloads the font asset or returns false.
		$temp_file = download_url( $url );
		if ( is_wp_error( $temp_file ) ) {
			return $temp_file;
		}

		$overrides = $this->get_upload_overrides( $filename );

		$file = array(
			'tmp_name' => $temp_file,
			'name'     => $filename,
		);

		add_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );
		add_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		$handled_file = wp_handle_upload( $file, $overrides );
		remove_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		remove_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );

		if ( array_key_exists( 'error', $handled_file ) ) {
			return new WP_Error( $handled_file['error'] . ' ' . $filename );
		}

		// Cleans the temp file.
		@unlink( $temp_file );

		// Returns the relative path to the downloaded font asset to be used as
		// font face src.
		return $handled_file['url'];
	}

	/**
	 * Moves an uploaded font face asset from temp folder to the fonts directory.
	 *
	 * This is used when uploading local fonts.
	 *
	 * @since 6.5.0
	 *
	 * @param array $font_face Font face to download.
	 * @param array $file      Uploaded file.
	 * @return array New font face with all assets downloaded and referenced in
	 *               the font face definition.
	 */
	private function move_font_face_asset( $font_face, $file ) {

		$new_font_face = $font_face;
		$filename      = WP_Font_Family_Utils::get_filename_from_font_face(
			$this->data['slug'],
			$font_face,
			$file['name']
		);

		// If the filename has no font mime type, don't move the file and
		// return the font face definition without src to be ignored later.
		if ( ! WP_Font_Family_Utils::has_font_mime_type( $filename ) ) {
			return $new_font_face;
		}

		// Move the uploaded font asset from the temp folder to the fonts directory.
		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$overrides = $this->get_upload_overrides( $filename );

		add_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );
		add_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		$handled_file = wp_handle_upload( $file, $overrides );
		remove_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		remove_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );

		if ( array_key_exists( 'error', $handled_file ) ) {
			return new WP_Error( $handled_file['error'] . ' ' . $filename );
		}

		return $handled_file['url'];
	}

	/**
	 * Gets the overrides for the 'wp_handle_upload' function.
	 *
	 * @since 6.5.0
	 *
	 * @param string $filename The filename to be used for the uploaded file.
	 * @return array The overrides for the 'wp_handle_upload' function.
	 */
	private function get_upload_overrides( $filename ) {
		return array(
			// Arbitrary string to avoid the is_uploaded_file() check applied
			// when using 'wp_handle_upload'.
			'action'                   => 'wp_handle_font_upload',
			// Not testing a form submission.
			'test_form'                => false,
			// Seems mime type for files that are not images cannot be tested.
			// See wp_check_filetype_and_ext().
			'test_type'                => true,
			'unique_filename_callback' => static function () use ( $filename ) {
				// Keep the original filename.
				return $filename;
			},
		);
	}

	/**
	 * Deletes all font face asset files associated with a given font face.
	 *
	 * @since 6.5.0
	 *
	 * @param array $font_face The font face array containing the 'src' attribute
	 *                         with the file path(s) to be deleted.
	 * @return bool True if delete was successful, otherwise false.
	 */
	private function delete_font_face_assets( $font_face ) {
		$sources = (array) $font_face['src'];
		foreach ( $sources as $src ) {
			//Skip if it's remotely hosted
			if( ! str_contains( $src, WP_Font_Library::get_fonts_dir() ) ){
				continue;
			}

			$filename  = basename( $src );
			$file_path = path_join( WP_Font_Library::get_fonts_dir(), $filename );
			wp_delete_file( $file_path );
		}

	}






































	/**
	 * Checks whether the font family has font faces defined.
	 *
	 * @since 6.5.0
	 *
	 * @return bool True if the font family has font faces defined, false otherwise.
	 */
	public function has_font_faces() {
		return ! empty( $this->data['fontFace'] ) && is_array( $this->data['fontFace'] );
	}

	/**
	 * Removes font family assets.
	 *
	 * @since 6.5.0
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
	 * @since 6.5.0
	 *
	 * @param bool $force Whether to force the deletion and bypass trass.
	 *
	 * @return bool|WP_Error True if the font family was uninstalled, WP_Error otherwise.
	 */
	public function uninstall( $force ) {
		if (
			! $this->remove_font_family_assets() ||
			! wp_delete_post( $this->id, $force )
		) {
			return new WP_Error(
				'font_family_not_deleted',
				__( 'The font family could not be deleted.', 'gutenberg' )
			);
		}

		return true;
	}
















	/**
	 * Downloads font face assets if the font family is a Google font,
	 * or moves them if it is a local font.
	 *
	 * @since 6.5.0
	 *
	 * @param array $files An array of files to be installed.
	 * @return bool True if the font faces were downloaded or moved successfully, false otherwise.
	 */
	private function download_or_move_font_faces( $files ) {
		if ( ! $this->has_font_faces() ) {
			return true;
		}

		$new_font_faces = array();
		foreach ( $this->data['fontFace'] as $font_face ) {
			// If the fonts are not meant to be downloaded or uploaded
			// (for example to install fonts that use a remote url).
			$new_font_face = $font_face;

			$font_face_is_repeated = false;

			// If the font face has the same fontStyle and fontWeight as an existing, continue.
			foreach ( $new_font_faces as $font_to_compare ) {
				if ( $new_font_face['fontStyle'] === $font_to_compare['fontStyle'] &&
					$new_font_face['fontWeight'] === $font_to_compare['fontWeight'] ) {
					$font_face_is_repeated = true;
				}
			}

			if ( $font_face_is_repeated ) {
				continue;
			}

			// If the font face requires the use of the filesystem, create the fonts dir if it doesn't exist.
			if ( ! empty( $font_face['downloadFromUrl'] ) && ! empty( $font_face['uploadedFile'] ) ) {
				wp_mkdir_p( WP_Font_Library::get_fonts_dir() );
			}

			// If installing google fonts, download the font face assets.
			if ( ! empty( $font_face['downloadFromUrl'] ) ) {
				$new_font_face = $this->download_font_face_assets( $new_font_face );
			}

			// If installing local fonts, move the font face assets from
			// the temp folder to the wp fonts directory.
			if ( ! empty( $font_face['uploadedFile'] ) && ! empty( $files ) ) {
				$new_font_face = $this->move_font_face_asset(
					$new_font_face,
					$files[ $new_font_face['uploadedFile'] ]
				);
			}

			/*
			 * If the font face assets were successfully downloaded, add the font face
			 * to the new font. Font faces with failed downloads are not added to the
			 * new font.
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
	 * Gets the font faces that are in both the existing and incoming font families.
	 *
	 * @since 6.5.0
	 *
	 * @param array $existing The existing font faces.
	 * @param array $incoming The incoming font faces.
	 * @return array The font faces that are in both the existing and incoming font families.
	 */
	private function get_intersecting_font_faces( $existing, $incoming ) {
		$intersecting = array();
		foreach ( $existing as $existing_face ) {
			foreach ( $incoming as $incoming_face ) {
				if ( $incoming_face['fontStyle'] === $existing_face['fontStyle'] &&
					$incoming_face['fontWeight'] === $existing_face['fontWeight'] &&
					$incoming_face['src'] !== $existing_face['src'] ) {
					$intersecting[] = $existing_face;
				}
			}
		}
		return $intersecting;
	}


	/**
	 * Installs the font family into the library.
	 *
	 * @since 6.5.0
	 *
	 * @param array $files Optional. An array of files to be installed. Default null.
	 * @return array|WP_Error An array of font family data on success, WP_Error otherwise.
	 */
	public function install( $files = null ) {
		add_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );
		add_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		$were_assets_written = $this->download_or_move_font_faces( $files );
		remove_filter( 'upload_dir', array( 'WP_Font_Library', 'set_upload_dir' ) );
		remove_filter( 'upload_mimes', array( 'WP_Font_Library', 'set_allowed_mime_types' ) );

		if ( ! $were_assets_written ) {
			return new WP_Error(
				'font_face_download_failed',
				__( 'The font face assets could not be written.', 'gutenberg' )
			);
		}

		// $post_id = $this->create_or_update_font_post();

		// if ( is_wp_error( $post_id ) ) {
		// 	return $post_id;
		// }

		return $this->get_data();
	}
}
