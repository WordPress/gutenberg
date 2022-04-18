<?php
/**
 * Server-side rendering of the `core/comments-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comments-title` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Return the post comments title.
 */
function render_block_core_comments_title( $attributes, $content, $block ) {
	$comments_title     = '';
	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );
	/* translators: %s: The post title. */
	$single_comment_label   = __( 'One Response to "%s"' );
	$multiple_comment_label = __( '%1$s Responses to "%2$s"' );
	if ( 1 === (int) get_comments_number() ) {
		$comments_title = sprintf(
			/* translators: %s: The post title. */
			$single_comment_label,
			get_the_title()
		);
	} else {
		$comments_title = sprintf(
			/* translators: 1: The number of comments, 2: The post title. */
			$multiple_comment_label,
			number_format_i18n( get_comments_number() ),
			get_the_title()
		);
	}
	return sprintf(
		'<h3 id="comments" %1$s>%2$s</h3>',
		$wrapper_attributes,
		$comments_title
	);
}

/**
 * Registers the `core/comments-title` block on the server.
 */
function register_block_core_comments_title() {
	register_block_type_from_metadata(
		__DIR__ . '/comments-title',
		array(
			'render_callback' => 'render_block_core_comments_title',
		)
	);
}

add_action( 'init', 'register_block_core_comments_title' );
