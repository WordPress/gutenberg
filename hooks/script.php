<?php
/**
 * Registers the wp-hooks script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-hooks',
	gutenberg_url( 'hooks/build/index.js' ),
	array(),
	filemtime( gutenberg_dir_path() . 'hooks/build/index.js' )
);
