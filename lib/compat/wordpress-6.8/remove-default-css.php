<?php

function gutenberg_remove_default_css( $hook ) {
	// Maybe also remove on post.php when Gutenberg is enabled for posts.
	if ( 'site-editor.php' !== $hook ) {
		return;
	}
	wp_dequeue_style( 'colors' );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_remove_default_css' );
