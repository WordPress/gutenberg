<?php
/**
 * Scans through an HTML document to find specific tags, then
 * transforms those tags by adding, removing, or updating the
 * values of the HTML attributes within that tag (opener).
 * Furthermore finds the matching closing tag for a given
 * opening tag, and retrieves the content in between them.
 *
 * @TODO: Handle self-closing foreign elements.
 * @TODO: Detect non-normative HTML input.
 * @TODO: Consider parsing non-normative HTML input, support adoption agency algorithm.
 * @TODO: Figure out how multiple external states can conflict.
 *
 * If we support non-normative HTML we can probably handle significantly more
 * HTML without introducing unexpected results, but I'm not sure yet if we can
 * handle HTML the same way as the browser, because the section in HTML5 spec
 * dealing with errors is itself "non-normative" and only issues a few examles.
 *
 * Not yet clear is if browsers are full of special one-off cases for "invalid"
 * input. E.g. it's clear to me how to handle `</b></b></b>` but not clear to how
 * handle `</p></p></p>` given that `<b>` is a formatting element but `<p>` is
 * not, that `<p>` itself is a special element.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.2.0
 */

/**
 * Processes an input HTML document by applying a specified set of patches
 * to that input. Retrieves content between matching opening and closing tags.
 * Tokenizes HTML but does not fully parse the input document.
 *
 * ## Usage
 *
 * Note that this is a subclass of `WP_HTML_Tag_Processor`. Most of the
 * functionality of this class is thus covered by `WP_HTML_Tag_Processor`'s
 * documentation.
 * The following documentation covers the additional features added by
 * `WP_HTML_Processor`.
 *
 * ### Retrieving content
 *
 * When on an opening tag, it's possible to retrieve the content enclosed between
 * that opening tag and its matching closing tag.
 *
 * Example:
 * ```php
 *     $html = '<div id="outer"><div>Inner div content</div><img></div>';
 *     $tags = new WP_HTML_Processor( $html );
 *     $tags->next_tag( [ 'tag_name' => 'div' ];
 *     $label = $tags->get_content_inside_balanced_tags();
 *     // $label === '<div>Inner div content</div><img>'
 *     }
 * ```
 *
 * @see WP_HTML_Tag_Processor
 */
class WP_HTML_Processor extends WP_HTML_Tag_Processor {
	/**
	 * Create a new tracking state for, based on the current opening tag.
	 *
	 * @return WP_HTML_Processor_Scan_State
	 */
	public function new_state() {
		$state    = new WP_HTML_Processor_Scan_State();
		$tag_name = $this->get_tag();

		if ( ! self::is_html_void_element( $tag_name ) && ! $this->is_tag_closer() ) {
			$state->open_tags[] = $tag_name;
		}

		return $state;
	}

	/**
	 * Find the matching closing tag for an opening tag.
	 *
	 * When called while on an open tag, move to the matching closing tag,
	 * respecting any in-between content, including nested tags of the same
	 * name. Return false when called on a closing or void tag, or if no
	 * matching closing tag was found.
	 *
	 * @param WP_HTML_Processor_Scan_State $state Tracking state.
	 * @param array|string                 $query Query criteria for the closing tag.
	 * @return bool                        True if a matching closing tag was found.
	 *
	 * @see WP_HTML_Tag_Processor::parse_query
	 */
	public function balanced_next( WP_HTML_Processor_Scan_State $state, $query = null ) {
		while ( $this->next_tag( array( 'tag_closers' => 'visit' ) ) && $state->budget-- > 0 ) {
			$tag_name  = $this->get_tag();
			$is_closer = $this->is_tag_closer();
			$is_void   = self::is_html_void_element( $tag_name );
			$type      = self::classify_tag_type( $is_closer, $is_void );

			/*
			 * Step 1. Update the stack of open tags.
			 *
			 * If and when we add more complete HTML parsing support we will also
			 * need to track the stack of active formats so that we can properly
			 * handle missing tags and overlapping tags.
			 */

			switch ( $type ) {
				case 'void':
					/*
					 * Void tags (such as <img>) can't have children and so we
					 * won't push or pop them from the stack of open tags.
					 *
					 * If and when we support self-closing foreign tags we would
					 * need to separately track those, but their behavior matches
					 * this case. The self-closing flag is ignored for HTML5 tags.
					 */
					if ( 0 === $state->relative_depth() ) {
						return false;
					}

					break;

				case 'opener':
					$state->open_tags[] = $tag_name;
					break;

				case 'closer':
					$last_tag = array_pop( $state->open_tags );

					/*
					 * Currently we can only support fully-normative and balanced HTML5.
					 * If we encounter anything we don't expect then we will bail. In a
					 * future update we may perform more careful HTML parsing and unlock
					 * navigating through non-normative documents.
					 */
					if ( $last_tag !== $tag_name ) {
						return false;
					}

					/*
					 * Step 2. Bail if we've reached the end of the tag in which we started.
					 */
					if ( 0 === $state->relative_depth() ) {
						return false;
					}

					break;
			}

			/*
			 * Void elements don't enter the stack, but they do exist in the
			 * depth hierarchy, so we have to temporarily account for that.
			 *
			 * We could have followed the approach in the HTML5 spec by appending
			 * the void tag to the stack of open tags, and then remember to pop it
			 * when existing this function, but by tracking it like this we don't
			 * have to remember to do that.
			 */
			$depth = 'void' === $type
				? $state->relative_depth() + 1
				: $state->relative_depth();

			/*
			 * Step 3. Determine if we have a matching tag. In addition to the query
			 * we pass along to the underlying tag processor we're going to allow
			 * specifying the relative depth for a match. For example, a CSS child
			 * combinator would specify that a match must have a relative depth of 1,
			 * indicating that it's a direct child of the surrounding element, whereas
			 * the descendant selector could match at any depth and so sets this to `null`.
			 * To prevent matching _above_ a tag we rely on the `bail_depth` to stop
			 * searching once we've exited the tag on which we started, or reach its parent.
			 */

			if ( ! isset( $state->match_depth ) || $state->match_depth + 1 === $depth ) {
				$this->parse_query( $query );
				if ( $this->matches() ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Return the content between two balanced tags.
	 *
	 * When called on an opening tag, return the HTML content found between
	 * that opening tag and its matching closing tag.
	 *
	 * @return string The content between the current opening and its matching closing tag.
	 */
	public function get_content_inside_balanced_tags() {
		static $start_name = null;
		static $end_name   = null;

		if ( null === $start_name || array_key_exists( $start_name, $this->bookmarks ) ) {
			$rand_id    = rand( 1, PHP_INT_MAX );
			$start_name = "start_{$rand_id}";
		}

		if ( null === $end_name || array_key_exists( $end_name, $this->bookmarks ) ) {
			$rand_id  = rand( 1, PHP_INT_MAX );
			$end_name = "start_{$rand_id}";
		}

		$this->set_bookmark( $start_name );

		$state = self::new_state();
		while ( $this->balanced_next( $state ) ) {
			continue;
		}

		$this->set_bookmark( $end_name );
		$content = $this->content_inside_bookmarks( $start_name, $end_name );
		$this->seek( $start_name );

		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		return $content;
	}

	/**
	 * Return the content between two bookmarks.
	 *
	 * @param WP_HTML_Span $start_bookmark The bookmark marking the start of the content.
	 * @param WP_HTML_Span $end_bookmark   The bookmark marking the start of the content.
	 * @return string|null                 The content between the two bookmarks.
	 *                                     Null if either of the bookmarks isn't set.
	 */
	private function content_inside_bookmarks( $start_bookmark, $end_bookmark ) {
		if ( ! isset( $this->bookmarks[ $start_bookmark ], $this->bookmarks[ $end_bookmark ] ) ) {
			return null;
		}

		$start = $this->bookmarks[ $start_bookmark ];
		$end   = $this->bookmarks[ $end_bookmark ];

		return substr( $this->get_updated_html(), $start->end + 1, $end->start - $start->end - 2 );
	}

	/*
	 * HTML-related Utility Functions
	 */

	/**
	 * Classify a given HTML tag type.
	 *
	 * Return 'opener' for an opening element, 'closer' for a closing element,
	 * and 'void' for a void element.
	 *
	 * @param bool $is_closer Whether the current element is a closing element.
	 * @param bool $is_void Whether the current element is a void element.
	 * @return 'opener'|'closer'|'void' The type of element in question.
	 */
	public static function classify_tag_type( $is_closer, $is_void ) {
		if ( $is_void ) {
			return 'void';
		}

		return $is_closer ? 'closer' : 'opener';
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
}
