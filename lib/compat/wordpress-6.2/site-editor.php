<?php
/**
 * Updates the site-editor.php file
 *
 * @package gutenberg
 */

/**
 * Remove home template setting and add filtered extraTemplatesTypes setting for WP 6.2.
 *
 * @param array                   $settings Existing block editor settings.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_site_editor_update_settings( $settings, $context ) {
	if ( isset( $context->post ) ) {
		return $settings;
	}

	unset( $settings['__unstableHomeTemplate'] );

	/**
	 * Filters the list of extra templates.
	 *
	 * Template types added in this filter will show up under the `Add new` menu in the Site Editor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $extra_template_types An array of template types, formatted as [ slug, title, description ] ].
	 */
	$settings['extraTemplateTypes'] = apply_filters( 'extra_template_types', array() );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_site_editor_update_settings', 10, 2 );
