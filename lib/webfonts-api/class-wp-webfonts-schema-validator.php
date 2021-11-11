<?php
/**
 * Webfonts API: Webfonts Schema Validator
 *
 * @package WordPress
 * @subpackage Webfonts
 * @since 5.9.0
 */

/**
 * The validator checks ensures a given webfont is ready for processing
 * in the API. After processing, the API can trust each webfont schema,
 * meaning no additional validation is needed within the API.
 *
 * Required webfont properties are validated {@see WP_Webfonts_Schema_Validator::is_valid_schema()}
 * and optional webfont properties are set if missing, else checked and, if invalid, set to a
 * default value {@see WP_Webfonts_Schema_Validator::set_valid_properties()}.
 *
 * The validator is a dependency to the `WP_Webfonts_Registry` which
 * interacts with this validator before registering a webfont.
 *
 * @since 5.9.0
 */
class WP_Webfonts_Schema_Validator {

	/**
	 * Valid font styles.
	 *
	 * @since 5.9.0
	 *
	 * @var string[]
	 */
	const VALID_FONT_STYLE = array( 'normal', 'italic', 'oblique', 'inherit', 'initial', 'revert', 'unset' );

	/**
	 * Valid font display values.
	 *
	 * @since 5.9.0
	 *
	 * @var string[]
	 */
	const VALID_FONT_DISPLAY = array( 'auto', 'block', 'fallback', 'swap' );

	/**
	 * Valid font weight values.
	 *
	 * @since 5.9.0
	 *
	 * @var string[]
	 */
	const VALID_FONT_WEIGHT = array( 'normal', 'bold', 'bolder', 'lighter', 'inherit' );

	/**
	 * An array of valid CSS properties for @font-face.
	 *
	 * @since 5.9.0
	 *
	 * @var string[]
	 */
	protected $font_face_properties = array(
		'ascend-override',
		'descend-override',
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
	 * Basic schema structure.
	 *
	 * @since 5.9.0
	 *
	 * @var array
	 */
	protected $basic_schema = array(
		'provider'     => '',
		'font-family'  => '',
		'font-style'   => 'normal',
		'font-weight'  => '400',
		'font-display' => 'fallback',
	);

	/**
	 * Webfont being validated.
	 *
	 * Set as a property for performance.
	 *
	 * @var array
	 */
	private $webfont = array();

	/**
	 * Checks if the given webfont schema is valid.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont to validate.
	 * @return bool True when valid. False when invalid.
	 */
	public function is_valid_schema( array $webfont ) {
		$is_valid = (
			$this->is_valid_provider( $webfont ) &&
			$this->is_valid_font_family( $webfont )
		);

		if ( ! $is_valid ) {
			return false;
		}

		if ( 'local' === $webfont['provider'] || array_key_exists( 'src', $webfont ) ) {
			$is_valid = $this->is_src_valid( $webfont );
		}

		return $is_valid;
	}

	/**
	 * Checks if the provider is valid.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont to validate.
	 * @return bool True if valid. False if invalid.
	 */
	private function is_valid_provider( array $webfont ) {
		if (
			empty( $webfont['provider'] ) ||
			! is_string( $webfont['provider'] )
		) {
			trigger_error( __( 'Webfont provider must be a non-empty string.' ) );

			return false;
		}

		return true;
	}

	/**
	 * Checks if the font family is valid.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont to validate.
	 * @return bool True when valid. False when invalid.
	 */
	private function is_valid_font_family( array $webfont ) {
		if (
			empty( $webfont['font-family'] ) ||
			! is_string( $webfont['font-family'] )
		) {
			trigger_error( __( 'Webfont font family must be a non-empty string.' ) );

			return false;
		}

		return true;
	}

	/**
	 * Checks if the "src" value is valid.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont to validate.
	 * @return bool True if valid. False if invalid.
	 */
	private function is_src_valid( array $webfont ) {
		if (
			empty( $webfont['src'] ) ||
			(
				! is_string( $webfont['src'] ) && ! is_array( $webfont['src'] )
			)
		) {
			trigger_error( __( 'Webfont src must be a non-empty string or an array of strings.' ) );

			return false;
		}

		foreach ( (array) $webfont['src'] as $src ) {
			if ( empty( $src ) || ! is_string( $src ) ) {
				trigger_error( __( 'Each webfont src must be a non-empty string.' ) );

				return false;
			}

			if ( ! $this->is_src_value_valid( $src ) ) {
				trigger_error( __( 'Webfont src must be a valid URL or a data URI.' ) );

				return false;
			}
		}

		return true;
	}

	/**
	 * Checks if the given `src` value is valid.
	 *
	 * @since 5.9.0
	 *
	 * @param string $src Source to validate.
	 * @return bool True when valid. False when invalid.
	 */
	private function is_src_value_valid( $src ) {
		if (
			// Validate data URLs.
			preg_match( '/^data:.+;base64/', $src ) ||
			// Validate URLs.
			filter_var( $src, FILTER_VALIDATE_URL ) ||
			// Check if it's a URL starting with "//" (omitted protocol).
			0 === strpos( $src, '//' )
		) {
			return true;
		}

		return false;
	}

	/**
	 * Sets valid properties.
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfont Webfont definition.
	 * @return array Updated webfont.
	 */
	public function set_valid_properties( array $webfont ) {
		$this->webfont = array_merge( $this->basic_schema, $webfont );

		$this->set_valid_font_face_property();
		$this->set_valid_font_style();
		$this->set_valid_font_weight();
		$this->set_valid_font_display();

		$webfont       = $this->webfont;
		$this->webfont = array(); // Reset property.

		return $webfont;
	}

	/**
	 * Checks if the CSS property is valid for @font-face.
	 *
	 * @since 5.9.0
	 */
	private function set_valid_font_face_property() {
		foreach ( array_keys( $this->webfont ) as $property ) {
			/*
			 * Skip valid configuration parameters
			 * (these are configuring the webfont but are not @font-face properties).
			 */
			if ( 'provider' === $property || 'provider-params' === $property ) {
				continue;
			}

			if ( ! in_array( $property, $this->font_face_properties, true ) ) {
				unset( $this->webfont[ $property ] );
			}
		}
	}

	/**
	 * Sets a default font-style if invalid.
	 *
	 * @since 5.9.0
	 */
	private function set_valid_font_style() {
		// If empty or not a string, trigger an error and then set the default value.
		if (
			empty( $this->webfont['font-style'] ) ||
			! is_string( $this->webfont['font-style'] )
		) {
			trigger_error( __( 'Webfont font style must be a non-empty string.' ) );

		} elseif ( // Bail out if the font-style is a valid value.
			in_array( $this->webfont['font-style'], self::VALID_FONT_STYLE, true ) ||
			preg_match( '/^oblique\s+(\d+)%/', $this->webfont['font-style'] )
		) {
			return;
		}

		$this->webfont['font-style'] = 'normal';
	}

	/**
	 * Sets a default font-weight if invalid.
	 *
	 * @since 5.9.0
	 */
	private function set_valid_font_weight() {
		// If empty or not a string, trigger an error and then set the default value.
		if (
			empty( $this->webfont['font-weight'] ) ||
			! is_string( $this->webfont['font-weight'] )
		) {
			trigger_error( __( 'Webfont font weight must be a non-empty string.' ) );

		} elseif ( // Bail out if the font-weight is a valid value.
			// Check if value is a single font-weight, formatted as a number.
			in_array( $this->webfont['font-weight'], self::VALID_FONT_WEIGHT, true ) ||
			// Check if value is a single font-weight, formatted as a number.
			preg_match( '/^(\d+)$/', $this->webfont['font-weight'], $matches ) ||
			// Check if value is a range of font-weights, formatted as a number range.
			preg_match( '/^(\d+)\s+(\d+)$/', $this->webfont['font-weight'], $matches )
		) {
			return;
		}

		// Not valid. Set the default value.
		$this->webfont['font-weight'] = '400';
	}

	/**
	 * Sets a default font-display if invalid.
	 *
	 * @since 5.9.0
	 */
	private function set_valid_font_display() {
		if (
			empty( $this->webfont['font-display'] ) ||
			! in_array( $this->webfont['font-display'], self::VALID_FONT_DISPLAY, true )
		) {
			$this->webfont['font-display'] = 'fallback';
		}
	}
}
