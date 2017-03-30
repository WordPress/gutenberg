<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://wordpress.github.io/gutenberg/
 * Description: Prototyping since 1440. Development plugin for the editor focus in core.
 * Version: 0.1.0
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
		'Gutenberg',
		'Gutenberg',
		'manage_options',
		'gutenberg',
		'the_gutenberg_project'
	);
}

add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Registers common scripts to be used as dependencies of the editor and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts() {
	$suffix = SCRIPT_DEBUG ? '' : '.min';

	// Vendor
	wp_register_script( 'react', 'https://unpkg.com/react@15/dist/react' . $suffix . '.js' );
	wp_register_script( 'react-dom', 'https://unpkg.com/react-dom@15/dist/react-dom' . $suffix . '.js', array( 'react' ) );

	// Editor
	wp_register_script( 'tinymce-nightly', 'https://fiddle.azurewebsites.net/tinymce/nightly/tinymce.min.js' );
	wp_register_script( 'wp-element', plugins_url( 'element/build/index.js', __FILE__ ), array( 'react', 'react-dom' ) );
	wp_register_script( 'wp-blocks', plugins_url( 'blocks/build/index.js', __FILE__ ), array( 'wp-element', 'tinymce-nightly' ) );
}
add_action( 'init', 'gutenberg_register_scripts' );

/**
 * Adds the filters to register additional links for the Gutenberg editor in
 * the post/page screens.
 *
 * @since 0.1.0
 */
function gutenberg_add_edit_links_filters() {
	// For hierarchical post types
	add_filter( 'page_row_actions', 'gutenberg_add_edit_links', 10, 2 );
	// For non-hierarchical post types
	add_filter( 'post_row_actions', 'gutenberg_add_edit_links', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_add_edit_links_filters' );

/**
 * Registers additional links in the post/page screens to edit any post/page in
 * the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_add_edit_links( $actions, $post ) {
	$can_edit_post = current_user_can( 'edit_post', $post->ID );
	$title = _draft_or_post_title( $post->ID );

	if ( $can_edit_post && 'trash' !== $post->post_status ) {
		// Build the Gutenberg edit action.  See also:
		// WP_Posts_List_Table::handle_row_actions()
		$gutenberg_url = menu_page_url( 'gutenberg', false );
		$gutenberg_action = sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			add_query_arg( 'post_id', $post->ID, $gutenberg_url ),
			esc_attr( sprintf(
				/* translators: %s: post title */
				__( 'Edit &#8220;%s&#8221; in the Gutenberg editor', 'gutenberg' ),
				$title
			) ),
			__( 'Gutenberg', 'gutenberg' )
		);
		// Insert the Gutenberg action immediately after the Edit action.
		$edit_offset = array_search( 'edit', array_keys( $actions ), true );
		$actions = array_merge(
			array_slice( $actions, 0, $edit_offset + 1 ),
			array( 'gutenberg hide-if-no-js' => $gutenberg_action ),
			array_slice( $actions, $edit_offset + 1 )
		);
	}

	return $actions;
}

/**
 * Scripts & Styles.
 *
 * Enqueues the needed scripts and styles when visiting the top-level page of
 * the Gutenberg editor.
 *
 * @param string $hook Screen name.
 * @since 0.1.0
 */
function gutenberg_scripts_and_styles( $hook ) {
	if ( 'toplevel_page_gutenberg' !== $hook ) {
		return;
	}

	/**
	 * Scripts
	 */

	// The editor code itself
	wp_enqueue_script(
		'wp-editor',
		plugins_url( 'editor/build/index.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element', 'gutenberg-content' ),
		false, // $ver
		true   // $in_footer
	);

	// Temporary test content
	wp_register_script(
		'gutenberg-content',
		plugins_url( 'post-content.js', __FILE__ )
	);

	// Load an actual post if an ID is specified
	$post_to_edit = null;
	if ( isset( $_GET['post_id'] ) && (int) $_GET['post_id'] > 0 ) {
		$request = new WP_REST_Request(
			'GET',
			sprintf( '/wp/v2/posts/%d', (int) $_GET['post_id'] )
		);
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );
		if ( 200 === $response->get_status() ) {
			$post_to_edit = $response->get_data();
		}
	}

	// Initialize the post data...
	if ( $post_to_edit ) {
		// ...with a real post
		wp_add_inline_script(
			'wp-editor',
			'wp.editor.post = ' . json_encode( $post_to_edit )
		);
	} else {
		// ...with some test content
		wp_add_inline_script(
			'wp-editor',
			'wp.editor.post = { content: { raw: window.content } };'
		);
	}

	// Initialize the editor
	wp_add_inline_script(
		'wp-editor',
		'wp.editor.createEditorInstance( \'editor\', wp.editor.post );'
	);

	/**
	 * Styles
	 */

	wp_enqueue_style(
		'wp-editor-font',
		'https://fonts.googleapis.com/css?family=Noto+Serif:400,400i,700,700i'
	);
	wp_enqueue_style(
		'wp-editor',
		plugins_url( 'editor/build/style.css', __FILE__ )
	);
}

add_action( 'admin_enqueue_scripts', 'gutenberg_scripts_and_styles' );

/**
 * Project.
 *
 * The main entry point for the Gutenberg editor. Renders the editor on the
 * wp-admin page for the plugin.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	?>
	<div class="gutenberg">
		<section id="editor" class="gutenberg__editor"></section>
	</div>
	<?php
}

/**
 * Registers a block.
 *
 * @param  string $name Block name including namespace.
 * @param  array  $args Optional. Array of settings for the block. Default
 *                      empty array.
 * @return bool         True on success, false on error.
 */
function register_block( $name, $args = array() ) {
	// Not implemented yet.
}
