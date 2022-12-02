<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller_6_2 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Global Styles REST API Controller.
 */
class Gutenberg_REST_Global_Styles_Controller extends Gutenberg_REST_Global_Styles_Controller_6_0 {

	protected function download_font_face ( $font_face ) {
		// Download font asset in temp folder
		$font_asset_url = $font_face['src'][0];

		$file_extension = pathinfo($font_asset_url, PATHINFO_EXTENSION);
        $file_name = $font_face['fontFamily'].'_'.$font_face['fontStyle'].'_'.$font_face['fontWeight'].'.'.$file_extension;
		
		$theme_data = wp_get_theme();
		$theme_slug = $theme_data->get('TextDomain');
		
		$upload_dir = wp_upload_dir();
		$fonts_dir = $upload_dir['basedir'] . DIRECTORY_SEPARATOR . 'fonts' . DIRECTORY_SEPARATOR . $theme_slug . DIRECTORY_SEPARATOR;
		wp_mkdir_p( $fonts_dir );
		copy ( $font_asset_url, $fonts_dir . $file_name );

		$fonts_url_path = $upload_dir['baseurl']."/fonts/".$theme_slug."/".$file_name;
		
		$new_font_face =  $font_face;
		unset( $new_font_face['shouldBeDownloaded'] );
		$new_font_face['src'] = array ( $fonts_url_path );

		return $new_font_face;
	}

	protected function prepare_font_families_for_database( $font_families ) {
		$prepared_font_families = array();

		foreach ( $font_families as $font_family ) {
			if ( isset ( $font_family['fontFace'] ) ) {
				$new_font_faces = array();
				foreach ( $font_family['fontFace'] as $font_face ) {
					$updated_font_face = $font_face;
					if ( isset( $updated_font_face['shouldBeDownloaded'] ) ) {
						$updated_font_face = $this->download_font_face( $font_face );
					}
					$new_font_faces[] = $updated_font_face;
				}

				$font_family['fontFace'] = $new_font_faces;
			}

			$prepared_font_families[] = $font_family;
		}

		return $prepared_font_families;
	}

	/**
	 * Prepares a single global styles config for update.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$changes         = new stdClass();
		$changes->ID     = $request['id'];
		$post            = get_post( $request['id'] );
		$existing_config = array();
		if ( $post ) {
			$existing_config     = json_decode( $post->post_content, true );
			$json_decoding_error = json_last_error();
			if ( JSON_ERROR_NONE !== $json_decoding_error || ! isset( $existing_config['isGlobalStylesUserThemeJSON'] ) ||
				! $existing_config['isGlobalStylesUserThemeJSON'] ) {
				$existing_config = array();
			}
		}
		if ( isset( $request['styles'] ) || isset( $request['settings'] ) ) {
			$config = array();
			if ( isset( $request['styles'] ) ) {
				$config['styles'] = $request['styles'];
			} elseif ( isset( $existing_config['styles'] ) ) {
				$config['styles'] = $existing_config['styles'];
			}
			if ( isset( $request['settings'] ) ) {
				$config['settings'] = $request['settings'];
			} elseif ( isset( $existing_config['settings'] ) ) {
				$config['settings'] = $existing_config['settings'];
			}

			if ( isset ( $config['settings']['typography']['fontFamilies']['custom'] ) ) {
				$new_fonts = $this->prepare_font_families_for_database( $config['settings']['typography']['fontFamilies']['custom'] );
				$config['settings']['typography']['fontFamilies']['custom'] = $new_fonts;
			}

			$config['isGlobalStylesUserThemeJSON'] = true;
			$config['version']                     = WP_Theme_JSON_Gutenberg::LATEST_SCHEMA;
			$changes->post_content                 = wp_json_encode( $config );
		}
		// Post title.
		if ( isset( $request['title'] ) ) {
			if ( is_string( $request['title'] ) ) {
				$changes->post_title = $request['title'];
			} elseif ( ! empty( $request['title']['raw'] ) ) {
				$changes->post_title = $request['title']['raw'];
			}
		}
		return $changes;
	}

}
