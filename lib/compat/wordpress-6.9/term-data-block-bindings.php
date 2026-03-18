<?php
/**
 * Term Data source for the block bindings.
 *
 * @since 6.9.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets value for Term Data source.
 *
 * @since 6.9.0
 * @access private
 *
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "field" => "name" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_term_data_get_value( array $source_args, $block_instance ) {
	if ( empty( $source_args['field'] ) ) {
		return null;
	}

	/*
	 * Three-tier fallback for entity ID resolution:
	 * 1. Args-first: Read from binding args (new WP 7.0+ navigation links)
	 * 2. Backward compat: Read from block attributes (WP 6.9+ navigation links)
	 * 3. Context: Read from block context (all other blocks)
	 */
	$block_name          = $block_instance->name ?? '';
	$is_navigation_block = in_array(
		$block_name,
		array( 'core/navigation-link', 'core/navigation-submenu' ),
		true
	);

	if ( isset( $source_args['id'] ) ) {
		// Tier 1: Explicit args (new navigation links, WP 7.0+)
		$term_id  = $source_args['id'];
		$type     = $source_args['type'] ?? '';
		$taxonomy = ( 'tag' === $type ) ? 'post_tag' : $type;
	} elseif ( $is_navigation_block ) {
		// Tier 2: Backward compat (existing navigation links without id in args)
		$term_id  = $block_instance->attributes['id'] ?? null;
		$type     = $block_instance->attributes['type'] ?? '';
		$taxonomy = ( 'tag' === $type ) ? 'post_tag' : $type;
	} else {
		// Tier 3: Standard context (all other blocks)
		$term_id  = $block_instance->context['termId'] ?? null;
		$taxonomy = $block_instance->context['taxonomy'] ?? '';
	}

	// If we don't have required identifiers, bail early.
	if ( empty( $term_id ) || empty( $taxonomy ) ) {
		return null;
	}

	// Get the term data.
	$term = get_term( $term_id, $taxonomy );
	if ( is_wp_error( $term ) || ! $term ) {
		return null;
	}

	// Check if taxonomy exists and is publicly queryable.
	$taxonomy_object = get_taxonomy( $taxonomy );
	if ( ! $taxonomy_object || ! $taxonomy_object->publicly_queryable ) {
		if ( ! current_user_can( 'read' ) ) {
			return null;
		}
	}

	switch ( $source_args['field'] ) {
		case 'id':
			return esc_html( (string) $term_id );

		case 'name':
			return esc_html( $term->name );

		case 'link':
			// Only taxonomy entities are supported by Term Data.
			$term_link = get_term_link( $term );
			return is_wp_error( $term_link ) ? null : esc_url( $term_link );

		case 'slug':
			return esc_html( $term->slug );

		case 'description':
			return wp_kses_post( $term->description );

		case 'parent':
			return esc_html( (string) $term->parent );

		case 'count':
			return esc_html( (string) $term->count );

		default:
			return null;
	}
}

/**
 * Registers Term Data source in the block bindings registry.
 *
 * @since 6.9.0
 * @access private
 */
function gutenberg_register_block_bindings_term_data_source() {
	if ( get_block_bindings_source( 'core/term-data' ) ) {
		// The source is already registered.
		return;
	}

	register_block_bindings_source(
		'core/term-data',
		array(
			'label'              => _x( 'Term Data', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_term_data_get_value',
			'uses_context'       => array( 'termId', 'taxonomy' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_term_data_source' );
