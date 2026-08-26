<?php
/**
 * Server-side conversion of shortcodes into blocks.
 *
 * @package gutenberg
 */

/**
 * Turns the shortcodes in a run of markup into blocks.
 *
 * The PHP counterpart of `segmentHTMLToShortcodeBlock()` in
 * `@wordpress/blocks`, reading the same `shortcode` transforms out of
 * `WP_Block_Type::$transforms` that the editor reads from block settings.
 *
 * @access private
 */
class Gutenberg_Shortcode_Transforms {
	/**
	 * Markup a shortcode has to follow to stand on its own line.
	 *
	 * @var string
	 */
	const BEFORE_LINE = '/(\n|<p>|<br\s*\/?>)\s*$/';

	/**
	 * Markup a shortcode has to precede to stand on its own line.
	 *
	 * @var string
	 */
	const AFTER_LINE = '#^\s*(\n|</p>|<br\s*/?>)#';

	/**
	 * Splits markup into the runs between its shortcodes and the blocks they become.
	 *
	 * @param string  $html                  Markup to split.
	 * @param int     $offset                Where to start looking for a shortcode.
	 * @param array   $excluded_block_names  Blocks whose transform already declined this markup.
	 * @return array Markup strings and parsed block arrays, in document order.
	 */
	public static function segment( $html, $offset = 0, $excluded_block_names = array() ) {
		$transform = self::find_transform( $html, $excluded_block_names );

		if ( null === $transform ) {
			return array( $html );
		}

		$shortcode = self::next( $transform['tag'], $html, $offset );

		if ( null === $shortcode ) {
			return array( $html );
		}

		$last_index = $shortcode['index'] + strlen( $shortcode['text'] );
		$before     = substr( $html, 0, $shortcode['index'] );
		$after      = substr( $html, $last_index );

		/*
		 * A shortcode reading as part of a sentence stays in the sentence.
		 * Only one holding markup of its own, or standing on its own line,
		 * becomes a block.
		 */
		$holds_markup = isset( $shortcode['content'] ) && false !== strpos( $shortcode['content'], '<' );

		if ( ! $holds_markup && ! ( preg_match( self::BEFORE_LINE, $before ) && preg_match( self::AFTER_LINE, $after ) ) ) {
			return self::segment( $html, $last_index );
		}

		$block = self::create_block( $transform, $shortcode );

		if ( null === $block ) {
			/*
			 * The block is not registered, or rebuilds its own markup, so the
			 * shortcode is left for the next transform that wants it.
			 */
			$excluded_block_names[] = $transform['blockName'];

			return self::segment( $html, $offset, $excluded_block_names );
		}

		return array_merge(
			self::segment( preg_replace( self::BEFORE_LINE, '', $before ) ),
			array( $block ),
			self::segment( preg_replace( self::AFTER_LINE, '', $after ) )
		);
	}

	/**
	 * Returns the first shortcode transform matching the markup, or null.
	 *
	 * @param string   $html                 Markup to match against.
	 * @param string[] $excluded_block_names Blocks to skip.
	 * @return array|null Matching transform, or null.
	 */
	private static function find_transform( $html, $excluded_block_names ) {
		foreach ( self::get_transforms() as $transform ) {
			if ( in_array( $transform['blockName'], $excluded_block_names, true ) ) {
				continue;
			}

			if ( isset( $transform['serverConversion'] ) && false === $transform['serverConversion'] ) {
				continue;
			}

			if ( preg_match( self::regexp( $transform['tag'] ), $html ) ) {
				return $transform;
			}
		}

		return null;
	}

	/**
	 * Returns every registered shortcode transform, ordered by priority.
	 *
	 * @return array[] Shortcode transforms, each carrying the `blockName` it belongs to.
	 */
	private static function get_transforms() {
		$transforms = array();

		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
			if ( ! isset( $block_type->transforms['from'] ) || ! is_array( $block_type->transforms['from'] ) ) {
				continue;
			}

			foreach ( $block_type->transforms['from'] as $index => $transform ) {
				if ( ! is_array( $transform ) || ! isset( $transform['type'], $transform['tag'] ) || 'shortcode' !== $transform['type'] ) {
					continue;
				}

				$transform['blockName'] = $block_type->name;
				$transform['priority']  = isset( $transform['priority'] ) ? (int) $transform['priority'] : 10;
				$transform['order']     = $index;
				$transforms[]           = $transform;
			}
		}

		usort(
			$transforms,
			static function ( $a, $b ) {
				return $a['priority'] === $b['priority']
					? $a['order'] - $b['order']
					: $a['priority'] - $b['priority'];
			}
		);

		return $transforms;
	}

	/**
	 * Builds the block a matched shortcode becomes, or null.
	 *
	 * @param array $transform Matching transform.
	 * @param array $shortcode Matched shortcode.
	 * @return array|null Parsed block array, or null when the block is not registered.
	 */
	private static function create_block( $transform, $shortcode ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $transform['blockName'] );

		if ( ! $block_type instanceof WP_Block_Type ) {
			return null;
		}

		$attributes  = array();
		$definitions = isset( $transform['attributes'] ) && is_array( $transform['attributes'] ) ? $transform['attributes'] : array();

		foreach ( $definitions as $name => $definition ) {
			if ( ! is_array( $definition ) || ! isset( $definition['source'] ) ) {
				continue;
			}

			$value = self::read_attribute( $definition, $shortcode );

			if ( null !== $value ) {
				$attributes[ $name ] = $value;
			}
		}

		$markup = self::raw_markup( $block_type, $attributes );

		/*
		 * A block rebuilding its markup from attributes cannot be produced
		 * without its `save`, the same as a raw transform whose block rewrites
		 * the source. Declining leaves the shortcode to the next transform
		 * that wants it, which is the Shortcode block.
		 */
		if ( null === $markup ) {
			return null;
		}

		return array(
			'blockName'    => $block_type->name,
			'attrs'        => self::remove_sourced_attributes( $block_type, $attributes ),
			'innerBlocks'  => array(),
			'innerHTML'    => $markup,
			'innerContent' => array( $markup ),
		);
	}

	/**
	 * Reads one attribute value out of a matched shortcode.
	 *
	 * @param array $definition Attribute definition.
	 * @param array $shortcode      Matched shortcode.
	 * @return mixed Attribute value, or null when the shortcode does not carry it.
	 */
	private static function read_attribute( $definition, $shortcode ) {
		if ( 'shortcodeText' === $definition['source'] ) {
			return $shortcode['text'];
		}

		if ( 'shortcodeAttribute' !== $definition['source'] || ! isset( $definition['attribute'] ) ) {
			return null;
		}

		// A list names the attributes a shortcode may carry the value under,
		// in the order they win.
		foreach ( (array) $definition['attribute'] as $attribute ) {
			if ( isset( $shortcode['attrs']['named'][ $attribute ] ) ) {
				return $shortcode['attrs']['named'][ $attribute ];
			}
		}

		return null;
	}

	/**
	 * Returns the attributes worth serializing into the block delimiter.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @param array         $attributes Attribute values.
	 * @return array Attribute values.
	 */
	private static function remove_sourced_attributes( $block_type, $attributes ) {
		$definitions = (array) $block_type->attributes;

		foreach ( $attributes as $name => $value ) {
			if ( isset( $definitions[ $name ]['source'] ) ) {
				unset( $attributes[ $name ] );
			}
		}

		return $attributes;
	}

	/**
	 * Returns the markup a block saves for a shortcode, or null.
	 *
	 * A block sourcing an attribute with `raw` saves that attribute and nothing
	 * else, which is what the Shortcode block does with the shortcode's own
	 * text. That is the one shape the server can write without running a
	 * block's `save`.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @param array         $attributes Attribute values.
	 * @return string|null Saved markup, or null when the block rebuilds its own.
	 */
	private static function raw_markup( $block_type, $attributes ) {
		foreach ( (array) $block_type->attributes as $name => $definition ) {
			if (
				isset( $definition['source'], $attributes[ $name ] )
				&& 'raw' === $definition['source']
				&& is_string( $attributes[ $name ] )
			) {
				return $attributes[ $name ];
			}
		}

		return null;
	}

	/**
	 * Returns the pattern matching a shortcode tag.
	 *
	 * The same pattern `get_shortcode_regex()` builds, with the tag left as
	 * written so a transform can match a family of tags rather than one name.
	 *
	 * @param string $tag Shortcode tag, or a pattern matching several.
	 * @return string Regular expression.
	 */
	private static function regexp( $tag ) {
		return '#\[(\[?)(' . $tag . ')(?![\w-])([^\]\/]*(?:\/(?!\])[^\]\/]*)*?)(?:(\/)\]|\](?:([^\[]*(?:\[(?!\/\2\])[^\[]*)*)(\[\/\2\]))?)(\]?)#s';
	}

	/**
	 * Finds the next shortcode in the markup, or null.
	 *
	 * @param string $tag    Shortcode tag, or a pattern matching several.
	 * @param string $html   Markup to search.
	 * @param int    $offset Where to start looking.
	 * @return array|null Match details, or null when there is no shortcode left.
	 */
	private static function next( $tag, $html, $offset = 0 ) {
		if ( $offset >= strlen( $html ) ) {
			return null;
		}

		if ( ! preg_match( self::regexp( $tag ), $html, $matches, PREG_OFFSET_CAPTURE, $offset ) ) {
			return null;
		}

		$text  = $matches[0][0];
		$index = $matches[0][1];

		// An escaped shortcode, `[[tag]]`, is text rather than a shortcode.
		if ( '[' === $matches[1][0] && ']' === ( isset( $matches[7] ) ? $matches[7][0] : '' ) ) {
			return self::next( $tag, $html, $index + strlen( $text ) );
		}

		return array(
			'index'   => $index,
			'text'    => $text,
			'tag'     => $matches[2][0],
			'attrs'   => self::parse_attributes( $matches[3][0] ),
			'content' => isset( $matches[5] ) && -1 !== $matches[5][1] ? $matches[5][0] : null,
		);
	}

	/**
	 * Splits a shortcode's attribute string into named and positional values.
	 *
	 * @param string $text Attribute string.
	 * @return array Attributes, under `named` and `numeric`.
	 */
	private static function parse_attributes( $text ) {
		$parsed = shortcode_parse_atts( $text );

		$attrs = array(
			'named'   => array(),
			'numeric' => array(),
		);

		if ( ! is_array( $parsed ) ) {
			return $attrs;
		}

		foreach ( $parsed as $key => $value ) {
			if ( is_int( $key ) ) {
				$attrs['numeric'][] = $value;
				continue;
			}

			$attrs['named'][ $key ] = $value;
		}

		return $attrs;
	}
}
