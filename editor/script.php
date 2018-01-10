<?php
/**
 * Registers the wp-editor script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-editor',
	gutenberg_url( 'editor/build/index.js' ),
	array( 'jquery', 'wp-api', 'wp-data', 'wp-date', 'wp-i18n', 'wp-blocks', 'wp-element', 'wp-components', 'wp-utils', 'word-count', 'editor', 'heartbeat' ),
	filemtime( gutenberg_dir_path() . 'editor/build/index.js' ),
	true // enqueue in the footer.
);

wp_register_style(
	'wp-editor-font',
	'https://fonts.googleapis.com/css?family=Noto+Serif:400,400i,700,700i'
);

wp_register_style(
	'wp-editor',
	gutenberg_url( 'editor/build/style.css' ),
	array( 'wp-components', 'wp-blocks', 'wp-edit-blocks', 'wp-editor-font' ),
	filemtime( gutenberg_dir_path() . 'editor/build/style.css' )
);
wp_style_add_data( 'wp-editor', 'rtl', 'replace' );
