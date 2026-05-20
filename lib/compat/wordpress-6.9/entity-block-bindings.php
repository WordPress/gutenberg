<?php
/**
 * Entity source for the block bindings (explicit entity args).
 *
 * @since 6.9.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets value for Entity source.
 *
 * This source is intentionally **not** tied to the current post context.
 * Consumers must pass entity identifiers via `$source_args`.
 *
 * Supported args:
 * - key: currently only supports `url`
 * - kind: `post-type` | `taxonomy`
 * - type: post type slug or taxonomy slug
 * - id: entity ID
 *
 * @since 6.9.0
 * @access private
 *
 * @param array    $source_args    Array containing source arguments used to look up the value.
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_entity_get_value( array $source_args, $block_instance ) {
	if ( empty( $source_args['key'] ) || 'url' !== $source_args['key'] ) {
		return null;
	}
	if ( empty( $source_args['kind'] ) || empty( $source_args['type'] ) || empty( $source_args['id'] ) ) {
		return null;
	}

	$kind = (string) $source_args['kind'];
	$type = (string) $source_args['type'];
	$id   = (int) $source_args['id'];

	if ( $id <= 0 ) {
		return null;
	}

	if ( 'post-type' === $kind ) {
		$post = get_post( $id );
		if ( ! $post ) {
			return null;
		}
		// Prevent unauthorized users from accessing non-public post data.
		if ( ( ! is_post_publicly_viewable( $post ) && ! current_user_can( 'read_post', $id ) ) || post_password_required( $post ) ) {
			return null;
		}
		$permalink = get_permalink( $id );
		return false === $permalink ? null : esc_url( $permalink );
	}

	if ( 'taxonomy' === $kind ) {
		// Map UI shorthand to taxonomy slug when using args.
		$taxonomy = ( 'tag' === $type ) ? 'post_tag' : $type;

		$term = get_term( $id, $taxonomy );
		if ( is_wp_error( $term ) || ! $term ) {
			return null;
		}

		$taxonomy_object = get_taxonomy( $taxonomy );
		if ( ! $taxonomy_object || ! $taxonomy_object->publicly_queryable ) {
			if ( ! current_user_can( 'read' ) ) {
				return null;
			}
		}

		$term_link = get_term_link( $term );
		return is_wp_error( $term_link ) ? null : esc_url( $term_link );
	}

	return null;
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

