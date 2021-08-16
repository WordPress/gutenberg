<?php
/**
 * Functions to register client-side assets (scripts and stylesheets) for the
 * Gutenberg editor plugin.
 *
 * @package gutenberg
 */

/**
 * Extends block editor settings to remove the Gutenberg's `editor-styles.css`;
 *
 * This can be removed when plugin support requires WordPress 5.8.0+.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_styles( $settings ) {
	if ( empty( $settings['styles'] ) ) {
		$settings['styles'] = array();
	} else {
		/*
		 * WordPress versions prior to 5.8 include a legacy editor styles file
		 * that need to be removed.
		 * This code can be removed from the Gutenberg plugin when the supported WP
		 * version is 5.8
		 */
		$default_styles_file = is_rtl() ?
			ABSPATH . WPINC . '/css/dist/editor/editor-styles-rtl.css' :
			ABSPATH . WPINC . '/css/dist/editor/editor-styles.css';

		if ( file_exists( $default_styles_file ) ) {
			$default_styles = file_get_contents(
				$default_styles_file
			);

			/*
			* Iterate backwards from the end of the array since the preferred
			* insertion point in case not found is prepended as first entry.
			*/
			for ( $i = count( $settings['styles'] ) - 1; $i >= 0; $i-- ) {
				if ( isset( $settings['styles'][ $i ]['css'] ) &&
						$default_styles === $settings['styles'][ $i ]['css'] ) {
					break;
				}
			}

			if ( isset( $i ) && $i >= 0 ) {
				unset( $settings['styles'][ $i ] );
			}
		}
	}

	// Remove the default font editor styles for FSE themes.
	if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		foreach ( $settings['styles'] as $j => $style ) {
			if ( 0 === strpos( $style['css'], 'body { font-family:' ) ) {
				unset( $settings['styles'][ $j ] );
			}
		}
	}

	return $settings;
}
// This can be removed when plugin support requires WordPress 5.8.0+.
if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_extend_block_editor_styles' );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_extend_block_editor_styles' );
}

/**
 * Adds a flag to the editor settings to know whether we're in FSE theme or not.
 *
 * This can be removed when plugin support requires WordPress 5.8.0+.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_extend_block_editor_settings_with_fse_theme_flag( $settings ) {
	$settings['supportsTemplateMode'] = gutenberg_supports_block_templates();

	// Enable the new layout options for themes with a theme.json file.
	$settings['supportsLayout'] = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();

	return $settings;
}
// This can be removed when plugin support requires WordPress 5.8.0+.
if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_extend_block_editor_settings_with_fse_theme_flag' );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_extend_block_editor_settings_with_fse_theme_flag' );
}
