<?php
/**
 * Server-side rendering of the `core/post-comments-form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments-form` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post comments form for the current post.
 */
function render_block_core_post_comments_form( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$classes = '';
	if ( isset( $attributes['textAlign'] ) ) {
		$classes .= 'has-text-align-' . $attributes['textAlign'];
	}

	ob_start();
	comment_form( array(), $block->context['postId'] );
	$form               = ob_get_clean();
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );

	// Enqueue the comment-reply script.
	wp_enqueue_script( 'comment-reply' );

	return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $form );
}

/**
 * Registers the `core/post-comments-form` block on the server.
 */
function register_block_core_post_comments_form() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comments-form',
		array(
			'render_callback' => 'render_block_core_post_comments_form',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments_form' );

/**
 * Use the button block classes for the form-submit button.
 *
 * @param array $fields The default comment form arguments.
 *
 * @return array Returns the modified fields.
 */
function post_comments_form_block_form_defaults( $fields ) {
	if ( wp_is_block_theme() ) {
		$fields['submit_button'] = '<input name="%1$s" type="submit" id="%2$s" class="%3$s wp-block-button__link" value="%4$s" />';
		$fields['submit_field']  = '<p class="form-submit wp-block-button">%1$s %2$s</p>';
	}

	return $fields;
}
add_filter( 'comment_form_defaults', 'post_comments_form_block_form_defaults' );
