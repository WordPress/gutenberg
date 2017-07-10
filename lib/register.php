<?php
/**
 * Initialization and wp-admin integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

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
		'edit_posts',
		'gutenberg',
		'the_gutenberg_project',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Gutenberg', 'gutenberg' ),
		__( 'New Post', 'gutenberg' ),
		'edit_posts',
		'gutenberg',
		'the_gutenberg_project'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg-demo',
		'the_gutenberg_project'
	);
}
add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Adds the filters to register additional links for the Gutenberg editor in
 * the post/page screens.
 *
 * @since 0.1.0
 */
function gutenberg_add_edit_links_filters() {
	// For hierarchical post types.
	add_filter( 'page_row_actions', 'gutenberg_add_edit_links', 10, 2 );
	// For non-hierarchical post types.
	add_filter( 'post_row_actions', 'gutenberg_add_edit_links', 10, 2 );
}
add_action( 'admin_init', 'gutenberg_add_edit_links_filters' );

/**
 * Registers additional links in the post/page screens to edit any post/page in
 * the Gutenberg editor.
 *
 * @since 0.1.0
 *
 * @param  array $actions Post actions.
 * @param  array $post    Edited post.
 *
 * @return array          Updated post actions.
 */
function gutenberg_add_edit_links( $actions, $post ) {
	$can_edit_post = current_user_can( 'edit_post', $post->ID );
	$title = _draft_or_post_title( $post->ID );

	if ( $can_edit_post && 'trash' !== $post->post_status ) {
		// Build the Gutenberg edit action. See also: WP_Posts_List_Table::handle_row_actions().
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
			array(
				'gutenberg hide-if-no-js' => $gutenberg_action,
			),
			array_slice( $actions, $edit_offset + 1 )
		);
	}

	return $actions;
}
