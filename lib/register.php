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

	require_once ABSPATH . 'wp-admin/includes/post.php';
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

	require_once ABSPATH . 'wp-admin/includes/post.php';
	return use_block_editor_for_post_type( $post_type );
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
