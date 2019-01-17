<?php
/**
 * Plugin Name: Gutenberg Test Plugin, WP Editor Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-wp-editor-metabox
 */

add_action( 'add_meta_boxes', 'gutenberg_test_add_tinymce_meta_box' );
/**
 * Adds a TinyMCE meta box for testing
 */
function gutenberg_test_add_tinymce_meta_box() {
	add_meta_box(
		'test_tinymce',
		'Test TinyMCE',
		'gutenberg_test_render_tinymce_meta_box',
		null,
		'advanced',
		'high'
	);
}

/**
 * Render the TinyMCE meta box
 *
 * @param WP_Post $post The current post object.
 */
function gutenberg_test_render_tinymce_meta_box( $post ) {
	$field_value = get_post_meta( $post->ID, 'test_tinymce', true );
	wp_editor(
		$field_value,
		'test_tinymce_id',
		array(
			'wpautop'       => true,
			'media_buttons' => false,
			'textarea_name' => 'test_tinymce',
			'textarea_rows' => 10,
			'teeny'         => true,
		)
	);
}

/**
 * Save the TinyMCE meta box
 *
 * @param int $post_id The ID of the current post.
 */
function gutenberg_test_save_tinymce_meta_box( $post_id ) {
	if ( ! isset( $_POST['test_tinymce'] ) ) {
		return;
	}
	update_post_meta( $post_id, 'test_tinymce', $_POST['test_tinymce'] );
}
add_action( 'save_post', 'gutenberg_test_save_tinymce_meta_box' );
