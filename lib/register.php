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

	add_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10, 3 );
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
	if ( ! gutenberg_can_edit_post( $post->ID ) ) {
		return $actions;
	}

	$title = _draft_or_post_title( $post->ID );
	$post_type = get_post_type( $post );

	if ( gutenberg_post_has_blocks( $post->ID ) ) {
		$text = __( 'Classic Editor', 'gutenberg' );
		/* translators: %s: post title */
		$label = __( 'Edit &#8220;%s&#8221; in the classic editor', 'gutenberg' );

		remove_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10 );
		$edit_url = get_edit_post_link( $post->ID, 'raw' );
		add_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10, 3 );
	} else {
		$text = __( 'Gutenberg', 'gutenberg' );
		/* translators: %s: post title */
		$label = __( 'Edit &#8220;%s&#8221; in the Gutenberg editor', 'gutenberg' );
		$edit_url = gutenberg_get_edit_post_url( $post->ID );
	}

	if ( 'trash' !== $post->post_status && apply_filters( 'gutenberg_add_edit_link_for_post_type', true, $post_type, $post ) ) {
		// Build the Gutenberg edit action. See also: WP_Posts_List_Table::handle_row_actions().
		$gutenberg_action = sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			esc_url( $edit_url ),
			esc_attr( sprintf(
				$label,
				$title
			) ),
			$text
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

/**
 * Get the edit post URL for Gutenberg.
 *
 * @since 0.5.0
 *
 * @param int $post_id Post ID.
 * @return string|false URL or false if not available.
 */
function gutenberg_get_edit_post_url( $post_id ) {
	// Note that menu_page_url() cannot be used because it does not work on the frontend.
	$gutenberg_url = admin_url( 'admin.php?page=gutenberg' );
	$gutenberg_url = add_query_arg( 'post_id', $post_id, $gutenberg_url );
	return $gutenberg_url;
}

/**
 * Filters the post edit link to default to the Gutenberg editor when the post content contains a block.
 *
 * @since 0.5.0
 *
 * @param string $url     The edit link URL.
 * @param int    $post_id Post ID.
 * @param string $context The link context. If set to 'display' then ampersands are encoded.
 * @return string Edit post link.
 */
function gutenberg_filter_edit_post_link( $url, $post_id, $context ) {
	$post = get_post( $post_id );
	if ( gutenberg_can_edit_post( $post_id ) && gutenberg_post_has_blocks( $post_id ) ) {
		$gutenberg_url = gutenberg_get_edit_post_url( $post->ID );
		if ( 'display' === $context ) {
			$gutenberg_url = esc_url( $gutenberg_url );
		}
		$url = $gutenberg_url;
	}
	return $url;
}

/**
 * Return whether the post can be edited in Gutenberg and by the current user.
 *
 * Gutenberg depends on the REST API, and if the post type is not shown in the
 * REST API, then the post cannot be edited in Gutenberg.
 *
 * @since 0.5.0
 *
 * @param int $post_id Post.
 * @return bool Whether the post can be edited with Gutenberg.
 */
function gutenberg_can_edit_post( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post || ! post_type_exists( $post->post_type ) ) {
		return false;
	}
	$post_type_object = get_post_type_object( $post->post_type );
	if ( ! $post_type_object->show_in_rest ) {
		return false;
	}
	return current_user_can( 'edit_post', $post_id );
}

/**
 * Determine whether a post has blocks.
 *
 * @since 0.5.0
 *
 * @param int $post_id Post ID.
 * @return bool Whether the post has blocks.
 */
function gutenberg_post_has_blocks( $post_id ) {
	$post = get_post( $post_id );
	return $post && preg_match( '#<!-- wp:\w+#', $post->post_content );
}
