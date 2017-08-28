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
	<!-- Classic Metabox iFrame -->
	<?php
}

/**
 * Set up global variables so that plugins will add metaboxes as if we were
 * using the main editor.
 */
function gutenberg_trick_plugins_into_registering_metaboxes() {
	global $pagenow;

	if ( isset( $_GET['page'] ) && 'gutenberg' === $_GET['page'] && 'admin.php' === $pagenow ) {
		global $hook_suffix, $post, $typenow;

		$GLOBALS['_gutenberg_restore_globals_after_metaboxes'] = array(
			'pagenow'        => $pagenow,
			'hook_suffix'    => $hook_suffix,
		);

		$pagenow = 'post.php';
		$hook_suffix = 'post.php';

		/**
		 * Sadly this will make rendering the metaboxes in a front end version
		 * of Gutenberg not possible without changes to core.
		 */
		// Fake global post state to ensure plugins who do non standard functionality ( ACF ) correctly register metaboxes.
		add_action( 'admin_head', 'gutenberg_set_post_state', 1 );
		// As early as possible, but after any plugins ( ACF ) that adds metaboxes.
		add_action( 'admin_head', 'gutenberg_collect_metabox_data', 99 );
	}
}
// As late as possible, but before any logic that adds metaboxes.
add_action(
	'plugins_loaded',
	'gutenberg_trick_plugins_into_registering_metaboxes'
);

/**
 * Imitates the global state of a post.
 */
function gutenberg_set_post_state() {
	global $current_screen, $wp_meta_boxes, $post, $typenow;

	// Depending on whether we are creating a post or editing one this may need to be different.
	$potential_hookname = 'post';

	// Set original screen to return to.
	$GLOBALS['_gutenberg_restore_globals_after_metaboxes']['current_screen'] = $current_screen;

	// Override screen as though we are on post.php.
	WP_Screen::get( $potential_hookname )->set_current_screen();

	// If we are working with an already predetermined post.
	if ( isset( $_REQUEST['post_id'] ) ) {
		$post = get_post( absint( $_REQUEST['post_id'] ) );
		$typenow = $post->post_type;
	} else {
		// Eventually add handling for creating new posts of different types in Gutenberg.
	}
}

/**
 * Collect information about metaboxes registered for the current post.
 *
 * This is used to tell React and Redux whether the metabox location has
 * metaboxes.
 */
function gutenberg_collect_metabox_data() {
	global $_gutenberg_restore_globals_after_metaboxes, $current_screen, $wp_meta_boxes, $post, $typenow;

	// Depending on whether we are creating a post or editing one this may need to be different.
	$potential_hookname = 'post';

	// Set original screen to return to.
	$GLOBALS['_gutenberg_restore_globals_after_metaboxes']['current_screen'] = $current_screen;

	// Override screen as though we are on post.php We have access to WP_Screen etc. by this point.
	WP_Screen::get( $potential_hookname )->set_current_screen();

	$screen = $current_screen;

	// If we are working with an already predetermined post.
	if ( isset( $_REQUEST['post_id'] ) ) {
		$post = get_post( absint( $_REQUEST['post_id'] ) );
		$typenow = $post->post_type;
	} else {
		// Eventually add handling for creating new posts of different types in Gutenberg.
	}
	$post_type = $post->post_type;
	$post_type_object = get_post_type_object( $post_type );

	$thumbnail_support = current_theme_supports( 'post-thumbnails', $post_type ) && post_type_supports( $post_type, 'thumbnail' );
	if ( ! $thumbnail_support && 'attachment' === $post_type && $post->post_mime_type ) {
		if ( wp_attachment_is( 'audio', $post ) ) {
			$thumbnail_support = post_type_supports( 'attachment:audio', 'thumbnail' ) || current_theme_supports( 'post-thumbnails', 'attachment:audio' );
		} elseif ( wp_attachment_is( 'video', $post ) ) {
			$thumbnail_support = post_type_supports( 'attachment:video', 'thumbnail' ) || current_theme_supports( 'post-thumbnails', 'attachment:video' );
		}
	}

	/*
	 * WIP: Collect and send information needed to render metaboxes.
	 * From wp-admin/edit-form-advanced.php
	 * Relevant code there:
	 * do_action( 'do_meta_boxes', $post_type, {'normal','advanced','side'}, $post );
	 * do_meta_boxes( $post_type, 'side', $post );
	 * do_meta_boxes( null, 'normal', $post );
	 * do_meta_boxes( null, 'advanced', $post );
	 */
	$meta_boxes_output = array();

	$publish_callback_args = null;
	if ( post_type_supports( $post_type, 'revisions' ) && 'auto-draft' !== $post->post_status ) {
		$revisions = wp_get_post_revisions( $post->ID );

		// We should aim to show the revisions meta box only when there are revisions.
		if ( count( $revisions ) > 1 ) {
			reset( $revisions ); // Reset pointer for key().
			$publish_callback_args = array(
				'revisions_count' => count( $revisions ),
				'revision_id' => key( $revisions ),
			);
			add_meta_box( 'revisionsdiv', __( 'Revisions', 'gutenberg' ), 'post_revisions_meta_box', $screen, 'normal', 'core' );
		}
	}

	if ( 'attachment' == $post_type ) {
		wp_enqueue_script( 'image-edit' );
		wp_enqueue_style( 'imgareaselect' );
		add_meta_box( 'submitdiv', __( 'Save', 'gutenberg' ), 'attachment_submit_meta_box', $screen, 'side', 'core' );
		add_action( 'edit_form_after_title', 'edit_form_image_editor' );

		if ( wp_attachment_is( 'audio', $post ) ) {
			add_meta_box( 'attachment-id3', __( 'Metadata', 'gutenberg' ), 'attachment_id3_data_meta_box', $screen, 'normal', 'core' );
		}
	} else {
		add_meta_box( 'submitdiv', __( 'Publish', 'gutenberg' ), 'post_submit_meta_box', $screen, 'side', 'core', $publish_callback_args );
	}

	if ( current_theme_supports( 'post-formats' ) && post_type_supports( $post_type, 'post-formats' ) ) {
		add_meta_box( 'formatdiv', _x( 'Format', 'post format', 'gutenberg' ), 'post_format_meta_box', $screen, 'side', 'core' );
	}

	// All taxonomies.
	foreach ( get_object_taxonomies( $post ) as $tax_name ) {
		$taxonomy = get_taxonomy( $tax_name );
		if ( ! $taxonomy->show_ui || false === $taxonomy->meta_box_cb ) {
			continue;
		}

		$label = $taxonomy->labels->name;

		if ( ! is_taxonomy_hierarchical( $tax_name ) ) {
			$tax_meta_box_id = 'tagsdiv-' . $tax_name;
		} else {
			$tax_meta_box_id = $tax_name . 'div';
		}

		add_meta_box( $tax_meta_box_id, $label, $taxonomy->meta_box_cb, $screen, 'side', 'core', array( 'taxonomy' => $tax_name ) );
	}

	if ( post_type_supports( $post_type, 'page-attributes' ) || count( get_page_templates( $post ) ) > 0 ) {
		add_meta_box( 'pageparentdiv', $post_type_object->labels->attributes, 'page_attributes_meta_box', $screen, 'side', 'core' );
	}

	if ( $thumbnail_support && current_user_can( 'upload_files' ) ) {
		add_meta_box( 'postimagediv', esc_html( $post_type_object->labels->featured_image ), 'post_thumbnail_meta_box', $screen, 'side', 'low' );
	}

	if ( post_type_supports( $post_type, 'excerpt' ) ) {
		add_meta_box( 'postexcerpt', __( 'Excerpt', 'gutenberg' ), 'post_excerpt_meta_box', $screen, 'normal', 'core' );
	}

	if ( post_type_supports( $post_type, 'trackbacks' ) ) {
		add_meta_box( 'trackbacksdiv', __( 'Send Trackbacks', 'gutenberg' ), 'post_trackback_meta_box', $screen, 'normal', 'core' );
	}

	if ( post_type_supports( $post_type, 'custom-fields' ) ) {
		add_meta_box( 'postcustom', __( 'Custom Fields', 'gutenberg' ), 'post_custom_meta_box', $screen, 'normal', 'core' );
	}

	/**
	 * Fires in the middle of built-in meta box registration.
	 *
	 * @since 2.1.0
	 * @deprecated 3.7.0 Use 'add_meta_boxes' instead.
	 *
	 * @param WP_Post $post Post object.
	 */
	do_action( 'dbx_post_advanced', $post );

	// Allow the Discussion meta box to show up if the post type supports comments,
	// or if comments or pings are open.
	if ( comments_open( $post ) || pings_open( $post ) || post_type_supports( $post_type, 'comments' ) ) {
		add_meta_box( 'commentstatusdiv', __( 'Discussion', 'gutenberg' ), 'post_comment_status_meta_box', $screen, 'normal', 'core' );
	}

	$stati = get_post_stati( array( 'public' => true ) );
	if ( empty( $stati ) ) {
		$stati = array( 'publish' );
	}
	$stati[] = 'private';

	if ( in_array( get_post_status( $post ), $stati ) ) {
		// If the post type support comments, or the post has comments, allow the
		// Comments meta box.
		if ( comments_open( $post ) || pings_open( $post ) || $post->comment_count > 0 || post_type_supports( $post_type, 'comments' ) ) {
			add_meta_box( 'commentsdiv', __( 'Comments', 'gutenberg' ), 'post_comment_meta_box', $screen, 'normal', 'core' );
		}
	}

	if ( ! ( 'pending' == get_post_status( $post ) && ! current_user_can( $post_type_object->cap->publish_posts ) ) ) {
		add_meta_box( 'slugdiv', __( 'Slug', 'gutenberg' ), 'post_slug_meta_box', $screen, 'normal', 'core' );
	}

	if ( post_type_supports( $post_type, 'author' ) && current_user_can( $post_type_object->cap->edit_others_posts ) ) {
		add_meta_box( 'authordiv', __( 'Author', 'gutenberg' ), 'post_author_meta_box', $screen, 'normal', 'core' );
	}

	// Set up metabox locations.
	$locations = array( 'normal', 'advanced', 'side' );

	// Foreach location run the hooks metaboxes are potentially registered on.
	foreach ( $locations as $location ) {
		do_action( 'add_meta_boxes', $post->post_type, $post );
		do_action( "add_meta_boxes_{$post->post_type}", $post );
		do_action(
			'do_meta_boxes',
			$screen,
			$location,
			$post
		);
	}
	do_action( 'edit_form_advanced', $post );

	// Copy metabox state.
	$_metaboxes_copy = $wp_meta_boxes;

	/**
	 * Documented in lib/metabox-partial-page.php
	 *
	 * @param array $wp_meta_boxes Global metabox state.
	 */
	$_metaboxes_copy = apply_filters( 'filter_gutenberg_metaboxes', $_metaboxes_copy );

	$metabox_data = array();

	// If the metabox should be empty set to false.
	foreach ( $locations as $location ) {
		if ( isset( $_metaboxes_copy[ $post->post_type ][ $location ] ) && gutenberg_is_metabox_empty( $_metaboxes_copy, $location, $post->post_type ) ) {
			$metabox_data[ $location ] = false;
		} else {
			$metabox_data[ $location ] = true;
		}
	}

	$GLOBALS['gutenberg_metabox_data'] = $metabox_data;

	/**
	 * Sadly we probably can not add this data directly into editor settings.
	 *
	 * ACF and other metaboxes need admin_head to fire for metabox registry.
	 * admin_head fires after admin_enqueue_scripts which is where we create our
	 * editor instance. If a cleaner solution can be imagined, please change
	 * this, and try to get this data to load directly into the editor settings.
	 */
	wp_add_inline_script(
		'wp-editor',
		'window._wpGutenbergEditor.dispatch( { type: \'INITIALIZE_METABOX_STATE\', metaboxes:' . wp_json_encode( $metabox_data ) . '} )'
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
