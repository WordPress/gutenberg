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
 *
 * IMPORTANT DISCLAIMER: This code is highly experimental and its only purpose
 * is to provide a way to test the server-side rendering of the Interactivity
 * API. Most of this code will be discarded once the HTML Processor is
 * available.  Please restrain from investing unnecessary time and effort trying
 * to improve this code.
 */
class WP_Directive_Processor extends WP_HTML_Tag_Processor {

	/**
	 * An array of root blocks.
	 *
	 * @var array
	 */
	static $root_blocks = array();

	/**
	 * Add a root block to the list.
	 *
	 * @param array $block The block to add.
	 *
	 * @return void
	 */
	public static function add_root_block( $block ) {
			self::$root_blocks[] = md5( serialize( $block ) );
	}

	/**
	 * Check if block is a root block.
	 *
	 * @param array $block The block to check.
	 *
	 * @return bool True if block is a root block, false otherwise.
	 */
	public static function is_root_block( $block ) {
			return in_array( md5( serialize( $block ) ), self::$root_blocks, true );
	}


	/**
	 * Find the matching closing tag for an opening tag.
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
				$depth++;
				continue;
			}

			if ( 0 === $depth ) {
				return true;
			}

			$depth--;
		}

		return false;
	}

	/**
	 * Return the content between two balanced tags.
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

		$start = $this->bookmarks[ $start_name ]->end + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		return substr( $this->html, $start, $end - $start );
	}

	/**
	 * Set the content between two balanced tags.
	 *
	 * When called on an opening tag, set the HTML content found between that
	 * opening tag and its matching closing tag.
	 *
	 * @param string $new_html The string to replace the content between the
	 * matching tags with.
	 *
	 * @return bool            Whether the content was successfully replaced.
	 */
	public function set_inner_html( $new_html ) {
		$this->get_updated_html(); // Apply potential previous updates.

		$bookmarks = $this->get_balanced_tag_bookmarks();
		if ( ! $bookmarks ) {
			return false;
		}
		list( $start_name, $end_name ) = $bookmarks;

		$start = $this->bookmarks[ $start_name ]->end + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		$this->lexical_updates[] = new WP_HTML_Text_Replacement( $start, $end, $new_html );
		return true;
	}

	/**
	 * Return a pair of bookmarks for the current opening tag and the matching
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
	 * Whether a given HTML element is void (e.g. <br>).
	 *
	 * @param string $tag_name The element in question.
	 * @return bool True if the element is void.
	 *
	 * @see https://html.spec.whatwg.org/#elements-2
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
	 * Extract and return the directive type and the the part after the double
	 * hyphen from an attribute name (if present), in an array format.
	 *
	 * Examples:
	 *
	 *     'wp-island'            => array( 'wp-island', null )
	 *     'wp-bind--src'         => array( 'wp-bind', 'src' )
	 *     'wp-thing--and--thang' => array( 'wp-thing', 'and--thang' )
	 *
	 * @param string $name The attribute name.
	 * @return array The resulting array
	 */
	public static function parse_attribute_name( $name ) {
		return explode( '--', $name, 2 );
	}
}
