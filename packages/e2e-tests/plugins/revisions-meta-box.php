<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Revisions Meta Box
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-revisions-meta-box
 */

/**
 * Registers a revisioned meta field that is not exposed to the REST API, so
 * that only a server side restore can bring back its value.
 */
function gutenberg_test_revisions_meta_box_register_meta() {
	register_post_meta(
		'post',
		'gutenberg_test_revisions_meta',
		array(
			'type'              => 'string',
			'single'            => true,
			'revisions_enabled' => true,
			'sanitize_callback' => 'sanitize_text_field',
			'auth_callback'     => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}
add_action( 'init', 'gutenberg_test_revisions_meta_box_register_meta' );

/**
 * Renders the meta box.
 *
 * @param WP_Post $post Post being edited.
 */
function gutenberg_test_revisions_meta_box_render( $post ) {
	wp_nonce_field( 'gutenberg_test_revisions_meta_box', 'gutenberg_test_revisions_meta_box_nonce' );
	printf(
		'<label for="gutenberg-test-revisions-meta">Revisions meta box field</label><input type="text" id="gutenberg-test-revisions-meta" name="gutenberg_test_revisions_meta" value="%s" />',
		esc_attr( get_post_meta( $post->ID, 'gutenberg_test_revisions_meta', true ) )
	);
}

/**
 * Adds the meta box.
 */
function gutenberg_test_revisions_meta_box_add() {
	add_meta_box(
		'gutenberg-test-revisions-meta-box',
		'Gutenberg Test Revisions Meta Box',
		'gutenberg_test_revisions_meta_box_render',
		'post',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'gutenberg_test_revisions_meta_box_add' );

/**
 * Saves the meta box value.
 *
 * @param int $post_id Post being saved.
 */
function gutenberg_test_revisions_meta_box_save( $post_id ) {
	if (
		! isset( $_POST['gutenberg_test_revisions_meta_box_nonce'] ) ||
		! wp_verify_nonce( sanitize_key( $_POST['gutenberg_test_revisions_meta_box_nonce'] ), 'gutenberg_test_revisions_meta_box' )
	) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( isset( $_POST['gutenberg_test_revisions_meta'] ) ) {
		update_post_meta(
			$post_id,
			'gutenberg_test_revisions_meta',
			sanitize_text_field( wp_unslash( $_POST['gutenberg_test_revisions_meta'] ) )
		);
	}
}
add_action( 'save_post_post', 'gutenberg_test_revisions_meta_box_save' );
