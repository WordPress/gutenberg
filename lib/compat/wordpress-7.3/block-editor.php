<?php
/**
 * WordPress 7.3 compatibility functions for the block editor settings.
 *
 * @package gutenberg
 */

/**
 * Adds the autosave ID, its post and its date to the `autosave` editor setting.
 *
 * The editor can move to another post without reloading the page, and can
 * save the post after the setting was printed. Naming the post and the date
 * lets it offer the autosave only for its post, and only while it is newer.
 *
 * @param array                   $settings             Editor settings.
 * @param WP_Block_Editor_Context $block_editor_context The current block editor context.
 * @return array Filtered editor settings.
 */
function gutenberg_add_autosave_post_to_editor_settings( $settings, $block_editor_context ) {
	if ( ! isset( $settings['autosave'] ) || empty( $block_editor_context->post ) ) {
		return $settings;
	}

	$post     = $block_editor_context->post;
	$autosave = wp_get_post_autosave( $post->ID );

	if ( ! $autosave ) {
		return $settings;
	}

	$settings['autosave']['id']       = $autosave->ID;
	$settings['autosave']['postId']   = $post->ID;
	$settings['autosave']['modified'] = mysql_to_rfc3339( $autosave->post_modified );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_autosave_post_to_editor_settings', 10, 2 );
