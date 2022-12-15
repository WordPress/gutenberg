<?php
/**
 * WP_Theme_JSON_6_2 class
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of structures that adhere to the theme.json spec.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_6_2 extends WP_Theme_JSON_6_1 {

	/**
	 * Indirect metadata for style properties that are not directly output.
	 *
	 * Each element is a direct mapping from a CSS property name to the
	 * path to the value in theme.json & block attributes.
	 *
	 * Indirect properties are not output directly by `compute_style_properties`,
	 * but are used elsewhere in the processing of global styles. The indirect
	 * property is used to validate whether or not a style value is allowed.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	const INDIRECT_PROPERTIES_METADATA = array(
		'gap'        => array( 'spacing', 'blockGap' ),
		'column-gap' => array( 'spacing', 'blockGap', 'left' ),
		'row-gap'    => array( 'spacing', 'blockGap', 'top' ),
	);

	/**
	 * Processes a style node and returns the same node
	 * without the insecure styles.
	 *
	 * @since 5.9.0
	 * @since 6.2.0 Allow indirect properties used outside of `compute_style_properties`.
	 *
	 * @param array $input Node to process.
	 * @return array
	 */
	protected static function remove_insecure_styles( $input ) {
		$output       = array();
		$declarations = static::compute_style_properties( $input );

		foreach ( $declarations as $declaration ) {
			if ( static::is_safe_css_declaration( $declaration['name'], $declaration['value'] ) ) {
				$path = static::PROPERTIES_METADATA[ $declaration['name'] ];

				// Check the value isn't an array before adding so as to not
				// double up shorthand and longhand styles.
				$value = _wp_array_get( $input, $path, array() );
				if ( ! is_array( $value ) ) {
					_wp_array_set( $output, $path, $value );
				}
			}
		}

		// Ensure indirect properties not handled by `compute_style_properties` are allowed.
		foreach ( static::INDIRECT_PROPERTIES_METADATA as $property => $path ) {
			$value = _wp_array_get( $input, $path, array() );
			if (
				isset( $value ) &&
				! is_array( $value ) &&
				static::is_safe_css_declaration( $property, $value )
			) {
				_wp_array_set( $output, $path, $value );
			}
		}

		return $output;
	}

}
