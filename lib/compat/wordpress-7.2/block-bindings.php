<?php
/**
 * Block bindings additions for WordPress 7.2.
 *
 * @since 7.2.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

add_filter(
	'block_bindings_supported_attributes_core/icon',
	function ( $supported_attributes ) {
		$supported_attributes[] = 'icon';
		return $supported_attributes;
	}
);
