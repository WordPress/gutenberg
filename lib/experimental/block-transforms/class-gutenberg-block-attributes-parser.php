<?php
/**
 * Server-side implementation of block attribute sources.
 *
 * @package gutenberg
 */

/**
 * Derives block attribute values from markup using a block type's attribute
 * definitions.
 *
 * This is the PHP counterpart of `getBlockAttributes()` in `@wordpress/blocks`.
 * It implements the `attribute`, `html`, `text`, `rich-text`, `query`, `tag`
 * and `raw` sources. The `children` and `node` sources are deliberately
 * unsupported: both produce React element trees and have been deprecated in
 * the editor for years.
 *
 * @access private
 */
class Gutenberg_Block_Attributes_Parser {
	/**
	 * Derives every attribute of a block type from an element.
	 *
	 * @param WP_Block_Type          $block_type         Block type whose attribute definitions to apply.
	 * @param Gutenberg_HTML_Element $element            Element holding the block's markup.
	 * @param array                  $comment_attributes Optional. Attributes already known from block delimiters.
	 * @return array Attribute values, keyed by attribute name.
	 */
	public static function parse( $block_type, $element, $comment_attributes = array() ) {
		$attributes = array();

		foreach ( (array) $block_type->attributes as $name => $schema ) {
			$value = self::parse_attribute( $name, $schema, $element, $comment_attributes );

			if ( null !== $value ) {
				$attributes[ $name ] = $value;
			}
		}

		/**
		 * Filters the block attributes derived from markup on the server.
		 *
		 * The counterpart of the `blocks.getBlockAttributes` JavaScript filter.
		 *
		 * @param array                  $attributes Derived attribute values.
		 * @param WP_Block_Type          $block_type Block type the attributes belong to.
		 * @param Gutenberg_HTML_Element $element    Element the attributes were derived from.
		 */
		return apply_filters( 'gutenberg_block_attributes_from_html', $attributes, $block_type, $element );
	}

	/**
	 * Derives one value from a single attribute definition.
	 *
	 * @param array                  $schema  Attribute definition. Must declare a source.
	 * @param Gutenberg_HTML_Element $element Element holding the block's markup.
	 * @return mixed Attribute value, or null when the attribute has no value.
	 */
	public static function parse_single( $schema, $element ) {
		$value = self::apply_source( $schema, $element );

		/*
		 * A `map` turns the sourced value into the one the block declares, such
		 * as a heading tag name into a heading level. It runs before validation
		 * because the declared type describes the mapped value, not the sourced
		 * one.
		 */
		if ( isset( $schema['map'] ) && is_array( $schema['map'] ) ) {
			/*
			 * JSON has no boolean keys, so a boolean value looks its map key up
			 * under the spelling JSON can write — "true"/"false" — which is
			 * also how the editor's `String()` coercion spells it. PHP's own
			 * cast would give "1" and "".
			 */
			if ( is_bool( $value ) ) {
				$key = $value ? 'true' : 'false';
			} else {
				$key = is_scalar( $value ) ? (string) $value : '';
			}

			$value = array_key_exists( $key, $schema['map'] ) ? $schema['map'][ $key ] : null;
		}

		if ( ! self::is_valid_by_type( $value, $schema ) || ! self::is_valid_by_enum( $value, $schema ) ) {
			return null;
		}

		return $value;
	}

	/**
	 * Derives a single attribute value.
	 *
	 * @param string                 $name               Attribute name.
	 * @param array                  $schema             Attribute definition.
	 * @param Gutenberg_HTML_Element $element            Element holding the block's markup.
	 * @param array                  $comment_attributes Attributes already known from block delimiters.
	 * @return mixed Attribute value, or null when the attribute has no value.
	 */
	private static function parse_attribute( $name, $schema, $element, $comment_attributes ) {
		$source = isset( $schema['source'] ) ? $schema['source'] : null;

		if ( null === $source ) {
			$value = isset( $comment_attributes[ $name ] ) ? $comment_attributes[ $name ] : null;
		} elseif ( 'raw' === $source ) {
			$value = $element->get_inner_html();
		} else {
			$value = self::apply_source( $schema, $element );
		}

		if ( ! self::is_valid_by_type( $value, $schema ) || ! self::is_valid_by_enum( $value, $schema ) ) {
			$value = null;
		}

		if ( null === $value && isset( $schema['default'] ) ) {
			$value = $schema['default'];
		}

		return $value;
	}

	/**
	 * Applies a single attribute source to an element.
	 *
	 * @param array                  $schema  Attribute definition.
	 * @param Gutenberg_HTML_Element $element Element to read from.
	 * @return mixed Sourced value, or null when nothing matched.
	 */
	private static function apply_source( $schema, $element ) {
		$selector = isset( $schema['selector'] ) ? $schema['selector'] : null;
		$source   = isset( $schema['source'] ) ? $schema['source'] : null;

		// An attribute with no source is stored in the block's comment rather
		// than read out of its markup.
		if ( ! is_string( $source ) ) {
			return null;
		}

		if ( 'query' === $source ) {
			$sub_schema = isset( $schema['query'] ) ? $schema['query'] : array();
			$matches    = null === $selector ? array( $element ) : self::query_all( $element, $selector );
			$values     = array();

			foreach ( $matches as $match ) {
				$item = array();

				foreach ( $sub_schema as $sub_name => $sub_attribute ) {
					$sub_value = self::apply_source( $sub_attribute, $match );

					if ( ! self::is_valid_by_type( $sub_value, $sub_attribute ) || ! self::is_valid_by_enum( $sub_value, $sub_attribute ) ) {
						$sub_value = null;
					}

					if ( null === $sub_value && isset( $sub_attribute['default'] ) ) {
						$sub_value = $sub_attribute['default'];
					}

					if ( null !== $sub_value ) {
						$item[ $sub_name ] = $sub_value;
					}
				}

				$values[] = $item;
			}

			return $values;
		}

		$target = null === $selector ? $element : $element->closest_self_or_descendant( $selector );

		/*
		 * A boolean attribute reads as its presence even when the selector
		 * matches nothing at all — `toBooleanAttributeMatcher()` turns an
		 * unmatched read into `false`, not into no value.
		 */
		if (
			null === $target
			&& 'attribute' === $source
			&& isset( $schema['type'] )
			&& 'boolean' === $schema['type']
		) {
			return false;
		}

		if ( null === $target ) {
			return null;
		}

		switch ( $source ) {
			case 'style':
				return self::read_style_property( $target, isset( $schema['property'] ) ? $schema['property'] : null );

			case 'attribute':
				if ( ! isset( $schema['attribute'] ) || ! is_string( $schema['attribute'] ) ) {
					_doing_it_wrong(
						__METHOD__,
						__( 'An "attribute" block attribute source has to name the attribute it reads.', 'gutenberg' ),
						'23.9.0'
					);

					return null;
				}

				$value = $target->get_attribute( $schema['attribute'] );
				$type  = isset( $schema['type'] ) ? $schema['type'] : null;

				/*
				 * A boolean attribute reads as its presence: `true` when the
				 * markup carries it, `false` when it does not — the same as
				 * the editor's `toBooleanAttributeMatcher()`.
				 */
				if ( 'boolean' === $type ) {
					return null !== $value;
				}

				if ( null === $value ) {
					return null;
				}

				$value = true === $value ? '' : $value;

				/*
				 * HTML attributes are always strings. The editor leaves the
				 * coercion to each transform; declared sources can do it here.
				 */
				if ( ( 'number' === $type || 'integer' === $type ) && is_numeric( $value ) ) {
					$number = $value + 0;

					return is_float( $number ) && (float) (int) $number === $number ? (int) $number : $number;
				}

				return $value;

			case 'html':
				if ( ! empty( $schema['multiline'] ) ) {
					$html = '';

					foreach ( $target->child_elements() as $child ) {
						if ( strtolower( $schema['multiline'] ) === $child->tag_name ) {
							$html .= $child->get_outer_html();
						}
					}

					return $html;
				}

				return $target->get_inner_html();

			case 'rich-text':
				$html = $target->get_inner_html();

				/*
				 * `RichTextData.fromHTMLElement()` collapses each text node on
				 * its own, leaving attribute values alone; this collapses the
				 * markup as one string, so whitespace inside an attribute is
				 * collapsed too. Nothing reads the difference today, because a
				 * sourced value is re-derived from the markup rather than
				 * written into the block, and the markup is carried unchanged.
				 */
				if ( empty( $schema['__unstablePreserveWhiteSpace'] ) ) {
					$html = trim( preg_replace( '/[\r\n\t ]+/', ' ', $html ) );
				}

				return $html;

			case 'text':
				return trim( preg_replace( '/[\r\n\t ]+/', ' ', $target->get_text_content() ) );

			case 'tag':
				return $target->tag_name;
		}

		_doing_it_wrong(
			__METHOD__,
			sprintf(
				/* translators: %s: Block attribute source, for example "node". */
				__( 'The "%s" block attribute source is not supported on the server.', 'gutenberg' ),
				$source
			),
			'23.9.0'
		);

		return null;
	}

	/**
	 * Reads one declaration out of an element's inline styles.
	 *
	 * Mirrors what the editor reads through the CSSOM: the winning declaration
	 * for the property — a later one replaces an earlier one unless the
	 * earlier one is `!important` — with the priority reported separately
	 * rather than as part of the value, and bare keyword values lowercased the
	 * way serialization spells them. Values that are not bare keywords —
	 * lengths, URLs, quoted strings — are left as written.
	 *
	 * @param Gutenberg_HTML_Element $element  Element to read.
	 * @param string|null            $property CSS property name, as it is written in the style attribute.
	 * @return string|null The value, or null when the element does not set it.
	 */
	private static function read_style_property( $element, $property ) {
		if ( ! is_string( $property ) || '' === $property ) {
			return null;
		}

		$style = $element->get_attribute( 'style' );

		if ( ! is_string( $style ) ) {
			return null;
		}

		$value     = null;
		$important = false;

		// Split on `;` only outside parentheses, so a value such as
		// `url(data:image/png;base64,…)` keeps its semicolons.
		foreach ( preg_split( '/;(?![^(]*\))/', $style ) as $declaration ) {
			$parts = explode( ':', $declaration, 2 );

			if ( 2 !== count( $parts ) ) {
				continue;
			}

			if ( strtolower( trim( $parts[0] ) ) !== strtolower( $property ) ) {
				continue;
			}

			$candidate    = trim( $parts[1] );
			$is_important = (bool) preg_match( '/!\s*important\s*$/i', $candidate );

			if ( $is_important ) {
				$candidate = trim( preg_replace( '/!\s*important\s*$/i', '', $candidate ) );
			}

			if ( null !== $value && $important && ! $is_important ) {
				continue;
			}

			if ( preg_match( '/^-?[a-zA-Z][a-zA-Z0-9-]*$/', $candidate ) ) {
				$candidate = strtolower( $candidate );
			}

			$value     = $candidate;
			$important = $is_important;
		}

		return '' === $value ? null : $value;
	}

	/**
	 * Returns every element matching a selector, including the element itself.
	 *
	 * @param Gutenberg_HTML_Element $element  Element to search from.
	 * @param string                 $selector Selector list.
	 * @return Gutenberg_HTML_Element[] Matching elements.
	 */
	private static function query_all( $element, $selector ) {
		$matches = $element->query_selector_all( $selector );

		if ( $element->matches( $selector ) ) {
			array_unshift( $matches, $element );
		}

		return $matches;
	}

	/**
	 * Determines whether a value satisfies an attribute definition's type.
	 *
	 * @param mixed $value  Value to test.
	 * @param array $schema Attribute definition.
	 * @return bool Whether the value is valid.
	 */
	private static function is_valid_by_type( $value, $schema ) {
		if ( null === $value || ! isset( $schema['type'] ) ) {
			return true;
		}

		foreach ( (array) $schema['type'] as $type ) {
			switch ( $type ) {
				case 'string':
				case 'rich-text':
					if ( is_string( $value ) ) {
						return true;
					}
					break;

				case 'boolean':
					if ( is_bool( $value ) ) {
						return true;
					}
					break;

				case 'object':
					if ( is_array( $value ) && ( array() === $value || ! array_is_list( $value ) ) ) {
						return true;
					}
					break;

				case 'array':
					if ( is_array( $value ) && ( array() === $value || array_is_list( $value ) ) ) {
						return true;
					}
					break;

				case 'null':
					// A null value was accepted above, so this type says
					// nothing about the value in hand: try the next one.
					break;

				case 'integer':
				case 'number':
					if ( is_int( $value ) || is_float( $value ) ) {
						return true;
					}
					break;

				default:
					return true;
			}
		}

		return false;
	}

	/**
	 * Determines whether a value satisfies an attribute definition's enum.
	 *
	 * @param mixed $value  Value to test.
	 * @param array $schema Attribute definition.
	 * @return bool Whether the value is valid.
	 */
	private static function is_valid_by_enum( $value, $schema ) {
		if ( null === $value || ! isset( $schema['enum'] ) || ! is_array( $schema['enum'] ) ) {
			return true;
		}

		return in_array( $value, $schema['enum'], true );
	}
}
