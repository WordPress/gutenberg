<?php

/**
 * Extends default editor settings with editing canvas stylesheets.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */

function gutenberg_stylesheets_editor_settings( $settings ) {
	$stylesheets_settings = array(
		'resizableStylesheets' => array(
			'block-library',
			'editor-style',
			'block-editor',
		),
	);

	return array_merge( $settings, $stylesheets_settings );
}
add_filter( 'block_editor_settings', 'gutenberg_experiments_editor_settings' );
