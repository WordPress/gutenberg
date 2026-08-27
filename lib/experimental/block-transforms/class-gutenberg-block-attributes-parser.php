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
			$key   = is_scalar( $value ) ? (string) $value : '';
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
		$source   = $schema['source'];

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

		if ( null === $target ) {
			return null;
		}

		switch ( $source ) {
			case 'attribute':
				$value = $target->get_attribute( $schema['attribute'] );
				$type  = isset( $schema['type'] ) ? $schema['type'] : null;

				/*
				 * An absent boolean attribute has no value rather than `false`,
				 * which is what the editor derives from the same markup.
				 */
				if ( 'boolean' === $type ) {
					return null === $value ? null : true;
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
			'23.8.0'
		);

		return null;
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
