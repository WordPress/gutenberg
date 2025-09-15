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

	if ( empty( $block_instance->context['termId'] ) || empty( $block_instance->context['taxonomy'] ) ) {
		return null;
	}

	$term_id  = $block_instance->context['termId'];
	$taxonomy = $block_instance->context['taxonomy'];

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
