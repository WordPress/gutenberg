<?php

if ( isset( $_COOKIE[ 'requiresTinymce' ] ) ) {
	return;
}

add_action( 'admin_init', 'gutenberg_disable_tinymce' );
function gutenberg_disable_tinymce() {
	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if ( $gutenberg_experiments && array_key_exists( 'gutenberg-no-tinymce', $gutenberg_experiments ) ) {
		require __DIR__ . '/wp-editors-class-placeholder.php';
	}
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_tinymce_proxy' );
function gutenberg_enqueue_tinymce_proxy() {
	wp_enqueue_script( 'gutenberg-tinymce-proxy', plugins_url( 'assets/tinymce-proxy.js' , __FILE__ ) );
}
