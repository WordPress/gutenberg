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
 * @deprecated 5.1.0 use_block_editor_for_post
 *
 * @param int|WP_Post $post Post ID or WP_Post object.
 * @return bool Whether the post can be edited with Gutenberg.
 */
function gutenberg_can_edit_post( $post ) {
	_deprecated_function( __FUNCTION__, '5.1.0', 'use_block_editor_for_post' );

	return use_block_editor_for_post( $post );
}

/**
 * Return whether the post type can be edited in Gutenberg.
 *
 * Gutenberg depends on the REST API, and if the post type is not shown in the
 * REST API, then the post cannot be edited in Gutenberg.
 *
 * @since 1.5.2
 * @deprecated 5.1.0 use_block_editor_for_post_type
 *
 * @param string $post_type The post type.
 * @return bool Whether the post type can be edited with Gutenberg.
 */
function gutenberg_can_edit_post_type( $post_type ) {
	_deprecated_function( __FUNCTION__, '5.1.0', 'use_block_editor_for_post_type' );

	return use_block_editor_for_post_type( $post_type );
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
 * @deprecated 5.1.0
 */
function gutenberg_remember_classic_editor_when_saving_posts() {
	_deprecated_function( __FUNCTION__, '5.1.0' );
}

/**
 * Appends a query argument to the redirect url to make sure it gets redirected to the classic editor.
 *
 * @since 1.5.2
 * @deprecated 5.1.0
 *
 * @param string $url Redirect url.
 * @return string Redirect url.
 */
function gutenberg_redirect_to_classic_editor_when_saving_posts( $url ) {
	_deprecated_function( __FUNCTION__, '5.1.0' );

	return $url;
}

/**
 * Appends a query argument to the edit url to make sure it is redirected to
 * the editor from which the user navigated.
 *
 * @since 1.5.2
 * @deprecated 5.1.0
 *
 * @param string $url Edit url.
 * @return string Edit url.
 */
function gutenberg_revisions_link_to_editor( $url ) {
	_deprecated_function( __FUNCTION__, '5.1.0' );

	return $url;
}

/**
 * Modifies revisions data to preserve Gutenberg argument used in determining
 * where to redirect user returning to editor.
 *
 * @since 1.9.0
 * @deprecated 5.0.0
 *
 * @param array $revisions_data The bootstrapped data for the revisions screen.
 * @return array Modified bootstrapped data for the revisions screen.
 */
function gutenberg_revisions_restore( $revisions_data ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $revisions_data;
}
