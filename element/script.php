<?php
/**
 * Registers the wp-element script
 *
 * @package gutenberg
 */

wp_register_script(
	'wp-element',
	gutenberg_url( 'element/build/index.js' ),
	array( 'react', 'react-dom', 'react-dom-server' ),
	filemtime( gutenberg_dir_path() . 'element/build/index.js' )
);
