<?php
/**
 * Server-side conversion of arbitrary HTML into blocks.
 *
 * @package gutenberg
 */

/**
 * Converts HTML into blocks using the raw transforms declared by registered
 * block types.
 *
 * This is the PHP counterpart of `rawHandler()` in `@wordpress/blocks`. Where
 * the editor reads `transforms.from` entries from JavaScript block settings,
 * this reads them from `WP_Block_Type::$transforms`, which `block.json` can now
 * populate.
 *
 * @access private
 */
class Gutenberg_HTML_To_Blocks {
	/**
	 * Elements that belong inside a paragraph rather than beside one.
	 *
	 * @see https://html.spec.whatwg.org/multipage/dom.html#phrasing-content-2
	 *
	 * @var string[]
	 */
	const PHRASING_CONTENT = array(
		'a',
		'abbr',
		'audio',
		'b',
		'bdi',
		'bdo',
		'br',
		'canvas',
		'cite',
		'code',
		'data',
		'datalist',
		'del',
		'dfn',
		'em',
		'embed',
		'i',
		'iframe',
		'img',
		'input',
		'ins',
		'kbd',
		'label',
		'map',
		'mark',
		'math',
		'meter',
		'object',
		'output',
		'picture',
		'progress',
		'q',
		'ruby',
		's',
		'samp',
		'select',
		'small',
		'span',
		'strong',
		'sub',
		'sup',
		'svg',
		'template',
		'textarea',
		'time',
		'u',
		'var',
		'video',
		'wbr',
	);

	/**
	 * Media elements that a figure should wrap when they appear on their own.
	 *
	 * @var string[]
	 */
	const FIGURE_CONTENT = array( 'img', 'video', 'audio', 'iframe', 'embed', 'object' );

	/**
	 * Block used for markup that no registered block claims.
	 *
	 * @var string
	 */
	const FALLBACK_BLOCK = 'core/html';

	/**
	 * Converts HTML into a list of blocks.
	 *
	 * @param string $html HTML to convert.
	 * @return array[] Parsed block arrays, in the shape returned by `parse_blocks()`.
	 */
	public static function convert( $html ) {
		$html = (string) $html;

		if ( '' === trim( $html ) ) {
			return array();
		}

		if ( false !== strpos( $html, '<!-- wp:' ) ) {
			$blocks = parse_blocks( $html );

			$is_single_freeform = 1 === count( $blocks ) && 'core/freeform' === $blocks[0]['blockName'];
			if ( ! $is_single_freeform ) {
				return $blocks;
			}
		}

		$root = Gutenberg_HTML_Element::from_html( $html );

		if ( null === $root ) {
			return array();
		}

		self::convert_special_comments( $root );
		self::wrap_figure_content( $root );
		self::normalise( $root );

		$blocks = array();

		foreach ( $root->children as $child ) {
			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type ) {
				continue;
			}

			$blocks[] = self::convert_element( $child );
		}

		return $blocks;
	}

	/**
	 * Converts a single element into a block.
	 *
	 * @param Gutenberg_HTML_Element $element Element to convert.
	 * @return array Parsed block array.
	 */
	private static function convert_element( $element ) {
		$transform = self::find_transform( $element );

		if ( null === $transform ) {
			return self::create_fallback_block( $element );
		}

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $transform['blockName'] );

		if ( ! $block_type instanceof WP_Block_Type ) {
			return self::create_fallback_block( $element );
		}

		if ( isset( $transform['transform'] ) && is_callable( $transform['transform'] ) ) {
			$block = call_user_func( $transform['transform'], $element, array( __CLASS__, 'convert' ) );

			if ( is_array( $block ) && isset( $block['blockName'] ) ) {
				return $block;
			}

			return self::create_fallback_block( $element );
		}

		$inner_blocks = array();

		if ( isset( $transform['innerBlocks'] ) && false !== $transform['innerBlocks'] ) {
			$inner_blocks = self::extract_inner_blocks( $element, $transform['innerBlocks'] );
		}

		$attributes = array();

		if ( ! isset( $transform['sourceAttributes'] ) || false !== $transform['sourceAttributes'] ) {
			$attributes = Gutenberg_Block_Attributes_Parser::parse( $block_type, $element );
		}

		if ( isset( $transform['attributes'] ) && is_array( $transform['attributes'] ) ) {
			$attributes = array_merge( $attributes, self::resolve_transform_attributes( $transform['attributes'], $element ) );
		}

		$attributes = array_merge( self::get_block_supports_attributes( $block_type, $element ), $attributes );

		return self::create_block( $block_type, $attributes, $element, $inner_blocks );
	}

	/**
	 * Derives the attributes that block supports contribute to a block.
	 *
	 * `anchor` and `className` are added to a block's attributes by the editor
	 * rather than by `block.json`, so they are not part of the block type on the
	 * server and cannot be sourced like the rest.
	 *
	 * @param WP_Block_Type          $block_type Block type.
	 * @param Gutenberg_HTML_Element $element    Matched element.
	 * @return array Attribute values.
	 */
	private static function get_block_supports_attributes( $block_type, $element ) {
		$supports   = (array) $block_type->supports;
		$attributes = array();

		if ( ! empty( $supports['anchor'] ) ) {
			$anchor = $element->get_attribute( 'id' );

			if ( is_string( $anchor ) && '' !== $anchor ) {
				$attributes['anchor'] = $anchor;
			}
		}

		if ( ! isset( $supports['customClassName'] ) || false !== $supports['customClassName'] ) {
			$class_names = $element->get_class_names();

			if ( array() !== $class_names ) {
				$attributes['className'] = implode( ' ', $class_names );
			}
		}

		return $attributes;
	}

	/**
	 * Resolves the attribute overrides declared on a transform.
	 *
	 * Values are used as-is, except for arrays carrying a `source` key, which are
	 * read out of the matched element using the same vocabulary `block.json`
	 * attribute definitions use. That lets a transform pick up markup its block
	 * does not otherwise source, such as an attribute on a wrapper element.
	 *
	 * @param array                  $attributes Attribute overrides.
	 * @param Gutenberg_HTML_Element $element    Matched element.
	 * @return array Resolved attribute values.
	 */
	private static function resolve_transform_attributes( $attributes, $element ) {
		$resolved = array();

		foreach ( $attributes as $name => $value ) {
			if ( ! is_array( $value ) || ! isset( $value['source'] ) ) {
				$resolved[ $name ] = $value;
				continue;
			}

			$sourced = Gutenberg_Block_Attributes_Parser::parse_single( $value, $element );

			if ( null !== $sourced ) {
				$resolved[ $name ] = $sourced;
			}
		}

		return $resolved;
	}

	/**
	 * Converts part of an element's content into inner blocks and detaches it.
	 *
	 * `true` converts the whole content; a selector converts only the matching
	 * child elements and leaves the rest in place, so a block can hold both text
	 * and inner blocks the way a list item does.
	 *
	 * @param Gutenberg_HTML_Element $element     Element to take inner blocks from.
	 * @param true|string            $inner_blocks `true`, or a selector matching child elements.
	 * @return array[] Parsed block arrays.
	 */
	private static function extract_inner_blocks( $element, $inner_blocks ) {
		if ( true === $inner_blocks ) {
			$blocks            = self::convert( $element->get_inner_html() );
			$element->children = array();

			return $blocks;
		}

		$blocks = array();

		foreach ( $element->child_elements() as $child ) {
			if ( ! $child->matches( $inner_blocks ) ) {
				continue;
			}

			$blocks[] = self::convert_element( $child );
			$child->remove();
		}

		return $blocks;
	}

	/**
	 * Builds a parsed block array from a block type and its source markup.
	 *
	 * @param WP_Block_Type          $block_type   Block type.
	 * @param array                  $attributes   Block attributes.
	 * @param Gutenberg_HTML_Element $element      Element the block was derived from.
	 * @param array[]                $inner_blocks Inner blocks.
	 * @return array Parsed block array.
	 */
	private static function create_block( $block_type, $attributes, $element, $inner_blocks ) {
		$attributes = self::remove_default_attributes( $block_type, $attributes );
		$markup     = self::prepare_wrapper_markup( $block_type, $element );

		if ( array() === $inner_blocks ) {
			return array(
				'blockName'    => $block_type->name,
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => $markup['outer'],
				'innerContent' => array( $markup['outer'] ),
			);
		}

		$before        = $markup['opening'] . $element->get_inner_html();
		$after         = $markup['closing'];
		$inner_content = array( $before );

		$inner_content = array_merge( $inner_content, array_fill( 0, count( $inner_blocks ), null ) );

		$inner_content[] = $after;

		return array(
			'blockName'    => $block_type->name,
			'attrs'        => $attributes,
			'innerBlocks'  => $inner_blocks,
			'innerHTML'    => $before . $after,
			'innerContent' => $inner_content,
		);
	}

	/**
	 * Wraps unclaimed markup in the fallback block.
	 *
	 * @param Gutenberg_HTML_Element $element Element to wrap.
	 * @return array Parsed block array.
	 */
	private static function create_fallback_block( $element ) {
		$html = $element->get_outer_html();

		return array(
			'blockName'    => self::FALLBACK_BLOCK,
			'attrs'        => array(),
			'innerBlocks'  => array(),
			'innerHTML'    => $html,
			'innerContent' => array( $html ),
		);
	}

	/**
	 * Drops attribute values that match the block type's declared defaults.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @param array         $attributes Attribute values.
	 * @return array Attribute values worth serializing.
	 */
	private static function remove_default_attributes( $block_type, $attributes ) {
		$definitions = (array) $block_type->attributes;

		foreach ( $attributes as $name => $value ) {
			$definition = isset( $definitions[ $name ] ) ? $definitions[ $name ] : array();

			if ( array_key_exists( 'default', $definition ) && $definition['default'] === $value ) {
				unset( $attributes[ $name ] );
				continue;
			}

			// Sourced attributes are read back out of the markup, not the delimiter.
			if ( isset( $definition['source'] ) ) {
				unset( $attributes[ $name ] );
			}
		}

		return $attributes;
	}

	/**
	 * Adds the block's generated class name to its wrapper element.
	 *
	 * Static blocks save markup that carries a `wp-block-*` class, and block
	 * validation in the editor compares against that saved markup. Adding the
	 * class here is what keeps converted markup valid without a server-side
	 * implementation of every block's `save()`.
	 *
	 * @param WP_Block_Type          $block_type Block type.
	 * @param Gutenberg_HTML_Element $element    Element to add the class to.
	 * @return array Markup with `opening`, `closing` and `outer` keys.
	 */
	private static function prepare_wrapper_markup( $block_type, $element ) {
		$opening  = $element->get_opening_tag();
		$closing  = $element->get_closing_tag();
		$supports = (array) $block_type->supports;

		$add_class    = ! isset( $supports['className'] ) || false !== $supports['className'];
		$keep_classes = ! isset( $supports['customClassName'] ) || false !== $supports['customClassName'];
		$keep_anchor  = ! empty( $supports['anchor'] );

		$processor = new WP_HTML_Tag_Processor( $opening );

		if ( $processor->next_tag() ) {
			if ( ! $keep_classes ) {
				$processor->remove_attribute( 'class' );
			}

			if ( ! $keep_anchor ) {
				$processor->remove_attribute( 'id' );
			}

			if ( $add_class ) {
				$processor->add_class( self::get_default_class_name( $block_type->name ) );
			}

			$opening = $processor->get_updated_html();
		}

		return array(
			'opening' => $opening,
			'closing' => $closing,
			'outer'   => $opening . $element->get_inner_html() . $closing,
		);
	}

	/**
	 * Returns the generated class name for a block.
	 *
	 * @see getBlockDefaultClassName() in `@wordpress/blocks`.
	 *
	 * @param string $block_name Block name.
	 * @return string Generated class name.
	 */
	private static function get_default_class_name( $block_name ) {
		return 'wp-block-' . preg_replace( '#^core-#', '', str_replace( '/', '-', $block_name ) );
	}

	/**
	 * Returns the raw transform matching an element, or null.
	 *
	 * @param Gutenberg_HTML_Element $element Element to match.
	 * @return array|null Matching transform, or null.
	 */
	private static function find_transform( $element ) {
		foreach ( self::get_raw_transforms() as $transform ) {
			if ( isset( $transform['isMatch'] ) && is_callable( $transform['isMatch'] ) ) {
				if ( call_user_func( $transform['isMatch'], $element ) ) {
					return $transform;
				}

				continue;
			}

			if ( isset( $transform['selector'] ) && $element->matches( $transform['selector'] ) ) {
				return $transform;
			}
		}

		return null;
	}

	/**
	 * Returns every registered raw transform, ordered by priority.
	 *
	 * @return array[] Raw transforms, each carrying the `blockName` it belongs to.
	 */
	private static function get_raw_transforms() {
		$transforms = array();

		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
			if ( ! isset( $block_type->transforms['from'] ) || ! is_array( $block_type->transforms['from'] ) ) {
				continue;
			}

			foreach ( $block_type->transforms['from'] as $index => $transform ) {
				if ( ! is_array( $transform ) || ! isset( $transform['type'] ) || 'raw' !== $transform['type'] ) {
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
	 * Replaces `<!--more-->` and `<!--nextpage-->` with elements blocks can match.
	 *
	 * @param Gutenberg_HTML_Element $root Fragment root.
	 * @return void
	 */
	private static function convert_special_comments( $root ) {
		foreach ( $root->children as $index => $child ) {
			if ( Gutenberg_HTML_Element::ELEMENT === $child->type ) {
				self::convert_special_comments( $child );
				continue;
			}

			if ( Gutenberg_HTML_Element::COMMENT !== $child->type ) {
				continue;
			}

			$text       = trim( $child->text );
			$attributes = null;

			if ( 'nextpage' === $text ) {
				$attributes = array( 'data-block' => 'core/nextpage' );
			} elseif ( 'more' === $text || 0 === strpos( $text, 'more ' ) ) {
				$attributes = array( 'data-block' => 'core/more' );
				$custom     = trim( substr( $text, 4 ) );

				if ( '' !== $custom ) {
					$attributes['data-custom-text'] = $custom;
				}
			}

			if ( null === $attributes ) {
				continue;
			}

			$element = Gutenberg_HTML_Element::create_element( 'wp-block', $attributes );

			/*
			 * The More and Page Break blocks save the very comment being
			 * replaced here, so keep it as the element's markup. The synthetic
			 * element only exists so a block can declare a selector for it.
			 */
			$element->set_opening_tag( $child->get_outer_html() );
			$element->set_closing_tag( '' );

			$element->parent          = $root;
			$root->children[ $index ] = $element;
		}
	}

	/**
	 * Wraps top level media elements in a figure so media blocks can match them.
	 *
	 * @param Gutenberg_HTML_Element $root Fragment root.
	 * @return void
	 */
	private static function wrap_figure_content( $root ) {
		$children = array();

		foreach ( $root->children as $child ) {
			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type || ! self::is_figure_content( $child ) ) {
				$children[] = $child;
				continue;
			}

			$figure             = Gutenberg_HTML_Element::create_element( 'figure' );
			$figure->children[] = $child;
			$child->parent      = $figure;
			$figure->parent     = $root;

			$children[] = $figure;
		}

		$root->children = $children;
	}

	/**
	 * Determines whether an element is media that belongs inside a figure.
	 *
	 * @param Gutenberg_HTML_Element $element Element to test.
	 * @return bool Whether the element is figure content.
	 */
	private static function is_figure_content( $element ) {
		if ( in_array( $element->tag_name, self::FIGURE_CONTENT, true ) ) {
			return true;
		}

		if ( 'a' !== $element->tag_name ) {
			return false;
		}

		$elements = $element->child_elements();

		return 1 === count( $elements )
			&& in_array( $elements[0]->tag_name, self::FIGURE_CONTENT, true )
			&& '' === trim( $element->get_text_content() );
	}

	/**
	 * Wraps loose text and phrasing content in paragraphs.
	 *
	 * @see normaliseBlocks() in `@wordpress/blocks`.
	 *
	 * @param Gutenberg_HTML_Element $root Fragment root.
	 * @return void
	 */
	private static function normalise( $root ) {
		$children = $root->children;
		$blocks   = array();
		$open     = null;

		foreach ( $children as $child ) {
			if ( Gutenberg_HTML_Element::COMMENT === $child->type ) {
				continue;
			}

			if ( Gutenberg_HTML_Element::TEXT === $child->type ) {
				if ( '' === trim( $child->text ) ) {
					continue;
				}

				if ( null === $open ) {
					$open     = Gutenberg_HTML_Element::create_element( 'p' );
					$blocks[] = $open;
				}

				$open->append_child( $child );
				continue;
			}

			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type ) {
				continue;
			}

			if ( 'br' === $child->tag_name ) {
				$open = null;
				continue;
			}

			if ( ! in_array( $child->tag_name, self::PHRASING_CONTENT, true ) ) {
				$open     = null;
				$blocks[] = $child;
				continue;
			}

			if ( null === $open ) {
				$open     = Gutenberg_HTML_Element::create_element( 'p' );
				$blocks[] = $open;
			}

			$open->append_child( $child );
		}

		foreach ( $blocks as $block ) {
			$block->parent = $root;
		}

		$root->children = array_values(
			array_filter(
				$blocks,
				static function ( $block ) {
					return ! ( 'p' === $block->tag_name && $block->is_empty() );
				}
			)
		);
	}
}
