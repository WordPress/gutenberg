<?php
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

// Define the callback function
function custom_rest_endpoint_callback($request) {
	// Get the JSON data from the request
	$blocks = parse_blocks( $request->get_json_params() );
	
	 // Initialize an empty string to store the rendered HTML
	 $rendered_html = '';

	 // Render each block
	 foreach ($blocks as $block) {
			 $rendered_block = render_block($block);
			 $rendered_html .= $rendered_block;
	 }

	 return $rendered_html;
}

// Register the REST API endpoint
function register_custom_rest_endpoint() {
	register_rest_route('wp/v2', '/render_blocks', array(
			'methods' => 'POST',
			'callback' => 'custom_rest_endpoint_callback',
	));
}

add_action('rest_api_init', 'register_custom_rest_endpoint');