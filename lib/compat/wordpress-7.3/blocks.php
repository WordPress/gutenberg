<?php
/**
 * Block API additions for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Registers `datetime` and `url` block attributes as `string`.
 *
 * WordPress versions before 7.3 can't validate these types.
 *
 * @param array<string, mixed> $args Block type arguments.
 * @return array<string, mixed> Block type arguments.
 */
function gutenberg_register_field_api_attribute_types_as_string( $args ) {
	if ( empty( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		return $args;
	}

	$attributes = $args['attributes'];
	foreach ( $attributes as $name => $attribute ) {
		if ( is_array( $attribute ) && isset( $attribute['type'] ) && in_array( $attribute['type'], array( 'datetime', 'url' ), true ) ) {
			$attribute['type']   = 'string';
			$attributes[ $name ] = $attribute;
		}
	}
	$args['attributes'] = $attributes;

	return $args;
}

if ( ! function_exists( '_wp_get_block_attribute_json_schema' ) ) {
	add_filter( 'register_block_type_args', 'gutenberg_register_field_api_attribute_types_as_string' );
}
