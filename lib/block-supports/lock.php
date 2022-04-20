<?php
/**
 * Spacing block support flag.
 *
 * Once 6.0 is the minimum supported WordPress version for the Gutenberg
 * plugin, this shim can be removed
 *
 * @package gutenberg
 */

/**
 * Registers the lock block attribute for block types.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_lock_support( $block_type ) {
	// Setup attributes if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ! array_key_exists( 'lock', $block_type->attributes ) ) {
		$block_type->attributes['lock'] = array(
			'type' => 'object',
		);
	}
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'lock',
	array(
		'register_attribute' => 'gutenberg_register_lock_support',
	)
);
