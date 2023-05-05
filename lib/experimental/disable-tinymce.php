<?php
add_action( 'admin_init', 'gutenberg_disable_tinymce' );
function gutenberg_disable_tinymce() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-no-tinymce', $gutenberg_experiments ) ) {
		require __DIR__ . '/wp-editors-class-placeholder.php';
	}
}