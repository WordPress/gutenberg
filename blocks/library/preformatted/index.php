<?php
/**
 * Server-side rendering of the `core/preformatted` block.
 *
 * @package gutenberg
 */

function register_core_preformatted_block() {
	wp_register_script( 'core-preformatted-block', gutenberg_url( '/build/__block_preformatted.js' ) );

	register_block_type( 'core/preformatted', array(
		'editor_script' => 'core-preformatted-block',
	) );
}

add_action( 'init', 'register_core_preformatted_block' );
