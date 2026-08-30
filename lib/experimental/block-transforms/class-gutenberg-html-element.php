<?php
/**
 * Minimal element tree and CSS selector matching on top of the HTML API.
 *
 * @package gutenberg
 */

/**
 * A single node in a parsed HTML fragment.
 *
 * The HTML API is a streaming parser. Raw block transforms and block attribute
 * sources both need random access to an element's ancestors, descendants and
 * serialized markup, so this class collects the token stream into a tree.
 *
 * Markup is preserved by storing the HTML API's own normative serialization of
 * each token, so round-tripping a fragment through the tree does not depend on
 * a separate serializer.
 *
 * @access private
 */
class Gutenberg_HTML_Element {
	const ELEMENT = 'element';
	const TEXT    = 'text';
	const COMMENT = 'comment';
	const OTHER   = 'other';

	/**
	 * Node type. One of the class constants.
	 *
	 * @var string
	 */
	public $type = self::ELEMENT;

	/**
	 * Lowercase tag name, or null for non-element nodes.
	 *
	 * @var string|null
	 */
	public $tag_name = null;

	/**
	 * Attributes, keyed by lowercase name. Boolean attributes hold `true`.
	 *
	 * @var array<string, string|true>
	 */
	public $attributes = array();

	/**
	 * Child nodes.
	 *
	 * @var Gutenberg_HTML_Element[]
	 */
	public $children = array();

	/**
	 * Parent node, or null for the fragment root.
	 *
	 * @var Gutenberg_HTML_Element|null
	 */
	public $parent = null;

	/**
	 * Plain text of a text node, or comment text of a comment node.
	 *
	 * @var string
	 */
	public $text = '';

	/**
	 * Serialization of this node's opening tag, or of the whole node for
	 * non-element nodes.
	 *
	 * @var string
	 */
	private $opening_html = '';

	/**
	 * Serialization of this node's closing tag, empty for void elements.
	 *
	 * @var string
	 */
	private $closing_html = '';

	/**
	 * Parsed selector cache, keyed by selector string.
	 *
	 * @var array<string, array>
	 */
	private static $selector_cache = array();

	/**
	 * Parses an HTML fragment into a tree.
	 *
	 * @param string $html HTML to parse.
	 * @return Gutenberg_HTML_Element|null Fragment root, or null if the HTML could not be parsed.
	 */
	public static function from_html( $html ) {
		$processor = WP_HTML_Processor::create_fragment( (string) $html );

		if ( null === $processor ) {
			return null;
		}

		$root       = new self();
		$root->type = self::OTHER;
		$stack      = array( $root );

		while ( $processor->next_token() ) {
			$token_type = $processor->get_token_type();
			$parent     = $stack[ count( $stack ) - 1 ];

			if ( '#tag' === $token_type ) {
				if ( $processor->is_tag_closer() ) {
					$tag_name = strtolower( $processor->get_tag() );

					for ( $i = count( $stack ) - 1; $i > 0; $i-- ) {
						if ( $stack[ $i ]->tag_name === $tag_name ) {
							array_splice( $stack, $i );
							break;
						}
					}

					continue;
				}

				$node               = new self();
				$node->type         = self::ELEMENT;
				$node->tag_name     = strtolower( $processor->get_tag() );
				$node->opening_html = $processor->serialize_token();

				$attribute_names = $processor->get_attribute_names_with_prefix( '' );
				if ( null !== $attribute_names ) {
					foreach ( $attribute_names as $attribute_name ) {
						$node->attributes[ strtolower( $attribute_name ) ] = $processor->get_attribute( $attribute_name );
					}
				}

				$node->parent       = $parent;
				$parent->children[] = $node;

				if ( $processor->expects_closer() ) {
					$node->closing_html = '</' . $node->tag_name . '>';
					$stack[]            = $node;
				}

				continue;
			}

			$node         = new self();
			$node->parent = $parent;

			if ( '#text' === $token_type ) {
				$node->type = self::TEXT;
				$node->text = $processor->get_modifiable_text();
			} elseif ( '#comment' === $token_type ) {
				$node->type = self::COMMENT;
				$node->text = (string) $processor->get_full_comment_text();
			} else {
				$node->type = self::OTHER;
			}

			$node->opening_html = $processor->serialize_token();
			$parent->children[] = $node;
		}

		if ( null !== $processor->get_last_error() ) {
			return null;
		}

		return $root;
	}

	/**
	 * Creates a detached element node.
	 *
	 * @param string $tag_name   Tag name.
	 * @param array  $attributes Optional. Attributes keyed by name.
	 * @return Gutenberg_HTML_Element The new node.
	 */
	public static function create_element( $tag_name, $attributes = array() ) {
		$node           = new self();
		$node->type     = self::ELEMENT;
		$node->tag_name = strtolower( $tag_name );

		$markup = '<' . $node->tag_name;
		foreach ( $attributes as $name => $value ) {
			$name                      = strtolower( $name );
			$node->attributes[ $name ] = $value;
			$markup                   .= true === $value
				? ' ' . $name
				: ' ' . $name . '="' . esc_attr( $value ) . '"';
		}

		$node->opening_html = $markup . '>';
		$node->closing_html = '</' . $node->tag_name . '>';

		return $node;
	}

	/**
	 * Returns the element children of this node, skipping text and comments.
	 *
	 * @return Gutenberg_HTML_Element[] Element children.
	 */
	public function child_elements() {
		$elements = array();

		foreach ( $this->children as $child ) {
			if ( self::ELEMENT === $child->type ) {
				$elements[] = $child;
			}
		}

		return $elements;
	}

	/**
	 * Returns an attribute value.
	 *
	 * @param string $name Attribute name.
	 * @return string|true|null Attribute value, `true` for boolean attributes, or null when absent.
	 */
	public function get_attribute( $name ) {
		$name = strtolower( $name );

		return array_key_exists( $name, $this->attributes ) ? $this->attributes[ $name ] : null;
	}

	/**
	 * Returns the class names on this node.
	 *
	 * @return string[] Class names.
	 */
	public function get_class_names() {
		$class = $this->get_attribute( 'class' );

		if ( ! is_string( $class ) || '' === trim( $class ) ) {
			return array();
		}

		return preg_split( '/\s+/', trim( $class ) );
	}

	/**
	 * Returns this node's markup, including its own tags.
	 *
	 * @return string Outer HTML.
	 */
	public function get_outer_html() {
		if ( self::ELEMENT !== $this->type ) {
			return $this->opening_html;
		}

		return $this->opening_html . $this->get_inner_html() . $this->closing_html;
	}

	/**
	 * Returns this node's opening tag markup.
	 *
	 * @return string Opening tag, or the whole node for non-element nodes.
	 */
	public function get_opening_tag() {
		return $this->opening_html;
	}

	/**
	 * Returns this node's closing tag markup.
	 *
	 * @return string Closing tag, or an empty string for void and non-element nodes.
	 */
	public function get_closing_tag() {
		return $this->closing_html;
	}

	/**
	 * Replaces this node's opening tag markup.
	 *
	 * @param string $html Opening tag markup.
	 * @return void
	 */
	public function set_opening_tag( $html ) {
		$this->opening_html = $html;
	}

	/**
	 * Replaces this node's closing tag markup.
	 *
	 * @param string $html Closing tag markup.
	 * @return void
	 */
	public function set_closing_tag( $html ) {
		$this->closing_html = $html;
	}

	/**
	 * Returns the markup of this node's children.
	 *
	 * @return string Inner HTML.
	 */
	public function get_inner_html() {
		$html = '';

		foreach ( $this->children as $child ) {
			$html .= $child->get_outer_html();
		}

		return $html;
	}

	/**
	 * Returns the concatenated text of this node and its descendants.
	 *
	 * @return string Text content.
	 */
	public function get_text_content() {
		if ( self::TEXT === $this->type ) {
			return $this->text;
		}

		$text = '';

		foreach ( $this->children as $child ) {
			$text .= $child->get_text_content();
		}

		return $text;
	}

	/**
	 * Determines whether this node has no content beyond whitespace.
	 *
	 * @return bool Whether the node is empty.
	 */
	public function is_empty() {
		if ( self::COMMENT === $this->type ) {
			return false;
		}

		if ( self::ELEMENT === $this->type && array() !== $this->child_elements() ) {
			return false;
		}

		return '' === trim( $this->get_text_content() );
	}

	/**
	 * Removes this node from its parent.
	 *
	 * @return void
	 */
	public function remove() {
		if ( null === $this->parent ) {
			return;
		}

		foreach ( $this->parent->children as $index => $child ) {
			if ( $child === $this ) {
				array_splice( $this->parent->children, $index, 1 );
				break;
			}
		}

		$this->parent = null;
	}

	/**
	 * Appends a node as the last child of this node.
	 *
	 * @param Gutenberg_HTML_Element $node Node to append.
	 * @return void
	 */
	public function append_child( $node ) {
		$node->remove();
		$node->parent     = $this;
		$this->children[] = $node;
	}

	/**
	 * Replaces this node with its children.
	 *
	 * @return void
	 */
	public function unwrap() {
		if ( null === $this->parent ) {
			return;
		}

		foreach ( $this->parent->children as $index => $child ) {
			if ( $child !== $this ) {
				continue;
			}

			foreach ( $this->children as $grandchild ) {
				$grandchild->parent = $this->parent;
			}

			array_splice( $this->parent->children, $index, 1, $this->children );
			break;
		}

		$this->children = array();
		$this->parent   = null;
	}

	/**
	 * Removes every attribute except the named ones.
	 *
	 * The dropped attributes are removed from the original opening tag rather
	 * than the kept ones written into a new one: `set_attribute()` re-escapes
	 * every value it writes — rejecting a URI whose escaping comes back empty,
	 * such as a `data:` URL, and re-encoding entities — so a kept attribute
	 * would not survive byte for byte.
	 *
	 * @param string[] $names Attribute names to keep.
	 * @return void
	 */
	public function keep_attributes( $names ) {
		if ( self::ELEMENT !== $this->type ) {
			return;
		}

		$names = array_map( 'strtolower', $names );
		$kept  = array();

		foreach ( $this->attributes as $name => $value ) {
			if ( in_array( $name, $names, true ) ) {
				$kept[ $name ] = $value;
			}
		}

		if ( count( $kept ) === count( $this->attributes ) ) {
			return;
		}

		$processor = new WP_HTML_Tag_Processor( $this->opening_html );

		if ( ! $processor->next_tag() ) {
			return;
		}

		foreach ( array_keys( $this->attributes ) as $name ) {
			if ( ! isset( $kept[ $name ] ) ) {
				$processor->remove_attribute( $name );
			}
		}

		/*
		 * `remove_attribute()` leaves the whitespace that stood around the
		 * attribute. A gap before the closing bracket is trimmed so a tag
		 * whose last attribute was removed still reads as it would have been
		 * written; a quoted value cannot be touched, because its closing
		 * quote stands between it and the bracket.
		 */
		$this->opening_html = preg_replace( '/\s+(\/?>)$/', '$1', $processor->get_updated_html() );
		$this->attributes   = $kept;
	}

	/**
	 * Determines whether this node matches a selector list.
	 *
	 * @param string $selector Selector list.
	 * @return bool Whether the node matches.
	 */
	public function matches( $selector ) {
		if ( self::ELEMENT !== $this->type ) {
			return false;
		}

		$selector_list = self::parse_selector_list( $selector );

		if ( null === $selector_list ) {
			return false;
		}

		foreach ( $selector_list as $complex ) {
			if ( $this->matches_complex_selector( $complex ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the first descendant matching a selector list.
	 *
	 * @param string $selector Selector list.
	 * @return Gutenberg_HTML_Element|null Matching node, or null.
	 */
	public function query_selector( $selector ) {
		foreach ( $this->children as $child ) {
			if ( self::ELEMENT !== $child->type ) {
				continue;
			}

			if ( $child->matches( $selector ) ) {
				return $child;
			}

			$match = $child->query_selector( $selector );
			if ( null !== $match ) {
				return $match;
			}
		}

		return null;
	}

	/**
	 * Returns every descendant matching a selector list, in document order.
	 *
	 * @param string $selector Selector list.
	 * @return Gutenberg_HTML_Element[] Matching nodes.
	 */
	public function query_selector_all( $selector ) {
		$matches = array();

		$this->collect_matches( $selector, $matches );

		return $matches;
	}

	/**
	 * Appends every matching descendant to a list, in document order.
	 *
	 * The list is passed down rather than merged back up, so that a deep tree
	 * costs one append per match rather than one array copy per level.
	 *
	 * @param string                   $selector Selector list.
	 * @param Gutenberg_HTML_Element[] $matches  List to append to.
	 * @return void
	 */
	private function collect_matches( $selector, &$matches ) {
		foreach ( $this->children as $child ) {
			if ( self::ELEMENT !== $child->type ) {
				continue;
			}

			if ( $child->matches( $selector ) ) {
				$matches[] = $child;
			}

			$child->collect_matches( $selector, $matches );
		}
	}

	/**
	 * Returns this node if it matches, otherwise the first matching descendant.
	 *
	 * Block attribute sources are evaluated against a block's outer markup, so a
	 * selector such as `p` must be able to match the element the markup starts
	 * with, mirroring how the editor queries against a wrapping container.
	 *
	 * @param string $selector Selector list.
	 * @return Gutenberg_HTML_Element|null Matching node, or null.
	 */
	public function closest_self_or_descendant( $selector ) {
		return $this->matches( $selector ) ? $this : $this->query_selector( $selector );
	}

	/**
	 * Determines whether this node matches a parsed complex selector.
	 *
	 * @param array $complex Parsed complex selector, in source order.
	 * @return bool Whether the node matches.
	 */
	private function matches_complex_selector( $complex ) {
		$last = count( $complex ) - 1;

		if ( $last < 0 ) {
			return false;
		}

		if ( ! $this->matches_compound_selector( $complex[ $last ]['compound'] ) ) {
			return false;
		}

		return $this->matches_ancestors( $complex, $last - 1, $complex[ $last ]['combinator'] );
	}

	/**
	 * Walks up the tree matching the remaining parts of a complex selector.
	 *
	 * @param array       $complex    Parsed complex selector, in source order.
	 * @param int         $index      Index of the part to match next.
	 * @param string|null $combinator Combinator joining that part to the one already matched.
	 * @return bool Whether the ancestors match.
	 */
	private function matches_ancestors( $complex, $index, $combinator ) {
		if ( $index < 0 ) {
			return true;
		}

		$compound = $complex[ $index ]['compound'];

		if ( '>' === $combinator ) {
			if ( null === $this->parent || ! $this->parent->matches_compound_selector( $compound ) ) {
				return false;
			}

			return $this->parent->matches_ancestors( $complex, $index - 1, $complex[ $index ]['combinator'] );
		}

		for ( $ancestor = $this->parent; null !== $ancestor; $ancestor = $ancestor->parent ) {
			if (
				$ancestor->matches_compound_selector( $compound ) &&
				$ancestor->matches_ancestors( $complex, $index - 1, $complex[ $index ]['combinator'] )
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Determines whether this node matches a parsed compound selector.
	 *
	 * @param array $compound Parsed compound selector.
	 * @return bool Whether the node matches.
	 */
	private function matches_compound_selector( $compound ) {
		if ( self::ELEMENT !== $this->type ) {
			return false;
		}

		if ( null !== $compound['tag'] && $compound['tag'] !== $this->tag_name ) {
			return false;
		}

		foreach ( $compound['classes'] as $class_name ) {
			if ( ! in_array( $class_name, $this->get_class_names(), true ) ) {
				return false;
			}
		}

		if ( null !== $compound['id'] && $compound['id'] !== $this->get_attribute( 'id' ) ) {
			return false;
		}

		foreach ( $compound['attributes'] as $attribute ) {
			$value = $this->get_attribute( $attribute['name'] );

			if ( null === $value ) {
				return false;
			}

			if ( null === $attribute['value'] ) {
				continue;
			}

			// A valueless attribute has the empty string for its DOM value,
			// which is what a selector compares against.
			$actual   = true === $value ? '' : $value;
			$expected = $attribute['value'];

			switch ( $attribute['operator'] ) {
				case '~=':
					$tokens = '' === trim( $actual ) ? array() : preg_split( '/\s+/', trim( $actual ) );

					if ( ! in_array( $expected, $tokens, true ) ) {
						return false;
					}
					break;

				case '^=':
					if ( '' === $expected || 0 !== strpos( $actual, $expected ) ) {
						return false;
					}
					break;

				case '$=':
					if ( '' === $expected || substr( $actual, -strlen( $expected ) ) !== $expected ) {
						return false;
					}
					break;

				case '*=':
					if ( '' === $expected || false === strpos( $actual, $expected ) ) {
						return false;
					}
					break;

				case '|=':
					if ( $expected !== $actual && 0 !== strpos( $actual, $expected . '-' ) ) {
						return false;
					}
					break;

				default:
					if ( $expected !== $actual ) {
						return false;
					}
			}
		}

		foreach ( $compound['has'] as $selector ) {
			if ( ! $this->has_matching_descendant( $selector ) ) {
				return false;
			}
		}

		if ( in_array( 'only-child', $compound['pseudo'], true ) && ! $this->is_only_child() ) {
			return false;
		}

		foreach ( $compound['not'] as $selector ) {
			if ( '' !== $selector['scope'] ) {
				if ( $this->has_matching_descendant( $selector ) ) {
					return false;
				}
				continue;
			}

			if ( $this->matches( $selector['selector'] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Determines whether this element is its parent's only child element.
	 *
	 * @return bool Whether the element has no element siblings.
	 */
	private function is_only_child() {
		if ( ! $this->parent instanceof self ) {
			return false;
		}

		return array( $this ) === $this->parent->child_elements();
	}

	/**
	 * Determines whether a `:has()` argument matches anything below this node.
	 *
	 * @param array $selector Parsed relative selector with `scope` and `selector` keys.
	 * @return bool Whether a descendant matches.
	 */
	private function has_matching_descendant( $selector ) {
		if ( '>' === $selector['scope'] ) {
			foreach ( $this->child_elements() as $child ) {
				if ( $child->matches( $selector['selector'] ) ) {
					return true;
				}
			}

			return false;
		}

		return null !== $this->query_selector( $selector['selector'] );
	}

	/**
	 * Parses a selector list into complex selectors.
	 *
	 * Supports the subset of CSS needed by block attribute sources and raw block
	 * transforms: type, universal, class, ID and attribute selectors — presence
	 * and the `=`, `~=`, `^=`, `$=`, `*=` and `|=` operators — the descendant
	 * and child combinators, and the `:has()`, `:not()` and `:only-child`
	 * pseudo-classes.
	 *
	 * A selector list that uses anything outside that subset is rejected whole, so
	 * it matches nothing rather than silently matching more than it names.
	 *
	 * @param string $selector Selector list.
	 * @return array[]|null Parsed complex selectors, or null when unsupported.
	 */
	private static function parse_selector_list( $selector ) {
		if ( array_key_exists( $selector, self::$selector_cache ) ) {
			return self::$selector_cache[ $selector ];
		}

		$parsed = array();

		foreach ( self::split_selector_list( $selector ) as $complex_selector ) {
			$complex = self::parse_complex_selector( $complex_selector );

			if ( null === $complex ) {
				$parsed = null;
				break;
			}

			$parsed[] = $complex;
		}

		if ( null === $parsed || array() === $parsed ) {
			$parsed = null;
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: CSS selector, for example "p:first-child". */
					__( 'The "%s" selector uses CSS that is not supported on the server, so it matches nothing.', 'gutenberg' ),
					$selector
				),
				'23.9.0'
			);
		}

		self::$selector_cache[ $selector ] = $parsed;

		return $parsed;
	}

	/**
	 * Splits a selector list on top level commas.
	 *
	 * @param string $selector Selector list.
	 * @return string[] Individual selectors.
	 */
	private static function split_selector_list( $selector ) {
		$selectors = array();
		$depth     = 0;
		$current   = '';

		for ( $at = 0; $at < strlen( $selector ); $at++ ) {
			$character = $selector[ $at ];

			if ( '(' === $character || '[' === $character ) {
				++$depth;
			} elseif ( ')' === $character || ']' === $character ) {
				--$depth;
			} elseif ( ',' === $character && 0 === $depth ) {
				$selectors[] = trim( $current );
				$current     = '';
				continue;
			}

			$current .= $character;
		}

		$selectors[] = trim( $current );

		return array_values( array_filter( $selectors, 'strlen' ) );
	}

	/**
	 * Parses a single complex selector into compound selectors and combinators.
	 *
	 * @param string $selector Complex selector.
	 * @return array[]|null Parts, each with `combinator` and `compound` keys, or null when unsupported.
	 */
	private static function parse_complex_selector( $selector ) {
		$parts      = array();
		$combinator = null;
		$depth      = 0;
		$current    = '';

		$rejected = false;

		$flush = function () use ( &$parts, &$current, &$combinator, &$rejected ) {
			if ( '' === $current ) {
				return;
			}

			$compound = self::parse_compound_selector( $current );

			if ( null === $compound ) {
				$rejected = true;
			}

			$parts[]    = array(
				'combinator' => $combinator,
				'compound'   => $compound,
			);
			$current    = '';
			$combinator = null;
		};

		for ( $at = 0; $at < strlen( $selector ); $at++ ) {
			$character = $selector[ $at ];

			if ( '(' === $character || '[' === $character ) {
				++$depth;
			} elseif ( ')' === $character || ']' === $character ) {
				--$depth;
			}

			if ( 0 === $depth && ( ' ' === $character || "\t" === $character || "\n" === $character ) ) {
				$flush();
				if ( null === $combinator ) {
					$combinator = ' ';
				}
				continue;
			}

			if ( 0 === $depth && '>' === $character ) {
				$flush();
				$combinator = '>';
				continue;
			}

			$current .= $character;
		}

		$flush();

		if ( $rejected || array() === $parts ) {
			return null;
		}

		$parts[0]['combinator'] = null;

		return $parts;
	}

	/**
	 * Parses a compound selector.
	 *
	 * @param string $selector Compound selector.
	 * @return array|null Parsed compound selector, or null when it uses unsupported syntax.
	 */
	private static function parse_compound_selector( $selector ) {
		$compound = array(
			'tag'        => null,
			'id'         => null,
			'classes'    => array(),
			'attributes' => array(),
			'has'        => array(),
			'not'        => array(),
			'pseudo'     => array(),
		);

		$at = 0;

		if ( preg_match( '/^(\*|[a-zA-Z][a-zA-Z0-9-]*)/', $selector, $matches ) ) {
			if ( '*' !== $matches[1] ) {
				$compound['tag'] = strtolower( $matches[1] );
			}
			$at = strlen( $matches[0] );
		}

		while ( $at < strlen( $selector ) ) {
			$character = $selector[ $at ];

			if ( '.' === $character || '#' === $character ) {
				if ( ! preg_match( '/^[.#]([^.#\[:]+)/', substr( $selector, $at ), $matches ) ) {
					return null;
				}

				if ( '.' === $character ) {
					$compound['classes'][] = $matches[1];
				} else {
					$compound['id'] = $matches[1];
				}

				$at += strlen( $matches[0] );
				continue;
			}

			if ( '[' === $character ) {
				$end = strpos( $selector, ']', $at );
				if ( false === $end ) {
					return null;
				}

				$attribute = self::parse_attribute_selector( substr( $selector, $at + 1, $end - $at - 1 ) );
				if ( null === $attribute ) {
					return null;
				}

				$compound['attributes'][] = $attribute;
				$at                       = $end + 1;
				continue;
			}

			if ( ':' === $character ) {
				if ( preg_match( '/^:only-child/', substr( $selector, $at ), $matches ) ) {
					$compound['pseudo'][] = 'only-child';
					$at                  += strlen( $matches[0] );
					continue;
				}

				if ( ! preg_match( '/^:(has|not)\(/', substr( $selector, $at ), $matches ) ) {
					return null;
				}

				$open  = $at + strlen( $matches[0] ) - 1;
				$close = self::find_closing_parenthesis( $selector, $open );
				if ( null === $close ) {
					return null;
				}

				$argument = trim( substr( $selector, $open + 1, $close - $open - 1 ) );
				$scope    = '';

				if ( 0 === strpos( $argument, '>' ) ) {
					$scope    = '>';
					$argument = trim( substr( $argument, 1 ) );
				}

				$compound[ $matches[1] ][] = array(
					'scope'    => $scope,
					'selector' => $argument,
				);

				$at = $close + 1;
				continue;
			}

			return null;
		}

		return $compound;
	}

	/**
	 * Parses the contents of an attribute selector.
	 *
	 * @param string $selector Attribute selector without the enclosing brackets.
	 * @return array|null Parsed attribute selector, or null when it uses an unsupported operator.
	 */
	private static function parse_attribute_selector( $selector ) {
		if ( ! preg_match( '/^\s*([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*(?:([~^$*|]?=)(.*))?$/', $selector, $matches ) ) {
			return null;
		}

		if ( ! isset( $matches[2] ) || '' === $matches[2] ) {
			return array(
				'name'     => strtolower( $matches[1] ),
				'operator' => null,
				'value'    => null,
			);
		}

		$value = trim( $matches[3] );

		/*
		 * A case-sensitivity flag is not supported. Rejecting the selector
		 * makes it match nothing with a notice; parsing the flag into the
		 * value would make it match nothing silently. A quoted value always
		 * ends in its quote, so a trailing whitespace-separated `i` or `s`
		 * can only be a flag.
		 */
		if ( preg_match( '/\s[iIsS]$/', $value ) ) {
			return null;
		}

		if ( strlen( $value ) > 1 ) {
			$first = $value[0];
			$last  = $value[ strlen( $value ) - 1 ];
			if ( ( '"' === $first || "'" === $first ) && $first === $last ) {
				$value = substr( $value, 1, -1 );
			}
		}

		return array(
			'name'     => strtolower( $matches[1] ),
			'operator' => $matches[2],
			'value'    => $value,
		);
	}

	/**
	 * Finds the parenthesis closing the one at the given offset.
	 *
	 * @param string $selector Selector text.
	 * @param int    $open     Offset of the opening parenthesis.
	 * @return int|null Offset of the closing parenthesis, or null if unbalanced.
	 */
	private static function find_closing_parenthesis( $selector, $open ) {
		$depth = 0;

		for ( $at = $open; $at < strlen( $selector ); $at++ ) {
			if ( '(' === $selector[ $at ] ) {
				++$depth;
			} elseif ( ')' === $selector[ $at ] ) {
				--$depth;
				if ( 0 === $depth ) {
					return $at;
				}
			}
		}

		return null;
	}
}
