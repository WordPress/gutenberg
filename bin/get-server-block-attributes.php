#!/usr/bin/env php
<?php
/**
 * Generates server-registered block attributes, writing to standard output.
 *
 * @package gutenberg-build
 */

$attributes = array();

/**
 * Register a block type. Substitute for core API in lieu of loading full
 * WordPress context.
 *
 * @param string $name Block type name including namespace.
 * @param array  $args {
 *     Optional. Array of block type arguments. Any arguments may be defined, however the
 *     ones described below are supported by default. Default empty array.
 *
 *     @type callable $render_callback Callback used to render blocks of this block type.
 *     @type array    $attributes      Block attributes mapping, property name to schema.
 * }
 */
function register_block_type( $name, $args = array() ) {
	if ( ! isset( $args['attributes'] ) ) {
		return;
	}

	global $attributes;
	$attributes[ $name ] = $args['attributes'];
}

// Register server-side code for individual blocks.
foreach ( glob( dirname( dirname( __FILE__ ) ) . '/blocks/library/*/index.php' ) as $block_logic ) {
	require_once $block_logic;
}

echo json_encode( $attributes );
