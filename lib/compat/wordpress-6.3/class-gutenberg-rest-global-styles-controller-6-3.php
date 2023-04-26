<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Global Styles REST API Controller.
 */
class Gutenberg_REST_Global_Styles_Controller_6_3 extends Gutenberg_REST_Global_Styles_Controller_6_2 {
	/**
	 * Revision controller.
	 *
	 * @since 6.3.0
	 * @var WP_REST_Revisions_Controller
	 */
	private $revisions_controller;

	/**
	 * Prepares links for the request.
	 *
	 * @since 5.9.0
	 * @since 6.3 Adds revisions to version-history.
	 *
	 * @param integer $id ID.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $id ) {
		$base = sprintf( '%s/%s', $this->namespace, $this->rest_base );

		$links = array(
			'self' => array(
				'href' => rest_url( trailingslashit( $base ) . $id ),
			),
		);

		if ( post_type_supports( $this->post_type, 'revisions' ) ) {
			$revisions                = wp_get_latest_revision_id_and_total_count( $id );
			$revisions_count          = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
			$revisions_base           = sprintf( '/%s/%s/%d/revisions', $this->namespace, $this->rest_base, $id );
			$links['version-history'] = array(
				'href'  => rest_url( $revisions_base ),
				'count' => $revisions_count,
			);
		}

		return $links;
	}


	protected function get_font_file_extension ( $mime ) {
		$extensions = array(
			'font/ttf' => 'ttf',
			'font/woff' => 'woff',
			'font/woff2' => 'woff2',
		);
		if ( isset( $extensions[ $mime] ) ) {
			return $extensions[ $mime ];
		}
		throw new Exception('Mime type not allowed');
	}

	protected function base64_decode_file($data) {
		if(preg_match('/^data\:([a-zA-Z]+\/[a-zA-Z]+);base64\,([a-zA-Z0-9\+\/]+\=*)$/', $data, $matches)) {
			return [
					'mime' => $matches[1],
					'data' => base64_decode($matches[2]),
			];
		}
		return false;
	}

	protected function delete_custom_fonts () {
		$fonts_dir = $this->get_fonts_dir();
		$files = glob( $fonts_dir['basedir'] . '/*' );
		foreach ( $files as $file ) {
			if ( is_file( $file ) ) {
				unlink( $file );
			}
		}
	}

	protected function delete_font_asset ( $font_face ) {
		$fonts_dir = $this->get_fonts_dir();  
		foreach ( $font_face['src'] as $url ) {
			// TODO: make this work with relative urls too
			$filename = basename( $url );
			$filepath = $fonts_dir['basedir'] . $filename;
			if ( file_exists( $filepath ) ) {
				return unlink(
					$filepath
				);
			}
		}
		return false;
	}

	protected function get_fonts_dir () {
		$theme_data = wp_get_theme();
		$theme_slug = $theme_data->get('TextDomain');
		$upload_dir = wp_upload_dir();
		$fonts_dir = $upload_dir['basedir'] . DIRECTORY_SEPARATOR . 'fonts' . DIRECTORY_SEPARATOR . $theme_slug . DIRECTORY_SEPARATOR;
		$font_path = $upload_dir['baseurl']."/fonts/".$theme_slug."/".$file_name;
		return array (
			'basedir' => $fonts_dir,
			'baseurl' => $font_path,
		);
	}

	protected function write_font_face ( $font_face ) {
		$font_asset = $this->base64_decode_file( $font_face['base64'] );

		$file_extension = $this->get_font_file_extension( $font_asset[ 'mime' ] );
        $file_name = $font_face['fontFamily'].'_'.$font_face['fontStyle'].'_'.$font_face['fontWeight'].'.'.$file_extension;
		
		$fonts_dir = $this->get_fonts_dir();  		
		wp_mkdir_p( $fonts_dir['basedir'] );
		file_put_contents( $fonts_dir['basedir'] . $file_name, $font_asset['data'] );
		
		$new_font_face =  $font_face;
		unset( $new_font_face['shouldBeDecoded'] );
		unset( $new_font_face['base64'] );
		$font_url = $fonts_dir['baseurl'] . $file_name;
		$new_font_face['src'] = array ( $font_url );

		return $new_font_face;
	}

	protected function prepare_font_families_for_database( $font_families ) {
		$prepared_font_families = array();

		foreach ( $font_families as $font_family ) {
			if ( isset ( $font_family['fontFace'] ) ) {
				$new_font_faces = array();
				foreach ( $font_family['fontFace'] as $font_face ) {
					$updated_font_face = $font_face;
					if ( isset( $updated_font_face['shouldBeDecoded'] ) ) {
						$updated_font_face = $this->write_font_face( $font_face );
					}
					if ( !isset ( $font_face['shouldBeRemoved'] ) ) {
						$new_font_faces[] = $updated_font_face;
					} else {
						$this->delete_font_asset( $font_face );
					}
				}

				$font_family['fontFace'] = $new_font_faces;
			}
			if ( ! isset ( $font_family[ 'shouldBeRemoved' ] ) ) {
				$prepared_font_families[] = $font_family;
			}
			
		}

		return $prepared_font_families;
	}

	/**
	 * Prepares a single global styles config for update.
	 *
	 * @since 5.9.0
	 * @since 6.2.0 Added validation of styles.css property.
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
				if ( isset( $request['styles']['css'] ) ) {
					$validate_custom_css = $this->validate_custom_css( $request['styles']['css'] );
					if ( is_wp_error( $validate_custom_css ) ) {
						return $validate_custom_css;
					}
				}
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
			} else {
				$this->delete_custom_fonts();
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
