<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

add_filter(
	'block_editor_settings_all',
	static function ( $settings ) {
		// We must override what core is passing now.
		$settings['themeSupportsAppearanceTools'] = current_theme_supports( 'appearance-tools' );
		return $settings;
	}
);
