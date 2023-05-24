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

    function fonts_library_permissions_check () {
        return true;
        // return current_user_can( 'edit_posts' );
    }

    function get_fonts_library () {
        $post = $this->query_fonts_library();
        return new WP_REST_Response( $post->post_content );
    }

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

    function get_google_fonts () {
        $file = file_get_contents(
            path_join ( dirname(__FILE__),"google-fonts.json" )
        );
        $data = json_decode($file, true);
        return new WP_REST_Response( $data );
    }

    function delete_asset( $src ) {
        $filename = basename( $src );
        $file_path = path_join( $this->wp_fonts_dir, $filename );
        return wp_delete_file( $file_path );
    }

    function delete_font_face_assets ( $font_face ) {
        if ( is_array( $font_face['src'] ) ) {
            foreach ( $font_face['src'] as $src ) {
                $this->delete_asset($src);
            }
        } else {
            $this->delete_asset( $font_face['src'] );
        }
    }

    function download_asset( $src, $filename ) {
        wp_mkdir_p( $this->wp_fonts_dir );
        $file_path = path_join( $this->wp_fonts_dir, $filename );
        $file = download_url( $src );
        rename( $file, $file_path );
        return "{$this->relative_fonts_path}{$filename}";
    }

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

    function uninstall_font_family ( $request ) {
        $post = $this->query_fonts_library();
        $post_content = $post->post_content;
        $library = json_decode( $post_content, true );
        $font_families = $library['fontFamilies'];

        $font_to_uninstall = $request->get_json_params();
        $new_font_families = $this->remove_font_family( $font_families, $font_to_uninstall );
        return $this->update_fonts_library( $new_font_families );
    }

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

    function install_fonts ( $request ) {
        $post = $this->query_fonts_library();
        $post_content = $post->post_content;
        $library = json_decode( $post_content, true );
        $font_families = $library['fontFamilies'];

        $fonts_to_install = $request->get_json_params();
        $new_fonts = $this->install_new_fonts( $fonts_to_install );
        $new_library_fonts = $this->merge_fonts( $font_families, $new_fonts );
        return $this->update_fonts_library( $new_library_fonts );
    }

    function install_new_fonts ( $fonts ) {
        $new_fonts = array();
        foreach ( $fonts as $font ) {
            $new_font = $font;
            if ( isset( $font['fontFace'] ) ) {
                $new_font_faces = array();
                foreach ( $font['fontFace'] as $font_face ) {
                    $new_font_face = $this->download_font_face_asset( $font_face );
                    $new_font_faces[] = $new_font_face;
                }
                $new_font['fontFace'] = $new_font_faces;
            }
            $new_fonts[] = $new_font;
        }
        return $new_fonts;
    }

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