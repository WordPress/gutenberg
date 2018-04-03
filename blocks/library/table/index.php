<?php
/**
 * Server-side rendering of the `core/table` block.
 *
 * @package gutenberg
 */

function register_core_table_block() {
	wp_register_script( 'core-table-block', gutenberg_url( '/build/__block_table.js' ) );

	register_block_type( 'core/table', array(
		'editor_script' => 'core-table-block',
	) );
}

add_action( 'init', 'register_core_table_block' );
