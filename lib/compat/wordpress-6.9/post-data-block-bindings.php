<?php
/**
 * Post Data source for the block bindings.
 *
 * @since 6.9.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets value for Post Data source.
 *
 * @since 6.9.0
 * @access private
 *
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "field" => "foo" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_post_data_get_value( array $source_args, $block_instance ) {
	if ( empty( $source_args['field'] ) ) {
		// Backward compatibility for when the source argument was called `key` in Gutenberg plugin.
		if ( empty( $source_args['key'] ) ) {
			return null;
		}
		$field = $source_args['key'];
	} else {
		$field = $source_args['field'];
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
		$post_id = $block_instance->attributes['id'] ?? null;
	} else {
		// All other blocks: use context
		$post_id = $block_instance->context['postId'] ?? null;
	}

	// If we don't have an entity ID, bail early.
	if ( empty( $post_id ) ) {
		return null;
	}

	// If a post isn't public, we need to prevent unauthorized users from accessing the post data.
	$post = get_post( $post_id );
	if ( ( ! is_post_publicly_viewable( $post ) && ! current_user_can( 'read_post', $post_id ) ) || post_password_required( $post ) ) {
		return null;
	}

	if ( 'date' === $field ) {
		return esc_attr( get_the_date( 'c', $post_id ) );
	}

	if ( 'modified' === $field ) {
		// Only return the modified date if it is later than the publishing date.
		if ( get_the_modified_date( 'U', $post_id ) > get_the_date( 'U', $post_id ) ) {
			return esc_attr( get_the_modified_date( 'c', $post_id ) );
		} else {
			return '';
		}
	}

	if ( 'link' === $field ) {
		$permalink = get_permalink( $post_id );
		return false === $permalink ? null : esc_url( $permalink );
	}
}

/**
 * Registers Post Data source in the block bindings registry.
 *
 * @since 6.9.0
 * @access private
 */
function gutenberg_register_block_bindings_post_data_source() {
	if ( get_block_bindings_source( 'core/post-data' ) ) {
		// The source is already registered.
		return;
	}

	register_block_bindings_source(
		'core/post-data',
		array(
			'label'              => _x( 'Post Data', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_post_data_get_value',
			'uses_context'       => array( 'postId', 'postType' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_post_data_source' );

/**
 * Filters the value from the core/post-data source to add support for button block.
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
function gutenberg_filter_block_bindings_post_data_value( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
	if ( 'core/post-data' !== $source_name ) {
		return $value;
	}

	$block_name = $block_instance->name ?? '';

	// Only handle button block - navigation blocks and others are handled by Core.
	if ( 'core/button' !== $block_name ) {
		return $value;
	}

	// Button block: read from metadata (id, kind, type stored in metadata).
	$post_id = $block_instance->attributes['metadata']['id'] ?? null;
	$kind    = $block_instance->attributes['metadata']['kind'] ?? null;

	// Only handle post-type entities for post-data source.
	if ( empty( $post_id ) || 'post-type' !== $kind ) {
		return $value;
	}

	$field = $source_args['field'] ?? $source_args['key'] ?? null;
	if ( empty( $field ) ) {
		return $value;
	}

	// If a post isn't public, we need to prevent unauthorized users from accessing the post data.
	$post = get_post( $post_id );
	if ( ( ! is_post_publicly_viewable( $post ) && ! current_user_can( 'read_post', $post_id ) ) || post_password_required( $post ) ) {
		return null;
	}

	if ( 'link' === $field ) {
		$permalink = get_permalink( $post_id );
		return false === $permalink ? null : esc_url( $permalink );
	}

	return $value;
}

add_filter( 'block_bindings_source_value', 'gutenberg_filter_block_bindings_post_data_value', 10, 5 );