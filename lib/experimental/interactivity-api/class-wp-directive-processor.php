<?php
/**
 * WP_Directive_Processor class
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

if ( class_exists( 'WP_Directive_Processor' ) ) {
	return;
}

/**
 * This processor is built on top of the HTML Tag Processor and augments its
 * capabilities to process the Interactivity API directives.
 */
class WP_Directive_Processor extends Gutenberg_HTML_Tag_Processor_6_5 {
	/**
	 * String containing the current root block.
	 *
	 * @var string
	 */
	public static $root_block = null;

	/**
	 * Array containing the direct children of interactive blocks.
	 *
	 * @var array
	 */
	public static $children_of_interactive_block = array();

	/**
	 * Sets the current root block.
	 *
	 * @param array $block The block to add.
	 */
	public static function mark_root_block( $block ) {
		if ( null !== $block['blockName'] ) {
			self::$root_block = $block['blockName'] . md5( serialize( $block ) );
		} else {
			self::$root_block = md5( serialize( $block ) );
		}
	}

	/**
	 * Resets the root block.
	 */
	public static function unmark_root_block() {
		self::$root_block = null;
	}

	/**
	 * Checks if block is a root block.
	 *
	 * @param array $block The block to check.
	 * @return bool True if block is a root block, false otherwise.
	 */
	public static function is_marked_as_root_block( $block ) {
		// If self::$root_block is null, is impossible that any block has been marked as root.
		if ( is_null( self::$root_block ) ) {
			return false;
		}
		// Blocks whose blockName is null are specifically intended to convey - "this is a freeform HTML block."
		if ( null !== $block['blockName'] ) {
			return str_contains( self::$root_block, $block['blockName'] ) && $block['blockName'] . md5( serialize( $block ) ) === self::$root_block;
		}
		return md5( serialize( $block ) ) === self::$root_block;
	}

	/**
	 * Checks if a root block has already been defined.
	 *
	 * @return bool True if there is a root block, false otherwise.
	 */
	public static function has_root_block() {
		return isset( self::$root_block );
	}

	/**
	 * Stores a reference to a direct children of an interactive block to be able
	 * to identify it later.
	 *
	 * @param array $block The block to add.
	 */
	public static function mark_children_of_interactive_block( $block ) {
		self::$children_of_interactive_block[] = md5( serialize( $block ) );
	}

	/**
	 * Checks if block is marked as children of an interactive block.
	 *
	 * @param array $block The block to check.
	 * @return bool True if block is a children of an interactive block, false otherwise.
	 */
	public static function is_marked_as_children_of_interactive_block( $block ) {
		return in_array( md5( serialize( $block ) ), self::$children_of_interactive_block, true );
	}

	/**
	 * Finds the matching closing tag for an opening tag.
	 *
	 * When called while on an open tag, traverse the HTML until we find the
	 * matching closing tag, respecting any in-between content, including nested
	 * tags of the same name. Return false when called on a closing or void tag,
	 * or if no matching closing tag was found.
	 *
	 * @return bool Whether a matching closing tag was found.
	 */
	public function next_balanced_closer() {
		$depth = 0;

		$tag_name = $this->get_tag();

		if ( self::is_html_void_element( $tag_name ) ) {
			return false;
		}

		while ( $this->next_tag(
			array(
				'tag_name'    => $tag_name,
				'tag_closers' => 'visit',
			)
		) ) {
			if ( ! $this->is_tag_closer() ) {
				++$depth;
				continue;
			}

			if ( 0 === $depth ) {
				return true;
			}

			--$depth;
		}

		return false;
	}

	/**
	 * Returns the content between two balanced tags.
	 *
	 * When called on an opening tag, return the HTML content found between that
	 * opening tag and its matching closing tag.
	 *
	 * @return string The content between the current opening and its matching
	 * closing tag.
	 */
	public function get_inner_html() {
		$bookmarks = $this->get_balanced_tag_bookmarks();
		if ( ! $bookmarks ) {
			return false;
		}
		list( $start_name, $end_name ) = $bookmarks;

		$start = $this->bookmarks[ $start_name ]->start + $this->bookmarks[ $start_name ]->length + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		return substr( $this->html, $start, $end - $start );
	}

	/**
	 * Sets the content between two balanced tags.
	 *
	 * When called on an opening tag, set the HTML content found between that
	 * opening tag and its matching closing tag.
	 *
	 * @param string $new_html The string to replace the content between the
	 * matching tags with.
	 * @return bool            Whether the content was successfully replaced.
	 */
	public function set_inner_html( $new_html ) {
		$this->get_updated_html(); // Apply potential previous updates.

		$bookmarks = $this->get_balanced_tag_bookmarks();
		if ( ! $bookmarks ) {
			return false;
		}
		list( $start_name, $end_name ) = $bookmarks;

		$start = $this->bookmarks[ $start_name ]->start + $this->bookmarks[ $start_name ]->length + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		$this->lexical_updates[] = new Gutenberg_HTML_Text_Replacement_6_5( $start, $end - $start, $new_html );
		return true;
	}

	/**
	 * Returns a pair of bookmarks for the current opening tag and the matching
	 * closing tag.
	 *
	 * @return array|false A pair of bookmarks, or false if there's no matching
	 * closing tag.
	 */
	public function get_balanced_tag_bookmarks() {
		$i = 0;
		while ( array_key_exists( 'start' . $i, $this->bookmarks ) ) {
			++$i;
		}
		$start_name = 'start' . $i;

		$this->set_bookmark( $start_name );
		if ( ! $this->next_balanced_closer() ) {
			$this->release_bookmark( $start_name );
			return false;
		}

		$i = 0;
		while ( array_key_exists( 'end' . $i, $this->bookmarks ) ) {
			++$i;
		}
		$end_name = 'end' . $i;
		$this->set_bookmark( $end_name );

		return array( $start_name, $end_name );
	}

	/**
	 * Checks whether a given HTML element is void (e.g. <br>).
	 *
	 * @see https://html.spec.whatwg.org/#elements-2
	 *
	 * @param string $tag_name The element in question.
	 * @return bool True if the element is void.
	 */
	public static function is_html_void_element( $tag_name ) {
		switch ( $tag_name ) {
			case 'AREA':
			case 'BASE':
			case 'BR':
			case 'COL':
			case 'EMBED':
			case 'HR':
			case 'IMG':
			case 'INPUT':
			case 'LINK':
			case 'META':
			case 'SOURCE':
			case 'TRACK':
			case 'WBR':
				return true;

			default:
				return false;
		}
	}

	/**
	 * Extracts and return the directive type and the the part after the double
	 * hyphen from an attribute name (if present), in an array format.
	 *
	 * Examples:
	 *
	 *     'wp-island'            => array( 'wp-island', null )
	 *     'wp-bind--src'         => array( 'wp-bind', 'src' )
	 *     'wp-thing--and--thang' => array( 'wp-thing', 'and--thang' )
	 *
	 * @param string $name The attribute name.
	 * @return array The resulting array.
	 */
	public static function parse_attribute_name( $name ) {
		return explode( '--', $name, 2 );
	}

	/**
	 * Parse and extract the namespace and path from the given value.
	 *
	 * If the value contains a JSON instead of a path, the function parses it
	 * and returns the resulting array.
	 *
	 * @param string $value Passed value.
	 * @param string $ns Namespace fallback.
	 * @return array The resulting array
	 */
	public static function parse_attribute_value( $value, $ns = null ) {
		$matches = array();
		$has_ns  = preg_match( '/^([\w\-_\/]+)::(.+)$/', $value, $matches );

		/*
		 * Overwrite both `$ns` and `$value` variables if `$value` explicitly
		 * contains a namespace.
		 */
		if ( $has_ns ) {
			list( , $ns, $value ) = $matches;
		}

		/*
		 * Try to decode `$value` as a JSON object. If it works, `$value` is
		 * replaced with the resulting array. The original string is preserved
		 * otherwise.
		 *
		 * Note that `json_decode` returns `null` both for an invalid JSON or
		 * the `'null'` string (a valid JSON). In the latter case, `$value` is
		 * replaced with `null`.
		 */
		$data = json_decode( $value, true );
		if ( null !== $data || 'null' === trim( $value ) ) {
			$value = $data;
		}

		return array( $ns, $value );
	}
}
