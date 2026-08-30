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
	 * Raw transforms gathered for the conversion in progress.
	 *
	 * @var array[]|null
	 */
	private static $raw_transforms = null;

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
	 * The `children` token naming the phrasing content schema in `block.json`.
	 *
	 * @var string
	 */
	const PHRASING_TOKEN = 'phrasing';

	/**
	 * Internal `children` marker for the nested phrasing schema.
	 *
	 * A text-level wrapper allows every text-level element except itself, so
	 * the schema cannot be written out once: it is resolved per element. The
	 * marker starts with a NUL byte so no `block.json` string can collide
	 * with it.
	 *
	 * @var string
	 */
	const NESTED_PHRASING = "\0nested-phrasing";

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

		/*
		 * Gathering the raw transforms walks every registered block and sorts
		 * what it finds, and `find_transform()` wants them once per element.
		 * They are held for the length of one conversion, during which no
		 * block can be registered, rather than cached beyond it, where a block
		 * registered later would be missed.
		 */
		$outermost = null === self::$raw_transforms;

		if ( $outermost ) {
			self::$raw_transforms = Gutenberg_Block_Transforms::get_declared_transforms( 'raw' );
		}

		try {
			return self::convert_html( $html );
		} finally {
			if ( $outermost ) {
				self::$raw_transforms = null;
			}
		}
	}

	/**
	 * Converts markup into blocks, with the raw transforms already gathered.
	 *
	 * @param string $html HTML to convert.
	 * @return array[] Parsed block arrays.
	 */
	private static function convert_html( $html ) {

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

		/*
		 * The editor's `deepFilter` visits nodes in document order, so media
		 * standing before a `<!--more-->` leaves its container before the
		 * marker splits it — the emptied halves are dropped — while media
		 * after the marker leaves the half the split made, which stays. Two
		 * passes around the splitting reproduce that order: first the media
		 * no marker precedes, then, once the markers have split their
		 * containers, the rest.
		 */
		self::wrap_figure_content( $root, true );
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

		/*
		 * The Embed block matches on the text of a paragraph rather than on a
		 * selector, so it is the one transform `block.json` cannot describe
		 * and the one consulted from somewhere else. In the editor it competes
		 * at the default priority, so here it yields to a declared transform
		 * that outranks it and pre-empts the rest — among them the Paragraph
		 * block's, which declares a larger number.
		 */
		if ( null === $transform || self::transform_priority( $transform ) >= 10 ) {
			$embed = Gutenberg_Embed_Transforms::convert( $element );

			if ( null !== $embed ) {
				return $embed;
			}
		}

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

		if ( isset( $transform['transform'] ) && self::is_transform_callback( $transform['transform'] ) ) {
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

		/*
		 * The support-derived values win over declared ones, as they do in the
		 * editor, whose `nodeToBlock()` writes the element's class and id onto
		 * whatever the transform produced.
		 */
		$attributes = array_merge( $attributes, self::get_block_supports_attributes( $block_type, $element ) );

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
			// The generated class is the support's to re-add, not a custom
			// class, so markup that already carries it does not keep it here.
			$generated   = wp_get_block_default_classname( $block_type->name );
			$class_names = array_values( array_diff( $element->get_class_names(), array( $generated ) ) );

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
		$steps = explode( '.', (string) $path );

		// An empty step would write into an attribute named "", which no
		// block declares and the editor cannot read back.
		if ( in_array( '', $steps, true ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: Attribute path declared by a transform, for example "style.typography.textAlign". */
					__( 'The attribute path "%s" has an empty step, so no attribute can be written.', 'gutenberg' ),
					(string) $path
				),
				'23.9.0'
			);

			return;
		}

		$last = array_pop( $steps );

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
	 * @param Gutenberg_HTML_Element $element      Element to take inner blocks from.
	 * @param true|string            $inner_blocks `true`, or a selector matching child elements.
	 * @return array `blocks`, the parsed block arrays, and `segments`, the markup between them: one more segment than there are blocks.
	 */
	private static function extract_inner_blocks( $element, $inner_blocks ) {
		if ( true === $inner_blocks ) {
			$blocks            = self::convert( $element->get_inner_html() );
			$element->children = array();

			return array(
				'blocks'   => $blocks,
				'segments' => array_fill( 0, count( $blocks ) + 1, '' ),
			);
		}

		$blocks   = array();
		$segments = array();
		$kept     = array();
		$segment  = '';

		foreach ( $element->children as $child ) {
			if (
				Gutenberg_HTML_Element::ELEMENT === $child->type
				&& $child->matches( $inner_blocks )
			) {
				$blocks[]   = self::convert_element( $child );
				$segments[] = $segment;
				$segment    = '';
				continue;
			}

			$segment .= $child->get_outer_html();
			$kept[]   = $child;
		}

		$segments[]        = $segment;
		$element->children = $kept;

		return array(
			'blocks'   => $blocks,
			'segments' => $segments,
		);
	}

	/**
	 * Builds a parsed block array from a block type and its source markup.
	 *
	 * @param WP_Block_Type          $block_type   Block type.
	 * @param array                  $transform    Transform that matched the element.
	 * @param array                  $attributes   Block attributes.
	 * @param Gutenberg_HTML_Element $element      Element the block was derived from.
	 * @param array                  $inner_blocks Inner blocks and the markup around them, or an empty array when the block has none.
	 * @return array Parsed block array.
	 */
	private static function create_block( $block_type, $transform, $attributes, $element, $inner_blocks ) {
		$attributes = Gutenberg_Block_Transforms::remove_implied_attributes( $block_type, $attributes );
		$markup     = self::prepare_wrapper_markup( $block_type, $transform, $element, $attributes );

		if ( array() === $inner_blocks || array() === $inner_blocks['blocks'] ) {
			$outer = $markup['opening'] . $element->get_inner_html() . $markup['closing'];

			return array(
				'blockName'    => $block_type->name,
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => $outer,
				'innerContent' => array( $outer ),
			);
		}

		/*
		 * Each inner block stands where it stood in the source, between the
		 * markup that surrounded it. Appending them all after the rest would
		 * reorder the content around them.
		 */
		$blocks        = $inner_blocks['blocks'];
		$segments      = $inner_blocks['segments'];
		$last          = count( $blocks ) - 1;
		$inner_content = array( $markup['opening'] . $segments[0] );

		foreach ( $blocks as $index => $ignored ) {
			$tail = $segments[ $index + 1 ];

			if ( $index === $last ) {
				$tail .= $markup['closing'];
			}

			$inner_content[] = null;

			// `parse_blocks()` writes nothing between two adjacent inner
			// blocks rather than an empty string.
			if ( '' !== $tail ) {
				$inner_content[] = $tail;
			}
		}

		return array(
			'blockName'    => $block_type->name,
			'attrs'        => $attributes,
			'innerBlocks'  => $blocks,
			'innerHTML'    => implode( '', array_filter( $inner_content, 'is_string' ) ),
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
	 * @return array Markup with `opening` and `closing` keys.
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
			self::get_declared_wrapper_classes( $transform ),
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
		);
	}

	/**
	 * Returns the constant classes a transform declares for its wrapper.
	 *
	 * A block whose `save()` writes a class the server cannot derive — one
	 * standing for a default attribute value, such as the Separator's
	 * `has-alpha-channel-opacity` — declares it under
	 * `serverConversion.classes`, so converted markup matches what `save()`
	 * produces rather than an older deprecation.
	 *
	 * @param array $transform Transform that matched the element.
	 * @return string[] Class names.
	 */
	private static function get_declared_wrapper_classes( $transform ) {
		if (
			! isset( $transform['serverConversion'] )
			|| ! is_array( $transform['serverConversion'] )
			|| ! isset( $transform['serverConversion']['classes'] )
			|| ! is_array( $transform['serverConversion']['classes'] )
		) {
			return array();
		}

		return array_values( array_filter( $transform['serverConversion']['classes'], 'is_string' ) );
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

		$children = self::resolve_children_schema( $element->tag_name, $entry['children'] );

		// `*` allows anything, so there is nothing to filter.
		if ( ! is_array( $children ) ) {
			return;
		}

		foreach ( $element->children as $child ) {
			self::filter_node( $child, $children );
		}
	}

	/**
	 * Resolves a `children` schema value into the tags it stands for.
	 *
	 * `"phrasing"` is the one token `block.json` can write, naming the same
	 * schema `getPhrasingContentSchema()` builds for the editor; anything the
	 * schema forbids — a `span`, a `script`, an event handler attribute — has
	 * to be filtered here exactly as the editor filters it, or markup the
	 * editor would clean survives into stored post content.
	 *
	 * @param string $tag      Tag of the element whose children are described.
	 * @param mixed  $children Declared `children` value.
	 * @return mixed The resolved schema array, or the value as declared.
	 */
	private static function resolve_children_schema( $tag, $children ) {
		if ( self::PHRASING_TOKEN === $children ) {
			return self::get_phrasing_content_schema();
		}

		if ( self::NESTED_PHRASING === $children ) {
			return self::get_nested_phrasing_schema( $tag );
		}

		return $children;
	}

	/**
	 * Returns the phrasing content schema.
	 *
	 * A port of `getPhrasingContentSchema()` in `@wordpress/dom` — the
	 * text-level semantic elements plus embedded content, each restricted to
	 * the attributes the editor keeps. `span` is deliberately absent so that
	 * filtering unwraps it.
	 *
	 * @return array[] Schema, keyed by tag name.
	 */
	private static function get_phrasing_content_schema() {
		static $schema = null;

		if ( null !== $schema ) {
			return $schema;
		}

		$schema = array_merge(
			self::get_text_level_schema( null ),
			array(
				'audio'  => array( 'attributes' => array( 'src', 'preload', 'autoplay', 'mediagroup', 'loop', 'muted' ) ),
				'canvas' => array( 'attributes' => array( 'width', 'height' ) ),
				'embed'  => array( 'attributes' => array( 'src', 'type', 'width', 'height' ) ),
				'img'    => self::get_image_schema(),
				'object' => array( 'attributes' => array( 'data', 'type', 'name', 'usemap', 'form', 'width', 'height' ) ),
				'video'  => array( 'attributes' => array( 'src', 'poster', 'preload', 'playsinline', 'autoplay', 'mediagroup', 'loop', 'muted', 'controls', 'width', 'height' ) ),
				'math'   => array(
					'attributes' => array( 'display', 'xmlns' ),
					'children'   => '*',
				),
			)
		);

		return $schema;
	}

	/**
	 * Returns what a text-level wrapper may hold: every text-level element
	 * except itself, plus an image.
	 *
	 * The editor expresses this as a cyclic object graph; PHP arrays cannot
	 * cycle, so each wrapper's children carry the `NESTED_PHRASING` marker and
	 * are resolved one level at a time.
	 *
	 * @param string $except Tag to leave out, so a wrapper cannot nest in itself.
	 * @return array[] Schema, keyed by tag name.
	 */
	private static function get_nested_phrasing_schema( $except ) {
		static $memo = array();

		if ( isset( $memo[ $except ] ) ) {
			return $memo[ $except ];
		}

		$schema = self::get_text_level_schema( $except );

		$schema['img'] = self::get_image_schema();

		$memo[ $except ] = $schema;

		return $schema;
	}

	/**
	 * Returns the text-level semantic elements and their kept attributes.
	 *
	 * @param string|null $except Tag to leave out, or null for all of them.
	 * @return array[] Schema, keyed by tag name.
	 */
	private static function get_text_level_schema( $except ) {
		$nested = array( 'children' => self::NESTED_PHRASING );

		$schema = array(
			'strong' => $nested,
			'em'     => $nested,
			's'      => $nested,
			'del'    => $nested,
			'ins'    => $nested,
			'a'      => $nested + array( 'attributes' => array( 'href', 'target', 'rel', 'id' ) ),
			'code'   => $nested,
			'abbr'   => $nested + array( 'attributes' => array( 'title' ) ),
			'sub'    => $nested,
			'sup'    => $nested,
			'br'     => array(),
			'small'  => $nested,
			'q'      => $nested + array( 'attributes' => array( 'cite' ) ),
			'dfn'    => $nested + array( 'attributes' => array( 'title' ) ),
			'data'   => $nested + array( 'attributes' => array( 'value' ) ),
			'time'   => $nested + array( 'attributes' => array( 'datetime' ) ),
			'var'    => $nested,
			'samp'   => $nested,
			'kbd'    => $nested,
			'i'      => $nested,
			'b'      => $nested,
			'u'      => $nested,
			'mark'   => $nested,
			'ruby'   => $nested,
			'rt'     => $nested,
			'rp'     => $nested,
			'bdi'    => $nested + array( 'attributes' => array( 'dir' ) ),
			'bdo'    => $nested + array( 'attributes' => array( 'dir' ) ),
			'wbr'    => array(),
			'#text'  => array(),
		);

		if ( null !== $except ) {
			unset( $schema[ $except ] );
		}

		return $schema;
	}

	/**
	 * Returns the schema entry for an image inside phrasing content.
	 *
	 * @return array Schema entry.
	 */
	private static function get_image_schema() {
		return array( 'attributes' => array( 'alt', 'src', 'srcset', 'usemap', 'ismap', 'width', 'height' ) );
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
			if ( ! isset( $schema['#text'] ) && ! self::is_blank_text( $node->text ) ) {
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

		/*
		 * `class` follows its own rule, as it does in `cleanNodeList()`: the
		 * attribute never falls to the attribute list; the schema's `classes`
		 * decide which class names survive — none do when the schema names
		 * none — and they decide it even for an entry keeping every other
		 * attribute with `*`.
		 */
		self::filter_classes( $node, $entry );

		if ( null !== $attributes ) {
			$node->keep_attributes( array_merge( $attributes, array( 'class' ) ) );
		}

		self::filter_children( $node, $entry );
	}

	/**
	 * Removes the class names a schema entry does not allow.
	 *
	 * The editor's `cleanNodeList()` keeps a class name when it matches an
	 * entry in the schema's `classes` — `*` keeps them all — and removes the
	 * attribute when nothing survives. `classes` alone governs them: listing
	 * `class` under `attributes` has no effect there, so it has none here.
	 *
	 * @param Gutenberg_HTML_Element $node  Element to filter.
	 * @param array                  $entry Schema entry for the element.
	 * @return void
	 */
	private static function filter_classes( $node, $entry ) {
		$current = $node->get_class_names();

		if ( array() === $current ) {
			return;
		}

		$allowed = isset( $entry['classes'] ) && is_array( $entry['classes'] )
			? array_values( array_filter( $entry['classes'], 'is_string' ) )
			: array();

		if ( in_array( '*', $allowed, true ) ) {
			return;
		}

		$kept = array_values( array_intersect( $current, $allowed ) );

		if ( $kept === $current ) {
			return;
		}

		$node->set_class_names( $kept );
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

		// An entry that varies by context lists the conversion's set under
		// `default`, which may itself be `*`.
		if ( is_array( $attributes ) && isset( $attributes['default'] ) ) {
			$attributes = $attributes['default'];
		}

		// `*` says the attributes here do not matter, which is what a block
		// declaring what it can save back writes when its own schema strips
		// them anyway.
		if ( '*' === $attributes ) {
			return null;
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
			if ( isset( $transform['isMatch'] ) && self::is_transform_callback( $transform['isMatch'] ) ) {
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
	 * Returns the priority a transform competes at.
	 *
	 * @param array $transform Transform to read.
	 * @return int|float Declared priority, or the default of 10.
	 */
	private static function transform_priority( $transform ) {
		return isset( $transform['priority'] ) && is_numeric( $transform['priority'] )
			? $transform['priority'] + 0
			: 10;
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

		$copy = $probe->children[0];

		if ( ! self::attributes_already_conform( $copy, $schema ) ) {
			return false;
		}

		$before = $copy->get_inner_html();

		self::apply_content_schema( $copy, $schema );

		return $before === $copy->get_inner_html();
	}

	/**
	 * Determines whether an element carries only attributes a schema names.
	 *
	 * The wrapper's attributes are part of what a block saves, so a schema that
	 * lists them is saying which ones the block can write back. One the block
	 * would drop is content the conversion would lose, the same as content the
	 * content schema does not allow.
	 *
	 * @param Gutenberg_HTML_Element $element Element to test.
	 * @param array                  $schema  Content schema.
	 * @return bool Whether the element's attributes are all named by the schema.
	 */
	private static function attributes_already_conform( $element, $schema ) {
		if ( ! isset( $schema[ $element->tag_name ] ) || ! is_array( $schema[ $element->tag_name ] ) ) {
			return true;
		}

		$entry   = $schema[ $element->tag_name ];
		$allowed = self::get_schema_attributes( $entry );

		$allowed_classes = isset( $entry['classes'] ) && is_array( $entry['classes'] )
			? array_values( array_filter( $entry['classes'], 'is_string' ) )
			: null;

		// `*` keeps every class, the same as not listing them at all.
		if ( null !== $allowed_classes && in_array( '*', $allowed_classes, true ) ) {
			$allowed_classes = null;
		}

		foreach ( array_keys( $element->attributes ) as $name ) {
			/*
			 * `id` is written back by the `anchor` support rather than by the
			 * block, so a schema does not have to name it. `class` works the
			 * same way through `customClassName` — unless the schema lists the
			 * classes the block reads meaning into, in which case a class
			 * outside that list is content the conversion would demote to a
			 * custom class, such as an alignment the editor's transform turns
			 * into an attribute.
			 */
			if ( 'id' === $name ) {
				continue;
			}

			if ( 'class' === $name ) {
				if ( null === $allowed_classes ) {
					continue;
				}

				foreach ( $element->get_class_names() as $class_name ) {
					if ( ! in_array( $class_name, $allowed_classes, true ) ) {
						return false;
					}
				}

				continue;
			}

			// A schema keeping every attribute with `*` has nothing to say
			// about this one; its `classes`, checked above, still bind.
			if ( null !== $allowed && ! in_array( $name, $allowed, true ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Determines whether a transform's callback may be called.
	 *
	 * See `Gutenberg_Block_Transforms::is_runnable_callback()` for what is
	 * refused and why.
	 *
	 * @param mixed $callback Value declared for `isMatch` or `transform`.
	 * @return bool Whether it may be called.
	 */
	private static function is_transform_callback( $callback ) {
		return Gutenberg_Block_Transforms::is_runnable_callback( $callback );
	}

	/**
	 * Returns every registered raw transform, ordered by priority.
	 *
	 * @return array[] Raw transforms, each carrying the `blockName` it belongs to.
	 */
	private static function get_raw_transforms() {
		return null === self::$raw_transforms
			? Gutenberg_Block_Transforms::get_declared_transforms( 'raw' )
			: self::$raw_transforms;
	}

	/**
	 * Replaces `<!--more-->` and `<!--nextpage-->` with elements blocks can match.
	 *
	 * The counterpart of `specialCommentConverter` in `@wordpress/blocks`. A
	 * marker has to reach the top level — only top-level elements become
	 * blocks — without reordering anything around it, so every container
	 * between the marker and the top is split where the marker stood, the way
	 * the editor splits a paragraph: `<div>a<!--more-->b</div>` becomes two
	 * halves of the division with the marker between them. Empty halves are
	 * dropped, as the editor drops a split paragraph's empty side, and a
	 * `<!--more-->` takes any following `<!--noteaser-->` with it.
	 *
	 * @param Gutenberg_HTML_Element $root Fragment root.
	 * @return void
	 */
	private static function convert_special_comments( $root ) {
		$root->children = self::convert_comments_splitting( $root );

		foreach ( $root->children as $child ) {
			$child->parent = $root;
		}
	}

	/**
	 * Converts the special comments among an element's children.
	 *
	 * Markers converted below a child element surface as that child's
	 * replacement nodes, so at this level every marker stands directly in the
	 * returned list.
	 *
	 * @param Gutenberg_HTML_Element $element Element whose children to convert.
	 * @return Gutenberg_HTML_Element[] Converted children, markers standing among them.
	 */
	private static function convert_comments_splitting( $element ) {
		$source   = $element->children;
		$consumed = array();
		$out      = array();

		foreach ( $source as $index => $child ) {
			if ( isset( $consumed[ $index ] ) ) {
				continue;
			}

			if ( Gutenberg_HTML_Element::COMMENT === $child->type ) {
				$marker = self::special_comment_element( $child, $source, $index, $consumed );

				$out[] = null === $marker ? $child : $marker;
				continue;
			}

			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type ) {
				$out[] = $child;
				continue;
			}

			foreach ( self::split_element_on_markers( $child ) as $node ) {
				$out[] = $node;
			}
		}

		return $out;
	}

	/**
	 * Splits an element around the markers converted inside it.
	 *
	 * @param Gutenberg_HTML_Element $element Element to convert and split.
	 * @return Gutenberg_HTML_Element[] The element itself when it holds no marker, otherwise its halves with the markers between them.
	 */
	private static function split_element_on_markers( $element ) {
		$children = self::convert_comments_splitting( $element );

		if ( 'p' === $element->tag_name ) {
			$element->children = $children;

			foreach ( $children as $child ) {
				$child->parent = $element;
			}

			return self::split_on_special_comments( $element );
		}

		$segments = array( array() );
		$markers  = array();

		foreach ( $children as $child ) {
			if ( self::is_marker_element( $child ) ) {
				$markers[]  = $child;
				$segments[] = array();
				continue;
			}

			$segments[ count( $segments ) - 1 ][] = $child;
		}

		if ( array() === $markers ) {
			$element->children = $children;

			foreach ( $children as $child ) {
				$child->parent = $element;
			}

			return array( $element );
		}

		$pieces = array();

		foreach ( $segments as $at => $segment ) {
			if ( array() !== $segment ) {
				$pieces[] = self::container_from( $element, $segment );
			}

			if ( isset( $markers[ $at ] ) ) {
				$pieces[] = $markers[ $at ];
			}
		}

		return $pieces;
	}

	/**
	 * Determines whether a node is the element standing in for a marker.
	 *
	 * @param Gutenberg_HTML_Element $node Node to test.
	 * @return bool Whether the node is a marker element.
	 */
	private static function is_marker_element( $node ) {
		return Gutenberg_HTML_Element::ELEMENT === $node->type
			&& 'wp-block' === $node->tag_name
			&& null !== $node->get_attribute( 'data-block' );
	}

	/**
	 * Builds one half of a split container.
	 *
	 * The half keeps the source container's own markup — its halves usually
	 * end up as Custom HTML, where the attributes are content — unlike a
	 * split paragraph, whose halves the editor builds bare.
	 *
	 * @param Gutenberg_HTML_Element   $element  Container being split.
	 * @param Gutenberg_HTML_Element[] $children Nodes the half holds.
	 * @return Gutenberg_HTML_Element Container holding those nodes.
	 */
	private static function container_from( $element, $children ) {
		$piece = Gutenberg_HTML_Element::create_element( $element->tag_name, $element->attributes );
		$piece->set_opening_tag( $element->get_opening_tag() );
		$piece->set_closing_tag( $element->get_closing_tag() );

		foreach ( $children as $child ) {
			$piece->append_child( $child );
		}

		return $piece;
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
		/*
		 * The text is compared as written, not trimmed: the editor's
		 * `specialCommentConverter` reads `nodeValue` verbatim, so
		 * `<!-- more -->` is a plain comment on both sides and
		 * `<!--morefoo-->` is a More block with custom text on both sides.
		 */
		$text = $comment->text;

		if ( 'nextpage' === $text ) {
			$attributes = array( 'data-block' => 'core/nextpage' );
			$markup     = '<!--nextpage-->';
		} elseif ( 0 === strpos( $text, 'more' ) ) {
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
					&& 'noteaser' === $sibling->text
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
					$pieces[] = self::paragraph_from( $run );
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
			$pieces[] = self::paragraph_from( $run );
		}

		return $pieces;
	}

	/**
	 * Builds one side of a split paragraph.
	 *
	 * The piece is a bare `<p>`, as the editor builds it with
	 * `createElement( 'p' )`: carrying the source paragraph's own opening tag
	 * would write its `id` onto every piece, leaving a duplicate DOM id in
	 * the post.
	 *
	 * @param Gutenberg_HTML_Element[] $children Nodes the piece holds.
	 * @return Gutenberg_HTML_Element Paragraph holding those nodes.
	 */
	private static function paragraph_from( $children ) {
		$piece = Gutenberg_HTML_Element::create_element( 'p' );

		foreach ( $children as $child ) {
			$piece->append_child( $child );
		}

		return $piece;
	}

	/**
	 * Wraps media in a figure so media blocks can match it, taking it out of a
	 * paragraph or division first where the editor would.
	 *
	 * The counterpart of `figureContentReducer` in `@wordpress/blocks`, which
	 * the editor runs over every node: media anywhere in the tree is
	 * considered, its nearest `p` or `div` ancestor decides whether it comes
	 * out, and an image alone inside an anchor travels with the anchor. Unlike
	 * the editor, the media is only wrapped when a registered transform claims
	 * the resulting figure, so markup no block converts keeps its shape.
	 *
	 * @param Gutenberg_HTML_Element $root               Fragment root.
	 * @param bool                   $until_first_marker Optional. Keep only the media no special comment precedes. Default false.
	 * @return void
	 */
	private static function wrap_figure_content( $root, $until_first_marker = false ) {
		$media = self::collect_figure_content( $root );

		if ( $until_first_marker ) {
			$media = self::media_before_any_marker( $root, $media );
		}

		foreach ( $media as $node ) {
			$target = $node;
			$parent = $node->parent;

			/*
			 * The Image block saves `figure > a > img`, so an image that is
			 * the whole of an anchor takes the anchor with it — the editor's
			 * `canHaveAnchor()` case, which counts every child node the way
			 * `childNodes` does.
			 */
			if (
				'img' === $node->tag_name
				&& $parent instanceof Gutenberg_HTML_Element
				&& Gutenberg_HTML_Element::ELEMENT === $parent->type
				&& 'a' === $parent->tag_name
				&& 1 === count( $parent->children )
			) {
				$target = $parent;
			}

			$wrapper = self::closest_paragraph_or_division( $target, $root );

			if ( null !== $wrapper ) {
				$aligned = array_intersect(
					$node->get_class_names(),
					array( 'alignleft', 'aligncenter', 'alignright' )
				);

				// Media reading as part of a sentence stays in the sentence:
				// it only comes out when it is aligned, or when the wrapper
				// holds no text of its own.
				if ( array() === $aligned && ! self::is_blank_text( $wrapper->get_text_content() ) ) {
					continue;
				}
			}

			self::promote_to_figure( $target, $wrapper );
		}
	}

	/**
	 * Collects the media elements below a node, in document order.
	 *
	 * Media already inside a `figure` stays with it, so those subtrees are not
	 * searched, and media is not searched for more media inside itself.
	 *
	 * @param Gutenberg_HTML_Element $node Node to search below.
	 * @return Gutenberg_HTML_Element[] Media elements.
	 */
	private static function collect_figure_content( $node ) {
		$media = array();

		foreach ( $node->children as $child ) {
			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type || 'figure' === $child->tag_name ) {
				continue;
			}

			if ( in_array( $child->tag_name, self::FIGURE_CONTENT, true ) ) {
				$media[] = $child;
				continue;
			}

			$media = array_merge( $media, self::collect_figure_content( $child ) );
		}

		return $media;
	}

	/**
	 * Keeps the media elements no special comment precedes in document order.
	 *
	 * The editor visits both in one pass, so a marker only rearranges what
	 * comes after it.
	 *
	 * @param Gutenberg_HTML_Element   $root  Fragment root.
	 * @param Gutenberg_HTML_Element[] $media Collected media elements.
	 * @return Gutenberg_HTML_Element[] The media standing before every marker.
	 */
	private static function media_before_any_marker( $root, $media ) {
		$kept = array();
		$seen = false;

		self::walk_media_and_markers( $root, $media, $seen, $kept );

		return $kept;
	}

	/**
	 * Walks the tree in document order, keeping media until a marker is seen.
	 *
	 * @param Gutenberg_HTML_Element   $node  Node whose children to walk.
	 * @param Gutenberg_HTML_Element[] $media Collected media elements.
	 * @param bool                     $seen  Whether a special comment was passed.
	 * @param Gutenberg_HTML_Element[] $kept  Media collected so far.
	 * @return void
	 */
	private static function walk_media_and_markers( $node, $media, &$seen, &$kept ) {
		foreach ( $node->children as $child ) {
			if (
				Gutenberg_HTML_Element::COMMENT === $child->type
				&& ( 'nextpage' === $child->text || 0 === strpos( $child->text, 'more' ) )
			) {
				$seen = true;
				continue;
			}

			if ( Gutenberg_HTML_Element::ELEMENT !== $child->type ) {
				continue;
			}

			if ( ! $seen && in_array( $child, $media, true ) ) {
				$kept[] = $child;
			}

			self::walk_media_and_markers( $child, $media, $seen, $kept );
		}
	}

	/**
	 * Returns the nearest `p` or `div` ancestor, or null.
	 *
	 * The counterpart of the editor's `closest( 'p,div' )` call.
	 *
	 * @param Gutenberg_HTML_Element $node Node whose ancestors to walk.
	 * @param Gutenberg_HTML_Element $root Fragment root, which is not an element of the document.
	 * @return Gutenberg_HTML_Element|null Wrapping paragraph or division, or null.
	 */
	private static function closest_paragraph_or_division( $node, $root ) {
		for ( $ancestor = $node->parent; null !== $ancestor && $root !== $ancestor; $ancestor = $ancestor->parent ) {
			if (
				Gutenberg_HTML_Element::ELEMENT === $ancestor->type
				&& in_array( $ancestor->tag_name, array( 'p', 'div' ), true )
			) {
				return $ancestor;
			}
		}

		return null;
	}

	/**
	 * Wraps media in a figure and moves it before its wrapper, when a
	 * registered transform claims the result.
	 *
	 * The figure is built and matched once: kept when a transform claims it,
	 * unwound without having touched the tree when none does.
	 *
	 * @param Gutenberg_HTML_Element      $target  Media, or the anchor holding it.
	 * @param Gutenberg_HTML_Element|null $wrapper Paragraph or division to move it out of, or null to wrap the media where it stands.
	 * @return void
	 */
	private static function promote_to_figure( $target, $wrapper ) {
		$source      = $target->parent;
		$destination = null === $wrapper ? $source : $wrapper->parent;

		if ( null === $source || null === $destination ) {
			return;
		}

		$figure             = Gutenberg_HTML_Element::create_element( 'figure' );
		$figure->children[] = $target;
		$figure->parent     = $destination;
		$target->parent     = $figure;

		if ( null === self::find_transform( $figure ) ) {
			// Unclaimed: the tree was never changed, so only the probe's own
			// parent pointer needs unwinding.
			$target->parent = $source;

			return;
		}

		// Detach the media from where it stood.
		$position = null;

		foreach ( $source->children as $index => $child ) {
			if ( $child === $target ) {
				array_splice( $source->children, $index, 1 );
				$position = $index;
				break;
			}
		}

		if ( null === $position ) {
			$target->parent = $source;

			return;
		}

		// With no wrapper the figure stands where the media stood; with one it
		// goes immediately before the wrapper, as the editor inserts it.
		if ( null === $wrapper ) {
			array_splice( $source->children, $position, 0, array( $figure ) );

			return;
		}

		foreach ( $destination->children as $index => $child ) {
			if ( $child === $wrapper ) {
				array_splice( $destination->children, $index, 0, array( $figure ) );

				return;
			}
		}

		$destination->children[] = $figure;
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
				if ( self::is_blank_text( $child->text ) ) {
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
	 * Determines whether text reads as blank.
	 *
	 * The same characters the editor's `isEmpty()` treats as blank —
	 * JavaScript's `trim()` strips the no-break space, PHP's does not, and a
	 * stray `&nbsp;` between blocks is everywhere in classic content.
	 *
	 * @param string $text Text to test.
	 * @return bool Whether the text is blank.
	 */
	private static function is_blank_text( $text ) {
		return 1 === preg_match( '/^[ \f\n\r\t\v\x{00A0}]*+$/u', $text );
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
