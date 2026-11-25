<?php
/**
 * Block bindings additions for WordPress 7.3.
 *
 * @since 7.3.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Adds the Read More block's `content` attribute to the attributes supported by block bindings.
 *
 * This can be removed once the minimum required WordPress version is 7.3 or newer.
 *
 * @since 7.3.0
 *
 * @param string[] $supported_attributes The block's attributes that are supported by block bindings.
 * @return string[] The supported attributes, including `content`.
 */
function gutenberg_add_read_more_block_bindings_supported_attributes( array $supported_attributes ): array {
	if ( ! in_array( 'content', $supported_attributes, true ) ) {
		$supported_attributes[] = 'content';
	}

	return $supported_attributes;
}
add_filter( 'block_bindings_supported_attributes_core/read-more', 'gutenberg_add_read_more_block_bindings_supported_attributes' );
