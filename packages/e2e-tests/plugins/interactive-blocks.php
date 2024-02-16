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
	function () {
		// Register all blocks found in the `interactive-blocks` folder.
		if ( file_exists( __DIR__ . '/interactive-blocks/' ) ) {
			$block_json_files = glob( __DIR__ . '/interactive-blocks/**/block.json' );

			// Auto register all blocks that were found.
			foreach ( $block_json_files as $filename ) {
				$block_folder = dirname( $filename );
				$name         = basename( $block_folder );

				$view_file = plugin_dir_url( $block_folder ) . $name . '/' . 'view.js';

				wp_register_script_module(
					$name . '-view',
					$view_file,
					array(
						'@wordpress/interactivity',
						array(
							'id'     => '@wordpress/interactivity-router',
							'import' => 'dynamic',
						),
					),
					filemtime( $view_file )
				);

				register_block_type_from_metadata( $block_folder );
			}
		}

		/*
		 * Disable the server directive processing during E2E testing. This is
		 * required to ensure that client hydration works even when the rendered
		 * HTML contains unbalanced tags and it couldn't be processed in the server.
		 */
		if ( 'true' === $_GET['disable_server_directive_processing'] ) {
			// Ensure the interactivity API is loaded.
			wp_interactivity();
			// But remove the server directive processing.
			remove_filter(
				'render_block_data',
				'wp_interactivity_process_directives_of_interactive_blocks'
			);
		}
	}
);
