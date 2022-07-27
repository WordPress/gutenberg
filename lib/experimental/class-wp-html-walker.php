<?php
/***
 * Scans through an HTML document to find specific tags, then
 * transforms those tags by adding, removing, or updating the
 * values of the HTML attributes within that tag (opener).
 *
 * Does not fully parse HTML or _recurse_ into the HTML structure
 * Instead this scans linearly through a document and only parses
 * the HTML tag openers.
 *
 * @package gutenberg
 */

/**
 * Processes an input HTML document by applying a specified set
 * of patches to that input. Tokenizes HTML but does not fully
 * parse the input document.
 */
class WP_HTML_Walker {

	/**
	 * The HTML document to parse.
	 *
	 * @var string
	 */
	private $html;
	/**
	 * The updated HTML document.
	 *
	 * @var string
	 */
	private $updated_html = '';
	/**
	 * How many bytes from the original HTML document were already read.
	 *
	 * @var int
	 */
	private $parsed_bytes = 0;
	/**
	 * How many bytes from the original HTML document were already treated
	 * with the requested replacements.
	 *
	 * @var int
	 */
	private $updated_bytes = 0;
	/**
	 * The name of the currently matched tag.
	 *
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
	 * @var array<WP_HTML_Attribute_Token>
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
	 * @var array<WP_Class_Name_Update>
	 */
	private $classnames_updates = array();

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
	 *     $modifications[] = new WP_Text_Replacement( $start, $end, get_the_post_thumbnail_url() );
	 *
	 *     // Correspondingly, something like this
	 *     // will appear in the replacements array.
	 *     $replacements = array(
	 *         WP_Text_Replacement( 14, 28, 'https://my-site.my-domain/wp-content/uploads/2014/08/kittens.jpg' )
	 *     );
	 * </code>
	 *
	 * @var array<WP_Text_Replacement>
	 */
	private $attributes_updates = array();

	/**
	 * @param string $html HTML to process.
	 */
	public function __construct( $html ) {
		$this->html = $html;
	}

	/**
	 * @param array $query Query.
	 *
	 * @TODO: How to document the query here without copying and pasting the docstring from WP_Tag_Find_Descriptor?
	 * @return WP_HTML_Walker|false
	 * @see WP_Tag_Find_Descriptor::parse.
	 */
	public function next_tag( $query = null ) {
		$descriptor           = WP_Tag_Find_Descriptor::parse( $query );
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
				++ $current_match_offset;
			}
		} while ( $current_match_offset !== $descriptor->match_offset );

		return $this;
	}

	private function parse_next_tag() {
		$this->after_tag();
		$matches = $this->consume_regexp(
			'~<!--(?>.*?-->)|<!\[CDATA\[(?>.*?\]\]>)|<\?(?>.*?)>|<(?P<TAG_NAME>[a-z][^\x{09}\x{0a}\x{0c}\x{20}\/>]*)~mui'
		);
		if ( false === $matches ) {
			return false;
		}
		if ( empty( $matches['TAG_NAME'][0] ) ) {
			return $this->parse_next_tag();
		}
		$this->tag_name         = $matches['TAG_NAME'][0];
		$this->tag_name_ends_at = $this->parsed_bytes;
	}

	private function parse_next_attribute() {
		$name_match = $this->consume_regexp(
			'~
			# Preceeding whitespace:
			[\x{09}\x{0a}\x{0c}\x{20} ]*
			(?>
				# Either a tag end, or an attribute:
				(?P<CLOSER>\/?>)
				|
				(?P<NAME>(?:
					# Attribute names starting with an equals sign (yes, this is valid)
					=?[^=\/>\x{09}\x{0a}\x{0c}\x{20}]*
					|
					# Attribute names starting with anything other than an equals sign:
					[^=\/>\x{09}\x{0a}\x{0c}\x{20}]+
				))
			)
			~miux'
		);

		// No attribute, just tag closer.
		if ( ! $name_match || ! empty( $name_match['CLOSER'][0] ) || empty( $name_match['NAME'][0] ) ) {
			return false;
		}

		list( $attribute_name, $attribute_start ) = $name_match['NAME'];

		// Skip whitespace.
		$this->consume_regexp( '~[\x{09}\x{0a}\x{0c}\x{20}]*~u' );

		$has_value = '=' === $this->html[ $this->parsed_bytes ];
		if ( $has_value ) {
			$this->parsed_bytes ++;
			$value_match     = $this->consume_regexp(
				"~
				# Preceeding whitespace
				[\x{09}\x{0a}\x{0c}\x{20}]*
				(?:
					# A quoted attribute value
					(?P<QUOTE>['\"])(?P<VALUE>.*?)\k<QUOTE>
					|
					# An unquoted attribute value
					(?P<VALUE>[^=\/>\x{09}\x{0a}\x{0c}\x{20}]*)
				)
				~miuJx"
			);
			$attribute_value = $value_match['VALUE'][0];
			$attribute_end   = $this->offset_after_match( $value_match[0] );
		} else {
			$attribute_value = 'true';
			$attribute_end   = $this->offset_after_match( $name_match['NAME'] );
		}

		$this->attributes[ $attribute_name ] = new WP_HTML_Attribute_Token(
			$attribute_name,
			// Avoid storing large, base64-encoded images. This class only ever uses the "class"
			// attribute value, so let's store just that. If we need to do attribute-based matching
			// in the future, this function could start accepting a list of relevant attributes.
			'class' === $attribute_name ? $attribute_value : null,
			$attribute_start,
			$attribute_end
		);

		return $this->attributes[ $attribute_name ];
	}

	/**
	 * Applies attribute updates and cleans up once a tag is fully parsed.
	 *
	 * @return void
	 * @throws WP_HTML_Walker_Exception
	 */
	private function after_tag() {
		$this->class_name_updates_to_attributes_updates();
		$this->apply_attributes_updates();
		$this->tag_name           = null;
		$this->tag_name_ends_at   = null;
		$this->attributes         = array();
		$this->classnames_updates = array();
	}

	/**
	 * Converts class name updates into tag attributes updates
	 * (they are accumulated in different data formats for performance).
	 *
	 * This method is only meant to run right before the attribute updates are applied.
	 * The behavior in all other cases is undefined.
	 *
	 * @return void
	 * @throws WP_HTML_Walker_Exception When no tag was matched.
	 * @see $classnames_updates
	 * @see $attributes_updates
	 */
	private function class_name_updates_to_attributes_updates() {
		if ( empty( $this->classnames_updates ) || array_key_exists( 'class', $this->attributes_updates ) ) {
			return;
		}

		$existing_class_attr = $this->get_current_tag_attribute( 'class' );
		$existing_class      = $existing_class_attr ? $existing_class_attr->value : '';

		$seen_classes = array();

		// Remove unwanted classes.
		$new_class = preg_replace_callback(
			'~(?:^|[ \t])([^ \t]+)~miu',
			function ( $matches ) use ( &$seen_classes ) {
				list( $full_match, $class_name ) = $matches;

				$comparable_name                  = self::comparable( $class_name );
				$seen_classes[ $comparable_name ] = true;
				if (
					array_key_exists( $comparable_name, $this->classnames_updates ) &&
					WP_Class_Name_Update::REMOVE === $this->classnames_updates[ $comparable_name ]->type
				) {
					return '';
				}

				return $full_match;
			},
			$existing_class
		);

		// Add new classes.
		foreach ( $this->classnames_updates as $comparable_name => $operation ) {
			if ( WP_Class_Name_Update::ADD === $operation->type && ! isset( $seen_classes[ $comparable_name ] ) ) {
				$new_class .= " {$operation->class_name}";
			}
		}

		if ( $existing_class !== $new_class ) {
			if ( $new_class ) {
				$this->set_attribute( 'class', trim( $new_class ) );
			} else {
				$this->remove_attribute( 'class' );
			}
		}
	}

	private function apply_attributes_updates() {
		$updates = array_values( $this->attributes_updates );
		/**
		 * The replacement algorithm only works when the updates are
		 * sorted by their start byte offset. However, they can be
		 * enqueued by the user in any arbitrary order.
		 * Well, let's sort them!
		 */
		usort(
			$updates,
			function ( $update1, $update2 ) {
				return $update1->start - $update2->start;
			}
		);

		foreach ( $updates as $diff ) {
			$this->updated_html  .= substr( $this->html, $this->updated_bytes, $diff->start - $this->updated_bytes );
			$this->updated_html  .= $diff->text;
			$this->updated_bytes = $diff->end;
		}
		$this->attributes_updates = array();
	}

	/**
	 * Updates or creates a new attribute on the currently matched tag.
	 *
	 * @param string $name The attribute name to target.
	 * @param string $value The new attribute value.
	 *
	 * @return WP_HTML_Walker This object.
	 * @throws WP_HTML_Walker_Exception When no tag was matched.
	 */
	public function set_attribute( $name, $value ) {
		$this->assert_tag_matched();

		$escaped_new_value = esc_attr( $value );
		$updated_attribute = "{$name}=\"{$escaped_new_value}\"";

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
			$this->attributes_updates[ $name ] = new WP_Text_Replacement(
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
			$this->attributes_updates[ $name ] = new WP_Text_Replacement(
				$this->tag_name_ends_at,
				$this->tag_name_ends_at,
				' ' . $updated_attribute
			);
		}

		return $this;
	}

	/**
	 * Removes an attribute of the currently matched tag.
	 *
	 * @param string $name The attribute name to remove.
	 *
	 * @return WP_HTML_Walker This object.
	 * @throws WP_HTML_Walker_Exception When no tag was matched.
	 */
	public function remove_attribute( $name ) {
		$this->assert_tag_matched();

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
			$this->attributes_updates[ $name ] = new WP_Text_Replacement(
				$attr->start,
				$attr->end,
				''
			);
		}

		return $this;
	}

	private function assert_tag_matched() {
		// More specific error message when we've finished parsing the original HTML document.
		if ( strlen( $this->html ) === $this->updated_bytes ) {
			throw new WP_HTML_Walker_Exception( 'Cannot update a tag: WP_HTML_Walker can only move forward through the HTML document and it has already reached an end.' );
		}
		if ( ! $this->tag_name ) {
			throw new WP_HTML_Walker_Exception( 'Cannot update a tag: No tag was matched' );
		}
	}

	private function get_current_tag_attribute( $name ) {
		if ( array_key_exists( $name, $this->attributes ) ) {
			return $this->attributes[ $name ];
		}

		return false;
	}

	/**
	 * Adds a new class name to the currently matched tag.
	 *
	 * @param string $class_name The class name to add.
	 *
	 * @return WP_HTML_Walker This object.
	 * @throws WP_HTML_Walker_Exception When no tag was matched.
	 */
	public function add_class( $class_name ) {
		$this->assert_tag_matched();
		$this->classnames_updates[ self::comparable( $class_name ) ] = new WP_Class_Name_Update( $class_name, true );

		return $this;
	}

	/**
	 * Removes a class name from the currently matched tag.
	 *
	 * @param string $class_name The class name to remove.
	 *
	 * @return WP_HTML_Walker This object.
	 * @throws WP_HTML_Walker_Exception When no tag was matched.
	 */
	public function remove_class( $class_name ) {
		$this->assert_tag_matched();
		$this->classnames_updates[ self::comparable( $class_name ) ] = new WP_Class_Name_Update( $class_name, false );

		return $this;
	}

	private function consume_regexp( $regexp ) {
		$matches = null;
		$result  = preg_match(
			$regexp,
			$this->html,
			$matches,
			PREG_OFFSET_CAPTURE,
			$this->parsed_bytes
		);
		if ( 1 !== $result ) {
			return false;
		}
		$this->parsed_bytes = $this->offset_after_match( $matches[0] );

		return $matches;
	}

	/**
	 * @param array $match
	 *
	 * @return int|mixed
	 */
	private function offset_after_match( $match ) {
		return $match[1] + strlen( $match[0] );
	}

	/**
	 * @return string
	 */
	public function __toString() {
		if ( strlen( $this->html ) !== $this->updated_bytes ) {
			$this->after_tag();
			$this->updated_html  .= substr( $this->html, $this->updated_bytes );
			$this->updated_bytes = strlen( $this->html );
		}

		return $this->updated_html;
	}

	/**
	 * @param string $value
	 *
	 * @return string
	 */
	public static function comparable( $value ) {
		return trim( strtolower( $value ) );
	}

}

/**
 *
 */
class WP_Class_Name_Update {
	const REMOVE = false;
	const ADD    = true;
	/** @var string */
	public $class_name;
	/** @var boolean */
	public $type;

	/**
	 * @param string $class_name
	 * @param bool   $operation
	 */
	public function __construct( $class_name, $operation ) {
		$this->class_name = $class_name;
		$this->type       = $operation;
	}
}

/**
 *
 */
class WP_Text_Replacement {
	/**
	 * @var integer Byte offset into document where replacement span begins.
	 */
	public $start;

	/**
	 * @var integer Byte offset into document where replacement span ends.
	 */
	public $end;

	/**
	 * @var string Span of text to insert in document to replace existing content from start to end.
	 */
	public $text;

	/**
	 * @param $start
	 * @param $end
	 * @param $text
	 */
	public function __construct( $start, $end, $text ) {
		$this->start = $start;
		$this->end   = $end;
		$this->text  = $text;
	}
}

/**
 *
 */
class WP_HTML_Attribute_Token {
	/**
	 * @var string
	 */
	public $name;

	/**
	 * @var string
	 */
	public $value;

	/**
	 * @var integer
	 */
	public $start;

	/**
	 * @var integer
	 */
	public $end;

	/**
	 * @param $name
	 * @param $value
	 * @param $start
	 * @param $end
	 */
	public function __construct( $name, $value, $start, $end ) {
		$this->name  = $name;
		$this->value = $value;
		$this->start = $start;
		$this->end   = $end;
	}
}

/**
 * Describes the search conditions for finding a given tag in an HTML document.
 */
class WP_Tag_Find_Descriptor {
	/**
	 * We're looking for an HTML tag of this name, up to the comparable
	 * equivalence of those names (lower-cased, Unicode-normalized, etc...).
	 * If we're looking for "any tag" then this property will be `null`.
	 *
	 * `h1...h6` are special since they are variations of the same base tag.
	 * To find "any heading tag" pass the special value `h`.
	 *
	 * @var string|null
	 */
	private $tag_name;

	/**
	 * We're looking for a tag also containing this CSS class name, up to
	 * the comparable equivalence of those names. If we're not looking for
	 * a class name this property will be `null`.
	 *
	 * @var string|null
	 */
	private $class_pattern;

	/**
	 * Used to skip matches in case we expect more than one to exist.
	 * This constraint applies after all other constraints have held.
	 * For example, to find the first `<div>` tag containing the
	 * `wp-block` class name set `match_offset = 0`. To find the third
	 * match, set `match_offset = 2`. If not provided the default indication
	 * is to find the first match.
	 *
	 * @default 0
	 * @var int
	 */
	public $match_offset = 0;

	/**
	 * Creates a tag find descriptor given the input parameters specifying
	 * the intended match, encodes inputs for searching.
	 *
	 * @param array|string $query {
	 *     Which tag name to find, having which class, etc.
	 *
	 * @type string|null $tag_name Which tag to find, or `null` for "any tag."
	 * @type int|null $match_offset Find the Nth tag matching all search criteria.
	 *                                   0 for "first" tag, 2 for "third," etc.
	 *                                   Defaults to first tag.
	 * @type string|null $class_name Tag must contain this whole class name to match.
	 * @type array<string|callable>  Tag must contain data-attribute of given name and optionally a given
	 *                                   value, or a given predicate function which returns whether the
	 *                                   attribute's value constitutes a match.
	 * }
	 * @return WP_Tag_Find_Descriptor Used by WP_HTML_Processor when scanning HTML.
	 */
	public static function parse( $query ) {
		$descriptor = new WP_Tag_Find_Descriptor();

		if ( is_array( $query ) ) {
			if ( isset( $query['tag_name'] ) && is_string( $query['tag_name'] ) ) {
				$descriptor->tag_name = WP_HTML_Walker::comparable( $query['tag_name'] );
			}

			if ( isset( $query['match_offset'] ) && is_integer( $query['match_offset'] ) ) {
				$descriptor->match_offset = $query['match_offset'];
			}

			if ( isset( $query['class_name'] ) && is_string( $query['class_name'] ) ) {
				$descriptor->class_pattern = preg_quote( WP_HTML_Walker::comparable( $query['class_name'] ), '~' );
			}
		} elseif ( is_string( $query ) ) {
			$descriptor->tag_name = WP_HTML_Walker::comparable( $query );
		}

		return $descriptor;
	}

	/**
	 * @param string                         $tag
	 * @param array<WP_HTML_Attribute_Token> $attributes
	 *
	 * @return boolean
	 */
	public function matches( $tag, $attributes ) {
		if ( $this->tag_name && WP_HTML_Walker::comparable( $tag ) !== $this->tag_name ) {
			return false;
		}
		if ( $this->class_pattern ) {
			$existing_class = isset( $attributes['class'] ) ? WP_HTML_Walker::comparable( $attributes['class']->value ) : '';
			if ( 1 !== preg_match( "~(?:^|[\t ]){$this->class_pattern}(?:[\t ]|$)~Smui", $existing_class ) ) {
				return false;
			}
		}

		return true;
	}
}

if ( ! function_exists( 'esc_attr' ) ) {
	/**
	 * Mock escaping to enable developing this code outside of WordPress.
	 *
	 * @TODO remove this mock.
	 *
	 * @param string $attr Value.
	 *
	 * @return string Escaped value.
	 */
	function esc_attr( $attr ) {
		return htmlspecialchars( $attr );
	}
}

class WP_HTML_Walker_Exception extends Exception {
}
