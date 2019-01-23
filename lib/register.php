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
 * Collect information about meta_boxes registered for the current post.
 *
 * Redirects to classic editor if a meta box is incompatible.
 *
 * @since 1.5.0
 * @deprecated 5.0.0 register_and_do_post_meta_boxes
 */
function gutenberg_collect_meta_box_data() {
	_deprecated_function( __FUNCTION__, '5.0.0', 'register_and_do_post_meta_boxes' );
}

/**
 * Return whether the post can be edited in Gutenberg and by the current user.
 *
 * @since 0.5.0
 *
 * @param int|WP_Post $post Post ID or WP_Post object.
 * @return bool Whether the post can be edited with Gutenberg.
 */
function gutenberg_can_edit_post( $post ) {
	$post     = get_post( $post );
	$can_edit = true;

	if ( ! $post ) {
		$can_edit = false;
	}

	if ( $can_edit && 'trash' === $post->post_status ) {
		$can_edit = false;
	}

	if ( $can_edit && ! gutenberg_can_edit_post_type( $post->post_type ) ) {
		$can_edit = false;
	}

	if ( $can_edit && ! current_user_can( 'edit_post', $post->ID ) ) {
		$can_edit = false;
	}

	// Disable the editor if on the blog page and there is no content.
	if ( $can_edit && absint( get_option( 'page_for_posts' ) ) === $post->ID && empty( $post->post_content ) ) {
		$can_edit = false;
	}

	/**
	 * Filter to allow plugins to enable/disable Gutenberg for particular post.
	 *
	 * @since 3.5
	 *
	 * @param bool $can_edit Whether the post can be edited or not.
	 * @param WP_Post $post The post being checked.
	 */
	return apply_filters( 'gutenberg_can_edit_post', $can_edit, $post );

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
 * @return bool Whether the post type can be edited with Gutenberg.
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
 * @deprecated 3.6.0 Use has_blocks()
 *
 * @param object $post Post.
 * @return bool  Whether the post has blocks.
 */
function gutenberg_post_has_blocks( $post ) {
	_deprecated_function( __FUNCTION__, '3.6.0', 'has_blocks()' );
	return has_blocks( $post );
}

/**
 * Determine whether a content string contains blocks. This test optimizes for
 * performance rather than strict accuracy, detecting the pattern of a block
 * but not validating its structure. For strict accuracy, you should use the
 * block parser on post content.
 *
 * @see gutenberg_parse_blocks()
 *
 * @since 1.6.0
 * @deprecated 3.6.0 Use has_blocks()
 *
 * @param string $content Content to test.
 * @return bool Whether the content contains blocks.
 */
function gutenberg_content_has_blocks( $content ) {
	_deprecated_function( __FUNCTION__, '3.6.0', 'has_blocks()' );
	return has_blocks( $content );
}

/**
 * Returns the current version of the block format that the content string is using.
 *
 * If the string doesn't contain blocks, it returns 0.
 *
 * @since 2.8.0
 * @see gutenberg_content_has_blocks()
 * @deprecated 5.0.0 block_version
 *
 * @param string $content Content to test.
 * @return int The block format version.
 */
function gutenberg_content_block_version( $content ) {
	_deprecated_function( __FUNCTION__, '5.0.0', 'block_version' );

	return block_version( $content );
}

/**
 * Adds a "Gutenberg" post state for post tables, if the post contains blocks.
 *
 * @deprecated 5.0.0
 *
 * @param array $post_states An array of post display states.
 * @return array A filtered array of post display states.
 */
function gutenberg_add_gutenberg_post_state( $post_states ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $post_states;
}

/**
 * Registers custom post types required by the Gutenberg editor.
 *
 * @since 0.10.0
 * @deprecated 5.0.0
 */
function gutenberg_register_post_types() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Apply the correct labels for Reusable Blocks in the bulk action updated messages.
 *
 * @since 4.3.0
 * @deprecated 5.0.0
 *
 * @param array $messages Arrays of messages, each keyed by the corresponding post type.
 *
 * @return array
 */
function gutenberg_bulk_post_updated_messages( $messages ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $messages;
}

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
 * Appends a query argument to the edit url to make sure it is redirected to
 * the editor from which the user navigated.
 *
 * @since 1.5.2
 *
 * @param string $url Edit url.
 * @return string Edit url.
 */
function gutenberg_revisions_link_to_editor( $url ) {
	global $pagenow;
	if ( 'revision.php' !== $pagenow || isset( $_REQUEST['gutenberg'] ) ) {
		return $url;
	}

	return add_query_arg( 'classic-editor', '', $url );
}
add_filter( 'get_edit_post_link', 'gutenberg_revisions_link_to_editor' );

/**
 * Modifies revisions data to preserve Gutenberg argument used in determining
 * where to redirect user returning to editor.
 *
 * @since 1.9.0
 *
 * @param array $revisions_data The bootstrapped data for the revisions screen.
 * @return array Modified bootstrapped data for the revisions screen.
 */
function gutenberg_revisions_restore( $revisions_data ) {
	if ( isset( $_REQUEST['gutenberg'] ) ) {
		$revisions_data['restoreUrl'] = add_query_arg(
			'gutenberg',
			$_REQUEST['gutenberg'],
			$revisions_data['restoreUrl']
		);
	}

	return $revisions_data;
}
add_filter( 'wp_prepare_revision_for_js', 'gutenberg_revisions_restore' );
