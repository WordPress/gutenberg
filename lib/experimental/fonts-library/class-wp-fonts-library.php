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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fonts_library' ),
					'permission_callback' => array( $this, 'read_fonts_library_permissions_check' ),
				),
			)
		);

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
     * Gets the fonts library post content
     * 
     * @return WP_REST_Response|WP_Error
     */
    function get_fonts_library () {
        $post = $this->query_fonts_library();
        if ( is_wp_error( $post ) ) {
            return $post;
        }
        return new WP_REST_Response( $post->post_content );
    }

     /**
     * Query fonts library post
     *
     * @return WP_Post|WP_Error
     */
    private function query_fonts_library () {
        // Try to get the fonts library post
        $wp_fonts_library_query = new WP_Query( $this->base_post_query );
        if ( $wp_fonts_library_query->have_posts() ) {
            $post = $wp_fonts_library_query->posts[0];
            return $post;
        }

        // Create empty post if there are no post
        $args = $this->base_post_query;
        $args['post_content'] = '{"fontFamilies":[]}';
        $post_id = wp_insert_post( $args );
        $post = get_post( $post_id );
        if ( ! $post ) {
            return new WP_Error(
				'rest_cant_create_fonts_library',
				__( 'Error creating fonts library post.' ),
				array( 'status' => 500 )
			);
        }
        return $post;
    }

    /**
     * Updates the fonts library post content.
     *
     * Updates the content of the fonts library post with a new list of fonts families.
     *
     * @param array $new_fonts_families The new list of fonts families to replace the current content of the fonts library post.
     * @return WP_REST_Response|WP_Error The updated fonts library post content wrapped in a WP_REST_Response object.
     */
    function update_fonts_library ( $new_fonts_families ) {
        $post = $this->query_fonts_library();
        $new_fonts_library = array (
            'fontFamilies' => $new_fonts_families,
        );
        $updated_post_data = array (
            'ID' => $post->ID,
            'post_content' => wp_json_encode( $new_fonts_library ),
        );
        $updated_post = wp_update_post( $updated_post_data );
        if ( is_wp_error( $updated_post ) ){
            return $updated_post;
        }
        $new_post = $this->query_fonts_library();
        if ( is_wp_error( $new_post ) ){
            return $new_post;
        }
        return new WP_REST_Response( $new_post->post_content );
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

        return wp_delete_file( $file_path );
    }

    /**
     * Deletes all font face asset files associated with a given font face.
     *
     * @param array $font_face The font face array containing the 'src' attribute with the file path(s) to be deleted.
     */
    function delete_font_face_assets ( $font_face ) {
        if ( is_array( $font_face['src'] ) ) {
            foreach ( $font_face['src'] as $src ) {
                $was_assets_removed = $this->delete_asset($src);
                if ( ! $was_assets_removed ) {
                    // Bail if any of the assets could not be removed
                    return false;
                }
            }
            return true;
        } else {
            return $this->delete_asset( $font_face['src'] );
        }
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
        if ( ! $renamed_file ) {
            @unlink( $temp_file );
            return false;
        }

        // Cleans the temp file
        @unlink( $temp_file );

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
     * @param int $i Optional counter for appending to the filename, default is 0.
     * @return string The generated filename for the font face asset.
     */
    function get_filename_from_font_face ( $font_face, $url, $i=0 ) {
        $extension = pathinfo( $url, PATHINFO_EXTENSION );
        $family = sanitize_title( $font_face['fontFamily'] );
        $style = sanitize_title( $font_face['fontStyle'] );
        $weight = sanitize_title( $font_face['fontWeight'] );
        $filename = "{$family}_{$style}_{$weight}";
        if ($i > 0) {
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
        if ( is_array( $font_face['src'] ) ) {
            $new_font_face['src'] = array();
            $i;
            foreach ( $font_face['src'] as $src ) {
                !$i ? $i = 0 : $i++;
                $filename = $this->get_filename_from_font_face( $font_face, $src, $i );
                $new_src = $this->download_asset($src, $filename);
                if ( $new_src ) {
                    $new_font_face['src'][] = $new_src;
                }
            }
        } else {
            $filename = $this->get_filename_from_font_face( $font_face, $font_face['src'] );
            $new_src = $this->download_asset( $font_face['src'], $filename );
            if ( $new_src ) {
                $new_font_face['src'] = $new_src;
            }
        }
        return $new_font_face;
    }

    /**
     * Uninstalls a font family.
     *
     * Removes a font family from the fonts library and deletes its associated font face assets.
     *
     * @param WP_REST_Request $request The request object containing the font family to uninstall in the request parameters.
     * @return WP_REST_Response|WP_Error The updated fonts library post content.
     */
    function uninstall_font_family ( $request ) {
        $post = $this->query_fonts_library();
        if ( is_wp_error( $post ) ) {
            return $post;
        }
        $post_content = $post->post_content;
        $library = json_decode( $post_content, true );
        $font_families = $library['fontFamilies'];

        $font_to_uninstall = $request->get_json_params();
        $new_font_families = $this->remove_font_family( $font_families, $font_to_uninstall );
        
        return $this->update_fonts_library( $new_font_families );
    }

    /**
     * Removes a font family.
     *
     * Removes a font family from an array of font families. If the font family to remove contains font face 
     * definitions, the associated assets are deleted.
     *
     * @param array $font_families The current array of font families.
     * @param array $font_to_uninstall The font family to remove from the font families array.
     * @return array The updated array of font families.
     */
    function remove_font_family ( $font_families, $font_to_uninstall ) {
        $new_font_families = array();
        foreach ( $font_families as $font_family ) {
            if ( $font_family['slug'] !== $font_to_uninstall['slug'] ) {
                $new_font_families[] = $font_family;
            } else {
                if ( isset ( $font_family['fontFace'] ) ){
                    foreach( $font_family['fontFace'] as $font_face ) {
                        $this->delete_font_face_assets( $font_face );
                    }
                }
            }
        }
        return $new_font_families;
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
        // Get existing font families
        $post = $this->query_fonts_library();
        if ( is_wp_error( $post ) ) {
            return $post;
        }
        $post_content = $post->post_content;
        $library = json_decode( $post_content, true );
        $font_families = $library['fontFamilies'];

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
            // Updates the fonts library with the new successfully downloaded fonts.
            $new_library_fonts = $this->merge_fonts( $font_families, $new_fonts );

            // Sanitizes the fonts library using WP_Theme_JSON
            $sanitized_font_families = $this->sanitize_font_families( $new_library_fonts );

            // Updates the fonts library post content and returns it
            return $this->update_fonts_library( $new_library_fonts );
        }
        
        return new WP_Error( 'error_installing_fonts', __( 'Error installing fonts. No font was installed.' ), array( 'status' => 500 ) );
    }

    /**
     * Sanitizes the font families data using WP_Theme_JSON.
     *
     * @param array $font_families An array of font families.
     * @return array A sanitized array of font families.
     */
    function sanitize_font_families ( $font_families ) {
        // Creates the structure of theme.json array with the new fonts
        $fonts_json = array(
            'version' => '2',
            'settings' => array(
                'typography' => array(
                    'fontFamilies' => $font_families
                )
            )
        );
        // Creates a new WP_Theme_JSON object with the new fonts to mmake profit of the sanitization and validation
        $theme_json = new WP_Theme_JSON( $fonts_json );
        $theme_data = $theme_json->get_data();
        $sanitized_font_families = !empty( $theme_data['settings']['typography']['fontFamilies'] )
            ? $theme_data['settings']['typography']['fontFamilies']
            : array();
        return $sanitized_font_families;
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
                    $new_font_face;

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
     * Merge new fonts with existing fonts
     *
     * @param array $current_fonts Fonts already installed.
     * @param array $add_fonts Fonts to be installed.
     * @return array Merged current fonts + new fonts.
     */
    function merge_fonts ( $current_fonts, $add_fonts ) {
        $new_fonts = $current_fonts;
        // Search if there is a font family with the same slug in the current fonts. If there is, add the new fontFace definitions to the current font face and if there is not, add the new font family to the current fonts.
        foreach ( $add_fonts as $add_font ) {
            $existing_font = array_search( $add_font['slug'], array_column( $new_fonts, 'slug' ) );

            if ( $existing_font === false ) {
                $new_fonts[] = $add_font;
            } else {
                $current_font_faces = $new_fonts[$existing_font]['fontFace'];
                $add_font_faces = $add_font['fontFace'];

                if ( $add_font['fontFace'] ){
                    $new_font_faces = array_merge($current_font_faces, $add_font_faces);
                    $new_font_faces = array_map("unserialize", array_unique(array_map("serialize", $new_font_faces)));
                    $new_fonts[$existing_font]['fontFace'] = $new_font_faces;
                } else {
                    $new_fonts[] = $current_fonts[ $existing_font ];
                }
            }  

        }
        return $new_fonts;
    }

}

function fonts_library_register_routes () {
	$fonts_library = new WP_Fonts_Library_Controller();
	$fonts_library->register_routes();
}

add_action( 'rest_api_init', 'fonts_library_register_routes' );