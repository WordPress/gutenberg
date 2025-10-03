<?php
/**
 * Entity source for the block bindings.
 *
 * @since 6.9.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets value for Entity source.
 *
 * @since 6.9.0
 * @access private
 *
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "key" => "url" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_entity_get_value( array $source_args, $block_instance ) {
	// Get the key from source args - no key means invalid binding
	if ( empty( $source_args['key'] ) ) {
		return null;
	}

	$key = $source_args['key'];

	// For now, only support 'url' key
	if ( 'url' !== $key ) {
		return null;
	}

	// Read entity data from block attributes
	$entity_id = $block_instance->attributes['id'] ?? null;
	$type      = $block_instance->attributes['type'] ?? '';
	$kind      = $block_instance->attributes['kind'] ?? '';

	if ( empty( $entity_id ) ) {
		return null;
	}

	try {
		// Handle post types
		if ( 'post-type' === $kind ) {
			$post = get_post( $entity_id );
			if ( ! $post ) {
				return null;
			}

			$permalink = get_permalink( $entity_id );
			if ( is_wp_error( $permalink ) ) {
				return null;
			}

			return esc_url( $permalink );
		}

		// Handle taxonomies
		if ( 'taxonomy' === $kind ) {
			// Convert 'tag' back to 'post_tag' for API calls
			// See update-attributes.js line 166 for the reverse conversion
			$taxonomy_slug = ( 'tag' === $type ) ? 'post_tag' : $type;
			$term          = get_term( $entity_id, $taxonomy_slug );

			if ( is_wp_error( $term ) || ! $term ) {
				return null;
			}

			$term_link = get_term_link( $term );
			if ( is_wp_error( $term_link ) ) {
				return null;
			}

			return esc_url( $term_link );
		}

		// Unknown entity kind
		return null;
	} catch ( Exception $e ) {
		return null;
	}
}

/**
 * Registers Entity source in the block bindings registry.
 *
 * @since 6.9.0
 * @access private
 */
function gutenberg_register_block_bindings_entity_source() {
	if ( get_block_bindings_source( 'core/entity' ) ) {
		// The source is already registered.
		return;
	}

	register_block_bindings_source(
		'core/entity',
		array(
			'label'              => _x( 'Entity', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_entity_get_value',
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_entity_source' );
