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
 * Set up global variables so that plugins will add meta boxes as if we were
 * using the main editor.
 *
 * @since 1.5.0
 */
function gutenberg_trick_plugins_into_registering_meta_boxes() {
	global $pagenow;

	if ( in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) && ! isset( $_REQUEST['classic-editor'] ) ) {
		// As early as possible, but after any plugins ( ACF ) that adds meta boxes.
		add_action( 'admin_head', 'gutenberg_collect_meta_box_data', 99 );
	}
}
// As late as possible, but before any logic that adds meta boxes.
add_action(
	'plugins_loaded',
	'gutenberg_trick_plugins_into_registering_meta_boxes'
);

/**
 * Collect information about meta_boxes registered for the current post.
 *
 * This is used to tell React and Redux whether the meta box location has
 * meta boxes.
 *
 * @since 1.5.0
 */
function gutenberg_collect_meta_box_data() {
	global $_gutenberg_restore_globals_after_meta_boxes, $current_screen, $wp_meta_boxes, $post, $typenow;

	// Depending on whether we are creating a post or editing one this may need to be different.
	$potential_hookname = 'post';

	// Set original screen to return to.
	$GLOBALS['_gutenberg_restore_globals_after_meta_boxes']['current_screen'] = $current_screen;

	// Override screen as though we are on post.php We have access to WP_Screen etc. by this point.
	WP_Screen::get( $potential_hookname )->set_current_screen();

	$screen = $current_screen;

	// If we are working with an already predetermined post.
	if ( isset( $_REQUEST['post'] ) ) {
		$post    = get_post( absint( $_REQUEST['post'] ) );
		$typenow = $post->post_type;
	} else {
		// Eventually add handling for creating new posts of different types in Gutenberg.
	}
	$post_type        = $post->post_type;
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
	 * WIP: Collect and send information needed to render meta boxes.
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
				'revision_id'     => key( $revisions ),
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

	// Set up meta box locations.
	$locations = array( 'normal', 'advanced', 'side' );

	// Foreach location run the hooks meta boxes are potentially registered on.
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

	// Copy meta box state.
	$_meta_boxes_copy = $wp_meta_boxes;

	/**
	 * Documented in lib/meta-box-partial-page.php
	 *
	 * @param array $wp_meta_boxes Global meta box state.
	 */
	$_meta_boxes_copy = apply_filters( 'filter_gutenberg_meta_boxes', $_meta_boxes_copy );

	$meta_box_data = array();

	// If the meta box should be empty set to false.
	foreach ( $locations as $location ) {
		if ( gutenberg_is_meta_box_empty( $_meta_boxes_copy, $location, $post->post_type ) ) {
			$meta_box_data[ $location ] = false;
		} else {
			$meta_box_data[ $location ] = true;
			$incompatible_meta_box      = false;
			// Check if we have a meta box that has declared itself incompatible with the block editor.
			foreach ( $_meta_boxes_copy[ $post->post_type ][ $location ] as $boxes ) {
				foreach ( $boxes as $box ) {
					/*
					 * If __block_editor_compatible_meta_box is declared as a false-y value,
					 * the meta box is not compatible with the block editor.
					 */
					if ( is_array( $box['args'] )
						&& isset( $box['args']['__block_editor_compatible_meta_box'] )
						&& ! $box['args']['__block_editor_compatible_meta_box'] ) {
							$incompatible_meta_box = true;
							break 2;
					}
				}
			}

			// Incompatible meta boxes require an immediate redirect to the classic editor.
			if ( $incompatible_meta_box ) {
				?>
				<script type="text/javascript">
					var joiner = '?';
					if ( window.location.search ) {
						joiner = '&';
					}
					window.location.href += joiner + 'classic-editor';
				</script>
				<?php
				exit;
			}
		}
	}

	/**
	 * Sadly we probably can not add this data directly into editor settings.
	 *
	 * ACF and other meta boxes need admin_head to fire for meta box registry.
	 * admin_head fires after admin_enqueue_scripts which is where we create our
	 * editor instance. If a cleaner solution can be imagined, please change
	 * this, and try to get this data to load directly into the editor settings.
	 */
	wp_add_inline_script(
		'wp-editor',
		'window._wpLoadGutenbergEditor.then( function( editor ) { editor.initializeMetaBoxes( ' . wp_json_encode( $meta_box_data ) . ' ) } );'
	);

	// Restore any global variables that we temporarily modified above.
	foreach ( $_gutenberg_restore_globals_after_meta_boxes as $name => $value ) {
		$GLOBALS[ $name ] = $value;
	}
}

/**
 * Return whether the post can be edited in Gutenberg and by the current user.
 *
 * @since 0.5.0
 *
 * @param int|WP_Post $post_id Post.
 * @return bool Whether the post can be edited with Gutenberg.
 */
function gutenberg_can_edit_post( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return false;
	}

	if ( 'trash' === $post->post_status ) {
		return false;
	}

	if ( ! gutenberg_can_edit_post_type( $post->post_type ) ) {
		return false;
	}

	return current_user_can( 'edit_post', $post_id );
}

/**
 * Return whether the post type can be edited in Gutenberg.
 *
 * Gutenberg depends on the REST API, and if the post type is not shown in the
 * REST API, then the post cannot be edited in Gutenberg.
 *
 * @since 1.5.2
 *
 * @param string $post_type The post type.
 * @return bool Wehther the post type can be edited with Gutenberg.
 */
function gutenberg_can_edit_post_type( $post_type ) {
	$can_edit = true;
	if ( ! post_type_exists( $post_type ) ) {
		$can_edit = false;
	}

	if ( ! post_type_supports( $post_type, 'editor' ) ) {
		$can_edit = false;
	}

	$post_type_object = get_post_type_object( $post_type );
	if ( $post_type_object && ! $post_type_object->show_in_rest ) {
		$can_edit = false;
	}

	/**
	 * Filter to allow plugins to enable/disable Gutenberg for particular post types.
	 *
	 * @since 1.5.2
	 *
	 * @param bool   $can_edit  Whether the post type can be edited or not.
	 * @param string $post_type The post type being checked.
	 */
	return apply_filters( 'gutenberg_can_edit_post_type', $can_edit, $post_type );
}

/**
 * Determine whether a post has blocks. This test optimizes for performance
 * rather than strict accuracy, detecting the pattern of a block but not
 * validating its structure. For strict accuracy, you should use the block
 * parser on post content.
 *
 * @see gutenberg_parse_blocks()
 *
 * @since 0.5.0
 *
 * @param object $post Post.
 * @return bool  Whether the post has blocks.
 */
function gutenberg_post_has_blocks( $post ) {
	$post = get_post( $post );
	return $post && gutenberg_content_has_blocks( $post->post_content );
}

/**
 * Determine whether a content string contains blocks. This test optimizes for
 * performance rather than strict accuracy, detecting the pattern of a block
 * but not validating its structure. For strict accuracy, you should use the
 * block parser on post content.
 *
 * @since 1.6.0
 * @see gutenberg_parse_blocks()
 *
 * @param string $content Content to test.
 * @return bool Whether the content contains blocks.
 */
function gutenberg_content_has_blocks( $content ) {
	return false !== strpos( $content, '<!-- wp:' );
}

/**
 * Adds a "Gutenberg" post state for post tables, if the post contains blocks.
 *
 * @param  array   $post_states An array of post display states.
 * @param  WP_Post $post        The current post object.
 * @return array                A filtered array of post display states.
 */
function gutenberg_add_gutenberg_post_state( $post_states, $post ) {
	if ( gutenberg_post_has_blocks( $post ) ) {
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
	register_post_type( 'wp_block', array(
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


/**
 * Gets revisions details for the selected post.
 *
 * @since 1.6.0
 *
 * @param array $post The post object from the response.
 * @return array|null Revisions details or null when no revisions present.
 */
function gutenberg_get_post_revisions( $post ) {
	$revisions       = wp_get_post_revisions( $post['id'] );
	$revisions_count = count( $revisions );
	if ( 0 === $revisions_count ) {
		return null;
	}

	$last_revision = array_shift( $revisions );

	return array(
		'count'   => $revisions_count,
		'last_id' => $last_revision->ID,
	);
}

/**
 * Adds the custom field `revisions` to the REST API response of post.
 *
 * TODO: This is a temporary solution. Next step would be to find a solution that is limited to the editor.
 *
 * @since 1.6.0
 */
function gutenberg_register_rest_api_post_revisions() {
	register_rest_field( get_post_types( '', 'names' ),
		'revisions',
		array(
			'get_callback' => 'gutenberg_get_post_revisions',
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_rest_api_post_revisions' );

/**
 * Injects a hidden input in the edit form to propagate the information that classic editor is selected.
 *
 * @since 1.5.2
 */
function gutenberg_remember_classic_editor_when_saving_posts() {
	?>
	<input type="hidden" name="classic-editor" />
	<?php
}
add_action( 'edit_form_top', 'gutenberg_remember_classic_editor_when_saving_posts' );

/**
 * Appends a query argument to the redirect url to make sure it gets redirected to the classic editor.
 *
 * @since 1.5.2
 *
 * @param string $url Redirect url.
 * @return string Redirect url.
 */
function gutenberg_redirect_to_classic_editor_when_saving_posts( $url ) {
	if ( isset( $_REQUEST['classic-editor'] ) ) {
		$url = add_query_arg( 'classic-editor', '', $url );
	}
	return $url;
}
add_filter( 'redirect_post_location', 'gutenberg_redirect_to_classic_editor_when_saving_posts', 10, 1 );

/**
 * Appends a query argument to the edit url to make sure it gets redirected to the classic editor.
 *
 * @since 1.5.2
 *
 * @param string $url Edit url.
 * @return string Edit url.
 */
function gutenberg_link_revisions_to_classic_editor( $url ) {
	global $pagenow;
	if ( 'revision.php' === $pagenow ) {
		$url = add_query_arg( 'classic-editor', '', $url );
	}
	return $url;
}
add_filter( 'get_edit_post_link', 'gutenberg_link_revisions_to_classic_editor' );
