<?php
/**
 * Loads the default editor styles.
 *
 * @package gutenberg
 */

/**
 * Load the default editor styles.
 * These styles are used if the "no theme styles" options is triggered
 * or on themes without their own editor styles.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_settings_with_default_editor_styles( $settings ) {
	$default_editor_styles_file      = gutenberg_dir_path() . 'build/block-editor/default-editor-styles.css';
	$settings['defaultEditorStyles'] = array(
		array(
			'css' => file_get_contents( $default_editor_styles_file ),
		),
	);

	// Remove the default font addition from Core Code.
	$styles_without_core_styles = array();
	if ( isset( $settings['styles'] ) ) {
		foreach ( $settings['styles'] as $style ) {
			if (
				! isset( $style['__unstableType'] ) ||
				'core' !== $style['__unstableType']
			) {
				$styles_without_core_styles[] = $style;
			}
		}
	}
	$settings['styles'] = $styles_without_core_styles;

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_extend_block_editor_settings_with_default_editor_styles' );
