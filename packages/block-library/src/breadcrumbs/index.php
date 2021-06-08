<?php
/**
 * Server-side rendering of the `core/breadcrumbs` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/breadcrumbs` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the filtered breadcrumbs for the current post.
 */
function render_block_core_breadcrumbs( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_ID = $block->context['postId'];

	$separator = '';

	if ( isset( $attributes['separator'] ) ) {
		$separator = $attributes['separator'];
	}

	$ancestor_ids = get_post_ancestors( $post_ID );

	if ( empty( $ancestor_ids ) ) {
		return '';
	}

	$breadcrumbs_inner = array();

	foreach( array_reverse( $ancestor_ids ) as $index => $ancestor_id ) {
		$li_class = 'wp-block-breadcrumbs__item';
		$separator_class = 'wp-block-breadcrumbs__separator';

		$markup = sprintf(
			'<a href="%s">%s</a>',
			get_the_permalink( $ancestor_id ),
			get_the_title( $ancestor_id )
		);

		if (
			isset( $attributes['separator'] ) &&
			$index !== count( $ancestor_ids ) - 1
		) {
			$markup .= sprintf(
				'<span class="%1$s">%2$s</span>',
				$separator_class,
				esc_html( $attributes['separator'] )
			);
		}

		$breadcrumbs_inner[] = sprintf(
			'<li class="%1$s">%2$s</li>',
			$li_class,
			$markup
		);
	}

	$inner_markup = implode( '', $breadcrumbs_inner );

	$align_class_name = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<ol %1$s>%2$s</ol>',
		$wrapper_attributes,
		$inner_markup
	);
}

/**
 * Registers the `core/post-title` block on the server.
 */
function register_block_core_breadcrumbs() {
	register_block_type_from_metadata(
		__DIR__ . '/breadcrumbs',
		array(
			'render_callback' => 'render_block_core_breadcrumbs',
		)
	);
}
add_action( 'init', 'register_block_core_breadcrumbs' );
