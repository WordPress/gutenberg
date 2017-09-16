<?php

function gutenberg_book_register_meta() {
	register_meta( 'post', 'author', array(
		'show_in_rest' => true,
		'single' => true,
	) );
}
add_action( 'init', 'gutenberg_book_register_meta' );
