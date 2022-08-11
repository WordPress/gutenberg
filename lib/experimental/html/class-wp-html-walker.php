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
 * @TODO: Unify language around "currently-opened tag."
 * @TODO: Support <script> data state.
 * @TODO: Organize unit test cases into normative tests, edge-case tests, regression tests.
 * @TODO: Clean up attribute token class after is_true addition
 * @TODO: Review (start,end) vs. (start,length) pairs for consistency and ease.
 * @TODO: Prune whitespace when removing classes/attributes: e.g. "a b c" -> "c" not " c"
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.1.0
 */

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
	 * @var array|null
	 */
	private $last_query;

	/**
	 * @var string|null
	 */
	private $sought_tag_name;

	/**
	 * @var string|null
	 */
	private $sought_class_name;

	/**
	 * @var int|null
	 */
	private $sought_match_offset;

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
	 * @var integer|null
	 */
	private $tag_name_starts_at;

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

	const ADD_CLASS    = true;
	const REMOVE_CLASS = false;
	const SKIP_CLASS   = null;

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
		$this->last_query = null;
	}

	/**
	 * Finds the next tag matching the $query.
	 *
	 * @since 6.1.0
	 *
	 * @param array|string|WP_HTML_Tag_Find_Descriptor $query {
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
		$this->parse_query( $query );
		$already_found = 0;

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

			$tag_name = $this->get_tag();
			if ( 'title' === $tag_name || 'textarea' === $tag_name ) {
				$this->skip_rcdata( $tag_name );
				continue;
			} elseif ( 'script' === $tag_name ) {
				$this->skip_script();
				continue;
			}

			if ( $this->matches() ) {
				$already_found++;
			}
		} while ( $already_found < $this->sought_match_offset );

		return true;
	}

	/**
	 * Skips the contents of the title and textarea tags until an appropriate
	 * tag closer is found:
	 * https://html.spec.whatwg.org/multipage/parsing.html#rcdata-state
	 *
	 * @param string $tag_name – the rcdata tag closer to look for.
	 * @since 6.1.0
	 */
	private function skip_rcdata( $tag_name ) {
		while ( true ) {
			// Find a potential tag closer.
			$closer = "</{$tag_name}";
			$at = strpos( $this->html, $closer, $this->parsed_bytes );
			if ( false === $at ) {
				return;
			}
			// Confirm the initial </tag sequence is followed by a terminating character.
			$this->parsed_bytes = $at + strlen( $closer );
			if ( 0 === strspn( $this->html, " \t\f\r\n/>", $this->parsed_bytes ) ) {
				continue;
			}
			// Parse all the attributes of the tag closer.
			while ( $this->parse_next_attribute() ) {
				// Twiddle our thumbs...
			}
		}
	}

	/**
	 * Skips the contents of <script> tags by bailing to the end of the document.
	 *
	 * @TODO: This needs to implement the script states in the HTML specification
	 *        so that we don't have to abort processing documents when we find
	 *        script tags.
	 *
	 * @since 6.1.0
	 */
	private function skip_script() {
		$this->parsed_bytes = strlen( $this->html );
	}

	/**
	 * Parses the next tag.
	 *
	 * @since 6.1.0
	 */
	private function parse_next_tag() {
		$this->after_tag();

		$html = $this->html;
		$at   = $this->parsed_bytes;

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
				$tag_name_length        = $tag_name_prefix_length + strcspn( $html, " \t\f\r\n/>", $at + $tag_name_prefix_length );
				$this->tag_name_starts_at = $at;
				$this->tag_name_ends_at = $at + $tag_name_length;
				$this->parsed_bytes     = $at + $tag_name_length;
				return true;
			}

			// <! transitions to markup declaration open state
			// https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
			if ( '!' === $html[ $at + 1 ] ) {
				// <!-- transitions to a bogus comment state – we can skip to the nearest -->
				// https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
				if (
					strlen( $html ) > $at + 3 &&
					'-' === $html[ $at + 2 ] &&
					'-' === $html[ $at + 3 ]
				) {
					$at = strpos( $html, '-->', $at + 4 ) + 3;
					continue;
				}

				// <![CDATA[ transitions to CDATA section state – we can skip to the nearest ]]>
				// The CDATA is case-sensitive.
				// https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
				if (
					strlen( $html ) > $at + 8 &&
					'[' === $html[ $at + 2 ] &&
					'C' === $html[ $at + 3 ] &&
					'D' === $html[ $at + 4 ] &&
					'A' === $html[ $at + 5 ] &&
					'T' === $html[ $at + 6 ] &&
					'A' === $html[ $at + 7 ] &&
					'[' === $html[ $at + 8 ]
				) {
					$at = strpos( $html, ']]>', $at + 9 ) + 3;
					continue;
				}

				/*
				 * <!DOCTYPE transitions to DOCTYPE state – we can skip to the nearest >
				 * These are ASCII-case-insensitive.
				 * https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
				 */
				if (
					strlen( $html ) > $at + 8 &&
					'D' === strtoupper( $html[ $at + 2 ] ) &&
					'O' === strtoupper( $html[ $at + 3 ] ) &&
					'C' === strtoupper( $html[ $at + 4 ] ) &&
					'T' === strtoupper( $html[ $at + 5 ] ) &&
					'Y' === strtoupper( $html[ $at + 6 ] ) &&
					'P' === strtoupper( $html[ $at + 7 ] ) &&
					'E' === strtoupper( $html[ $at + 8 ] )
				) {
					$at = strpos( $html, '>', $at + 9 ) + 1;
					continue;
				}

				/*
				 * Anything else here is an incorrectly-opened comment and transitions
				 * to the bogus comment state - we can skip to the nearest >.
				 */
				$at = strpos( $html, '>', $at + 1 );
				continue;
			}

			/*
			 * <? transitions to a bogus comment state – we can skip to the nearest >
			 * https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
			 */
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

		/*
		 * Treat the equal sign ("=") as a part of the attribute name if it is the
		 * first encountered byte:
		 * https://html.spec.whatwg.org/multipage/parsing.html#before-attribute-name-state
		 */
		$name_length = '=' === $this->html[ $this->parsed_bytes ]
			? 1 + strcspn( $this->html, "=/> \t\f\r\n", $this->parsed_bytes + 1 )
			: strcspn( $this->html, "=/> \t\f\r\n", $this->parsed_bytes );

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
					$quote              = $this->html[ $this->parsed_bytes ];
					$value_start        = $this->parsed_bytes + 1;
					$value_length       = strcspn( $this->html, $quote, $value_start );
					$attribute_end      = $value_start + $value_length + 1;
					$this->parsed_bytes = $attribute_end;
					break;

				default:
					$value_start        = $this->parsed_bytes;
					$value_length       = strcspn( $this->html, "> \t\f\r\n", $value_start );
					$attribute_end      = $value_start + $value_length;
					$this->parsed_bytes = $attribute_end;
			}
		} else {
			$value_start   = $this->parsed_bytes;
			$value_length  = 0;
			$attribute_end = $attribute_start + $name_length;
		}

		// If an attribute is listed many times, only use the first declaration and ignore the rest.
		if ( ! array_key_exists( $attribute_name, $this->attributes ) ) {
			$this->attributes[ $attribute_name ] = new WP_HTML_Attribute_Token(
				$attribute_name,
				$value_start,
				$value_length,
				$attribute_start,
				$attribute_end,
				! $has_value
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
		$this->parsed_bytes += strspn( $this->html, " \t\f\r\n", $this->parsed_bytes );
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
		$this->tag_name_starts_at = null;
		$this->tag_name_ends_at   = null;
		$this->attributes         = array();
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
		if ( count( $this->classname_updates ) === 0 || isset( $this->attribute_updates['class'] ) ) {
			$this->classname_updates = array();
			return;
		}

		$existing_class = isset( $this->attributes['class'] )
			? substr( $this->html, $this->attributes['class']->value_starts_at, $this->attributes['class']->value_length )
			: '';

		/**
		 * Updated "class" attribute value.
		 *
		 * This is incrementally built as we scan through the existing class
		 * attribute, omitting removed classes as we do so, and then appending
		 * added classes at the end. Only when we're done processing will the
		 * value contain the final new value.

		 * @var string
		 */
		$class = '';

		/**
		 * Tracks the cursor position in the existing class
		 * attribute value where we're currently parsing.
		 *
		 * @var integer
		 */
		$at = 0;

		/**
		 * Indicates if we have made any actual modifications to the existing
		 * class attribute value, used to short-circuit string copying.
		 *
		 * It's possible that we are intending to remove certain classes and
		 * add others in such a way that we don't modify the existing value
		 * because calls to `add_class()` and `remove_class()` occur
		 * independent of the input values sent to the walker. That is, we
		 * might call `remove_class()` for a class that isn't already present
		 * and we might call `add_class()` for one that is, in which case we
		 * wouldn't need to break apart the string and rebuild it.
		 *
		 * This flag is set upon the first change that requires a string update.
		 *
		 * @var boolean
		 */
		$modified = false;

		// Remove unwanted classes by only copying the new ones.
		while ( $at < strlen( $existing_class ) ) {
			// Skip to the first non-whitespace character.
			$ws_at     = $at;
			$ws_length = strspn( $existing_class, " \t\f\r\n", $ws_at );
			$at       += $ws_length;

			// Capture the class name – it's everything until the next whitespace.
			$name_length = strcspn( $existing_class, " \t\f\r\n", $at );
			if ( 0 === $name_length ) {
				// We're done, no more class names.
				break;
			}

			$name = substr( $existing_class, $at, $name_length );
			$at  += $name_length;

			// If this class is marked for removal, start processing the next one.
			$remove_class = (
				isset( $this->classname_updates[ $name ] ) &&
				self::REMOVE_CLASS === $this->classname_updates[ $name ]
			);

			// Once we've seen a class, we should never add it again.
			if ( ! $remove_class ) {
				$this->classname_updates[ $name ] = self::SKIP_CLASS;
			}

			if ( $remove_class ) {
				$modified = true;
				continue;
			}

			/*
			 * Otherwise, append it to the new "class" attribute value.
			 *
			 * By preserving the existing whitespace instead of only adding a single
			 * space (which is a valid transformation we can make) we'll introduce
			 * fewer changes to the HTML content and hopefully make comparing
			 * before/after easier for people trying to debug the modified output.
			 */
			$class .= substr( $existing_class, $ws_at, $ws_length );
			$class .= $name;
		}

		// Add new classes by appending the ones we haven't already seen.
		foreach ( $this->classname_updates as $name => $operation ) {
			if ( self::ADD_CLASS === $operation ) {
				$modified = true;

				$class .= strlen( $class ) > 0 ? ' ' : '';
				$class .= $name;
			}
		}

		$this->classname_updates = array();
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
	 * @param object $a First attribute update.
	 * @param object $b Second attribute update.
	 * @return integer
	 */
	private static function sort_start_ascending( $a, $b ) {
		return $a->start - $b->start;
	}

	/**
	 * Returns the value of the parsed attribute in the currently-opened tag.
	 *
	 * Example:
	 * <code>
	 *     $w = new WP_HTML_Walker( '<div enabled class="test" data-test-id="14">Test</div>' );
	 *     $w->next_tag( [ 'class_name' => 'test' ] ) === true;
	 *     $w->get_attribute( 'data-test-id' ) === '14';
	 *     $w->get_attribute( 'enabled' ) === true;
	 *     $w->get_attribute( 'aria-label' ) === null;
	 *
	 *     $w->next_tag( [] ) === false;
	 *     $w->get_attribute( 'class' ) === null;
	 * </code>
	 *
	 * @param string $name Name of attribute whose value is requested.
	 * @return string|true|null Value of attribute or `null` if not available.
	 *                          Boolean attributes return `true`.
	 */
	public function get_attribute( $name ) {
		if ( null === $this->tag_name_starts_at ) {
			return null;
		}

		$comparable = strtolower( $name );
		if ( ! isset( $this->attributes[ $comparable ] ) ) {
			return null;
		}

		$attribute = $this->attributes[ $comparable ];

		if ( true === $attribute->is_true ) {
			return true;
		}

		return substr( $this->html, $attribute->value_starts_at, $attribute->value_length );
	}

	/**
	 * Returns the raw name of the currently-opened tag.
	 *
	 * This will return the name as found in the input HTML,
	 * which might not be equivalent to the case-folded and
	 * semantically equivalent name sought after.
	 *
	 * Example:
	 * <code>
	 *     $w = new WP_HTML_Walker( '<DIV CLASS="test">Test</DIV>' );
	 *     $w->next_tag( [] ) === true;
	 *     $w->get_tag() === 'DIV';
	 *
	 *     $w->next_tag( [] ) === false;
	 *     $w->get_tag() === null;
	 * </code>
	 *
	 * @return string|null Raw name of current tag in input HTML, or `null` if none currently open.
	 */
	public function get_tag() {
		return null !== $this->tag_name_starts_at
			? substr( $this->html, $this->tag_name_starts_at, $this->tag_name_ends_at - $this->tag_name_starts_at )
			: null;
	}

	/**
	 * Updates or creates a new attribute on the currently matched tag with the value passed.
	 *
	 * For boolean attributes special handling is provided:
	 *  - When `true` is passed as the value, then only the attribute name is added to the tag.
	 *  - When `false` is passed, the attribute gets removed if it existed before.
	 *
	 * @since 6.1.0
	 *
	 * @param string         $name  The attribute name to target.
	 * @param string|boolean $value The new attribute value.
	 *
	 * @throws WP_HTML_Walker_Exception Once this object was already stringified and closed.
	 */
	public function set_attribute( $name, $value ) {
		$this->assert_not_closed();
		if ( $this->tag_name_starts_at === null ) {
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
			// @TODO: What escaping and sanitization do we need here?
			$escaped_new_value = str_replace( '"', '&quot;', $value );
			$updated_attribute = "{$name}=\"{$escaped_new_value}\"";
		}

		if ( isset( $this->attributes[ $name ] ) ) {
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
			$existing_attribute               = $this->attributes[ $name ];
			$this->attribute_updates[ $name ] = new WP_HTML_Text_Replacement(
				$existing_attribute->start,
				$existing_attribute->end,
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

		if ( ! isset( $this->attributes[ $name ] ) ) {
			return;
		}

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
			$this->attributes[ $name ]->start,
			$this->attributes[ $name ]->end,
			''
		);
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
		if ( $this->tag_name_starts_at !== null ) {
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
		if ( $this->tag_name_starts_at !== null ) {
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
	 * Prepares tag search criteria from input interface.
	 *
	 * @since 6.1.0
	 *
	 * @param array|string $query {
	 *     Which tag name to find, having which class.
	 *
	 *     @type string|null $tag_name     Which tag to find, or `null` for "any tag."
	 *     @type string|null $class_name   Tag must contain this class name to match.
	 * }
	 */
	private function parse_query( $query ) {
		if ( null !== $query && $query === $this->last_query ) {
			return;
		}

		$this->last_query          = $query;
		$this->sought_tag_name     = null;
		$this->sought_class_name   = null;
		$this->sought_match_offset = 1;

		// A single string value means "find the tag of this name."
		if ( is_string( $query ) ) {
			$this->sought_tag_name = $query;
			return;
		}

		// If not using the string interface we have to pass an associative array.
		if ( ! is_array( $query ) ) {
			return;
		}

		if ( isset( $query['tag_name'] ) && is_string( $query['tag_name'] ) ) {
			$this->sought_tag_name = $query['tag_name'];
		}

		if ( isset( $query['class_name'] ) && is_string( $query['class_name'] ) ) {
			$this->sought_class_name = $query['class_name'];
		}

		if ( isset( $query['match_offset'] ) && is_int( $query['match_offset'] ) && 0 < $query['match_offset'] ) {
			$this->sought_match_offset = $query['match_offset'];
		}
	}


	/**
	 * Checks whether a given tag and its attributes match the search criteria.
	 *
	 * @since 6.1.0
	 *
	 * @return boolean
	 */
	private function matches() {
		// Do we match a case-insensitive HTML tag name?
		if ( null !== $this->sought_tag_name ) {
			/*
			 * String (byte) length lookup is fast. If they aren't the
			 * same length then they can't be the same string values.
			 */
			$length = $this->tag_name_ends_at - $this->tag_name_starts_at;
			if ( $length !== strlen( $this->sought_tag_name ) ) {
				return false;
			}

			/*
			 * Otherwise we have to check for each character if they
			 * are the same, and only `strtolower()` if we have to.
			 * Presuming that most people will supply lowercase tag
			 * names and most HTML will contain lowercase tag names,
			 * most of the time this runs we shouldn't expect to
			 * actually run the case-folding comparison.
			 */
			for ( $i = 0; $i < $length; $i++ ) {
				$html_char = $this->html[ $this->tag_name_starts_at + $i ];
				$tag_char  = $this->sought_tag_name[ $i ];

				if ( $html_char !== $tag_char && strtolower( $html_char ) !== $tag_char ) {
					return false;
				}
			}
		}

		// Do we match a byte-for-byte (case-sensitive and encoding-form-sensitive) class name?
		if ( null !== $this->sought_class_name ) {
			if ( ! isset( $this->attributes['class'] ) ) {
				return false;
			}

			$class_start = $this->attributes['class']->value_starts_at;
			$class_end   = $class_start + $this->attributes['class']->value_length;
			$class_at    = $class_start;

			/*
			 * We're going to have to jump through potential matches here because
			 * it's possible that we have classes containing the class name we're
			 * looking for. For instance, if we are looking for "even" we don't
			 * want to be confused when we come to the class "not-even." This is
			 * secured by ensuring that we find our sought-after class and that
			 * it's surrounded on both sides by proper boundaries.
			 *
			 * See https://html.spec.whatwg.org/#attributes-3
			 * See https://html.spec.whatwg.org/#space-separated-tokens
			 */
			while (
				false !== ( $class_at = strpos( $this->html, $this->sought_class_name, $class_at ) ) &&
				$class_at < $class_end
			) {
				/*
				 * Verify this class starts at a boundary. If it were at 0 we'd be at
				 * the start of the string and that would be fine, otherwise we have
				 * to start at a place where the preceding character is whitespace.
				 */
				if ( $class_at > $class_start ) {
					$c = $this->html[ $class_at - 1 ];

					if ( ' ' !== $c && "\t" !== $c && "\f" !== $c && "\r" !== $c && "\n" !== $c ) {
						$class_at += strlen( $this->sought_class_name );
						continue;
					}
				}

				/*
				 * Similarly, verify this class ends at a boundary as well. Here we
				 * can end at the very end of the string value, otherwise we have
				 * to end at a place where the next character is whitespace.
				 */
				if ( $class_at + strlen( $this->sought_class_name ) < $class_end ) {
					$c = $this->html[ $class_at + strlen( $this->sought_class_name ) ];

					if ( ' ' !== $c && "\t" !== $c && "\f" !== $c && "\r" !== $c && "\n" !== $c ) {
						$class_at += strlen( $this->sought_class_name );
						continue;
					}
				}

				return true;
			}

			return false;
		}

		return true;
	}
}
