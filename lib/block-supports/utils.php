<?php
/**
 * Block support utility functions.
 *
 * @package gutenberg
 */

/**
 * Checks whether serialization of the current block's supported properties
 * should occur.
 *
 * @param WP_Block_type $block_type  Block type.
 * @param string        $feature_set Name of block support feature set..
 * @param string        $feature     Optional name of individual feature to check.
 *
 * @return boolean Whether to serialize block support styles & classes.
 */
function gutenberg_should_skip_block_supports_serialization( $block_type, $feature_set, $feature = null ) {
	if ( ! is_object( $block_type ) || ! $feature_set ) {
		return false;
	}

	$path               = array( $feature_set, '__experimentalSkipSerialization' );
	$skip_serialization = _wp_array_get( $block_type->supports, $path, false );

	if ( is_array( $skip_serialization ) ) {
		return in_array( $feature, $skip_serialization, true );
	}

	return $skip_serialization;
}
