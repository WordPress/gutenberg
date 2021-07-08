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

	$post_id      = $block->context['postId'];
	$ancestor_ids = get_post_ancestors( $post_id );

	if ( empty( $ancestor_ids ) ) {
		return '';
	}

	if ( ! empty( $attributes['nestingLevel'] ) ) {
		$ancestor_ids = array_slice(
			$ancestor_ids,
			0,
			intval( $attributes['nestingLevel'] )
		);
	}

	$inner_markup = '';

	foreach ( array_reverse( $ancestor_ids ) as $index => $ancestor_id ) {
		$show_separator = 0 !== $index || ! empty( $attributes['showLeadingSeparator'] );
		$inner_markup  .= build_block_core_breadcrumbs_inner_markup_item(
			$ancestor_id,
			$attributes,
			$show_separator
		);
	}

	if ( ! empty( $attributes['showCurrentPageTitle'] ) ) {
		$show_separator = true;
		$inner_markup  .= build_block_core_breadcrumbs_inner_markup_item(
			$post_id,
			$attributes,
			$show_separator
		);
	}

	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<nav %1$s><ol>%2$s</ol></nav>',
		$wrapper_attributes,
		$inner_markup
	);
}

/**
 * Builds the markup for a single Breadcrumb item.
 *
 * Used when iterating over a list of ancestor post ids.
 *
 * @param int   $post_id        The post id for this item.
 * @param array $attributes     Block attributes.
 * @param bool  $show_separator Whether to show the separator character where available.
 *
 * @return string The markup for a single breadcrumb item wrapped in an `li` element.
 */
function build_block_core_breadcrumbs_inner_markup_item( $post_id, $attributes, $show_separator = true ) {
	$li_class        = 'wp-block-breadcrumbs__item';
	$separator_class = 'wp-block-breadcrumbs__separator';

	$markup = '';

	if (
		$show_separator &&
		! empty( $attributes['separator'] )
	) {
		$markup .= sprintf(
			'<span class="%1$s">%2$s</span>',
			$separator_class,
			esc_html( $attributes['separator'] )
		);
	}

	$markup .= sprintf(
		'<a href="%s">%s</a>',
		get_the_permalink( $post_id ),
		get_the_title( $post_id )
	);

	return sprintf(
		'<li class="%1$s">%2$s</li>',
		$li_class,
		$markup
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
