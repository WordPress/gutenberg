<?php
/**
 * Registers the wp-blocks script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-blocks',
	gutenberg_url( 'blocks/build/index.js' ),
	array( 'wp-element', 'wp-components', 'wp-utils', 'wp-hooks', 'wp-i18n', 'tinymce-latest', 'tinymce-latest-lists', 'tinymce-latest-paste', 'tinymce-latest-table', 'media-views', 'media-models', 'shortcode' ),
	filemtime( gutenberg_dir_path() . 'blocks/build/index.js' )
);
wp_add_inline_script(
	'wp-blocks',
	gutenberg_get_script_polyfill( array(
		'\'Promise\' in window' => 'promise',
		'\'fetch\' in window'   => 'fetch',
	) ),
	'before'
);

wp_register_style(
	'wp-blocks',
	gutenberg_url( 'blocks/build/style.css' ),
	array(),
	filemtime( gutenberg_dir_path() . 'blocks/build/style.css' )
);
wp_style_add_data( 'wp-blocks', 'rtl', 'replace' );

wp_register_style(
	'wp-edit-blocks',
	gutenberg_url( 'blocks/build/edit-blocks.css' ),
	array(),
	filemtime( gutenberg_dir_path() . 'blocks/build/edit-blocks.css' )
);
wp_style_add_data( 'wp-edit-blocks', 'rtl', 'replace' );
