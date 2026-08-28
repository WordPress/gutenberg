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
	 * The tags `isPhrasingContent()` answers true for: everything the phrasing
	 * content schema names, plus `span`, which the schema leaves out so that
	 * filtering unwraps it.
	 *
	 * @see isPhrasingContent() in `@wordpress/dom`.
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
		'code',
		'data',
		'del',
		'dfn',
		'em',
		'embed',
		'i',
		'img',
		'ins',
		'kbd',
		'mark',
		'math',
		'object',
		'q',
		'rp',
		'rt',
		'ruby',
		's',
		'samp',
		'small',
		'span',
		'strong',
		'sub',
		'sup',
		'time',
		'u',
		'var',
		'video',
		'wbr',
	);

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

			// `parse_blocks()` names a run of markup that is not a block at
			// all with a null name, where the editor's parser calls it
			// `core/freeform`.
			$is_single_freeform = 1 === count( $blocks ) && null === $blocks[0]['blockName'];
			if ( ! $is_single_freeform ) {
				return $blocks;
			}
		}

		$blocks = array();

		/*
		 * Shortcodes are taken out of the markup before it is parsed as HTML,
		 * the way the editor does: a shortcode standing on its own becomes a
		 * block, and the markup around it is converted as usual.
		 */
		foreach ( Gutenberg_Shortcode_Transforms::segment( $html ) as $segment ) {
			if ( is_array( $segment ) ) {
				$blocks[] = $segment;
				continue;
			}

			$blocks = array_merge( $blocks, self::convert_markup( $segment ) );
		}

		return $blocks;
	}

	/**
	 * Converts a run of markup holding no shortcodes into blocks.
	 *
	 * @param string $html HTML to convert.
	 * @return array[] Parsed block arrays.
	 */
	private static function convert_markup( $html ) {
		if ( '' === trim( $html ) ) {
			return array();
		}

		$root = Gutenberg_HTML_Element::from_html( $html );

		/*
		 * The HTML API gives up on markup it cannot represent — foster
		 * parenting, misnested formatting, a few legacy tags — all of which
		 * classic content is full of. Markup that cannot be read is markup
		 * no block claims, so it is kept whole rather than dropped.
		 */
		if ( null === $root ) {
			return array( self::create_fallback_block_from_html( $html ) );
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
		/*
		 * The Embed block matches on the text of a paragraph rather than on a
		 * selector, so it is the one transform `block.json` cannot describe and
		 * the one this reads from somewhere else. It is tried first because the
		 * transform it stands in for outranks the Paragraph block's, which is
		 * the only other one claiming a paragraph.
		 */
		$embed = Gutenberg_Embed_Transforms::convert( $element );

		if ( null !== $embed ) {
			return $embed;
		}

		$transform = self::find_transform( $element );

		if ( null === $transform ) {
			return self::create_fallback_block( $element );
		}

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $transform['blockName'] );

		if ( ! $block_type instanceof WP_Block_Type ) {
			return self::create_fallback_block( $element );
		}

		if ( isset( $transform['schema'] ) && is_array( $transform['schema'] ) ) {
			self::apply_content_schema( $element, $transform['schema'] );
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

		return self::create_block( $block_type, $transform, $attributes, $element, $inner_blocks );
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
				self::set_attribute_path( $resolved, $name, $value );
				continue;
			}

			$sourced = Gutenberg_Block_Attributes_Parser::parse_single( $value, $element );

			if ( null !== $sourced ) {
				self::set_attribute_path( $resolved, $name, $sourced );
			}
		}

		return $resolved;
	}

	/**
	 * Assigns a value to an attribute, which may name a path into a nested one.
	 *
	 * A block attribute such as `style` holds an object the block itself shapes,
	 * so a declaration writes `style.typography.textAlign` to reach into it
	 * rather than replacing the whole attribute.
	 *
	 * @param array  $attributes Attributes being built, assigned into.
	 * @param string $path       Attribute name, or a dot separated path into one.
	 * @param mixed  $value      Value to assign.
	 * @return void
	 */
	private static function set_attribute_path( &$attributes, $path, $value ) {
		$steps = explode( '.', $path );
		$last  = array_pop( $steps );

		$target = &$attributes;

		foreach ( $steps as $step ) {
			if ( ! isset( $target[ $step ] ) || ! is_array( $target[ $step ] ) ) {
				$target[ $step ] = array();
			}

			$target = &$target[ $step ];
		}

		$target[ $last ] = $value;
		unset( $target );
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
	 * @param array                  $transform    Transform that matched the element.
	 * @param array                  $attributes   Block attributes.
	 * @param Gutenberg_HTML_Element $element      Element the block was derived from.
	 * @param array[]                $inner_blocks Inner blocks.
	 * @return array Parsed block array.
	 */
	private static function create_block( $block_type, $transform, $attributes, $element, $inner_blocks ) {
		$attributes = self::remove_default_attributes( $block_type, $attributes );
		$markup     = self::prepare_wrapper_markup( $block_type, $transform, $element, $attributes );

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
		return self::create_fallback_block_from_html( $element->get_outer_html() );
	}

	/**
	 * Builds the block that holds markup no block claims.
	 *
	 * @param string $html Markup to keep.
	 * @return array Parsed block array.
	 */
	private static function create_fallback_block_from_html( $html ) {
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
	 * @param array                  $transform  Transform that matched the element.
	 * @param Gutenberg_HTML_Element $element    Element to add the class to.
	 * @param array                  $attributes Attributes the block was built with.
	 * @return array Markup with `opening`, `closing` and `outer` keys.
	 */
	private static function prepare_wrapper_markup( $block_type, $transform, $element, $attributes ) {
		$opening  = $element->get_opening_tag();
		$closing  = $element->get_closing_tag();
		$supports = (array) $block_type->supports;

		$keep_classes = ! isset( $supports['customClassName'] ) || false !== $supports['customClassName'];
		$keep_anchor  = ! empty( $supports['anchor'] );

		$source = new WP_HTML_Tag_Processor( $opening );

		if ( ! $source->next_tag() ) {
			return array(
				'opening' => $opening,
				'closing' => $closing,
				'outer'   => $opening . $element->get_inner_html() . $closing,
			);
		}

		/*
		 * The wrapper is rebuilt from the attributes `save` would put back on
		 * it rather than filtered in place. Anything else survives into saved
		 * markup, where it makes the block invalid and the deprecation that
		 * absorbs it can swallow the whole element as the block's content.
		 */
		$rebuilt_attributes = array();

		/*
		 * The classes `useBlockProps.save()` would add, taken from the block
		 * supports the editor itself applies rather than from a second
		 * implementation of the same rule. They come first, as `save` writes
		 * them, and a class the source already carries is not repeated.
		 */
		$classes = array_merge(
			self::get_block_supports_classes( $block_type, $attributes ),
			$keep_classes ? $element->get_class_names() : array()
		);
		$classes = array_values( array_unique( $classes ) );

		if ( array() !== $classes ) {
			$rebuilt_attributes['class'] = implode( ' ', $classes );
		}

		if ( $keep_anchor ) {
			$anchor = $source->get_attribute( 'id' );

			if ( is_string( $anchor ) && '' !== $anchor ) {
				$rebuilt_attributes['id'] = $anchor;
			}
		}

		foreach ( self::get_wrapper_attributes( $block_type, $transform, $element ) as $name ) {
			$value = $source->get_attribute( $name );

			if ( null !== $value ) {
				$rebuilt_attributes[ $name ] = $value;
			}
		}

		$rebuilt = new WP_HTML_Tag_Processor( '<' . $element->tag_name . '>' );

		if ( $rebuilt->next_tag() ) {
			foreach ( $rebuilt_attributes as $name => $value ) {
				$rebuilt->set_attribute( $name, $value );
			}

			$opening = $rebuilt->get_updated_html();
		}

		return array(
			'opening' => $opening,
			'closing' => $closing,
			'outer'   => $opening . $element->get_inner_html() . $closing,
		);
	}

	/**
	 * Returns the classes a block's supports put on its wrapper.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @return string[] Class names.
	 */
	private static function get_block_supports_classes( $block_type, $attributes ) {
		$applied = wp_apply_generated_classname_support( $block_type );
		$classes = isset( $applied['class'] ) ? trim( (string) $applied['class'] ) : '';
		$classes = '' === $classes ? array() : preg_split( '/\s+/', $classes );

		/*
		 * Text alignment is saved as a class rather than an inline style, so a
		 * block that carries the attribute has to carry the class too or its
		 * markup will not match what `save` produces.
		 */
		$supports   = (array) $block_type->supports;
		$typography = isset( $supports['typography'] ) ? (array) $supports['typography'] : array();
		$text_align = isset( $attributes['style']['typography']['textAlign'] )
			? $attributes['style']['typography']['textAlign']
			: null;

		if (
			! empty( $typography['textAlign'] )
			&& is_string( $text_align )
			&& ! wp_should_skip_block_supports_serialization( $block_type, 'typography', 'textAlign' )
		) {
			$classes[] = 'has-text-align-' . $text_align;
		}

		return $classes;
	}

	/**
	 * Removes from an element's content what its transform's schema does not allow.
	 *
	 * The counterpart of `deepFilterHTML()` in `@wordpress/blocks`, which the
	 * editor runs over pasted and converted markup before any transform sees
	 * it. Only the content is filtered: the wrapper's own attributes are
	 * decided by what the block's `save` puts back on it.
	 *
	 * @param Gutenberg_HTML_Element $element Matched element.
	 * @param array                  $schema  Content schema declared by the transform.
	 * @return void
	 */
	private static function apply_content_schema( $element, $schema ) {
		if ( ! isset( $schema[ $element->tag_name ] ) || ! is_array( $schema[ $element->tag_name ] ) ) {
			return;
		}

		self::filter_children( $element, $schema[ $element->tag_name ] );
	}

	/**
	 * Filters an element's children against the schema entry describing it.
	 *
	 * @param Gutenberg_HTML_Element $element Element whose children to filter.
	 * @param array                  $entry   Schema entry for the element.
	 * @return void
	 */
	private static function filter_children( $element, $entry ) {
		if ( ! array_key_exists( 'children', $entry ) ) {
			$element->children = array();

			return;
		}

		$children = $entry['children'];

		/*
		 * `*` allows anything, and inline content is carried verbatim by the
		 * rich text and HTML attribute sources, so neither needs filtering.
		 */
		if ( ! is_array( $children ) ) {
			return;
		}

		foreach ( $element->children as $child ) {
			self::filter_node( $child, $children );
		}
	}

	/**
	 * Keeps, cleans or unwraps a single node according to a schema.
	 *
	 * @param Gutenberg_HTML_Element $node   Node to filter.
	 * @param array                  $schema Schema the node's parent allows.
	 * @return void
	 */
	private static function filter_node( $node, $schema ) {
		if ( Gutenberg_HTML_Element::TEXT === $node->type ) {
			if ( ! isset( $schema['#text'] ) && '' !== trim( $node->text ) ) {
				$node->remove();
			}

			return;
		}

		if ( Gutenberg_HTML_Element::ELEMENT !== $node->type ) {
			return;
		}

		if ( ! isset( $schema[ $node->tag_name ] ) || ! is_array( $schema[ $node->tag_name ] ) ) {
			// An element the schema does not name keeps its content but loses itself.
			foreach ( $node->children as $child ) {
				self::filter_node( $child, $schema );
			}

			$node->unwrap();

			return;
		}

		$entry      = $schema[ $node->tag_name ];
		$attributes = self::get_schema_attributes( $entry );

		if ( null !== $attributes ) {
			$node->keep_attributes( $attributes );
		}

		self::filter_children( $node, $entry );
	}

	/**
	 * Returns the attributes a schema entry allows.
	 *
	 * An entry that varies by context lists them under `default`, which is what
	 * conversion uses; `paste` is for content coming from another application.
	 *
	 * @param array $entry Schema entry.
	 * @return string[]|null Attribute names, or null when the entry keeps them all.
	 */
	private static function get_schema_attributes( $entry ) {
		if ( ! isset( $entry['attributes'] ) ) {
			return array();
		}

		$attributes = $entry['attributes'];

		// `*` says the attributes here do not matter, which is what a block
		// declaring what it can save back writes when its own schema strips
		// them anyway.
		if ( '*' === $attributes ) {
			return null;
		}

		if ( isset( $attributes['default'] ) ) {
			$attributes = $attributes['default'];
		}

		return is_array( $attributes ) ? array_values( array_filter( $attributes, 'is_string' ) ) : array();
	}

	/**
	 * Returns the wrapper attributes a block reads its own values from.
	 *
	 * These are the attributes `save` writes back out, so they are the only
	 * ones besides `class` and `id` that may stay on the wrapper.
	 *
	 * @param WP_Block_Type          $block_type Block type.
	 * @param array                  $transform  Transform that matched the element.
	 * @param Gutenberg_HTML_Element $element    Matched element.
	 * @return string[] Attribute names, lowercased.
	 */
	private static function get_wrapper_attributes( $block_type, $transform, $element ) {
		$definitions = (array) $block_type->attributes;

		if ( isset( $transform['attributes'] ) && is_array( $transform['attributes'] ) ) {
			$definitions = array_merge( $definitions, $transform['attributes'] );
		}

		$names = array();

		foreach ( $definitions as $definition ) {
			if ( ! is_array( $definition ) || ! isset( $definition['source'], $definition['attribute'] ) ) {
				continue;
			}

			if ( 'attribute' !== $definition['source'] ) {
				continue;
			}

			if ( isset( $definition['selector'] ) && ! $element->matches( $definition['selector'] ) ) {
				continue;
			}

			$names[] = strtolower( $definition['attribute'] );
		}

		return array_values( array_unique( $names ) );
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
				if ( ! call_user_func( $transform['isMatch'], $element ) ) {
					continue;
				}
			} elseif ( ! isset( $transform['selector'] ) || ! $element->matches( $transform['selector'] ) ) {
				continue;
			}

			// Only once the transform wants the element, since this filters a
			// copy of it to find out.
			if ( self::declines_server_conversion( $transform, $element ) ) {
				continue;
			}

			return $transform;
		}

		return null;
	}

	/**
	 * Determines whether a transform refuses to run outside the editor.
	 *
	 * A block whose `save` rewrites the markup rather than wrapping it cannot
	 * be reproduced from the source at all, and declares `false`. A block that
	 * can reproduce some shapes and not others declares the content it is able
	 * to save instead, and markup carrying anything else is left alone rather
	 * than converted into a block that would not validate.
	 *
	 * @param array                  $transform Transform to test.
	 * @param Gutenberg_HTML_Element $element   Element being converted.
	 * @return bool Whether the transform declines this markup.
	 */
	private static function declines_server_conversion( $transform, $element ) {
		if ( ! isset( $transform['serverConversion'] ) ) {
			return false;
		}

		$declared = $transform['serverConversion'];

		if ( false === $declared ) {
			return true;
		}

		if ( ! is_array( $declared ) || ! isset( $declared['requires'] ) || ! is_array( $declared['requires'] ) ) {
			return false;
		}

		return ! self::content_already_conforms( $element, $declared['requires'] );
	}

	/**
	 * Determines whether an element's content already matches a schema.
	 *
	 * Filtering is what tells them apart: markup the schema would rewrite is
	 * markup the block cannot save back unchanged. The element is copied first,
	 * so a transform that turns out to decline leaves nothing behind.
	 *
	 * @param Gutenberg_HTML_Element $element Element to test.
	 * @param array                  $schema  Content schema.
	 * @return bool Whether the content is already what the schema allows.
	 */
	private static function content_already_conforms( $element, $schema ) {
		$probe = Gutenberg_HTML_Element::from_html( $element->get_outer_html() );

		// Content that cannot be read back is content this cannot vouch for.
		if ( null === $probe || array() === $probe->children ) {
			return false;
		}

		$copy   = $probe->children[0];
		$before = $copy->get_inner_html();

		self::apply_content_schema( $copy, $schema );

		return $before === $copy->get_inner_html();
	}

	/**
	 * Returns every registered raw transform, ordered by priority.
	 *
	 * @return array[] Raw transforms, each carrying the `blockName` it belongs to.
	 */
	private static function get_raw_transforms() {
		$transforms = array();
		$order      = 0;

		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
			if ( ! isset( $block_type->transforms['from'] ) || ! is_array( $block_type->transforms['from'] ) ) {
				continue;
			}

			foreach ( $block_type->transforms['from'] as $transform ) {
				if ( ! is_array( $transform ) || ! isset( $transform['type'] ) || 'raw' !== $transform['type'] ) {
					continue;
				}

				$transform['blockName'] = $block_type->name;
				$transform['priority']  = isset( $transform['priority'] ) ? (int) $transform['priority'] : 10;

				/*
				 * Registration order across every block, not the index within
				 * one block's own list: `usort` is only stable from PHP 8.0,
				 * so transforms of equal priority would otherwise resolve
				 * differently on the versions below it.
				 */
				$transform['order'] = $order;
				++$order;

				$transforms[] = $transform;
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
	 * The counterpart of `specialCommentConverter` in `@wordpress/blocks`: a
	 * marker inside a paragraph splits it rather than staying in its text, and
	 * a `<!--more-->` takes any following `<!--noteaser-->` with it.
	 *
	 * @param Gutenberg_HTML_Element $root Fragment root.
	 * @return void
	 */
	private static function convert_special_comments( $root ) {
		$source   = $root->children;
		$children = array();
		$consumed = array();

		foreach ( $source as $index => $child ) {
			if ( isset( $consumed[ $index ] ) ) {
				continue;
			}

			if ( Gutenberg_HTML_Element::ELEMENT === $child->type ) {
				self::convert_special_comments( $child );

				if ( 'p' === $child->tag_name ) {
					foreach ( self::split_on_special_comments( $child ) as $piece ) {
						$children[] = $piece;
					}
					continue;
				}

				$children[] = $child;
				continue;
			}

			if ( Gutenberg_HTML_Element::COMMENT !== $child->type ) {
				$children[] = $child;
				continue;
			}

			$element = self::special_comment_element( $child, $source, $index, $consumed );

			$children[] = null === $element ? $child : $element;
		}

		foreach ( $children as $child ) {
			$child->parent = $root;
		}

		$root->children = $children;
	}

	/**
	 * Builds the element a special comment stands for.
	 *
	 * @param Gutenberg_HTML_Element   $comment  Comment node.
	 * @param Gutenberg_HTML_Element[] $siblings Nodes the comment sits among.
	 * @param int                      $index    Offset of the comment within them.
	 * @param array                    $consumed Offsets already taken, added to when a `<!--noteaser-->` is claimed.
	 * @return Gutenberg_HTML_Element|null Element to stand in for the comment, or null when it is not a special comment.
	 */
	private static function special_comment_element( $comment, $siblings, $index, &$consumed ) {
		$text = trim( $comment->text );

		if ( 'nextpage' === $text ) {
			$attributes = array( 'data-block' => 'core/nextpage' );
			$markup     = '<!--nextpage-->';
		} elseif ( 'more' === $text || 0 === strpos( $text, 'more ' ) ) {
			$attributes = array( 'data-block' => 'core/more' );
			$custom     = trim( substr( $text, 4 ) );
			$markup     = '' === $custom ? '<!--more-->' : '<!--more ' . $custom . '-->';

			if ( '' !== $custom ) {
				$attributes['data-custom-text'] = $custom;
			}

			/*
			 * A `<!--noteaser-->` marks the More block as hiding the text
			 * before it. It is rarely the comment's immediate sibling, so the
			 * rest of the siblings are searched, as the editor searches them.
			 */
			$total = count( $siblings );
			for ( $at = $index + 1; $at < $total; $at++ ) {
				$sibling = $siblings[ $at ];

				if (
					Gutenberg_HTML_Element::COMMENT === $sibling->type
					&& 'noteaser' === trim( $sibling->text )
				) {
					$attributes['data-no-teaser'] = '';
					$consumed[ $at ]              = true;
					$markup                      .= "\n<!--noteaser-->";
					break;
				}
			}
		} else {
			return null;
		}

		$element = Gutenberg_HTML_Element::create_element( 'wp-block', $attributes );

		/*
		 * The More and Page Break blocks save the comment being replaced here,
		 * so the element carries what their `save()` writes rather than the
		 * source comment, which may be spelled differently. The synthetic
		 * element only exists so a block can declare a selector for it.
		 */
		$element->set_opening_tag( $markup );
		$element->set_closing_tag( '' );

		return $element;
	}

	/**
	 * Splits a paragraph around the special comment elements inside it.
	 *
	 * @param Gutenberg_HTML_Element $paragraph Paragraph to split.
	 * @return Gutenberg_HTML_Element[] The paragraph itself when it holds no marker, otherwise the pieces it splits into.
	 */
	private static function split_on_special_comments( $paragraph ) {
		$pieces = array();
		$run    = array();

		foreach ( $paragraph->children as $child ) {
			if (
				Gutenberg_HTML_Element::ELEMENT === $child->type
				&& 'wp-block' === $child->tag_name
				&& null !== $child->get_attribute( 'data-block' )
			) {
				if ( array() !== $run ) {
					$pieces[] = self::paragraph_from( $paragraph, $run );
					$run      = array();
				}

				$pieces[] = $child;
				continue;
			}

			$run[] = $child;
		}

		if ( array() === $pieces ) {
			return array( $paragraph );
		}

		if ( array() !== $run ) {
			$pieces[] = self::paragraph_from( $paragraph, $run );
		}

		return $pieces;
	}

	/**
	 * Builds one side of a split paragraph.
	 *
	 * @param Gutenberg_HTML_Element   $paragraph Paragraph being split, whose markup the piece keeps.
	 * @param Gutenberg_HTML_Element[] $children  Nodes the piece holds.
	 * @return Gutenberg_HTML_Element Paragraph holding those nodes.
	 */
	private static function paragraph_from( $paragraph, $children ) {
		$piece = Gutenberg_HTML_Element::create_element( 'p' );
		$piece->set_opening_tag( $paragraph->get_opening_tag() );

		foreach ( $children as $child ) {
			$piece->append_child( $child );
		}

		return $piece;
	}

	/**
	 * Wraps media in a figure so media blocks can match it, taking it out of a
	 * paragraph or division first where the editor would.
	 *
	 * The counterpart of `figureContentReducer` in `@wordpress/blocks`.
	 *
	 * @param Gutenberg_HTML_Element $root Element whose children to rewrite.
	 * @return void
	 */
	private static function wrap_figure_content( $root ) {
		$children = array();

		foreach ( $root->children as $child ) {
			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type || 'figure' === $child->tag_name ) {
				$children[] = $child;
				continue;
			}

			if ( self::is_figure_content( $child ) ) {
				$children[] = self::claims_as_figure( $child, $root )
					? self::wrap_in_figure( $child, $root )
					: $child;
				continue;
			}

			if ( in_array( $child->tag_name, array( 'p', 'div' ), true ) ) {
				foreach ( self::take_figure_content( $child ) as $node ) {
					$children[] = self::wrap_in_figure( $node, $root );
				}

				$children[] = $child;
				continue;
			}

			self::wrap_figure_content( $child );

			$children[] = $child;
		}

		$root->children = $children;
	}

	/**
	 * Removes the media a paragraph or division only carries, so it can become
	 * a block of its own.
	 *
	 * Media stays where it is when it reads as part of a sentence: the editor
	 * takes it out only when it is aligned, or when the wrapper holds no text.
	 *
	 * @param Gutenberg_HTML_Element $wrapper Element to take media out of.
	 * @return Gutenberg_HTML_Element[] The media taken out, in document order.
	 */
	private static function take_figure_content( $wrapper ) {
		$has_text = '' !== trim( $wrapper->get_text_content() );
		$taken    = array();

		foreach ( $wrapper->child_elements() as $child ) {
			if ( ! self::is_figure_content( $child ) ) {
				continue;
			}

			$media   = 'a' === $child->tag_name ? $child->child_elements()[0] : $child;
			$aligned = array_intersect(
				$media->get_class_names(),
				array( 'alignleft', 'aligncenter', 'alignright' )
			);

			if ( ! $aligned && $has_text ) {
				continue;
			}

			if ( self::claims_as_figure( $child, $wrapper ) ) {
				$taken[] = $child;
			}
		}

		foreach ( $taken as $node ) {
			$node->remove();
		}

		return $taken;
	}

	/**
	 * Determines whether any transform would convert media once it is wrapped
	 * in a figure.
	 *
	 * Wrapping media no block converts would leave markup the source never had,
	 * so the answer decides whether to wrap it at all. The element is left
	 * exactly as it was found either way.
	 *
	 * @param Gutenberg_HTML_Element $node     Media to test.
	 * @param Gutenberg_HTML_Element $ancestor Element the figure would belong to.
	 * @return bool Whether a transform claims the wrapped media.
	 */
	private static function claims_as_figure( $node, $ancestor ) {
		$was    = $node->parent;
		$figure = self::wrap_in_figure( $node, $ancestor );
		$claims = null !== self::find_transform( $figure );

		$node->parent = $was;

		return $claims;
	}

	/**
	 * Wraps an element in a figure.
	 *
	 * @param Gutenberg_HTML_Element $node      Element to wrap.
	 * @param Gutenberg_HTML_Element $ancestor  Element the figure belongs to.
	 * @return Gutenberg_HTML_Element The figure.
	 */
	private static function wrap_in_figure( $node, $ancestor ) {
		$figure             = Gutenberg_HTML_Element::create_element( 'figure' );
		$figure->children[] = $node;
		$node->parent       = $figure;
		$figure->parent     = $ancestor;

		return $figure;
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
	 * Mirrors `normaliseBlocks()` called with `{ raw: true }`, which is how
	 * `rawHandler()` calls it: a single `<br>` stays inside the paragraph and
	 * only a double one starts a new paragraph, content following a paragraph
	 * joins that paragraph, and deliberate empty paragraphs are kept.
	 *
	 * @see normaliseBlocks() in `@wordpress/blocks`.
	 *
	 * @param Gutenberg_HTML_Element $root Fragment root.
	 * @return void
	 */
	private static function normalise( $root ) {
		$children = $root->children;
		$total    = count( $children );
		$blocks   = array();

		for ( $at = 0; $at < $total; $at++ ) {
			$child = $children[ $at ];

			if ( Gutenberg_HTML_Element::TEXT === $child->type ) {
				if ( '' === trim( $child->text ) ) {
					continue;
				}

				self::open_paragraph( $blocks )->append_child( $child );
				continue;
			}

			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type ) {
				continue;
			}

			if ( 'br' === $child->tag_name ) {
				$next = isset( $children[ $at + 1 ] ) ? $children[ $at + 1 ] : null;

				if (
					null !== $next
					&& Gutenberg_HTML_Element::ELEMENT === $next->type
					&& 'br' === $next->tag_name
				) {
					$blocks[] = Gutenberg_HTML_Element::create_element( 'p' );
					++$at;
				}

				// A `<br>` only survives inside a paragraph that has content.
				$last = self::last_block( $blocks );
				if ( null !== $last && 'p' === $last->tag_name && array() !== $last->children ) {
					$last->append_child( $child );
				}

				continue;
			}

			if (
				'p' !== $child->tag_name
				&& in_array( $child->tag_name, self::PHRASING_CONTENT, true )
			) {
				self::open_paragraph( $blocks )->append_child( $child );
				continue;
			}

			$blocks[] = $child;
		}

		foreach ( $blocks as $block ) {
			$block->parent = $root;
		}

		$root->children = $blocks;
	}

	/**
	 * Returns the paragraph the next piece of phrasing content belongs in.
	 *
	 * Mirrors `normaliseBlocks()`'s `accu.lastChild.nodeName !== 'P'` test, so
	 * text following a source paragraph joins it rather than starting a new one.
	 *
	 * @param Gutenberg_HTML_Element[] $blocks Accumulated blocks, appended to when a paragraph is opened.
	 * @return Gutenberg_HTML_Element Paragraph to append to.
	 */
	private static function open_paragraph( &$blocks ) {
		$last = self::last_block( $blocks );

		if ( null !== $last && 'p' === $last->tag_name ) {
			return $last;
		}

		$paragraph = Gutenberg_HTML_Element::create_element( 'p' );
		$blocks[]  = $paragraph;

		return $paragraph;
	}

	/**
	 * Returns the last accumulated block.
	 *
	 * @param Gutenberg_HTML_Element[] $blocks Accumulated blocks.
	 * @return Gutenberg_HTML_Element|null Last block, or null when there is none.
	 */
	private static function last_block( $blocks ) {
		return array() === $blocks ? null : $blocks[ count( $blocks ) - 1 ];
	}
}
