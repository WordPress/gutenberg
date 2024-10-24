<?php

add_action( 'admin_enqueue_scripts', function( $hook ) {
	// Maybe also remove on post.php when Gutenberg is enabled for posts.
	if ( 'site-editor.php' !== $hook ) {
		return;
	}
	wp_dequeue_style( 'colors' );
} );
