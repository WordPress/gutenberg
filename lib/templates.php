<?php
/**
 * Register Gutenberg core block editor templates.
 *
 * @package gutenberg
 */

/**
 * Registers Gutenberg core block editor templates.
 */
function gutenberg_register_templates() {
	$post_post_type_object                = get_post_type_object( 'post' );
	$post_post_type_object->template      = array(
		array( 'core/post-title' ),
		array( 'core/post-content', array(), array( array( 'core/paragraph' ) ) ),
	);
	$post_post_type_object->template_lock = 'insert';
}
add_action( 'init', 'gutenberg_register_templates' );
