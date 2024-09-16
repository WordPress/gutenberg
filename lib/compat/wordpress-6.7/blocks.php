<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Allow passing a PHP file as `variations` field for Core versions < 6.7
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 * @return array The block type settings
 */
function gutenberg_filter_block_type_metadata_settings_allow_variations_php_file( $settings, $metadata ) {
	// If `variations` is a string, it's the name of a PHP file that
	// generates the variations.
	if ( ! empty( $settings['variations'] ) && is_string( $settings['variations'] ) ) {
		$variations_path = wp_normalize_path(
			realpath(
				dirname( $metadata['file'] ) . '/' .
				remove_block_asset_path_prefix( $settings['variations'] )
			)
		);
		if ( $variations_path ) {
			/**
			 * Generates the list of block variations.
			 *
			 * @since 6.7.0
			 *
			 * @return string Returns the list of block variations.
			 */
			$settings['variation_callback'] = static function () use ( $variations_path ) {
				$variations = require $variations_path;
				return $variations;
			};
			// The block instance's `variations` field is only allowed to be an array
			// (of known block variations). We unset it so that the block instance will
			// provide a getter that returns the result of the `variation_callback` instead.
			unset( $settings['variations'] );
		}
	}
	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_filter_block_type_metadata_settings_allow_variations_php_file', 10, 2 );

/**
 * Adds post format query vars to the query loop block's WP_Query when the block's attributes call for them.
 *
 * @see 'query_loop_block_query_vars'
 *
 * @param array    $query The query vars.
 * @param WP_Block $block Block instance.
 * @return array   The filtered query vars.
 */
function gutenberg_add_format_query_vars_to_query_loop_block( $query, $block ) {
	// Return early if there is no format or if the format is not an array.
	if ( empty( $block->context['query']['format'] ) || ! is_array( $block->context['query']['format'] ) ) {
		return $query;
	}

	$formats   = $block->context['query']['format'];
	$tax_query = array( 'relation' => 'OR' );

	// The default post format, 'standard', is not stored in the database.
	// If 'standard' is part of the request, the query needs to exclude all post items that
	// have a format assigned.
	if ( in_array( 'standard', $formats, true ) ) {
		$tax_query[] = array(
			'taxonomy' => 'post_format',
			'field'    => 'slug',
			'terms'    => array(),
			'operator' => 'NOT EXISTS',
		);
		// Remove the standard format, since it cannot be queried.
		unset( $formats[ array_search( 'standard', $formats, true ) ] );
	}

	// Add any remaining formats to the tax query.
	if ( ! empty( $formats ) ) {
		// Add the post-format- prefix.
		$terms = array_map(
			static function ( $format ) {
				return 'post-format-' . $format;
			},
			$formats
		);

		$tax_query[] = array(
			'taxonomy' => 'post_format',
			'field'    => 'slug',
			'terms'    => $terms,
			'operator' => 'IN',
		);
	}

	// This condition is intended to prevent $tax_query from being added to $query
	// if it only contains the relation.
	if ( count( $tax_query ) > 1 ) {
		$query['tax_query'][] = $tax_query;
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'gutenberg_add_format_query_vars_to_query_loop_block', 10, 2 );
