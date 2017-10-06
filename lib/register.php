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
 * @todo Remove the temporary fix for the NVDA screen reader and use meaningful
 *       content instead. See pull #2380 and issues #467 and #503.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	?>
	<div class="nvda-temp-fix screen-reader-text">&nbsp;</div>
	<div class="gutenberg">
		<div id="editor" class="gutenberg__editor"></div>
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
	global $submenu;

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

	if ( current_user_can( 'edit_posts' ) ) {
		$submenu['gutenberg'][] = array(
			__( 'Feedback', 'gutenberg' ),
			'edit_posts',
			'http://wordpressdotorg.polldaddy.com/s/gutenberg-support',
		);
	}
}
add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Provide an edit link for posts and terms.
 *
 * @since 0.5.0
 *
 * @param WP_Admin_Bar $wp_admin_bar Admin bar.
 */
function gutenberg_add_admin_bar_edit_link( $wp_admin_bar ) {
	$edit_node = $wp_admin_bar->get_node( 'edit' );
	if ( ! $edit_node ) {
		return;
	}

	$queried_object = get_queried_object();
	if ( empty( $queried_object ) || empty( $queried_object->post_type ) || ! post_type_exists( $queried_object->post_type ) || ! gutenberg_can_edit_post( $queried_object->ID ) ) {
		return;
	}
	$post = $queried_object;

	if ( ! get_post_type_object( $post->post_type )->show_in_admin_bar ) {
		return;
	}

	$classic_text = __( 'Edit in Classic Editor', 'gutenberg' );
	remove_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10 );
	$classic_url = get_edit_post_link( $post->ID, 'raw' );
	add_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10, 3 );

	if ( empty( $classic_url ) || ! post_type_supports( $post->post_type, 'editor' ) ) {
		return;
	}

	$gutenberg_text = __( 'Edit in Gutenberg', 'gutenberg' );
	$gutenberg_url = gutenberg_get_edit_post_url( $post->ID );

	$is_gutenberg_default = gutenberg_post_has_blocks( $post->ID );

	// Update title for edit link to indicate default editor.
	$wp_admin_bar->add_node( array_merge(
		(array) $edit_node,
		array(
			'title' => $is_gutenberg_default ? $gutenberg_text : $classic_text,
		)
	) );

	// Add submenu item under link to go to Gutenberg editor or classic editor.
	$wp_admin_bar->add_node( array(
		'id' => 'edit_alt',
		'parent' => 'edit',
		'href' => $is_gutenberg_default ? $classic_url : $gutenberg_url,
		'title' => $is_gutenberg_default ? $classic_text : $gutenberg_text,
	) );

}
add_action( 'admin_bar_menu', 'gutenberg_add_admin_bar_edit_link', 81 );

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
 * @param  array   $actions Post actions.
 * @param  WP_Post $post    Edited post.
 *
 * @return array          Updated post actions.
 */
function gutenberg_add_edit_links( $actions, $post ) {
	if ( ! gutenberg_can_edit_post( $post->ID ) ||
			'trash' === $post->post_status ||
			! post_type_supports( $post->post_type, 'editor' ) ||
			! apply_filters( 'gutenberg_add_edit_link_for_post_type', true, $post->post_type, $post ) ) {
		return $actions;
	}

	remove_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10 );
	$classic_url = get_edit_post_link( $post->ID, 'raw' );
	add_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10, 3 );

	// Build the new edit actions. See also: WP_Posts_List_Table::handle_row_actions().
	$title = _draft_or_post_title( $post->ID );
	$edit_actions = array(
		'classic hide-if-no-js' => sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			esc_url( $classic_url ),
			esc_attr( sprintf(
				/* translators: %s: post title */
				__( 'Edit &#8220;%s&#8221; in the classic editor', 'gutenberg' ),
				$title
			) ),
			__( 'Classic Editor', 'gutenberg' )
		),
		'gutenberg hide-if-no-js' => sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			esc_url( gutenberg_get_edit_post_url( $post->ID ) ),
			esc_attr( sprintf(
				/* translators: %s: post title */
				__( 'Edit &#8220;%s&#8221; in the Gutenberg editor', 'gutenberg' ),
				$title
			) ),
			__( 'Gutenberg', 'gutenberg' )
		),
	);

	// Insert the new actions in place of the Edit action.
	$edit_offset = array_search( 'edit', array_keys( $actions ), true );
	$actions = array_merge(
		array_slice( $actions, 0, $edit_offset ),
		$edit_actions,
		array_slice( $actions, $edit_offset + 1 )
	);

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
	// Avoid redirect to Gutenberg after saving a block post in Classic editor.
	$sendback = wp_get_referer();
	if ( $sendback && (
			0 === strpos( $sendback, parse_url( admin_url( 'post.php' ), PHP_URL_PATH ) ) ||
			0 === strpos( $sendback, parse_url( admin_url( 'post-new.php' ), PHP_URL_PATH ) ) ) ) {
		return $url;
	}

	$post = get_post( $post_id );
	if ( gutenberg_can_edit_post( $post_id ) && gutenberg_post_has_blocks( $post_id ) && post_type_supports( get_post_type( $post_id ), 'editor' ) ) {
		$gutenberg_url = gutenberg_get_edit_post_url( $post->ID );
		if ( 'display' === $context ) {
			$gutenberg_url = esc_url( $gutenberg_url );
		}
		$url = $gutenberg_url;
	}
	return $url;
}
add_filter( 'get_edit_post_link', 'gutenberg_filter_edit_post_link', 10, 3 );

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
	return $post && strpos( $post->post_content, '<!-- wp:' ) !== false;
}

/**
 * Adds a "Gutenberg" post state for post tables, if the post contains blocks.
 *
 * @param  array   $post_states An array of post display states.
 * @param  WP_Post $post        The current post object.
 * @return array                A filtered array of post display states.
 */
function gutenberg_add_gutenberg_post_state( $post_states, $post ) {
	if ( gutenberg_post_has_blocks( $post->ID ) ) {
		$post_states[] = 'Gutenberg';
	}

	return $post_states;
}
add_filter( 'display_post_states', 'gutenberg_add_gutenberg_post_state', 10, 2 );

/**
 * Registers custom post types required by the Gutenberg editor.
 *
 * @since 0.10.0
 */
function gutenberg_register_post_types() {
	register_post_type( 'gb_reusable_block', array(
		'public' => false,
	) );
}
add_action( 'init', 'gutenberg_register_post_types' );

/**
 * Registers the REST API routes needed by the Gutenberg editor.
 *
 * @since 0.10.0
 */
function gutenberg_register_rest_routes() {
	$controller = new WP_REST_Reusable_Blocks_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_routes' );

