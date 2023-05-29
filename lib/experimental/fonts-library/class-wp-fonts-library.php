<?php

include(ABSPATH . "wp-admin/includes/admin.php");
class WP_Fonts_Library {

    private $wp_fonts_dir;

    public function __construct() {
        $this->wp_fonts_dir = path_join( WP_CONTENT_DIR, 'fonts' );
        $this->relative_fonts_path = site_url('/wp-content/fonts/', 'relative');

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


    function register_routes () {
        
        register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fonts_library' ),
					'permission_callback' => array( $this, 'fonts_library_permissions_check' ),
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
					'permission_callback' => array( $this, 'fonts_library_permissions_check' ),
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
					'permission_callback' => array( $this, 'fonts_library_permissions_check' ),
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
					'permission_callback' => array( $this, 'fonts_library_permissions_check' ),
				),
			)
		);

    }

    /**
     * Check if user has permissions to use fonts library
     *
     * @return bool
     */
    function fonts_library_permissions_check () {
        return current_user_can( 'edit_posts' );
    }

    /**
     * Gets the fonts library post content
     * 
     * @return WP_REST_Response
     */
    function get_fonts_library () {
        $post = $this->query_fonts_library();
        return new WP_REST_Response( $post->post_content );
    }

    /**
     * Query fonts library post
     *
     * @return WP_Post
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
        return $post;
    }

    /**
     * Updates the fonts library post content.
     *
     * Updates the content of the fonts library post with a new list of fonts families.
     *
     * @param array $new_fonts_families The new list of fonts families to replace the current content of the fonts library post.
     * @return WP_REST_Response The updated fonts library post content wrapped in a WP_REST_Response object.
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
        $new_post = $this->query_fonts_library();
        return new WP_REST_Response( $new_post->post_content );
    }

    /**
     * Fetches the Google Fonts JSON file.
     *
     * Reads the "google-fonts.json" file from the file system and returns its content.
     *
     * @return WP_REST_Response The content of the "google-fonts.json" file wrapped in a WP_REST_Response object.
     */
    function get_google_fonts () {
        $file = file_get_contents(
            path_join ( dirname(__FILE__),"google-fonts.json" )
        );
        return new WP_REST_Response( json_decode( $file ) );
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
                $this->delete_asset($src);
            }
        } else {
            $this->delete_asset( $font_face['src'] );
        }
    }

    /**
     * Downloads a font asset.
     *
     * Downloads a font asset from a specified source URL and saves it to the font directory.
     *
     * @param string $src The source URL of the font asset to be downloaded.
     * @param string $filename The filename to save the downloaded font asset as.
     * @return string The relative path to the downloaded font asset.
     */
    function download_asset( $src, $filename ) {
        wp_mkdir_p( $this->wp_fonts_dir );
        $file_path = path_join( $this->wp_fonts_dir, $filename );
        $file = download_url( $src );
        rename( $file, $file_path );
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
            $filename = "{$filename}_{$i}";
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
    function download_font_face_asset ( $font_face ) {
        $new_font_face = $font_face;
        if ( is_array( $font_face['src'] ) ) {
            $new_font_face['src'] = array();
            $i;
            foreach ( $font_face['src'] as $src ) {
                !$i ? $i = 0 : $i++;
                $filename = $this->get_filename_from_font_face( $font_face, $src, $i );
                $new_src = $this->download_asset($src, $filename);
                $new_font_face['src'][] = $new_src;
            }
        } else {
            $filename = $this->get_filename_from_font_face( $font_face, $font_face['src'] );
            $new_font_face['src'] = $this->download_asset( $font_face['src'], $filename );
        }
        return $new_font_face;
    }

    /**
     * Uninstalls a font family.
     *
     * Removes a font family from the fonts library and deletes its associated font face assets.
     *
     * @param WP_REST_Request $request The request object containing the font family to uninstall in the request parameters.
     * @return WP_REST_Response The updated fonts library post content.
     */
    function uninstall_font_family ( $request ) {
        $post = $this->query_fonts_library();
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
     * @return WP_REST_Response The updated fonts library post content.
     */
    function install_fonts ( $request ) {
        $post = $this->query_fonts_library();
        $post_content = $post->post_content;
        $library = json_decode( $post_content, true );
        $font_families = $library['fontFamilies'];


        $fonts_to_install = $request->get_param('fontFamilies');
        if ( is_string( $fonts_to_install ) ) {
            // If we are receiving form data (as we to upload local fonts), the font families are encoded as a string.
            $fonts_to_install = json_decode( $fonts_to_install, true );
        }

        $files = $request->get_file_params();

        $new_fonts = $this->install_new_fonts( $fonts_to_install, $files );
        $new_library_fonts = $this->merge_fonts( $font_families, $new_fonts );
        return $this->update_fonts_library( $new_library_fonts );
    }

    /**
     * Install new fonts in the library
     *
     * @param array $fonts Fonts to install.
     * @return array New fonts with all assets downloaded and referenced in the font families definition.
     */
    function install_new_fonts ( $fonts, $files ) {
        $new_fonts = array();
        foreach ( $fonts as $font ) {
            $new_font = $font;
            if ( isset( $font['fontFace'] ) ) {
                $new_font_faces = array();
                foreach ( $font['fontFace'] as $font_face ) {
                    $new_font_face;
                    if ( empty($files) ){
                        $new_font_face = $this->download_font_face_asset( $font_face );
                    } else {
                        $new_font_face = $this->move_font_face_asset( $font_face, $files[ $font_face[ 'file' ] ] );
                    }
                    
                    $new_font_faces[] = $new_font_face;
                }
                $new_font['fontFace'] = $new_font_faces;
            }
            $new_fonts[] = $new_font;
        }
        return $new_fonts;
    }

    function move_font_face_asset ( $font_face, $file ) {
        $new_font_face = $font_face;
        $filename =  $this->get_filename_from_font_face( $font_face, $file['name'] );
        $filepath= path_join( $this->wp_fonts_dir, $filename );
        $success = move_uploaded_file( $file['tmp_name'], $filepath );

        if ( $success ) {
            unset($new_font_face['file']);
            $new_font_face['src'] = "{$this->relative_fonts_path}{$filename}";
            return $new_font_face;
        }
        
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