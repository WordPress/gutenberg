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

// Plugins that add metaboxes along with their timing:
//
//  - advanced-custom-fields : admin_enqueue_scripts (priority 10) adds an
//                             'admin_head' action which calls add_meta_box()

/**
 * Set up global variables so that plugins will add metaboxes as if we were
 * using the main editor.
 *
 * @since ???
 */
function gutenberg_trick_plugins_into_registering_metaboxes() {
	global $pagenow;
	$GLOBALS['_gutenberg_restore_globals_after_metaboxes'] = array(
		'pagenow' => $pagenow,
	);
	$pagenow = 'post.php';
	// As early as possible, but after any logic that adds metaboxes.
	add_action( 'admin_head', 'gutenberg_collect_metabox_data', 99 );
}
// As late as possible, but before any logic that adds metaboxes.
add_action(
	'load-toplevel_page_gutenberg',
	'gutenberg_trick_plugins_into_registering_metaboxes'
);

/**
 * Collect information about metaboxes registered for the current post.
 *
 * @since ???
 */
function gutenberg_collect_metabox_data() {
	global $_gutenberg_post_id, $_gutenberg_restore_globals_after_metaboxes;

	// WIP: Collect and send information needed to render metaboxes.
	// From wp-admin/edit-form-advanced.php
	// Relevant code there:
	// do_action( 'do_meta_boxes', $post_type, {'normal','advanced','side'}, $post );
	// do_meta_boxes( $post_type, 'side', $post );
	// do_meta_boxes( null, 'normal', $post );
	// do_meta_boxes( null, 'advanced', $post );
	$meta_boxes_output = array();

	$post = get_post( $_gutenberg_post_id );
	foreach ( array( 'normal', 'advanced', 'side' ) as $location ) {
		ob_start();
		do_action(
			'do_meta_boxes',
			$post->post_type,
			$location,
			$post
		);
		do_meta_boxes(
			'side' === $location ? $post->post_type : null,
			$location,
			$post
		);
		$meta_boxes_output[ $location ] = ob_get_clean();
	}
	wp_add_inline_script(
		'wp-editor',
		'window._wpGutenbergMetaboxes = ' . wp_json_encode( $meta_boxes_output ) . ';'
		. "\nwindow._wpGutenbergInstance.setPostMetaboxes( window._wpGutenbergMetaboxes );"
	);

	// Restore any global variables that we temporarily modified above.
	foreach ( $_gutenberg_restore_globals_after_metaboxes as $name => $value ) {
		$GLOBALS[ $name ] = $value;
	}
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
