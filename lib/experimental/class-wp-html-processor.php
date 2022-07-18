<?php

/**
 * Processes an input HTML document by applying a specified set
 * of patches to that input. Tokenizes HTML but does not fully
 * parse the input document.
 */
class WP_HTML_Processor {
	/**
	 * Input HTML document to process set by constructor.
	 *
	 * Example:
	 * <code>
	 *     $processor = new WP_HTML_Processor( '<div class="wp-block-group">Content</div>' );
	 * </code>
	 *
	 * @var string
	 */
	public $input;


	/**
	 * Describes the constraints imposed on the HTML tag we're trying to match.
	 *
	 * @see WP_Tag_Find_Descriptor::parse()
	 *
	 * @var WP_Tag_Find_Descriptor
	 */
	public $descriptor;


	/**
	 * Set of modifications to perform on input HTML document, built
	 * via calls to the fluid API exposed by WP_HTML_Processor.
	 *
	 * @var WP_Tag_Modifications
	 */
	public $modifications;


	public function __construct( $input ) {
		$this->input = $input;
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


class WP_Tag_Finder_Tag {
	/**
	 * The matched tag name within an HTML tag match.
	 *
	 * @var string
	 */
	public $tag_name;

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
	 * @var array<int|string>
	 */
	public $attributes;
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
