<?php
/**
 * Block bindings additions for WordPress 7.2.
 *
 * @since 7.2.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

// The following filter can be removed once the minimum required WordPress version is 7.2 or newer.
add_filter(
	'block_bindings_supported_attributes_core/icon',
	function ( $supported_attributes ) {
		if ( ! in_array( 'icon', $supported_attributes, true ) ) {
			$supported_attributes[] = 'icon';
		}
		return $supported_attributes;
	}
);
