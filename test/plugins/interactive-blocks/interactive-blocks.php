<?php
/**
 * Plugin Name: Gutenberg Test Interactive Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-interactive-blocks
 */

 // Register all blocks found in the `build/blocks` folder.
function auto_register_block_types() {
	if ( file_exists( __DIR__ . '/build/' ) ) {
		$block_json_files = glob( __DIR__ . '/build/**/block.json' );


		// auto register all blocks that were found.
		foreach ( $block_json_files as $filename ) {
			$block_folder = dirname( $filename );
			register_block_type( $block_folder );
		};
	};
}

add_action( 'init', 'auto_register_block_types' );
