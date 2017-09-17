<?php

function gutenberg_book_register_meta() {
	register_meta( 'post', 'author', array(
		'show_in_rest' => true,
		'single' => true,
	) );
}
add_action( 'init', 'gutenberg_book_register_meta' );

function gutenberg_block_book_enqueue_assets() {
	wp_enqueue_script(
		'gutenberg-block-book',
		plugins_url( 'hypothetical-book-block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' )
	);
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_block_book_enqueue_assets' );
