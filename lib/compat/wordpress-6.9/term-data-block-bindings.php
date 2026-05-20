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
	 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks.
	 * Required for WordPress 6.9+ navigation blocks. DO NOT REMOVE.
	 */
	$block_name          = $block_instance->name ?? '';
	$is_navigation_block = in_array(
		$block_name,
		array( 'core/navigation-link', 'core/navigation-submenu' ),
		true
	);

	if ( $is_navigation_block ) {
		// Navigation blocks: read from block attributes
		$term_id = $block_instance->attributes['id'] ?? null;
		$type    = $block_instance->attributes['type'] ?? '';
		// Map UI shorthand to taxonomy slug when using attributes.
		$taxonomy = ( 'tag' === $type ) ? 'post_tag' : $type;
	} else {
		// All other blocks: use context
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

/**
* Filters the value from the core/term-data source to add support for button block.
*
* Button block stores entity info (id, kind, type) in metadata, not in context or attributes.
* This filter intercepts the Core callback and adds button block support.
*
* @since 7.1.0
*
* @param mixed  $value          The computed value for the source.
* @param string $source_name    The name of the source.
* @param array  $source_args    The arguments for the source.
* @param mixed  $block_instance The block instance.
* @param string $attribute_name The name of the attribute.
* @return mixed The filtered value.
*/
function gutenberg_filter_block_bindings_term_data_value( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
	if ( 'core/term-data' !== $source_name ) {
		return $value;
	}

	$block_name = $block_instance->name ?? '';

	// Only handle button block - navigation blocks and others are handled by Core.
	if ( 'core/button' !== $block_name ) {
		return $value;
	}

	// Button block: read from metadata (id, kind, type stored in metadata).
	$term_id  = $block_instance->attributes['metadata']['id'] ?? null;
	$kind     = $block_instance->attributes['metadata']['kind'] ?? null;
	$type     = $block_instance->attributes['metadata']['type'] ?? '';

	// Only handle taxonomy entities for term-data source.
	if ( empty( $term_id ) || 'taxonomy' !== $kind ) {
		return $value;
	}

	$field = $source_args['field'] ?? null;
	if ( empty( $field ) ) {
		return $value;
	}

	// Map UI shorthand to taxonomy slug when using metadata.
	$taxonomy = ( 'tag' === $type ) ? 'post_tag' : $type;

	// If we don't have required identifiers, bail early.
	if ( empty( $term_id ) || empty( $taxonomy ) ) {
		return $value;
	}

	// Get the term data.
	$term = get_term( $term_id, $taxonomy );
	if ( is_wp_error( $term ) || ! $term ) {
		return $value;
	}

	// Check if taxonomy exists and is publicly queryable.
	$taxonomy_object = get_taxonomy( $taxonomy );
	if ( ! $taxonomy_object || ! $taxonomy_object->publicly_queryable ) {
		if ( ! current_user_can( 'read' ) ) {
			return $value;
		}
	}

	if ( 'link' === $field ) {
		$term_link = get_term_link( $term );
		return is_wp_error( $term_link ) ? null : esc_url( $term_link );
	}

	return $value;
}

add_filter( 'block_bindings_source_value', 'gutenberg_filter_block_bindings_term_data_value', 10, 5 );
