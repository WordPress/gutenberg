<?php
/**
 * Annotations API: WP_Annotation_Selector class
 *
 * @package gutenberg
 * @since [version]
 */

/*
 * https://www.w3.org/TR/annotation-model/#selectors
 *
 * @codingStandardsIgnoreStart - Intentionally following W3C camelCase naming convention.
 * Note: The codingStandardsIgnoreStart line can be removed once PHPCS is upgraded to v3.2+.
 *
 * PHPCS v3.2+: Intentionally following W3C camelCase naming convention.
 * phpcs:disable WordPress.NamingConventions.ValidVariableName.NotSnakeCaseMemberVar
 */

/**
 * Annotation selector (W3C object model).
 *
 * @since [version]
 *
 * @link https://www.w3.org/TR/annotation-model/#selectors
 */
final class WP_Annotation_Selector {
	/**
	 * Gets a {@see WP_Annotation_Selector} instance.
	 *
	 * @since [version]
	 *
	 * @param  object|array $selector        Selector object or array.
	 *
	 * @return WP_Annotation_Selector|false  Selector object. False on failure.
	 */
	public static function get_instance( $selector ) {
		try {
			return new WP_Annotation_Selector( $selector );
		} catch ( Exception $exception ) {
			return false;
		}
	}

	/**
	 * Contructor.
	 *
	 * @since [version]
	 *
	 * @param  object|array $selector Selector object or array.
	 *
	 * @throws Exception              On invalid selector.
	 */
	public function __construct( $selector ) {
		if ( ! is_object( $selector ) && ! is_array( $selector ) ) {
			throw new Exception( 'Invalid data type for annotation selector.' );
		}

		foreach ( $selector as $key => $value ) {
			$this->{ $key } = $value;
		}

		if ( ! $this->parse() ) {
			throw new Exception( 'Invalid annotation selector.' );
		}
	}

	/**
	 * Converts object to array.
	 *
	 * @since [version]
	 *
	 * @return array Object as array.
	 */
	public function to_array() {
		$array = get_object_vars( $this );

		foreach ( $array as $key => $value ) {
			$array[ $key ] = $value instanceof self ? $value->to_array() : $value;
		}

		return $array;
	}

	/**
	 * Parses selector deeply.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 */
	protected function parse() {
		if ( empty( $this->type ) ) {
			return false;
		} elseif ( ! $this->is_allowed() ) {
			return false;
		} elseif ( $this->is_too_large() ) {
			return false;
		}

		switch ( $this->type ) {
			case 'FragmentSelector':
				return $this->parse_fragment_selector();

			case 'CssSelector':
			case 'XPathSelector':
				return $this->parse_css_xpath_selectors();

			case 'TextQuoteSelector':
				return $this->parse_text_quote_selector();

			case 'TextPositionSelector':
			case 'DataPositionSelector':
				return $this->parse_text_data_position_selectors();

			case 'SvgSelector':
				return $this->parse_svg_selector();

			case 'RangeSelector':
				return $this->parse_range_selector();
		}

		return false;
	}

	/**
	 * Checks if selector is allowed.
	 *
	 * @since [version]
	 *
	 * @return bool True if allowed.
	 *
	 * @internal As a security precaution, SVG selectors are disabled for now. If SVG is
	 * enabled, please enhance {@see WP_Annotation_Selector::parse_svg_selector()}.
	 */
	protected function is_allowed() {
		$types = array(
			'FragmentSelector',
			'CssSelector',
			'XPathSelector',
			'TextQuoteSelector',
			'TextPositionSelector',
			'DataPositionSelector',
			// 'SvgSelector', Disabled for now.
			'RangeSelector',
		);
		$is_allowed = in_array( $this->type, $types, true );

		/**
		 * Checks if annotation selector is allowed.
		 *
		 * @since [version]
		 *
		 * @param bool                   $is_allowed True if allowed.
		 * @param WP_Annotation_Selector $this       Selector object instance.
		 */
		$is_allowed = apply_filters( 'annotation_selector_is_allowed', $is_allowed, $this );

		return $is_allowed;
	}

	/**
	 * Checks if selector is too large.
	 *
	 * @since [version]
	 *
	 * @return bool True if too large.
	 */
	protected function is_too_large() {
		if ( 'RangeSelector' === $this->type ) {
			return false;
		}

		if ( 'SvgSelector' === $this->type ) {
			$max_size = 131072; // 128kb.
		} else {
			$max_size = 16384; // 16kb.
		}

		$minus_refinements = $this->to_array();
		unset( $minus_refinements['refinedBy'] );

		$size         = strlen( json_encode( $minus_refinements ) );
		$is_too_large = $size > $max_size;

		/**
		 * Filters max annotation selector size (in bytes).
		 *
		 * @since [version]
		 *
		 * @param bool                   $is_too_large True if too large.
		 * @param WP_Annotation_Selector $this         Selector object instance.
		 */
		$is_too_large = apply_filters( 'annotation_selector_is_too_large', $is_too_large, $this );

		return $is_too_large;
	}

	/**
	 * Parses a FragmentSelector.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#fragment-selector
	 */
	protected function parse_fragment_selector() {
		$array = $this->to_array();

		$allow_keys = array_fill_keys( array(
			'type',
			'value',
			'conformsTo',
			'refinedBy',
		), 0 );
		if ( array_diff_key( $array, $allow_keys ) ) {
			return false;
		}

		if ( empty( $this->value ) ) {
			return false;
		} elseif ( ! is_string( $this->value ) ) {
			return false;
		}

		if ( isset( $this->conformsTo ) ) {
			if ( ! is_string( $this->conformsTo ) ) {
				return false;
			} elseif ( ! wp_parse_url( $this->conformsTo ) ) {
				return false;
			}
		}

		if ( isset( $this->refinedBy ) ) {
			$this->refinedBy = self::get_instance( $this->refinedBy );

			if ( ! $this->refinedBy ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Parses a CssSelector or XPathSelector.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#css-selector
	 * @link https://www.w3.org/TR/annotation-model/#xpath-selector
	 */
	protected function parse_css_xpath_selectors() {
		$array = $this->to_array();

		$allow_keys = array_fill_keys( array(
			'type',
			'value',
			'refinedBy',
		), 0 );
		if ( array_diff_key( $array, $allow_keys ) ) {
			return false;
		}

		if ( empty( $this->value ) ) {
			return false;
		} elseif ( ! is_string( $this->value ) ) {
			return false;
		}

		if ( isset( $this->refinedBy ) ) {
			$this->refinedBy = self::get_instance( $this->refinedBy );

			if ( ! $this->refinedBy ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Parses a TextQuoteSelector.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#text-quote-selector
	 */
	protected function parse_text_quote_selector() {
		$array = $this->to_array();

		$allow_keys = array_fill_keys( array(
			'type',
			'exact',
			'prefix',
			'suffix',
		), 0 );
		if ( array_diff_key( $array, $allow_keys ) ) {
			return false;
		}

		if ( ! isset( $this->exact ) ) {
			return false;
		} elseif ( ! is_string( $this->exact ) ) {
			return false;
		} elseif ( '' === $this->exact ) {
			return false;
		}

		if ( isset( $this->prefix ) ) {
			if ( ! is_string( $this->prefix ) ) {
				return false;
			}
		}

		if ( isset( $this->suffix ) ) {
			if ( ! is_string( $this->suffix ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Parses a TextPositionSelector or DataPositionSelector.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#text-position-selector
	 * @link https://www.w3.org/TR/annotation-model/#data-position-selector
	 */
	protected function parse_text_data_position_selectors() {
		$array = $this->to_array();

		$allow_keys = array_fill_keys( array(
			'type',
			'start',
			'end',
		), 0 );
		if ( array_diff_key( $array, $allow_keys ) ) {
			return false;
		}

		if ( ! isset( $this->start ) ) {
			return false;
		} elseif ( ! is_int( $this->start ) ) {
			return false;
		} elseif ( 0 > $this->start ) {
			return false;
		}

		if ( ! isset( $this->end ) ) {
			return false;
		} elseif ( ! is_int( $this->end ) ) {
			return false;
		} elseif ( 0 > $this->end ) {
			return false;
		}

		return true;
	}

	/**
	 * Parses an SvgSelector.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#svg-selector
	 */
	protected function parse_svg_selector() {
		$array = $this->to_array();

		$allow_keys = array_fill_keys( array(
			'type',
			'id',    // URL leading to an SVG file.
			'value', // Inline SVG markup.
		), 0 );
		if ( array_diff_key( $array, $allow_keys ) ) {
			return false;
		}

		if ( empty( $this->id ) && empty( $this->value ) ) {
			return false;
		}

		if ( ! empty( $this->id ) ) {
			if ( ! is_string( $this->id ) ) {
				return false;
			} elseif ( ! wp_parse_url( $this->id ) ) {
				return false;
			}
		}

		if ( ! empty( $this->value ) ) {
			if ( ! is_string( $this->value ) ) {
				return false;
			} elseif ( false === stripos( $this->value, '</svg>' ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Parses an RangeSelector.
	 *
	 * @since [version]
	 *
	 * @return bool True if valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#range-selector
	 */
	protected function parse_range_selector() {
		$array = $this->to_array();

		$allow_keys = array_fill_keys( array(
			'type',
			'startSelector',
			'endSelector',
		), 0 );
		if ( array_diff_key( $array, $allow_keys ) ) {
			return false;
		}

		if ( empty( $this->startSelector ) ) {
			return false;
		} elseif ( empty( $this->endSelector ) ) {
			return false;
		}

		$this->startSelector = self::get_instance( $this->startSelector );
		$this->endSelector   = self::get_instance( $this->endSelector );

		if ( ! $this->startSelector || ! $this->endSelector ) {
			return false;
		}

		return true;
	}
}
