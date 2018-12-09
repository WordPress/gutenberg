<?php
/**
 * Plugin Name: Gutenberg Test Plugin, WP Editor Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-wp-editor-metabox
 */

add_action( 'add_meta_boxes', function(){
	add_meta_box( 'test_tinymce', 'Test TinyMCE', function( $post ){
		 $field_value = get_post_meta( $post->ID, 'test_tinymce', true );
		 wp_editor( $field_value, 'test_tinymce_id', array(
			'wpautop'       => true,
			'media_buttons' => false,
			'textarea_name' => 'test_tinymce',
			'textarea_rows' => 10,
			'teeny'         => true
		) );
	}, null, 'advanced', 'high' );
});
add_action( 'save_post', function( $post_id ){
	if ( ! isset( $_POST['test_tinymce'] ) ) {
		return;
	}
	update_post_meta( $post_id, 'test_tinymce', $_POST['test_tinymce'] );
});
