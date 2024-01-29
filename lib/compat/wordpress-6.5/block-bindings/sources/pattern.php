<?php
/**
 * Add the metadata source to the block bindings API.
 *
 * @package gutenberg
 */
if ( function_exists( 'wp_block_bindings_register_source' ) ) {
	$pattern_source_callback = function ( $source_attrs, $block_instance, $attribute_name ) {
		if ( ! _wp_array_get( $block_instance->attributes, array( 'metadata', 'id' ), false ) ) {
			return null;
		}
		$block_id           = $block_instance->attributes['metadata']['id'];
		$attribute_override = _wp_array_get( $block_instance->context, array( 'pattern/overrides', $block_id, $attribute_name ), null );
		if ( null === $attribute_override ) {
			return null;
		}
		switch ( $attribute_override[0] ) {
			case 0: // remove
				/**
				 * TODO: This currently doesn't remove the attribute, but only set it to an empty string.
				 * It's a temporary solution until the block binding API supports different operations.
				 */
				return '';
			case 1: // replace
				return $attribute_override[1];
			default:
				return null;
		}
	};
	wp_block_bindings_register_source(
		'core/pattern-attributes',
		array(
			'label' => __( 'Pattern Attributes' ),
			'apply' => $pattern_source_callback,
		)
	);
}

if ( ! function_exists( 'gutenberg_register_block_bindings_pattern_overrides_source' ) && ! function_exists( 'gutenberg_block_bindings_pattern_overrides_callback' ) ) {
	function gutenberg_block_bindings_pattern_overrides_callback( $source_attrs ) {
		if ( ! isset( $source_attrs['key'] ) ) {
			return null;
		}

		// Use the postId attribute if available
		if ( isset( $source_attrs['postId'] ) ) {
			$post_id = $source_attrs['postId'];
		} else {
			// I tried using $block_instance->context['postId'] but it wasn't available in the image block.
			$post_id = get_the_ID();
		}

		return get_post_meta( $post_id, $source_attrs['key'], true );
	}

	function gutenberg_register_block_bindings_pattern_overrides_source() {
		wp_block_bindings_register_source(
			'core/post-meta',
			array(
				'label' => __( 'Post Meta' ),
				'apply' => 'gutenberg_block_bindings_pattern_overrides_callback',
			)
		);
	}
}

add_action( 'init', 'gutenberg_register_block_bindings_pattern_overrides_source' );
