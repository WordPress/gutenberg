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
 *  - All the return values from `scan()` are written as if
 *    they are simple string values but they need to be the
 *    structure of the matches.
 *      - [ start, end ] of tag opener structure in source
 *      - [ start,  end ] offset of tag/attribute name in source
 *      - comparable( $name ) of the tag/attribute name
 *      - $value of the attribute value
 *
 *  - Write a comprehensive test suite for various unexpected
 *    quirks and attribute names. Unfortunately we need to have
 *    some fairly robust support because it's not difficult to
 *    create misleading HTML through the block editor. For
 *    example, as can happen with a number of plaintext inputs.
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
	 * Set of modifications to perform on input HTML document, built
	 * via calls to the fluid API exposed by WP_HTML_Processor.
	 *
	 * @var WP_Tag_Modifications
	 */
	public $modifications;


	public function __construct( $input ) {
		$this->scanner = new WP_HTML_Scanner( $input );
		$this->modifications = new WP_Tag_Modifications();
	}


	public function find( $query ) {
		$this->scanner->reset();
		$this->descriptor = WP_Tag_Find_Descriptor::parse( $query );
	}


	public function apply() {
		// find tag
		// apply modifications
		// construct output

		// @TODO: This is a stub; implement the real apply() behavior.
		return $this->scanner->document;
	}


	public function __toString() {
		return $this->apply();
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

		$tag_name = $query['tag_name'];
		$descriptor->tag_name = null !== $tag_name
			? self::comparable( $tag_name )
			: null;

		$match_offset = isset( $query['match_offset'] ) ? $query['match_offset'] : 0;
		$descriptor->match_offset = is_integer( $match_offset )
			? $match_offset
			: 0;

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


	public function needs_only_tag() {
		return $this->class_name === null && $this->data_attribute === null;
	}

	public function needs_class() {
		return $this->class_name !== null;
	}

	public function needs_data_attribute() {
		return $this->data_attribute !== null;
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
	 * Whether we've already found the tag meeting our search constraints.
	 *
	 * @var bool
	 */
	public $did_match = false;


	/**
	 * Whether we've reached the end of the document and failed to find our match.
	 *
	 * @var bool
	 */
	public $did_fail_match = false;


	/**
	 * Byte offset in the current tag being inspected starts, includes leading `<`.
	 *
	 * @var int|null
	 */
	public $tag_start = null;


	/**
	 * Byte offset in the document where the current tag
	 * being analyzed ends, including the trailing `>`.
	 *
	 * @var int|null
	 */
	public $tag_end = null;


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
	 * @var array<WP_HTML_Scanner_Token>
	 */
	public $attributes = array();


	public function __construct( $input ) {
		$this->document = $input;
	}


	public function scan( WP_Tag_Find_Descriptor $descriptor, $found_already = 0 ) {
		if ( $found_already === $descriptor->match_offset ) {
			return $found_already;
		}

		$tag = $this->find_next_tag();
		if ( ! $tag ) {
			return false;
		}

		// @TODO: Are we done matching?

		while ( $attribute = $this->find_next_attribute() ) {
			list( $name, $value ) = $attribute;

			// HTML5 says duplicate values are ignored
			if ( isset( $this->attributes[ $name ] ) ) {
				continue;
			}

			$this->attributes[ $name ] = $value;

			// @TODO: Are we done matching?
		}

		// @TODO: Remove this debugging call.
		var_export( [
			'tag' => $tag,
			'attributes' => $this->attributes
		] );
	}

	public function find_next_tag() {
		if ( 1 !== preg_match(
	"~<!--(?>.*?-->)|<!\[CDATA\[(?>.*?>)|<\?(?>.*?)>|<(?P<TAG>[a-z][^\t\x{0A}\x{0C} />]*)~mui",
			$this->document,
			$tag_match,
			PREG_OFFSET_CAPTURE,
			$this->start_at
		) ) {
			$this->start_at = strlen( $this->document );
			$this->did_fail_match = true;
			return false;
		}

		list( list( $full_match, $start_at ) ) = $tag_match;

		// Keep scanning if we found a comment or CDATA section.
		if ( ! isset( $tag_match['TAG'] ) ) {
			$this->start_at += strlen( $full_match );
			return $this->find_next_tag();
		}

		$this->tag_start = $this->start_at;
		$this->tag_name = WP_HTML_Scanner_Token::from_preg_match( $tag_match['TAG'] );
		$this->start_at += strlen( $full_match );

		return true;
	}


	public function find_next_attribute() {
		// Find the attribute name
		if ( 1 !== preg_match(
			'~[\t\x{0a}\x{0c}\x{0d} ]*(?P<NAME>=?[^/>\t\x{0C} =]*)~miu',
			$this->document,
			$attribute_match,
			PREG_OFFSET_CAPTURE,
			$this->start_at
		) ) {
			return false;
		}

		list( list( $full_match, $start_at ) ) = $attribute_match;
		$name_token = WP_HTML_Scanner_Token::from_preg_match( $attribute_match['NAME'] );

		if ( '=' !== $this->document[ $this->start_at ] ) {
			$this->start_at += strlen( $full_match );
			return new WP_HTML_Attribute_Token( $name_token, null, $name_token->start, $start_at + strlen( $full_match ) );
		}

		$this->start_at += strlen( $full_match );

		// Skip the equals sign (we already returned if it's not there).
		// Find the attribute value
		$this->start_at += 1;
		switch ( $this->document[ $this->start_at ] ) {
			case '"':
				$this->start_at += 1;
				$pattern = '~(?P<VALUE>[^"]*)"~';
				break;

			case "'":
				$this->start_at += 1;
				$pattern = "~(?P<VALUE>[^']*)'~";
				break;

			default:
				$pattern = '~(?P<VALUE>[^\t\x{0a}\x{0c}\x{0d} />]*)~';
				break;
		}

		if ( 1 != preg_match(
			$pattern,
			$this->document,
			$value_match,
			PREG_OFFSET_CAPTURE,
			$this->start_at
		) ) {
			// The end of the token is one after the end of the name because we found an `=`, implying the value is empty.
			return new WP_HTML_Attribute_Token( $name_token, null, $name_token->start, $name_token->start + $name_token->length + 1 );
		}

		list( list( $full_match, $value_start_at ) ) = $value_match;
		$value_token = WP_HTML_Scanner_Token::from_preg_match( $value_match['VALUE'] );
		$this->start_at += strlen( $full_match );

		return new WP_HTML_Attribute_Token( $name_token, $value_token, $start_at, $value_start_at + strlen( $full_match ) );
	}

	public function reset() {
		$this->tag_name = null;
		$this->attributes = array();
		$this->did_match = false;
		$this->tag_start = null;
	}
}


class WP_Tag_Modifications {
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
	public $class_changes;


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
	 *     list( $start, $end, $old_value ) = $attributes['src'];
	 *     $modifications[] = array( $start, $end, get_the_post_thumbnail_url() );
	 *
	 *     // Correspondingly, something like this
	 *     // will appear in the replacements array.
	 *     $replacements = array(
	 *         array( 14, 28, 'https://my-site.my-domain/wp-content/uploads/2014/08/kittens.jpg' )
	 *     );
	 * </code>
	 *
	 * @var array<int|string>
	 */
	public $replacements;
}
