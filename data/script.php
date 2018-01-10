<?php
/**
 * Registers the wp-data script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-data',
	gutenberg_url( 'data/build/index.js' ),
	array(),
	filemtime( gutenberg_dir_path() . 'data/build/index.js' )
);
