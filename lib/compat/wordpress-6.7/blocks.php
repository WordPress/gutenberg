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
 * Filters the block type arguments during registration to stabilize experimental block supports.
 *
 * This is a temporary compatibility shim as the approach in core is for this to be handled
 * within the WP_Block_Type class rather than requiring a filter.
 *
 * @param array $args Array of arguments for registering a block type.
 * @return array Array of arguments for registering a block type.
 */
function gutenberg_stabilize_experimental_block_supports( $args ) {
	if ( empty( $args['supports']['typography'] ) ) {
		return $args;
	}

	$experimental_typography_supports_to_stable = array(
		'__experimentalFontFamily'     => 'fontFamily',
		'__experimentalFontStyle'      => 'fontStyle',
		'__experimentalFontWeight'     => 'fontWeight',
		'__experimentalLetterSpacing'  => 'letterSpacing',
		'__experimentalTextDecoration' => 'textDecoration',
		'__experimentalTextTransform'  => 'textTransform',
	);

	$current_typography_supports = $args['supports']['typography'];
	$stable_typography_supports  = array();

	foreach ( $current_typography_supports as $key => $value ) {
		if ( array_key_exists( $key, $experimental_typography_supports_to_stable ) ) {
			$stable_typography_supports[ $experimental_typography_supports_to_stable[ $key ] ] = $value;
		} else {
			$stable_typography_supports[ $key ] = $value;
		}
	}

	$args['supports']['typography'] = $stable_typography_supports;

	return $args;
}

add_filter( 'register_block_type_args', 'gutenberg_stabilize_experimental_block_supports', 10, 1 );
