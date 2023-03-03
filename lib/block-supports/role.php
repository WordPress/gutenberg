<?php
/**
 * Role block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the role attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_role_support( $block_type ) {
	// Return early if the block type doesn't have support for role.
	$has_role_support = _wp_array_get( $block_type->supports, array( 'role' ), true );
	if ( ! $has_role_support ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}
	
	if ( ! array_key_exists( 'role', $block_type->attributes ) ) {
		$block_type->attributes['role'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Add the role attribute to the output.
 *
 * @param WP_Block_Type $block_type Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block role attribute.
 */
function gutenberg_apply_role_support( $block_type, $block_attributes ) {
	// Return early if the block doesn't have any attributes.
	if ( ! $block_attributes ) {
		return array();
	}
	// Don't print the role in the block wrapper if its set to skip serilization.
	if ( wp_should_skip_block_supports_serialization( $block_type, 'role' ) ) {
		return array();
	}
	// Return early if the block doesn't have support for role.
	$has_role_support = _wp_array_get( $block_type->supports, array( 'role' ), true );
	if ( ! $has_role_support ) {
		return array();
	}
	// Return early if the block doesn't have a role attribute.
	$has_role = array_key_exists( 'role', $block_attributes );
	if ( ! $has_role ) { 
		return array();
	}

	return array( 'role' => $block_attributes['role'] );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'role',
	array(
		'register_attribute' => 'gutenberg_register_role_support',
		'apply'              => 'gutenberg_apply_role_support',
	)
);
