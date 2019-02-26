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
 * Page loaded when saving the meta boxes.
 * The HTML returned by this page is irrelevant, it's being called in AJAX ignoring its output
 *
 * @since 1.8.0
 * @deprecated 5.0.0
 */
function gutenberg_meta_box_save() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Allows the meta box endpoint to correctly redirect to the meta box endpoint
 * when a post is saved.
 *
 * @since 1.5.0
 * @deprecated 5.0.0
 *
 * @param string $location The location of the meta box, 'side', 'normal'.
 * @return string Modified location of the meta box.
 */
function gutenberg_meta_box_save_redirect( $location ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $location;
}

/**
 * Filter out core meta boxes as well as the post thumbnail.
 *
 * @since 1.5.0
 * @deprecated 5.0.0
 *
 * @param array $meta_boxes Meta box data.
 * @return array Meta box data without core meta boxes.
 */
function gutenberg_filter_meta_boxes( $meta_boxes ) {
	_deprecated_function( __FUNCTION__, '5.0.0' );

	return $meta_boxes;
}

/**
 * Go through the global metaboxes, and override the render callback, so we can trigger our warning if needed.
 *
 * @since 1.8.0
 * @deprecated 5.0.0
 */
function gutenberg_intercept_meta_box_render() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Check if this metabox only exists for back compat purposes, show a warning if it doesn't.
 *
 * @since 1.8.0
 * @deprecated 5.0.0
 */
function gutenberg_override_meta_box_callback() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Display a warning in the metabox that the current plugin is causing the fallback to the old editor.
 *
 * @since 1.8.0
 * @deprecated 5.0.0
 */
function gutenberg_show_meta_box_warning() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}

/**
 * Renders the WP meta boxes forms.
 *
 * @since 1.8.0
 * @deprecated 5.0.0 the_block_editor_meta_boxes
 */
function the_gutenberg_metaboxes() {
	_deprecated_function( __FUNCTION__, '5.0.0', 'the_block_editor_meta_boxes' );

	the_block_editor_meta_boxes();
}

/**
 * Renders the hidden form required for the meta boxes form.
 *
 * @since 1.8.0
 * @deprecated 5.0.0 the_block_editor_meta_box_post_form_hidden_fields
 */
function gutenberg_meta_box_post_form_hidden_fields() {
	_deprecated_function( __FUNCTION__, '5.0.0', 'the_block_editor_meta_box_post_form_hidden_fields' );

	the_block_editor_meta_box_post_form_hidden_fields();
}

/**
 * Admin action which toggles the 'enable_custom_fields' option, then redirects
 * back to the editor. This allows Gutenberg to render a control that lets the
 * user to completely enable or disable the 'postcustom' meta box.
 *
 * @since 5.2.0
 * @deprecated 5.0.0
 */
function gutenberg_toggle_custom_fields() {
	_deprecated_function( __FUNCTION__, '5.0.0' );
}
