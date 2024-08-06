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
 * Filter the query vars (tax_query) for the Query Loop block to support post formats.
 *
 * @param array    $query The query vars.
 * @param WP_Block $block Block instance.
 * @return array   The filtered query vars.
 */
function gutenberg_filter_query_loop_block_query_vars_post_format( $query, $block ) {
	if ( isset( $block->context['query']['postFormat'] ) &&
		! empty( $block->context['query']['postFormat'] ) ) {
		// Add the required "post-format-" prefix to each format.
		$formats = array_map(
			function ( $format ) {
				return 'post-format-' . $format;
			},
			$block->context['query']['postFormat']
		);

		$query['tax_query'] = array(
			array(
				'taxonomy' => 'post_format',
				'field'    => 'slug',
				'terms'    => $formats,
			),
		);
	}
	return $query;
}
add_filter( 'query_loop_block_query_vars', 'gutenberg_filter_query_loop_block_query_vars_post_format', 10, 2 );
