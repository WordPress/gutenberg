<?php
/**
 * Registers the wp-components script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-components',
	gutenberg_url( 'components/build/index.js' ),
	array( 'wp-element', 'wp-i18n', 'wp-utils', 'wp-hooks', 'wp-api-request', 'moment' ),
	filemtime( gutenberg_dir_path() . 'components/build/index.js' )
);

wp_register_style(
	'wp-components',
	gutenberg_url( 'components/build/style.css' ),
	array(),
	filemtime( gutenberg_dir_path() . 'components/build/style.css' )
);
wp_style_add_data( 'wp-components', 'rtl', 'replace' );
