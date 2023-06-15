<?php
/**
 * Plugin Name: Gutenberg Test Interactive Blocks
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-interactive-blocks
 */

add_action(
	'init',
	function() {
		// Register all blocks found in the `interactive-blocks` folder.
		if ( file_exists( __DIR__ . '/interactive-blocks/' ) ) {
			$block_json_files = glob( __DIR__ . '/interactive-blocks/**/block.json' );

			// auto register all blocks that were found.
			foreach ( $block_json_files as $filename ) {
				$block_folder = dirname( $filename );
				$name         = basename( $block_folder );

				$view_file = plugin_dir_url( $block_folder ) . $name . '/' . 'view.js';

				wp_register_script(
					$name . '-view',
					$view_file,
					array( 'wp-interactivity' ),
					filemtime( $view_file ),
					true
				);

				register_block_type_from_metadata( $block_folder );
			};
		};
	}
);
