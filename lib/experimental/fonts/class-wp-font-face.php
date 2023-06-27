<?php
/**
 * WP_Font_Face class.
 *
 * @package    WordPress
 * @subpackage Fonts
 * @since      X.X.X
 */

if ( class_exists( 'WP_Font_Face' ) ) {
	return;
}

/**
 * Font Face generates and prints `@font-face` styles for given fonts.
 *
 * @since X.X.X
 */
class WP_Font_Face {

	/**
	 * The font-face property defaults.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	private $font_face_property_defaults = array(
		'font-family'  => '',
		'font-style'   => 'normal',
		'font-weight'  => '400',
		'font-display' => 'fallback',
	);

	/**
	 * Valid font-face property names.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	private $valid_font_face_properties = array(
		'ascent-override',
		'descent-override',
		'font-display',
		'font-family',
		'font-stretch',
		'font-style',
		'font-weight',
		'font-variant',
		'font-feature-settings',
		'font-variation-settings',
		'line-gap-override',
		'size-adjust',
		'src',
		'unicode-range',
	);

	/**
	 * Valid font-display values.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	private $valid_font_display = array( 'auto', 'block', 'fallback', 'swap', 'optional' );

	/**
	 * Fonts to be processed.
	 *
	 * @since X.X.X
	 *
	 * @var array[]
	 */
	private $fonts = array();

	/**
	 * Array of font-face style tag's attribute(s)
	 * where the key is the attribute name and the
	 * value is its value.
	 *
	 * @since X.X.X
	 *
	 * @var string[]
	 */
	private $style_tag_atts = array();

	/**
	 * Creates and initializes an instance of WP_Font_Face.
	 *
	 * @since X.X.X
	 */
	public function __construct() {
		/**
		 * Filters the font-face property defaults.
		 *
		 * @since X.X.X
		 *
		 * @param array $defaults {
		 *     An array of required font-face properties and defaults.
		 *
		 *     @type string $provider     The provider ID. Default 'local'.
		 *     @type string $font-family  The font-family property. Default empty string.
		 *     @type string $font-style   The font-style property. Default 'normal'.
		 *     @type string $font-weight  The font-weight property. Default '400'.
		 *     @type string $font-display The font-display property. Default 'fallback'.
		 * }
		 */
		$this->font_face_property_defaults = apply_filters( 'wp_font_face_property_defaults', $this->font_face_property_defaults );

		if (
			function_exists( 'is_admin' ) && ! is_admin()
			&&
			function_exists( 'current_theme_supports' ) && ! current_theme_supports( 'html5', 'style' )
		) {
			$this->style_tag_atts = array( 'type' => 'text/css' );
		}
	}

	/**
	 * Generates and prints the `@font-face` styles for the given fonts.
	 *
	 * @since X.X.X
	 *
	 * @param array $fonts The fonts to generate and print @font-face styles.
	 */
	public function generate_and_print( array $fonts ) {
		$fonts = $this->validate_fonts( $fonts );

		printf(
			$this->get_style_element(),
			$this->get_css( $fonts )
		);
	}

	/**
	 * Validates each of the font-face properties.
	 *
	 * @since X.X.X
	 *
	 * @param array $fonts The fonts to valid.
	 * @return array Prepared font-faces organized by provider and font-family.
	 */
	private function validate_fonts( array $fonts ) {
		$validated_fonts = array();

		foreach ( $fonts as $font_faces ) {
			foreach ( $font_faces as $font_face ) {
				$font_face = $this->validate_font_face_properties( $font_face );
				// Skip if failed validation.
				if ( false === $font_face ) {
					continue;
				}

				$validated_fonts[] = $font_face;
			}
		}

		return $validated_fonts;
	}

	/**
	 * Validates each font-face property.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_face Font face properties to validate.
	 * @return false|array Validated font-face on success. Else, false.
	 */
	private function validate_font_face_properties( array $font_face ) {
		$font_face = wp_parse_args( $font_face, $this->font_face_property_defaults );

		// Check the font-family.
		if ( empty( $font_face['font-family'] ) || ! is_string( $font_face['font-family'] ) ) {
			trigger_error( 'Font font-family must be a non-empty string.' );
			return false;
		}

		// Make sure that local fonts have 'src' defined.
		if ( empty( $font_face['src'] ) || ( ! is_string( $font_face['src'] ) && ! is_array( $font_face['src'] ) ) ) {
			trigger_error( 'Font src must be a non-empty string or an array of strings.' );
			return false;
		}

		// Validate the 'src' property.
		if ( ! empty( $font_face['src'] ) ) {
			foreach ( (array) $font_face['src'] as $src ) {
				if ( empty( $src ) || ! is_string( $src ) ) {
					trigger_error( 'Each font src must be a non-empty string.' );
					return false;
				}
			}
		}

		// Check the font-weight.
		if ( ! is_string( $font_face['font-weight'] ) && ! is_int( $font_face['font-weight'] ) ) {
			trigger_error( 'Font font-weight must be a properly formatted string or integer.' );
			return false;
		}

		// Check the font-display.
		if ( ! in_array( $font_face['font-display'], $this->valid_font_display, true ) ) {
			$font_face['font-display'] = $this->font_face_property_defaults['font-display'];
		}

		// Remove invalid properties.
		foreach ( $font_face as $prop => $value ) {
			if ( ! in_array( $prop, $this->valid_font_face_properties, true ) ) {
				unset( $font_face[ $prop ] );
			}
		}

		return $font_face;
	}

	/**
	 * Gets the `<style>` element for wrapping the `@font-face` CSS.
	 *
	 * @since X.X.X
	 *
	 * @return string The style element.
	 */
	private function get_style_element() {
		$attributes = $this->generate_style_element_attributes();

		return "<style id='wp-fonts-local'{$attributes}>\n%s\n</style>\n";
	}

	/**
	 * Gets the defined <style> element's attributes.
	 *
	 * @since X.X.X
	 *
	 * @return string A string of attribute=value when defined, else, empty string.
	 */
	private function generate_style_element_attributes() {
		$attributes = '';
		foreach ( $this->style_tag_atts as $name => $value ) {
			$attributes .= " {$name}='{$value}'";
		}
		return $attributes;
	}

	/**
	 * Gets the `@font-face` CSS styles for locally-hosted font files.
	 *
	 * This method does the following processing tasks:
	 *    1. Orchestrates an optimized `src` (with format) for browser support.
	 *    2. Generates the `@font-face` for all its fonts.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_faces The font-faces to generate @font-face CSS styles.
	 * @return string The `@font-face` CSS styles.
	 */
	private function get_css( $font_faces ) {
		$css = '';

		foreach ( $font_faces as $font_face ) {
				// Order the font's `src` items to optimize for browser support.
				$font_face = $this->order_src( $font_face );

				// Build the @font-face CSS for this font.
				$css .= '@font-face{' . $this->build_font_face_css( $font_face ) . '}' . "\n";
		}

		// Don't print the last newline character.
		return rtrim( $css, "\n" );
	}

	/**
	 * Orders `src` items to optimize for browser support.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_face Font face to process.
	 * @return array Font-face with ordered src items.
	 */
	private function order_src( array $font_face ) {
		if ( ! is_array( $font_face['src'] ) ) {
			$font_face['src'] = (array) $font_face['src'];
		}

		$src         = array();
		$src_ordered = array();

		foreach ( $font_face['src'] as $url ) {
			// Add data URIs first.
			if ( str_starts_with( trim( $url ), 'data:' ) ) {
				$src_ordered[] = array(
					'url'    => $url,
					'format' => 'data',
				);
				continue;
			}
			$format         = pathinfo( $url, PATHINFO_EXTENSION );
			$src[ $format ] = $url;
		}

		// Add woff2.
		if ( ! empty( $src['woff2'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['woff2'],
				'format' => 'woff2',
			);
		}

		// Add woff.
		if ( ! empty( $src['woff'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['woff'],
				'format' => 'woff',
			);
		}

		// Add ttf.
		if ( ! empty( $src['ttf'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['ttf'],
				'format' => 'truetype',
			);
		}

		// Add eot.
		if ( ! empty( $src['eot'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['eot'],
				'format' => 'embedded-opentype',
			);
		}

		// Add otf.
		if ( ! empty( $src['otf'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['otf'],
				'format' => 'opentype',
			);
		}
		$font_face['src'] = $src_ordered;

		return $font_face;
	}

	/**
	 * Builds the font-family's CSS.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_face Font face to process.
	 * @return string This font-family's CSS.
	 */
	private function build_font_face_css( array $font_face ) {
		$css = '';

		// Wrap font-family in quotes if it contains spaces
		// and is not already wrapped in quotes.
		if (
			str_contains( $font_face['font-family'], ' ' ) &&
			! str_contains( $font_face['font-family'], '"' ) &&
			! str_contains( $font_face['font-family'], "'" )
		) {
			$font_face['font-family'] = '"' . $font_face['font-family'] . '"';
		}

		foreach ( $font_face as $key => $value ) {
			// Compile the "src" parameter.
			if ( 'src' === $key ) {
				$value = $this->compile_src( $value );
			}

			// If font-variation-settings is an array, convert it to a string.
			if ( 'font-variation-settings' === $key && is_array( $value ) ) {
				$value = $this->compile_variations( $value );
			}

			if ( ! empty( $value ) ) {
				$css .= "$key:$value;";
			}
		}

		return $css;
	}

	/**
	 * Compiles the `src` into valid CSS.
	 *
	 * @since X.X.X
	 *
	 * @param array $value Value to process.
	 * @return string The CSS.
	 */
	private function compile_src( array $value ) {
		$src = '';

		foreach ( $value as $item ) {
			$src .= ( 'data' === $item['format'] )
				? ", url({$item['url']})"
				: ", url('{$item['url']}') format('{$item['format']}')";
		}

		$src = ltrim( $src, ', ' );
		return $src;
	}

	/**
	 * Compiles the font variation settings.
	 *
	 * @since X.X.X
	 *
	 * @param array $font_variation_settings Array of font variation settings.
	 * @return string The CSS.
	 */
	private function compile_variations( array $font_variation_settings ) {
		$variations = '';

		foreach ( $font_variation_settings as $key => $value ) {
			$variations .= "$key $value";
		}

		return $variations;
	}
}
