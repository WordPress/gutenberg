<?php
/**
 * Registers the wp-i18n script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-i18n',
	gutenberg_url( 'i18n/build/index.js' ),
	array(),
	filemtime( gutenberg_dir_path() . 'i18n/build/index.js' )
);
