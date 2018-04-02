<?php
/**
 * Server-side rendering of the `core/verse` block.
 *
 * @package gutenberg
 */

function register_core_verse_block() {
	wp_register_script( 'core-verse-block', gutenberg_url( '/build/__block_verse.js' ) );

	register_block_type( 'core/verse', array(
		'editor_script' => 'core-verse-block',
	) );
}

add_action( 'init', 'register_core_verse_block' );
