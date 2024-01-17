<?php
/**
 * Pattern block support flag.
 *
 * @package gutenberg
 */

$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments && array_key_exists( 'gutenberg-pattern-partial-syncing', $gutenberg_experiments ) ) {
	/**
	 * Registers the overrides context for block types that support it.
	 *
	 * @param WP_Block_Type $block_type Block Type.
	 */
	function gutenberg_register_pattern_support( $block_type ) {
		// Note that this should be a duplicate or a subset of the $allowed_blocks
		// defined in the `process_block_bindings` function.
		// It should also match the client side config defined in
		// `packages/patterns/src/constants.js`.
		$allowed_blocks  = array(
			'core/paragraph' => array( 'content' ),
			'core/heading'   => array( 'content' ),
			'core/image'     => array( 'url', 'title', 'alt' ),
			'core/button'    => array( 'url', 'text' ),
		);
		$pattern_support = array_key_exists( $block_type->name, $allowed_blocks );

		if ( $pattern_support ) {
			if ( ! $block_type->uses_context ) {
				$block_type->uses_context = array();
			}

			if ( ! in_array( 'pattern/overrides', $block_type->uses_context, true ) ) {
				$block_type->uses_context[] = 'pattern/overrides';
			}
		}
	}

	// Register the block support.
	WP_Block_Supports::get_instance()->register(
		'pattern',
		array(
			'register_attribute' => 'gutenberg_register_pattern_support',
		)
	);
}
