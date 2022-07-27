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
 * @TODO:
 *  - Write a comprehensive test suite for various unexpected
 *    quirks and attribute names. Unfortunately we need to have
 *    some fairly robust support because it's not difficult to
 *    create misleading HTML through the block editor. For
 *    example, as can happen with a number of plaintext inputs.
 *  - Cleanup comparable copies so strings people add, such as
 *    with add_class(), get pasted verbatim into the output
 *    even though we use the comparable to d-duplicate entries.
 *    Same goes for the attribute names - we don't want to
 *    modify what we don't need to.
 *
 * Performance ideas:
 *
 * It may be possible that we're thrashing the garbage collector by
 * allocating new classes for each tag and attribute token as we
 * scan through the input document. If this is the case we could
 * try pre-allocating a certain number of token class instances and
 * reuse those upon scanning each new tag. This would incur a fixed
 * memory cost but in addition to lowering the pressure on the
 * garbage collector we might end up having more efficient use of
 * localized data within the processor cache.
 *
 * If we can pick up scanning where we leave off, we can stop parsing
 * within a tag opener as soon as we meet all the query constraints.
 * If we need to set an attribute we haven't yet seen then we would
 * need to continue scanning to the end of that tag opener until we
 * find the existing attribute or know it's not there. This could
 * avoid parsing large attributes, such as one with a long data-URI.
 *
 * Defer creating comparable values until we need them so we don't
 * eagerly allocate and convert string values we don't ever read.
 *
 * Classes are passed by reference by default, but are we missing
 * opportunities to pass by reference when we are copying by value?
 */


/**
 * Processes an input HTML document by applying a specified set
 * of patches to that input. Tokenizes HTML but does not fully
 * parse the input document.
 */
class WP_HTML_Processor {
	/**
	 * Describes the constraints imposed on the HTML tag we're trying to match.
	 *
	 * @see WP_Tag_Find_Descriptor::parse()
	 *
	 * @var WP_Tag_Find_Descriptor
	 */
	public $descriptor;


	/**
	 * Scans the HTML document, keeping track of its own state.
	 *
	 * @var WP_HTML_Scanner
	 */
	public $scanner;


	/**
	 * Which class names to add or remove from a tag.
	 * If `true` then add and if `false` then remove.
	 *
	 * These are tracked separately from attribute updates
	 * because they are semantically distinct, whereas this
	 * interface exists for the common case of adding and
	 * removing class names while other attributes are
	 * generally modified as with DOM `setAttribute` calls.
	 *
	 * When modifying an HTML document these will eventually
	 * be collapsed into a single lexical update to replace
	 * the `class` attribute.
	 *
	 * Example:
	 * <code>
	 *     // Add the `wp-block-group` class, remove the `wp-group` class.
	 *     $class_changes = array( 'wp-block-group' => true, 'wp-group' => false );
	 * </code>
	 *
	 * @var array<boolean>
	 */
	public $class_changes = array();


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
	private $replacements;
	private $r_index = 0;


	public function __construct( $input ) {
		$this->scanner = new WP_HTML_Scanner( $input );
		$this->replacements = new SplFixedArray(20);
	}


	public function find( $query ) {
		$this->commit_class_changes();
		$this->descriptor = $query instanceof WP_Tag_Find_Descriptor
			? $query
			: WP_Tag_Find_Descriptor::parse( $query );

		if ( false === $this->scanner->scan( $this->descriptor ) ) {
			return false;
		}

		return $this;
	}


	private function add_attribute( $name, $value ) {
		$tag_name = $this->scanner->tag_name;
		$insert_at = $tag_name->start + $tag_name->length;

		$this->insert_replacement( new WP_Text_Replacement(
			$insert_at,
			$insert_at,
			' ' . self::serialize_attribute( $name, $value )
		) );

		return $this;
	}


	public function add_class( $class_name ) {
		$this->class_changes[ $class_name ] = true;
	}


	public function set_attribute( $name, $value ) {
		if ( ! array_key_exists( WP_Tag_Find_Descriptor::comparable( $name ), $this->scanner->attributes ) ) {
			return $this->add_attribute( $name, $value );
		}

		$existing = $this->scanner->attributes[ $name ];

		$this->insert_replacement( new WP_Text_Replacement(
			$existing->attribute_start,
			$existing->attribute_end,
			self::serialize_attribute( $name, $value )
		) );
	}


	public function remove_class( $class_name ) {
		$this->class_changes[ $class_name ] = false;
	}


	public function remove_attribute( $name ) {
		if ( ! array_key_exists( $name, $this->scanner->attributes ) ) {
			return $this;
		}

		$existing = $this->scanner->attributes[ $name ];

		$this->insert_replacement( new WP_Text_Replacement(
			$existing->attribute_start,
			$existing->attribute_end,
			''
		) );
	}


	private static function serialize_attribute( $name, $value ) {
		$value = str_replace( '"', "&quot;", $value );

		return "{$name}=\"{$value}\"";
	}


	private function commit_class_changes() {
		if ( empty( $this->class_changes ) ) {
			return;
		}

		$existing_class = array_key_exists( 'class', $this->scanner->attributes )
			? substr(
				$this->scanner->document,
				$this->scanner->attributes['class']->value->start,
				$this->scanner->attributes['class']->value->length
			)
			: '';

		// Remove unwanted classes.
		$new_class = preg_replace_callback(
			'~(?:^|[ \t])([^ \t]+)~miu',
			function ( $matches ) {
				list( $full_match, $class_name ) = $matches;

				$comparable_name = WP_Tag_Find_Descriptor::comparable( $class_name );
				if (
					 array_key_exists( $comparable_name, $this->class_changes ) &&
					 false === $this->class_changes[ $comparable_name ]
				) {
					 return '';
				}

				return $full_match;
			},
			$existing_class
		);

		// Add new classes.
		foreach ( $this->class_changes as $class => $should_include ) {
			if ( $should_include ) {
				$new_class .= " {$class}";
			}
		}

		$this->set_attribute( 'class', trim( $new_class ) );
		$this->class_changes = array();
	}


	/**
	 * Registers a new lexical replacement for the input document,
	 * maintains proper ordering of replacements for later substitution.
	 *
	 * Replacements need to be applied in the order in which their start
	 * byte offset first appears in the input document. This insertion
	 * function maintains that order on insertion. We can note that for
	 * most of our expected replacements they will appear already in the
	 * correct order or they will should be inserted within the last few
	 * items of the replacements array. This is because for each tag we
	 * scan, all of the replacements for that tag will follow all of the
	 * replacements for the previous tag, and only those replacements for
	 * a given tag which are listed in a different order than the HTML
	 * attributes appear in the source document will need to be sorted.
	 *
	 * Doing this here removes the need to sort the entire array of
	 * replacements at the end, which for operations with many
	 * replacements can take up a substantial portion of the runtime.
	 *
	 * @see $this->apply()
	 *
	 * @param WP_Text_Replacement $replacement The new lexical replacement to register on the input document.
	 */
	private function insert_replacement( WP_Text_Replacement $replacement ) {
		$replacements = $this->replacements;

		$old_size = $replacements->getSize();
		if ( $this->r_index === $old_size ) {
			$new_size = floor( $old_size * 1.4 );
			$replacements->setSize( $new_size );
		}

		$this->replacements[ $this->r_index++ ] = $replacement;
		$i = $c = $this->r_index - 1;
		while ( $i > 0 && $this->replacements[ $i ]->start < $this->replacements[ $i - 1 ]->start ) {
			$this->replacements[ $i ] = $this->replacements[ $i - 1 ];
			$i--;
		}

		if ( $i < $c ) {
			$this->replacements[ $i ] = $replacement;
		}
	}


	private function apply() {
		$document = $this->scanner->document;

		$this->commit_class_changes();

		if ( empty( $this->replacements ) ) {
			return $document;
		}

		$output = '';
		$at = 0;
		for ( $i = 0; $i < $this->r_index; $i++ ) {
			$replacement = $this->replacements[ $i ];

			if ( $replacement->start > $at ) {
				$output .= substr( $document, $at, $replacement->start - $at );
			}

			$output .= $replacement->text;
			$at = $replacement->end;
		}

		$output .= substr( $document, $at );
		return $output;
	}


	public function __toString() {
		return $this->apply();
	}
}


class WP_Text_Replacement {
	/** @var int Byte offset into document where replacement span begins. */
	public $start;

	/** @var int Byte offset into document where replacement span ends. */
	public $end;

	/** @var string Span of text to insert in document to replace existing content from start to end. */
	public $text;

	public function __construct( $start, $end, $text ) {
		$this->start = $start;
		$this->end   = $end;
		$this->text  = $text;
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
	 * h1...h6 are special since they are variations of the same base tag.
	 * To find "any heading tag" pass the special value `h`.
	 *
	 * @var string|null
	 */
	public $tag_name;


	/**
	 * We're looking for a tag also containing this CSS class name, up to
	 * the comparable equivalence of those names. If we're not looking for
	 * a class name this property will be `null`.
	 *
	 * @var string|null
	 */
	public $class_name;


	/**
	 * We're looking for a tag that also has some data-attribute values.
	 * If all we care about is the presence of one of those values this
	 * will contain the name of that attribute, up to the comparable
	 * equivalence of that name. If we also want to constrain the value
	 * of that attribute we will have a pair containing the name of the
	 * attribute (to equivalence) with a predicate function. If we're
	 * not looking for a data-attribute this property will be `null`.
	 *
	 * Example:
	 * <code>
	 *     // has a `data-wp-container` attribute
	 *     'data-wp-container'
	 *
	 *     // has a `data-wp-container` attribute with the value `core/group`
	 *     ['data-wp-block', 'core/group']
	 *
	 *     // has a `data-test-group` attribute with an even-valued id
	 *     ['data-test-group', function ( $group ) { return 0 === (int) $group % 2; }]
	 * </code>
	 *
	 * @var array<string|callable>
	 */
	public $data_attribute;


	/**
	 * Used to skip matches in case we expect more than one to exist.
	 * This constraint applies after all other constraints have held.
	 * For example, to find the third `<div>` tag containing the
	 * `wp-block` class name set `match_offset = 3`. If not provided
	 * the default indication is to find the first match.
	 *
	 * @default 1
	 * @var int
	 */
	public $match_offset;


	/**
	 * Creates a tag find descriptor given the input parameters specifying
	 * the intended match, encodes inputs for searching.
	 *
	 * @param array $query {
	 *     Which tag name to find, having which class, etc…
	 *
	 *     @type string|null $tag_name   Which tag to find, or `null` for "any tag," or `h` for "any h1 through h6."
	 *     @type int|null $match_offset  Find the Nth tag matching all search criteria.
	 *                                   1 for "first" tag, 3 for "third," etc.
	 *                                   Defaults to first tag.
	 *     @type string|null $class_name Tag must contain this whole class name to match.
	 *     @type array<string|callable>  Tag must contain data-attribute of given name and optionally a given
	 *                                   value, or a given predicate function which returns whether the
	 *                                   attribute's value constitutes a match.
	 * }
	 * @return WP_Tag_Find_Descriptor Used by WP_HTML_Processor when scanning HTML.
	 */
	public static function parse( $query ) {
		$descriptor = new WP_Tag_Find_Descriptor();

		$descriptor->tag_name = isset( $query['tag_name'] )
			? self::comparable( $query['tag_name'] )
			: null;

		$match_offset = isset( $query['match_offset'] ) ? $query['match_offset'] : 1;
		$descriptor->match_offset = is_integer( $match_offset )
			? $match_offset
			: 1;

		$containing_class = isset( $query['class_name'] ) ? $query['class_name'] : null;
		$descriptor->class_name = is_string( $containing_class )
			? self::comparable( $containing_class )
			: null;

		$data_attribute = isset( $query['data_attribute'] ) ? $query['data_attribute'] : null;
		if ( is_string( $data_attribute ) ) {
			$descriptor->data_attribute = $data_attribute;
		} elseif ( is_array( $data_attribute ) && is_string( $data_attribute[0] ) && ( is_callable( $data_attribute[1] ) || function_exists( $data_attribute[1] ) ) ) {
			$descriptor->data_attribute = $data_attribute;
		} else {
			$descriptor->data_attribute = null;
		}

		return $descriptor;
	}


	public static function comparable( $input ) {
		return strtolower( trim( $input ) );
	}

	/**
	 * @param string $tag
	 * @param array<WP_HTML_Attribute_Token> $attributes
	 * @return 'matches'|'cannot-match'|'might-match'|'not-implemented'
	 */
	public function check( $tag, $attributes ) {
		// @TODO Special-case h1..h6 here
		if ( $this->tag_name !== null && $this->tag_name !== $tag ) {
			return 'cannot-match';
		}

		if ( null === $this->class_name && null === $this->data_attribute ) {
			return 'matches';
		}

		if ( null === $this->data_attribute && isset( $attributes['class'] ) ) {
			// @TODO: Avoid this nested if
			if ( null === $attributes['class']->value ) {
				return false;
			}

			$pattern_class = preg_quote( $this->class_name, '~' );
			return 1 === preg_match( "~(?:^|[\t ]){$pattern_class}(?:[\t ]|$)~Smui", $attributes['class']->value->comparable );
		}

		if ( null === $this->class_name ) {
			return 'not-implemented';
		}

		return 'might-match';
	}
}


class WP_HTML_Scanner_Token {
	/**
	 * The starting byte offset in some document where the token was found.
	 *
	 * @var int
	 */
	public $start;

	/**
	 * The byte length of the token in the source document.
	 *
	 * @var int
	 */
	public $length;

	/**
	 * Comparable value of the token
	 *
	 * @var string|null
	 */
	public $comparable = null;

	public function __construct( $start, $length, $comparable ) {
		$this->start = $start;
		$this->length = $length;
		$this->comparable = $comparable;
	}

	/**
	 * Converts a `preg_match()` result with PREG_OFFSET_CAPTURE
	 * into a token pair of start-offset and length.
	 *
	 * This class exists to disambiguate alternative ways we could
	 * be representing a pattern match, and it holds a lazy
	 * reference to a comparable value to the parsed token.
	 *
	 * @param $preg_match
	 * @return self
	 */
	public static function from_preg_match( $preg_match ) {
		list( $source_value, $starts_at ) = $preg_match;

		return new self( $starts_at, strlen( $source_value ), WP_Tag_Find_Descriptor::comparable( $source_value ) );
	}
}


class WP_HTML_Attribute_Token {
	/**
	 * @var WP_HTML_Scanner_Token
	 */
	public $name;

	/**
	 * @var WP_HTML_Scanner_Token|null
	 */
	public $value;

	/**
	 * @var int
	 */
	public $attribute_start;

	/**
	 * @var int
	 */
	public $attribute_end;

	public function __construct( $name, $value, $start, $end ) {
		$this->name            = $name;
		$this->value           = $value;
		$this->attribute_start = $start;
		$this->attribute_end   = $end;
	}
}


class WP_HTML_Scanner {
	/**
	 * Input HTML document we're processing.
	 *
	 * @var string
	 */
	public $document;


	/**
	 * Byte offset in the input document we will start or continue parsing.
	 *
	 * @var int
	 */
	public $start_at = 0;


	/**
	 * Byte offset in the current tag being inspected starts, includes leading `<`.
	 *
	 * @var int|null
	 */
	public $tag_start = null;


	/**
	 * Start and end of matched tag name, or `null` if not yet found.
	 *
	 * @var WP_HTML_Scanner_Token|null
	 */
	public $tag_name = null;

	/**
	 * Lazily-built index of found attributes within an HTML tag match.
	 *
	 * Example:
	 * <code>
	 *     // supposing the parser is working through this content
	 *     // and stops after recognizing the `id` attribute
	 *     // <div id="test-4" class=outline title="data:text/plain;base64=asdk3nk1j3fo8">
	 *     //                 ^ parsing will continue from this point
	 *     $this->attributes = array(
	 *         'id' => array( 6, 17, 'test-4' )
	 *     );
	 *
	 *     // when picking up parsing again, or when asking to find the
	 *     // `class` attribute we will continue and add to this array
	 *     $this->attributes = array(
	 *         'id' => array( 6, 17, 'test-4' ),
	 *         'class' => array( 18, 32, 'outline' )
	 *     );
	 * </code>
	 *
	 * @var array<WP_HTML_Attribute_Token>
	 */
	public $attributes = array();


	public function __construct( $input ) {
		$this->document = $input;
	}


	public function scan( WP_Tag_Find_Descriptor $descriptor, $found_already = 0, $tag = null ) {
		if ( $found_already === $descriptor->match_offset ) {
			return $tag;
		}

		$tag = $this->find_next_tag();
		if ( ! $tag ) {
			return false;
		}

		// @TODO: Are we done matching?
		while ( $attribute = $this->find_next_attribute() ) {
			// HTML5 says duplicate values are ignored
			if ( ! array_key_exists( $attribute->name->comparable, $this->attributes ) ) {
				$this->attributes[ $attribute->name->comparable ] = $attribute;
			}
		}

		$does_match = 'matches' === $descriptor->check( $tag->comparable, $this->attributes );
		$found_this_time = $does_match ? 1 : 0;

		return $this->scan( $descriptor, $found_already + $found_this_time, $tag );
	}

	/**
	 * @return WP_HTML_Scanner_Token|false
	 */
	private function find_next_tag() {
		// @TODO: Handle <DOCTYPE>
		if ( 1 !== preg_match(
			/*
			 * Unfortunately we can't try to search for only the tag name we want because that might
			 * lead us to skip over other tags and lose track of our place. So we need to search for
			 * _every_ tag and then check after we find one if it's the one we are looking for.
			 */
	"~<!--(?>.*?-->)|<!\[CDATA\[(?>.*?\]\]>)|<\?(?>.*?)>|<(?P<TAG>[a-z][^\t\x{0A}\x{0C} /?>]*)~Smui",
			$this->document,
			$tag_match,
			PREG_OFFSET_CAPTURE,
			$this->start_at
		) ) {
			return false;
		}

		list( $full_match, $start_at ) = $tag_match[0];

		// Keep scanning if we found a comment or CDATA section.
		if ( ! isset( $tag_match['TAG'] ) ) {
			$this->start_at = $start_at + strlen( $full_match );
			return $this->find_next_tag();
		}

		$this->start_at = $start_at + strlen( $full_match );
		$this->tag_name = WP_HTML_Scanner_Token::from_preg_match( $tag_match['TAG'] );
		$this->tag_start = $this->tag_name->start - 1; // rewind past the leading `<`
		$this->attributes = array();

		return $this->tag_name;
	}


	private function find_next_attribute() {
		// Find the attribute name
		if ( 1 !== preg_match(
			'~[\t\x{0a}\x{0c} ]*(?P<NAME>=?[^=/>\t\x{0A}\x{0C} ]*)~Smiu',
			$this->document,
			$attribute_match,
			PREG_OFFSET_CAPTURE,
			$this->start_at
		) ) {
			return false;
		}

		list( $full_match, $start_at ) = $attribute_match[0];

		if ( empty( $full_match ) ) {
			return false;
		}

		$name_token = WP_HTML_Scanner_Token::from_preg_match( $attribute_match['NAME'] );

		$this->start_at = $start_at + strlen( $full_match );
		if ( '=' !== $this->document[ $this->start_at ] ) {
			return new WP_HTML_Attribute_Token( $name_token, null, $name_token->start, $start_at + strlen( $full_match ) );
		}

		// Skip the equals sign (we already returned if it's not there).
		// Find the attribute value
		$this->start_at += 1;
		switch ( $this->document[ $this->start_at ] ) {
			case '"':
				$this->start_at += 1;
				$pattern = '~(?P<VALUE>[^"]*)"~Smiu';
				break;

			case "'":
				$this->start_at += 1;
				$pattern = "~(?P<VALUE>[^']*)'~Smiu";
				break;

			default:
				$pattern = '~(?P<VALUE>[^\t\x{0a}\x{0c} >]*)~Smiu';
				break;
		}

		if ( 1 !== preg_match(
			$pattern,
			$this->document,
			$value_match,
			PREG_OFFSET_CAPTURE,
			$this->start_at
		) ) {
			// The end of the token is one after the end of the name because we found an `=`, implying the value is empty.
			return new WP_HTML_Attribute_Token( $name_token, null, $name_token->start, $name_token->start + $name_token->length + 1 );
		}

		list( $full_match, $value_start_at ) = $value_match[0];
		$value_token = WP_HTML_Scanner_Token::from_preg_match( $value_match['VALUE'] );
		$this->start_at = $value_start_at + strlen( $full_match );

		return new WP_HTML_Attribute_Token( $name_token, $value_token, $name_token->start, $value_start_at + strlen( $full_match ) );
	}
}
