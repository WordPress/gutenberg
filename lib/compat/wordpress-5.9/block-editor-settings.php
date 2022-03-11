<?php
/**
 * Extends the block editor with settings that are only in the plugin.
 *
 * This is a temporary solution until the Gutenberg plugin sets
 * the required WordPress version to 5.9.
 *
 * @see https://core.trac.wordpress.org/ticket/52920
 *
 * @param array $settings Existing editor settings.
 *
 * @return array Filtered settings.
 */
function gutenberg_get_block_editor_settings_5_9( $settings ) {
	$settings['__unstableEnableFullSiteEditingBlocks'] = current_theme_supports( 'block-templates' );

	if ( wp_is_block_theme() ) {
		$settings['defaultTemplatePartAreas'] = get_allowed_block_template_part_areas();
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings_5_9' );
