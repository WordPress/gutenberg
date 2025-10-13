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
 *                                 Example: array( "key" => "name" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_term_data_get_value( array $source_args, $block_instance ) {
	if ( empty( $source_args['key'] ) ) {
		return null;
	}

	/*
	 * BACKWARDS COMPATIBILITY: Hardcoded exception for navigation blocks
	 *
	 * This conditional MUST be maintained indefinitely for backwards compatibility.
	 *
	 * REASON: Once WordPress 6.9 ships, navigation blocks will be created with
	 * binding shapes that rely on this hardcoded exception. WordPress backwards
	 * compatibility requirements mandate that these existing block structures
	 * continue to be supported forever.
	 *
	 * MIGRATION PATH: During the WordPress 7.0 development cycle, a
	 * binding configuration API will be designed that allows blocks to declare
	 * their data source preferences. Navigation blocks can then be migrated to
	 * use this new API, but this legacy exception must remain as a fallback to
	 * ensure existing blocks continue to function.
	 *
	 * DO NOT REMOVE: This conditional is permanent technical debt that must
	 * be maintained to support blocks created in WordPress 6.9 and earlier.
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

	switch ( $source_args['key'] ) {
		case 'id':
			return esc_html( (string) $term_id );

		case 'name':
			return esc_html( $term->name );

		case 'link':
			// Only taxonomy entities are supported by Term Data.
			return esc_url( get_term_link( $term ) );

		case 'slug':
			return esc_html( $term->slug );

		case 'description':
			return wp_kses_post( $term->description );

		case 'parent':
			return esc_html( (string) $term->parent );

		case 'count':
			return esc_html( (string) '(' . $term->count . ')' );

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
