<?php
/**
 * Server-side rendering of the `core/post-terms` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-terms` block on the server.
 *
 * @since 5.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post terms for the current post wrapped inside "a" tags.
 */
function render_block_core_post_terms( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) || ! isset( $attributes['term'] ) ) {
		return '';
	}

	if ( ! is_taxonomy_viewable( $attributes['term'] ) ) {
		return '';
	}

	$classes = array( 'taxonomy-' . $attributes['term'] );
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}

	$has_items = in_array( $attributes['layout']['type'] ?? null, array( 'flex', 'grid' ), true );
	$separator = empty( $attributes['separator'] ) ? ' ' : $attributes['separator'];

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	$prefix = "<div $wrapper_attributes>";
	if ( isset( $attributes['prefix'] ) && $attributes['prefix'] ) {
		$prefix .= '<span class="wp-block-post-terms__prefix">' . $attributes['prefix'] . '</span>';
	}

	$suffix = '</div>';
	if ( isset( $attributes['suffix'] ) && $attributes['suffix'] ) {
		$suffix = '<span class="wp-block-post-terms__suffix">' . $attributes['suffix'] . '</span>' . $suffix;
	}

	$post_terms = get_the_term_list(
		$block->context['postId'],
		$attributes['term'],
		wp_kses_post( $prefix ),
		// In a flex or grid layout each term is an item and the gap spaces them, so a separator would be an item of its own.
		$has_items ? '' : '<span class="wp-block-post-terms__separator">' . esc_html( $separator ) . '</span>',
		wp_kses_post( $suffix )
	);

	if ( is_wp_error( $post_terms ) || empty( $post_terms ) ) {
		return '';
	}

	return $post_terms;
}

/**
 * Removes the flow layout classes from blocks that have no saved layout.
 *
 * The layout support adds them to every block that supports layout, but Post
 * Terms blocks saved before it was supported must keep rendering as they did.
 *
 * @since 7.2.0
 *
 * @param string $block_content The block content.
 * @param array  $block         The parsed block.
 * @return string The block content without the unused layout classes.
 */
function block_core_post_terms_remove_unused_layout_classes( $block_content, $block ) {
	if ( isset( $block['attrs']['layout'] ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag() ) {
		$processor->remove_class( 'is-layout-flow' );
		$processor->remove_class( 'wp-block-post-terms-is-layout-flow' );
	}

	return $processor->get_updated_html();
}
add_filter( 'render_block_core/post-terms', 'block_core_post_terms_remove_unused_layout_classes', 10, 2 );

/**
 * Returns the available variations for the `core/post-terms` block.
 *
 * @since 6.5.0
 *
 * @return array The available variations for the block.
 */
function block_core_post_terms_build_variations() {
	$taxonomies = get_taxonomies(
		array(
			'publicly_queryable' => true,
			'show_in_rest'       => true,
		),
		'objects'
	);

	// Split the available taxonomies to `built_in` and custom ones,
	// in order to prioritize the `built_in` taxonomies at the
	// search results.
	$built_ins         = array();
	$custom_variations = array();

	// Create and register the eligible taxonomies variations.
	foreach ( $taxonomies as $taxonomy ) {
		$variation = array(
			'name'        => $taxonomy->name,
			'title'       => $taxonomy->label,
			'description' => sprintf(
				/* translators: %s: taxonomy's label */
				__( 'Display a list of assigned terms from the taxonomy: %s' ),
				$taxonomy->label
			),
			'attributes'  => array(
				'term' => $taxonomy->name,
			),
			'isActive'    => array( 'term' ),
			'scope'       => array( 'inserter', 'transform' ),
		);
		// Set the category variation as the default one.
		if ( 'category' === $taxonomy->name ) {
			$variation['isDefault'] = true;
		}
		if ( $taxonomy->_builtin ) {
			$built_ins[] = $variation;
		} else {
			$custom_variations[] = $variation;
		}
	}

	return array_merge( $built_ins, $custom_variations );
}

/**
 * Registers the `core/post-terms` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_post_terms() {
	register_block_type_from_metadata(
		__DIR__ . '/post-terms',
		array(
			'render_callback'    => 'render_block_core_post_terms',
			'variation_callback' => 'block_core_post_terms_build_variations',
		)
	);
}
add_action( 'init', 'register_block_core_post_terms' );
