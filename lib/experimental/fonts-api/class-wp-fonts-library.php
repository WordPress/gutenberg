<?php

class WP_Fonts_Library {

    public function __construct() {
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
					'permission_callback' => array( $this, 'get_fonts_library_permissions_check' ),
				),
			)
		);

        register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_fonts_library' ),
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
					'permission_callback' => array( $this, 'get_fonts_library_permissions_check' ),
				),
			)
		);

    }

    function get_fonts_library_permissions_check () {
        return true;
        // return current_user_can( 'edit_posts' );
    }

    function update_fonts_library_permissions_check () {
        return true;
        // return current_user_can( 'edit_posts' );
    }

    function get_fonts_library () {
        $post = $this->get_fonts_library_post();
        $post_content = json_decode( $post->post_content );
        return new WP_REST_Response( $post_content );
    }

    private function get_fonts_library_post () {
        // Try to get the fonts library post
        $args = $this->base_post_query;
        $args['posts_per_page'] = 1;
        $args['name'] = $this->post_name;

        $wp_fonts_library_query = new WP_Query( $args );
        if ( $wp_fonts_library_query->have_posts() ) {
            $post = $wp_fonts_library_query->posts[0];
            return $post;
        }

        // Create empty post if there are no post
        $post_data = $this->base_post_query;
        $post_data['post_name'] = $this->post_name;
        $post = wp_insert_post( $post_data );
        return $post;
    }

    function update_fonts_library ( $request ) {
        $post = $this->get_fonts_library_post();
        $new_content = $request->get_json_params();
        $updated_post_data = array (
            'ID' => $post->ID,
            'post_content' => json_encode( $new_content  ),
        );
        $updated_post = wp_update_post( $updated_post_data );
        $new_post = $this->get_fonts_library_post();
        $post_content = json_decode( $new_post->post_content );
        return new WP_REST_Response( $post_content );
    }

    function get_google_fonts () {
        $file = file_get_contents(
            path_join ( dirname(__FILE__),"google-fonts.json" )
        );
        $data = json_decode($file, true);
        return new WP_REST_Response( $data );
    }

}