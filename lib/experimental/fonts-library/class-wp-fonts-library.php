<?php
include(ABSPATH . "wp-admin/includes/admin.php");

/**
 * Font library class.
 *
 * @package gutenberg
 * @since x.x.x
 * 
 */
class WP_Fonts_Library_Controller extends WP_REST_Controller {
    
    private $wp_fonts_dir;
    private $relative_fonts_path;
    private $post_type;
    private $post_name;
    private $post_title;
    private $post_status;
    private $base_post_query;

    public function __construct() {
        $this->wp_fonts_dir = path_join( WP_CONTENT_DIR, 'fonts' );
        $this->relative_fonts_path = content_url('/fonts/');

		$this->rest_base        = 'fonts_library';
		$this->namespace        = 'wp/v2';

        $this->post_type        = 'wp_fonts_library';
        $this->post_name        = 'wp_fonts_library';
        $this->post_title       = 'Fonts Library'; // Do not translate
        $this->post_status      = 'publish';

        $this->base_post_query  = array  (
            'post_type'      => $this->post_type,
            'post_title'     => $this->post_title,
            'post_status'    => $this->post_status,
            'post_name'      => $this->post_name,
            'name'           => $this->post_name,
            'posts_per_page' => 1,
        );
	}

	const ALLOWED_FONT_MIME_TYPES = array(
		'otf'   => 'font/otf',
		'ttf'   => 'font/ttf',
		'woff'  => 'font/woff',
		'woff2' => 'font/woff2',
	);

    public function register_routes () {
        register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'install_fonts' ),
					'permission_callback' => array( $this, 'update_fonts_library_permissions_check' ),
				),
			)
		);

        register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'uninstall_font_family' ),
					'permission_callback' => array( $this, 'update_fonts_library_permissions_check' ),
				),
			)
		);
        register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/google_fonts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_google_fonts' ),
					'permission_callback' => array( $this, 'read_fonts_library_permissions_check' ),
				),
			)
		);

    }

    /**
     * Removes a font family from the fonts library and all their assets
     *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
    function uninstall_font_family ( $request ) {
        $post = get_post( $request['id'] );

        if ( ! $post ) {
            return new WP_Error(
                'font_family_invalid_id',
                __( 'Invalid font family ID.' ),
                array(
                    'status' => 404,
                )
            );
        }

        $font_family = json_decode( $post->post_content, true );
        $were_assets_removed = $this->remove_font_family_assets( $font_family );
        $was_post_deleted = wp_delete_post ( $request['id'], true );

        if ( $was_post_deleted  === null || $were_assets_removed === false ) {
            return new WP_Error(
                'font_family_delete_error',
                __( 'Error: Could not delete font family.' ),
                array(
                    'status' => 500,
                )
            );
        }

        return new WP_REST_Response( true );
    }


    /**
     * Removes font family assets
     *
     * @param array $font_family
     * @return bool True if assets were removed, false otherwise.
     */
    function remove_font_family_assets ( $font_family ) {
        if ( isset( $font_family['fontFace'] ) ) {
            foreach ( $font_family['fontFace'] as $font_face ) {
                $were_assets_removed = $this->delete_font_face_assets( $font_face );
                if ( $were_assets_removed === false ) {
                    return false;
                }
            }
        }
        return true;
    }

	/**
	 * Returns whether the given file has a font MIME type.
	 *
	 * @param string $filepath The file to check.
	 * @return bool True if the file has a font MIME type, false otherwise.
	 */
	function has_font_mime_type( $filepath ) {
		$filetype = wp_check_filetype( $filepath, self::ALLOWED_FONT_MIME_TYPES );
		return in_array( $filetype['type'], self::ALLOWED_FONT_MIME_TYPES, true );
	}

    /**
     * Check if user has permissions to update the fonts library
     *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has write access for the item, WP_Error object otherwise.
	 */
    function update_fonts_library_permissions_check ( $request ) {
        if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_update_fonts_library',
				__( 'Sorry, you are not allowed to update the fonts library on this site.' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}
        
        // Create fonts directory if it doesn't exist
        wp_mkdir_p( $this->wp_fonts_dir );

        // The update endpoints requires write access to the temp and the fonts directories
        $temp_dir = get_temp_dir();
        if ( ! is_writable( $temp_dir ) || ! wp_is_writable( $this->wp_fonts_dir ) ) {
            return new WP_Error(
                'rest_cannot_write_fonts_folder',
                __( 'Error: WordPress does not have permission to write the fonts folder on your server.' ),
                array(
                    'status' => 500,
                )
            );
        }

		return true;
    }

    /**
     * Check if user has permissions to read the fonts library
     *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
    function read_fonts_library_permissions_check ( $request ) {
        if ( !current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_cannot_read_fonts_library',
				__( 'Sorry, you are not allowed to read the fonts library on this site.' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
    }

    /**
     * Fetches the Google Fonts JSON file.
     *
     * Reads the "google-fonts.json" file from the file system and returns its content.
     *
     * @return WP_REST_Response|WP_Error The content of the "google-fonts.json" file wrapped in a WP_REST_Response object.
     */
    function get_google_fonts () {
        $file = file_get_contents(
            path_join ( dirname(__FILE__),"google-fonts.json" )
        );
        if ( $file ) {
            return new WP_REST_Response( json_decode( $file ) );
        }
        return new WP_Error(
            'rest_cant_read_google_fonts',
            __( 'Error reading Google Fonts JSON file.' ),
            array( 'status' => 500 )
        );
    }

    /**
     * Deletes a specified font asset file from the fonts directory.
     *
     * @param string $src The path of the font asset file to delete.
     * @return bool Whether the file was deleted.
     */
    function delete_asset( $src ) {
        $filename = basename( $src );
        $file_path = path_join( $this->wp_fonts_dir, $filename );

        if ( ! file_exists( $file_path ) ) {
            return false;
        }

        wp_delete_file( $file_path );

        // If the file still exists after trying to delete it, return false
        if ( file_exists( $file_path ) ) {
            return false;
        }
        
        // return true if the file was deleted
        return true;
    }

    /**
     * Deletes all font face asset files associated with a given font face.
     *
     * @param array $font_face The font face array containing the 'src' attribute with the file path(s) to be deleted.
     */
    function delete_font_face_assets ( $font_face ) {
        $srcs = !empty ( $font_face['src'] ) && is_array( $font_face['src'] )
            ? $font_face['src']
            : array( $font_face['src'] );
        foreach ( $srcs as $src ) {
            $was_asset_removed = $this->delete_asset($src);
            if ( ! $was_asset_removed ) {
                // Bail if any of the assets could not be removed
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
    function download_asset( $src, $filename ) {
        $file_path = path_join( $this->wp_fonts_dir, $filename );

        // Checks if the file to be downloaded has a font mime type
        if ( ! $this->has_font_mime_type( $file_path ) ) {
            return false;
        }

        // Downloads the font asset or returns false
        $temp_file = download_url( $src );
        if ( is_wp_error( $temp_file ) ) {
            @unlink( $temp_file );
            return false;
        }

        // Moves the file to the fonts directory or return false
        $renamed_file = rename( $temp_file, $file_path );
        // Cleans the temp file
        @unlink( $temp_file );
        
        if ( ! $renamed_file ) {            
            return false;
        }

        // Returns the relative path to the downloaded font asset to be used as font face src
        return "{$this->relative_fonts_path}{$filename}";
    }

    /**
     * Generates a filename for a font face asset.
     *
     * Creates a filename for a font face asset using font family, style, weight and extension information.
     *
     * @param array $font_face The font face array containing 'fontFamily', 'fontStyle', and 'fontWeight' attributes.
     * @param string $url The URL of the font face asset, used to derive the file extension.
     * @param int $i Optional counter for appending to the filename, default is 1.
     * @return string The generated filename for the font face asset.
     */
    function get_filename_from_font_face ( $font_face, $url, $i=1 ) {
        $extension = pathinfo( $url, PATHINFO_EXTENSION );
        $family = sanitize_title( $font_face['fontFamily'] );
        $style = sanitize_title( $font_face['fontStyle'] );
        $weight = sanitize_title( $font_face['fontWeight'] );
        $filename = "{$family}_{$style}_{$weight}";
        if ($i > 1) {
            $filename .= "_{$i}";
        }
        return "{$filename}.{$extension}";
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
    function download_font_face_assets ( $font_face ) {
        $new_font_face = $font_face;
        $srcs = !empty ( $font_face['src'] ) && is_array( $font_face['src'] )
            ? $font_face['src']
            : array( $font_face['src'] );
        $new_font_face['src'] = array();
        $i = 0;
        foreach ( $srcs as $src ) {              
            $filename = $this->get_filename_from_font_face( $font_face, $src, $i++ );
            $new_src = $this->download_asset($src, $filename);
            if ( $new_src ) {
                $new_font_face['src'][] = $new_src;
            }
        }
        if ( count( $new_font_face['src'] ) === 1 ) {
            $new_font_face['src'] = $new_font_face['src'][0];
        }
        return $new_font_face;
    }

    function get_font_post ( $font ) {
        $args = array (
            'post_type' => $this->post_type,
            'post_name' => $font['slug'],
            'name' => $font['slug'],
            'posts_per_page' => 1,
        );

        $posts_query = new WP_Query( $args );

        if ( $posts_query->have_posts() ) {
            $post = $posts_query->posts[0];
            return $post;
        }

        return null;
    }

    /**
     * Create a post for a font family
     *
     * @param array $font_family
     * @return int
     */
    function create_font_post ( $font_family ) {
        $post = array(
            'post_title' => $font_family['name'],
            'post_name' => $font_family['slug'],
            'post_type' => $this->post_type,
            'post_content' => json_encode( $font_family ),
            'post_status' => 'publish',
        );
        $post_id = wp_insert_post( $post );
        if ( $post_id === 0 ) {
            return WP_Error( 'font_post_creation_failed', __( 'Font post creation failed', 'wp-fonts' ) );
        }
        return $post_id;
    }

    /**
     * @param array $font_family  
     * @param WP_Post $post
     * @return int
     */
    function update_font_post ( $font_family, $post ) {
        $existing_font = json_decode( $post->post_content, true );
        $new_font = $this->merge_fonts( $existing_font, $font_family );

        $post = array(
            'ID' => $post->ID,
            'post_content' => json_encode( $new_font ),
        );

        $post_id = wp_update_post( $post );
        return $post_id;
    }

    /**
     * Creates a post for a font in the fonts library if it doesn't exist, or updates it if it does.
     * 
     * @param array $font_family
     * @return WP_Post
     */
    function create_or_update_font_post ( $font_family ) {
        $post = $this->get_font_post( $font_family );

        if ( $post ) {
            // update post
            return $this->update_font_post( $font_family, $post );
        } 

        // create post
        $new_post =  $this->create_font_post( $font_family );
        return $new_post;
    }

    /**
     * Installs new fonts.
     *
     * Takes a request containing new fonts to install, downloads their assets, and adds them to the fonts library.
     *
     * @param WP_REST_Request $request The request object containing the new fonts to install in the request parameters.
     * @return WP_REST_Response|WP_Error The updated fonts library post content.
     */
    function install_fonts ( $request ) {
        // Get new fonts to install
        $fonts_to_install = $request->get_param('fontFamilies');
        if ( is_string( $fonts_to_install ) ) {
            // If we are receiving form data (as we to upload local fonts), the font families are encoded as a string.
            $fonts_to_install = json_decode( $fonts_to_install, true );
        }

        if ( empty ( $fonts_to_install ) ) {
            return new WP_Error( 'no_fonts_to_install', __( 'No fonts to install' ), array( 'status' => 400 ) );
        }

        //  Get uploaded files (used when installing local fonts)
        $files = $request->get_file_params();

        // Download or move the new fonts assets to the fonts folder
        $new_fonts = $this->download_or_move_fonts( $fonts_to_install, $files );

        if ( ! empty ( $new_fonts )  ){
            foreach ( $new_fonts as $new_font ) {
                $sanitized_font = $this->sanitize_font( $new_font );
                $this->create_or_update_font_post( $sanitized_font );
            }
            return new WP_REST_Response( $new_fonts );
        }
      
        return new WP_Error( 'error_installing_fonts', __( 'Error installing fonts. No font was installed.' ), array( 'status' => 500 ) );
    }

    /**
     * Sanitizes the font family data using WP_Theme_JSON.
     *
     * @param array $font A font family definition.
     * @return array A sanitized font family defintion.
     */
    function sanitize_font ( $font ) {
        // Creates the structure of theme.json array with the new fonts
        $fonts_json = array(
            'version' => '2',
            'settings' => array(
                'typography' => array(
                    'fontFamilies' => array( $font )
                )
            )
        );
        // Creates a new WP_Theme_JSON object with the new fonts to mmake profit of the sanitization and validation
        $theme_json = new WP_Theme_JSON( $fonts_json );
        $theme_data = $theme_json->get_data();
        $sanitized_font = !empty( $theme_data['settings']['typography']['fontFamilies'] )
            ? $theme_data['settings']['typography']['fontFamilies'][0]
            : array();
        return $sanitized_font;
    }

    /**
     * Download or move new font assets to the fonts folder
     *
     * @param array $fonts Fonts to install.
     * @param array $files Uploaded files (used when installing local fonts).
     * 
     * @return array New fonts with all assets downloaded referenced in the font families definition.
     */
    function download_or_move_fonts ( $fonts, $files ) {
        $new_fonts = array();
        foreach ( $fonts as $font ) {
            $new_font = $font;
            if ( isset( $font['fontFace'] ) ) {
                $new_font_faces = array();
                foreach ( $font['fontFace'] as $font_face ) {
                    
                    if ( empty( $files ) ){ 
                        // If we are installing local fonts, we need to move the font face assets from the temp folder to the wp fonts directory
                        $new_font_face = $this->download_font_face_assets( $font_face );
                    } else {
                        // If we are installing google fonts, we need to download the font face assets
                        $new_font_face = $this->move_font_face_asset( $font_face, $files[ $font_face[ 'file' ] ] );
                    }
                    
                    // If the font face assets were successfully downloaded, we add the font face to the new font.
                    // Font faces with failed downloads are not added to the new font
                    if ( !empty ( $new_font_face['src'] ) ){
                        $new_font_faces[] = $new_font_face;
                    }
                    
                }

                $new_font['fontFace'] = $new_font_faces;
            }

            // If the font face assets were successfully downloaded, we add the font to the new fonts array.
            // Fonts without no font faces successfully downloaded are not added to the new fonts array
            if ( ! empty ( $new_font['fontFace'] ) ){
                $new_fonts[] = $new_font;
            }
            
        }
        return $new_fonts;
    }

    /**
     * Move an uploaded font face asset from temp folder to the wp fonts directory
     * 
     * This is used when uploading local fonts
     *
     * @param array $font_face Font face to download.
     * @return array New font face with all assets downloaded and referenced in the font face definition.
     */
    function move_font_face_asset ( $font_face, $file ) {
        $new_font_face = $font_face;
        $filename =  $this->get_filename_from_font_face( $font_face, $file['name'] );
        $filepath= path_join( $this->wp_fonts_dir, $filename );

        // Remove the uploaded font asset reference from the font face definition because it is no longer needed.
        unset( $new_font_face['file'] );

        // If the filepath has not a font mime type, we don't move the file and return the font face definition without src to be ignored later
        if ( ! $this->has_font_mime_type( $filepath ) ) {
            return $new_font_face;
        }

        // Move the uploaded font asset from the temp folder to the wp fonts directory
        $file_was_moved = move_uploaded_file( $file['tmp_name'], $filepath );
        
        if ( $file_was_moved ) {
            // If the file was successfully moved, we update the font face definition to reference the new file location
            $new_font_face['src'] = "{$this->relative_fonts_path}{$filename}";
        }

        return $new_font_face;
    }


    /**
     * Merges two fonts and their font faces.
     *
     * @param array $font1 The first font to merge.
     * @param array $font2 The second font to merge.
     *
     * @return array The merged font.
     */
    function merge_fonts ( $font1, $font2 ) {
        $font_faces_1 = $font1['fontFace'] ?? array();
        $font_faces_2 = $font2['fontFace'] ?? array();

        $merged_font_faces = array_merge( $font_faces_1, $font_faces_2 );
        $merged_font_faces = array_map("unserialize", array_unique(array_map("serialize", $merged_font_faces)));
        
        $merged_font = array_merge( $font1, $font2 );
        $merged_fonts = array_unique( $merged_font );
        $merged_font['fontFace'] = $merged_font_faces;

        return $merged_font;
    }

    function register_post_type () {
        $args = array(
            'public' => true,
            'label'  => 'Font Library',
            'show_in_rest' => true,
        );
        register_post_type( 'wp_fonts_library', $args );
    }

}

function fonts_library_register_routes () {
	$fonts_library = new WP_Fonts_Library_Controller();
	$fonts_library->register_routes();
    $fonts_library->register_post_type();
}

add_action( 'rest_api_init', 'fonts_library_register_routes' );