<?php
/**
 * Utilities to manage editor settings.
 *
 * @package gutenberg
 */

/**
 * Extends the block editor with settings that are only in the plugin.
 *
 * This is a temporary solution until the Gutenberg plugin sets
 * the required WordPress version to 5.8.
 *
 * @see https://core.trac.wordpress.org/ticket/52920
 *
 * @param array $settings Existing editor settings.
 *
 * @return array Filtered settings.
 */
function gutenberg_extend_post_editor_settings( $settings ) {
	$image_default_size = get_option( 'image_default_size', 'large' );
	$image_sizes        = wp_list_pluck( $settings['imageSizes'], 'slug' );

	$settings['imageDefaultSize']                      = in_array( $image_default_size, $image_sizes, true ) ? $image_default_size : 'large';
	$settings['__unstableEnableFullSiteEditingBlocks'] = gutenberg_supports_block_templates();

	if ( gutenberg_is_fse_theme() ) {
		$settings['defaultTemplatePartAreas'] = gutenberg_get_allowed_template_part_areas();
	}

	return $settings;
}
// This can be removed when plugin support requires WordPress 5.8.0+.
if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_extend_post_editor_settings' );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_extend_post_editor_settings' );
}
