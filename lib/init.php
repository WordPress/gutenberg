<?php
// display errors
ini_set('display_errors', 1);
//ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		__( 'Gutenberg', 'gutenberg' ),
		__( 'Gutenberg', 'gutenberg' ),
		'edit_posts',
		'gutenberg',
		'',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg'
	);

	if ( current_user_can( 'edit_posts' ) ) {
		add_submenu_page(
			'gutenberg',
			__( 'Support', 'gutenberg' ),
			__( 'Support', 'gutenberg' ),
			'edit_posts',
			__( 'https://wordpress.org/support/plugin/gutenberg/', 'gutenberg' )
		);
		add_submenu_page(
			'gutenberg',
			__( 'Documentation', 'gutenberg' ),
			__( 'Documentation', 'gutenberg' ),
			'edit_posts',
			'https://developer.wordpress.org/block-editor/'
		);
	}

	add_submenu_page(
		'gutenberg',
		__( 'Experiments Settings', 'gutenberg' ),
		__( 'Experiments', 'gutenberg' ),
		'edit_posts',
		'gutenberg-experiments',
		'the_gutenberg_experiments'
	);
}
add_action( 'admin_menu', 'gutenberg_menu', 9 );

if ( ! function_exists( 'gutenberg_render_blocks_from_request' ) ) {
	/**
	 * Render blocks from a REST API request.
	 *
	 * @param mixed $request The current request.
	 *
	 * @return string
	 */
	function gutenberg_render_blocks_from_request( $request ) {
		// We need to fake a global $wp_query and $post.
		// This is because some blocks (e.g. Query block) rely on them,
		// and we don't have them in the REST API context.
		// Without them, the preview will be empty.
		global $wp_query;
		global $post;
		$data       = $request->get_json_params();
		$fake_query = new WP_Query(
			array(
				'post_type'      => 'post',
				'posts_per_page' => get_option( 'posts_per_page' ),
				'post_status'    => 'publish',
			)
		);
		// Not sure if there is a better way to achieve this.
		$wp_query = $fake_query;
		$post     = $wp_query->posts[0];
		return do_blocks( $data['blocks'] );
	}
}

if ( ! function_exists( 'register_gutenberg_render_blocks_endpoint' ) ) {
	/**
	 * Register custom REST endpoint for rendering blocks.
	 *
	 * @return void
	 */
	function register_gutenberg_render_blocks_endpoint() {
		register_rest_route(
			'wp/v2',
			'/render_blocks',
			array(
				'methods'             => 'POST',
				'callback'            => 'gutenberg_render_blocks_from_request',
				'permission_callback' => '__return_true',
			)
		);
	}
}

add_action( 'rest_api_init', 'register_gutenberg_render_blocks_endpoint' );
