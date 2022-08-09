<?php
/**
 * HTML Walker: Tag find descriptor class.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.1.0
 */

/**
 * Describes the search conditions for finding a given tag in an HTML document.
 *
 * @since 6.1.0
 *
 * @see WP_HTML_Walker
 */
class WP_HTML_Tag_Find_Descriptor {
	/**
	 * We're looking for an HTML tag of this name, up to the comparable
	 * equivalence of those names (lower-cased, Unicode-normalized, etc...).
	 * If we're looking for "any tag" then this property will be `null`.
	 *
	 * `h1...h6` are special since they are variations of the same base tag.
	 * To find "any heading tag" pass the special value `h`.
	 *
	 * @since 6.1.0
	 * @var string|null
	 */
	private $tag_name;

	/**
	 * We're looking for a tag also containing this CSS class name, up to
	 * the comparable equivalence of those names. If we're not looking for
	 * a class name this property will be `null`.
	 *
	 * @since 6.1.0
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
	 * @since 6.1.0
	 * @var int
	 */
	public $match_offset = 0;

	/**
	 * Creates a tag find descriptor given the input parameters specifying
	 * the intended match, encodes inputs for searching.
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
	 * @return WP_HTML_Tag_Find_Descriptor Used by WP_HTML_Processor when scanning HTML.
	 */
	public static function parse( $query ) {
		static $descriptor = null;
		static $last_query = null;

		if ( $query instanceof WP_HTML_Tag_Find_Descriptor ) {
			return $query;
		}

		if ( null === $descriptor ) {
			$descriptor = new WP_HTML_Tag_Find_Descriptor();
		}

		if ( $last_query === $query ) {
			return $descriptor;
		}

		$last_query = $query;

		// Reset the descriptor, reusing the already-allocated one.
		$descriptor->tag_name      = null;
		$descriptor->class_pattern = null;
		$descriptor->match_offset  = 0;

		if ( is_string( $query ) ) {
			$descriptor->tag_name = WP_HTML_Walker::comparable( $query );
			return $descriptor;
		}

		if ( ! is_array( $query ) ) {
			return $descriptor;
		}

		if ( isset( $query['tag_name'] ) && is_string( $query['tag_name'] ) ) {
			$descriptor->tag_name = WP_HTML_Walker::comparable( $query['tag_name'] );
		}

		if ( isset( $query['match_offset'] ) && is_integer( $query['match_offset'] ) ) {
			$descriptor->match_offset = $query['match_offset'];
		}

		if ( isset( $query['class_name'] ) && is_string( $query['class_name'] ) ) {
			$descriptor->class_pattern = $query['class_name'];
		}

		return $descriptor;
	}

	/**
	 * Checks whether a given tag and its attributes match the search criteria.
	 *
	 * @since 6.1.0
	 *
	 * @param string                    $tag        The name of the tag.
	 * @param WP_HTML_Attribute_Token[] $attributes The attributes for the tag.
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
