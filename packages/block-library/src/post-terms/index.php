<?php
/**
 * Server-side registering and rendering of the `core/post-terms` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-terms` block on the server.
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

	$post_terms = get_the_terms( $block->context['postId'], $attributes['term'] );
	if ( is_wp_error( $post_terms ) || empty( $post_terms ) ) {
		return '';
	}

	$classes = array( 'taxonomy-' . $attributes['term'] );
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}

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

	return get_the_term_list(
		$block->context['postId'],
		$attributes['term'],
		wp_kses_post( $prefix ),
		'<span class="wp-block-post-terms__separator">' . esc_html( $separator ) . '</span>',
		wp_kses_post( $suffix )
	);
}

/**
 * Returns a post terms variation
 *
 * @param WP_Taxonomy|stdClass $taxonomy taxonomy entity.
 *
 * @return array
 */
function block_core_post_terms_build_variation_for_post_terms( $taxonomy ) {
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

	return $variation;
}

/**
 * Registers the `core/post-terms` block on the server.
 */
function register_block_core_post_terms() {
	// This will only handle taxonomies registered until this point (init on priority 9).
	// See action hooks below for other taxonomies.
	// See https://github.com/WordPress/gutenberg/issues/52569 for details.
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
		$variation = block_core_post_terms_build_variation_for_post_terms( $taxonomy );
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
 */
function register_block_core_post_terms() {
	register_block_type_from_metadata(
		__DIR__ . '/post-terms',
		array(
			'render_callback'    => 'render_block_core_post_terms',
			'variation_callback' => 'build_post_term_block_variations',
		)
	);
}
add_action( 'init', 'register_block_core_post_terms' );
// Register actions for all taxonomies, to add variations when they are registered.
// All taxonomies registered before register_block_core_post_terms, will be handled by that function.
add_action( 'registered_taxonomy', 'register_block_core_post_terms_taxonomy_variation', 10, 3 );

/**
 * Register a custom taxonomy variation for post terms on taxonomy registration
 * Handles all taxonomies registered after the block is registered in register_block_core_post_terms
 *
 * @param string       $taxonomy Taxonomy slug.
 * @param array|string $object_type Object type or array of object types.
 * @param array        $args Array of taxonomy registration arguments.
 * @return void
 */
function register_block_core_post_terms_taxonomy_variation( $taxonomy, $object_type, $args ) {
	if ( isset( $args['publicly_queryable'] ) && $args['publicly_queryable'] ) {
		$variation = block_core_post_terms_build_variation_for_post_terms( (object) $args );
		// Directly set the variations on the registered block type
		// because there's no server side registration for variations (see #47170).
		$post_terms_block_type = WP_Block_Type_Registry::get_instance()->get_registered( 'core/post-terms' );
		// If the block is not registered yet, bail early.
		// Variation will be registered in register_block_core_post_terms then.
		if ( ! $post_terms_block_type ) {
			return;
		}

		$post_terms_block_type->variations[] = $variation;
	}
}
