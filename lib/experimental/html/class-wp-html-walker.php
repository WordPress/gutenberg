<?php
/**
 * Scans through an HTML document to find specific tags, then
 * transforms those tags by adding, removing, or updating the
 * values of the HTML attributes within that tag (opener).
 *
 * Does not fully parse HTML or _recurse_ into the HTML structure
 * Instead this scans linearly through a document and only parses
 * the HTML tag openers.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.1.0
 */
function esc_attr($x) {
	return htmlspecialchars($x);
}
/**
 * Processes an input HTML document by applying a specified set
 * of patches to that input. Tokenizes HTML but does not fully
 * parse the input document.
 *
 * @since 6.1.0
 */
class WP_HTML_Walker {

	/**
	 * The HTML document to parse.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	private $html;

	/**
	 * The updated HTML document.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	private $updated_html = '';

	/**
	 * How many bytes from the original HTML document were already read.
	 *
	 * @since 6.1.0
	 * @var int
	 */
	private $parsed_bytes = 0;

	/**
	 * How many bytes from the original HTML document were already treated
	 * with the requested replacements.
	 *
	 * @since 6.1.0
	 * @var int
	 */
	private $updated_bytes = 0;

	/**
	 * Whether the parsing is already finished.
	 *
	 * @since 6.1.0
	 * @var bool
	 */
	private $closed = false;

	/**
	 * The name of the currently matched tag.
	 *
	 * @since 6.1.0
	 * @var string|null
	 */
	private $tag_name;

	/**
	 * Byte offset after the name of current tag.
	 * Example:
	 *   <div
	 *   01234
	 *       ^ tag_name_ends_at = 4
	 *
	 * @since 6.1.0
	 * @var number
	 */
	private $tag_name_ends_at;

	/**
	 * Lazily-built index of attributes found within an HTML tag, keyed by the attribute name.
	 *
	 * Example:
	 * <code>
	 *     // supposing the parser is working through this content
	 *     // and stops after recognizing the `id` attribute
	 *     // <div id="test-4" class=outline title="data:text/plain;base64=asdk3nk1j3fo8">
	 *     //                 ^ parsing will continue from this point
	 *     $this->attributes = array(
	 *         'id' => new WP_HTML_Attribute_Match( 'id', null, 6, 17 )
	 *     );
	 *
	 *     // when picking up parsing again, or when asking to find the
	 *     // `class` attribute we will continue and add to this array
	 *     $this->attributes = array(
	 *         'id' => new WP_HTML_Attribute_Match( 'id', null, 6, 17 ),
	 *         'class' => new WP_HTML_Attribute_Match( 'class', 'outline', 18, 32 )
	 *     );
	 *
	 *     // Note that only the `class` attribute value is stored in the index.
	 *     // That's because it is the only value used by this class at the moment.
	 * </code>
	 *
	 * @since 6.1.0
	 * @var WP_HTML_Attribute_Token[]
	 */
	private $attributes = array();

	/**
	 * Which class names to add or remove from a tag.
	 *
	 * These are tracked separately from attribute updates because they are
	 * semantically distinct, whereas this interface exists for the common
	 * case of adding and removing class names while other attributes are
	 * generally modified as with DOM `setAttribute` calls.
	 *
	 * When modifying an HTML document these will eventually be collapsed
	 * into a single lexical update to replace the `class` attribute.
	 *
	 * Example:
	 * <code>
	 *     // Add the `WP-block-group` class, remove the `WP-group` class.
	 *     $class_changes = array(
	 *         // Indexed by a comparable class name
	 *         'wp-block-group' => new WP_Class_Name_Operation( 'WP-block-group', WP_Class_Name_Operation::ADD ),
	 *         'wp-group'       => new WP_Class_Name_Operation( 'WP-group', WP_Class_Name_Operation::REMOVE )
	 *     );
	 * </code>
	 *
	 * @since 6.1.0
	 * @var bool[]
	 */
	private $classname_updates = array();

	const ADD_CLASS = true;
	const REMOVE_CLASS = false;

	/**
	 * Lexical replacements to apply to input HTML document.
	 *
	 * HTML modifications collapse into lexical replacements in order to
	 * provide an efficient mechanism to update documents lazily and in
	 * order to support a variety of semantic modifications without
	 * building a complicated parsing machinery. That is, it's up to
	 * the calling class to generate the lexical modification from the
	 * semantic change requested.
	 *
	 * Example:
	 * <code>
	 *     // Replace an attribute stored with a new value, indices
	 *     // sourced from the lazily-parsed HTML recognizer.
	 *     $start = $attributes['src']->start;
	 *     $end   = $attributes['src']->end;
	 *     $modifications[] = new WP_HTML_Text_Replacement( $start, $end, get_the_post_thumbnail_url() );
	 *
	 *     // Correspondingly, something like this
	 *     // will appear in the replacements array.
	 *     $replacements = array(
	 *         WP_HTML_Text_Replacement( 14, 28, 'https://my-site.my-domain/wp-content/uploads/2014/08/kittens.jpg' )
	 *     );
	 * </code>
	 *
	 * @since 6.1.0
	 * @var WP_HTML_Text_Replacement[]
	 */
	private $attribute_updates = array();

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 *
	 * @param string $html HTML to process.
	 */
	public function __construct( $html ) {
		$this->html = $html;
	}

	/**
	 * Finds the next tag matching the $query.
	 *
	 * @since 6.1.0
	 *
	 * @param array|string $query {
	 *     Which tag name to find, having which class, etc.
	 *
	 *     @type string|null $tag_name     Which tag to find, or `null` for "any tag."
	 *     @type int|null    $match_offset Find the Nth tag matching all search criteria.
	 *                                     0 for "first" tag, 2 for "third," etc.
	 *                                     Defaults to first tag.
	 *     @type string|null $class_name   Tag must contain this whole class name to match.
	 * }
	 * @return boolean Whether a tag was matched.
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	public function next_tag( $query = null ) {
		$this->assert_not_closed();
		$descriptor           = WP_HTML_Tag_Find_Descriptor::parse( $query );
		$current_match_offset = - 1;
		do {
			/*
			 * Unfortunately we can't try to search for only the tag name we want because that might
			 * lead us to skip over other tags and lose track of our place. So we need to search for
			 * _every_ tag and then check after we find one if it's the one we are looking for.
			 */
			if ( false === $this->parse_next_tag() ) {
				$this->parsed_bytes = strlen( $this->html );

				return false;
			}

			// Parse all the attributes of the current tag.
			while ( $this->parse_next_attribute() ) {
				// Twiddle our thumbs...
			}

			if ( $descriptor->matches( $this->tag_name, $this->attributes ) ) {
				++$current_match_offset;
			}
		} while ( $current_match_offset !== $descriptor->match_offset );

		return true;
	}

	/**
	 * Parses the next tag.
	 *
	 * @since 6.1.0
	 */
	private function parse_next_tag() {
		$this->after_tag();

		$html = $this->html;
		$at = $this->parsed_bytes;

		while ( true ) {
			$at = strpos( $html, '<', $at );
			if ( false === $at ) {
				return false;
			}

			/*
			 * HTML tag names must start with [a-zA-Z] otherwise they are not tags.
			 * For example, "<3" is rendered as text, not a tag opener. This means
			 * if we have at least one letter following the "<" then we _do_ have
			 * a tag opener and can process it as such. This is more common than
			 * HTML comments, DOCTYPE tags, and other structure starting with "<"
			 * so it's good to check first for the presence of the tag.
			 *
			 * Reference:
			 * * https://html.spec.whatwg.org/multipage/parsing.html#data-state
			 * * https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
			 */
			$tag_name_prefix_length = strspn( $html, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', $at + 1 );
			if ( $tag_name_prefix_length > 0 ) {
				$at++;
				$tag_name_length        = $tag_name_prefix_length + strcspn( $html, " \t\r\n/>", $at + $tag_name_prefix_length );
				$this->tag_name         = substr( $html, $at, $tag_name_length );
				$this->tag_name_ends_at = $at + $tag_name_length;
				$this->parsed_bytes     = $at + $tag_name_length;
				return true;
			}

			// <! transitions to markup declaration open state
			// https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
			if ( '!' === $html[ $at + 1 ] ) {
				// <!-- transitions to a bogus comment state – we can skip to the nearest -->
				// https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
				if ( '-' === $html[ $at + 2 ] && '-' === $html[ $at + 3 ] ) {
					$at = strpos( $html, '-->', $at + 4 ) + 3;
					continue;
				}

				// <![CDATA[ transitions to CDATA section state – we can skip to the nearest ]]>
				// https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
				if ( 1 === preg_match( '~\[CDATA\[~Amiu', $html, $chunk, 0, $at + 2 ) ) {
					$at = strpos( $html, ']]>', $at + 9 ) + 3;
					continue;
				}

				// <!DOCTYPE transitions to DOCTYPE state – we can skip to the nearest >
				// https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
				if ( 1 === preg_match( '~DOCTYPE~Amiu', $html, $chunk, 0, $at + 2 ) )  {
					$at = strpos( $html, '>', $at + 9 ) + 1;
					continue;
				}
			}

			// <? transitions to a bogus comment state – we can skip to the nearest >
			// https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
			if ( '?' === $html[ $at + 1 ] ) {
				$at = strpos( $html, '>', $at + 2 ) + 1;
				continue;
			}

			$at++;
		}
	}

	/**
	 * Parses the next attribute.
	 *
	 * @since 6.1.0
	 */
	private function parse_next_attribute() {
		$this->skip_whitespace();

		$name_length = '=' === $this->html[ $this->parsed_bytes ]
			? 1 + strcspn( $this->html, "=/> \t\r\n", $this->parsed_bytes + 1 )
			: strcspn( $this->html, "=/> \t\r\n", $this->parsed_bytes );

		// No attribute, just tag closer.
		if ( 0 === $name_length ) {
			return false;
		}

		$attribute_start     = $this->parsed_bytes;
		$attribute_name      = substr( $this->html, $attribute_start, $name_length );
		$this->parsed_bytes += $name_length;

		$this->skip_whitespace();

		$has_value = '=' === $this->html[ $this->parsed_bytes ];
		if ( $has_value ) {
			$this->parsed_bytes++;
			$this->skip_whitespace();

			switch ( $this->html[ $this->parsed_bytes ] ) {
				case "'":
				case '"':
					$value_start        = $this->parsed_bytes + 1;
					$value_length       = strcspn( $this->html, $this->html[ $this->parsed_bytes ], $value_start );
					$attribute_end      = $value_start + $value_length + 1;
					$this->parsed_bytes = $attribute_end;
					break;

				default:
					$value_start        = $this->parsed_bytes;
					$value_length       = strcspn( $this->html, "> \t\r\n", $value_start );
					$attribute_end      = $value_start + $value_length;
					$this->parsed_bytes = $attribute_end;
			}
		} else {
			$value_start   = $this->parsed_bytes;
			$value_length  = 0;
			$attribute_end = $attribute_start + $name_length;
		}

		if ( ! array_key_exists( $attribute_name, $this->attributes ) ) {
			$this->attributes[ $attribute_name ] = new WP_HTML_Attribute_Token(
				$attribute_name,
				// Avoid storing large, base64-encoded images. This class only ever uses the "class"
				// attribute value, so let's store just that. If we need to do attribute-based matching
				// in the future, this function could start accepting a list of relevant attributes.
				'class' === $attribute_name ? substr( $this->html, $value_start, $value_length ) : null,
				$attribute_start,
				$attribute_end
			);
		}

		return $this->attributes[ $attribute_name ];
	}

	/**
	 * Move the pointer past any immediate successive whitespace.
	 *
	 * @since 6.1.0
	 *
	 * @return void
	 */
	private function skip_whitespace() {
		$this->parsed_bytes += strspn( $this->html, " \t\r\n", $this->parsed_bytes );
	}

	/**
	 * Asserts that the HTML Walker has not been closed for further lookup or modifications.
	 *
	 * @since 6.1.0
	 *
	 * @throws WP_HTML_Walker_Exception If the HTML Walker has been closed.
	 */
	private function assert_not_closed() {
		if ( $this->closed ) {
			throw new WP_HTML_Walker_Exception(
				'This WP_HTML_Walker was already cast to a string and ' .
				'no further lookups or updates are possible. This is because ' .
				'the HTML parsing algorithm only moves forward and the ' .
				'cursor is already at the end of the HTML document.'
			);
		}
	}

	/**
	 * Applies attribute updates and cleans up once a tag is fully parsed.
	 *
	 * @since 6.1.0
	 *
	 * @return void
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	private function after_tag() {
		$this->class_name_updates_to_attributes_updates();
		$this->apply_attributes_updates();
		$this->tag_name         = null;
		$this->tag_name_ends_at = null;
		$this->attributes       = array();
	}

	/**
	 * Converts class name updates into tag attributes updates
	 * (they are accumulated in different data formats for performance).
	 *
	 * This method is only meant to run right before the attribute updates are applied.
	 * The behavior in all other cases is undefined.
	 *
	 * @return void
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 * @since 6.1.0
	 *
	 * @see $classname_updates
	 * @see $attribute_updates
	 */
	private function class_name_updates_to_attributes_updates() {
		if ( count( $this->classname_updates ) === 0 || array_key_exists( 'class', $this->attribute_updates ) ) {
			$this->classname_updates = array();
			return;
		}

		$existing_class_attr = $this->get_current_tag_attribute( 'class' );
		$existing_class      = $existing_class_attr ? $existing_class_attr->value : '';
		$class               = '';
		$at                  = 0;
		$modified            = false;

		// Remove unwanted classes by only copying the new ones.
		while ( $at < strlen( $existing_class ) ) {
			$ws_at     = $at;
			$ws_length = strspn( $existing_class, ' ', $ws_at );
			$sep       = strpos( $existing_class, ' ', $at + $ws_length );
			$at       += $ws_length;
			if ( false === $sep ) {
				$sep = strlen( $existing_class );
			}

			$name = substr( $existing_class, $at, $sep - $at );
			$at   = $sep;

			$remove_class = array_key_exists( $name, $this->classname_updates ) && self::REMOVE_CLASS === $this->classname_updates[ $name ];
			unset( $this->classname_updates[ $name ] );

			if ( $remove_class ) {
				$modified = true;
				continue;
			}

			/*
			 * By preserving the existing whitespace we'll introduce fewer changes
			 * to the HTML content and hopefully make comparing before/after easier
			 * for people trying to debug the modified output.
			 */
			$class .= substr( $existing_class, $ws_at, $ws_length );
			$class .= $name;
		}

		// Add new classes by appending the ones we haven't already seen.
		if ( count( $this->classname_updates ) > 0 ) {
			$modified = true;
			foreach ( $this->classname_updates as $name => $do_keep ) {
				$class .= ( strlen( $class ) > 0 ? ' ' : '' ) . $name;
			}
		}

		if ( ! $modified ) {
			return;
		}

		if ( strlen( $class ) > 0 ) {
			$this->set_attribute( 'class', $class );
		} else {
			$this->remove_attribute( 'class' );
		}
	}

	/**
	 * Applies updates to attributes.
	 *
	 * @since 6.1.0
	 */
	private function apply_attributes_updates() {
		if ( ! count( $this->attribute_updates ) ) {
			return;
		}

		/**
		 * Attribute updates can be enqueued in any order but as we
		 * progress through the document to replace them we have to
		 * make our replacements in the order in which they are found
		 * in that document.
		 *
		 * Sorting the updates ensures we don't make our replacements
		 * out of order, which could otherwise lead to mangled output,
		 * partially-duplicate attributes, and overwritten attributes.
		 */
		usort( $this->attribute_updates, array( 'self', 'sort_start_ascending' ) );

		foreach ( $this->attribute_updates as $diff ) {
			$this->updated_html .= substr( $this->html, $this->updated_bytes, $diff->start - $this->updated_bytes );
			$this->updated_html .= $diff->text;
			$this->updated_bytes = $diff->end;
		}

		$this->attribute_updates = array();
	}

	/**
	 * Sort function to arrange objects with a start property in asending order.
	 *
	 * @since 6.1.0
	 *
	 * @param object $a
	 * @param object $b
	 * @return integer
	 */
	private static function sort_start_ascending( $a, $b ) {
		return $a->start - $b->start;
	}

	/**
	 * Updates or creates a new attribute on the currently matched tag.
	 *
	 * @since 6.1.0
	 *
	 * @param string $name  The attribute name to target.
	 * @param string $value The new attribute value.
	 *
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	public function set_attribute( $name, $value ) {
		$this->assert_not_closed();
		if ( ! $this->tag_name ) {
			return;
		}

		/*
		 * > The values "true" and "false" are not allowed on boolean attributes.
		 * > To represent a false value, the attribute has to be omitted altogether.
		 *     - HTML5 spec, https://html.spec.whatwg.org/#boolean-attributes
		 */
		if ( false === $value ) {
			$this->remove_attribute( $name );
			return;
		}

		if ( true === $value ) {
			$updated_attribute = $name;
		} else {
			$escaped_new_value = esc_attr( $value );
			$updated_attribute = "{$name}=\"{$escaped_new_value}\"";
		}

		$attr = $this->get_current_tag_attribute( $name );
		if ( $attr ) {
			/*
			 * Update an existing attribute.
			 *
			 * Example – set attribute id to "new" in <div id="initial_id" />:
			 *    <div id="initial_id"/>
			 *         ^-------------^
			 *         start         end
			 *    replacement: `id="new"`
			 *
			 *    Result: <div id="new"/>
			 */
			$this->attribute_updates[ $name ] = new WP_HTML_Text_Replacement(
				$attr->start,
				$attr->end,
				$updated_attribute
			);
		} else {
			/*
			 * Create a new attribute at the tag's name end.
			 *
			 * Example – add attribute id="new" to <div />:
			 *    <div/>
			 *        ^
			 *        start and end
			 *    replacement: ` id="new"`
			 *
			 *    Result: <div id="new"/>
			 */
			$this->attribute_updates[ $name ] = new WP_HTML_Text_Replacement(
				$this->tag_name_ends_at,
				$this->tag_name_ends_at,
				' ' . $updated_attribute
			);
		}
	}

	/**
	 * Removes an attribute of the currently matched tag.
	 *
	 * @since 6.1.0
	 *
	 * @param string $name The attribute name to remove.
	 *
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	public function remove_attribute( $name ) {
		$this->assert_not_closed();
		$attr = $this->get_current_tag_attribute( $name );
		if ( $attr ) {
			/*
			 * Removes an existing tag attribute.
			 *
			 * Example – remove the attribute id from <div id="main"/>:
			 *    <div id="initial_id"/>
			 *         ^-------------^
			 *         start         end
			 *    replacement: ``
			 *
			 *    Result: <div />
			 */
			$this->attribute_updates[ $name ] = new WP_HTML_Text_Replacement(
				$attr->start,
				$attr->end,
				''
			);
		}
	}

	/**
	 * Returns the current tag attribute or false if not found.
	 *
	 * @since 6.1.0
	 *
	 * @param string $name The attribute name to target.
	 * @return WP_HTML_Attribute_Token|boolean The attribute token, or false if not found.
	 */
	private function get_current_tag_attribute( $name ) {
		if ( array_key_exists( $name, $this->attributes ) ) {
			return $this->attributes[ $name ];
		}

		return false;
	}

	/**
	 * Return true when the HTML Walker is closed for further lookups and modifications.
	 *
	 * @since 6.1.0
	 *
	 * @return boolean True if the HTML Walker is closed, false otherwise.
	 */
	public function is_closed() {
		return $this->closed;
	}

	/**
	 * Adds a new class name to the currently matched tag.
	 *
	 * @since 6.1.0
	 *
	 * @param string $class_name The class name to add.
	 *
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	public function add_class( $class_name ) {
		$this->assert_not_closed();
		if ( $this->tag_name ) {
			$this->classname_updates[ $class_name ] = self::ADD_CLASS;
		}
	}

	/**
	 * Removes a class name from the currently matched tag.
	 *
	 * @since 6.1.0
	 *
	 * @param string $class_name The class name to remove.
	 *
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	public function remove_class( $class_name ) {
		$this->assert_not_closed();
		if ( $this->tag_name ) {
			$this->classname_updates[ $class_name ] = self::REMOVE_CLASS;
		}
	}

	/**
	 * Returns the string representation of the HTML Walker.
	 * It closes the HTML Walker and prevents further lookups and modifications.
	 *
	 * @since 6.1.0
	 *
	 * @return string The processed HTML.
	 */
	public function __toString() {
		if ( ! $this->is_closed() ) {
			$this->after_tag();
			$this->updated_html .= substr( $this->html, $this->updated_bytes );
			$this->parsed_bytes  = strlen( $this->html );
			$this->closed        = true;
		}

		return $this->updated_html;
	}

	/**
	 * Processes the passed comparable value.
	 *
	 * @since 6.1.0
	 *
	 * @param string $value The comparable value to process.
	 * @return string The processed value.
	 */
	public static function comparable( $value ) {
		return trim( strtolower( $value ) );
	}
}
