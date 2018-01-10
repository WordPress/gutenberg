<?php
/**
 * Registers the wp-utils script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-utils',
	gutenberg_url( 'utils/build/index.js' ),
	array(),
	filemtime( gutenberg_dir_path() . 'utils/build/index.js' )
);
