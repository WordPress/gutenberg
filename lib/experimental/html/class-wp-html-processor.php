<?php

/**
 * @TODO: Handle self-closing foreign elements.
 * @TODO: Detect non-normative HTML input.
 * @TODO: Consider parsing non-normative HTML input, support adoption agency algorithm.
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
 */

class WP_HTML_Processor extends WP_HTML_Tag_Processor {
	public function next_within_balanced_tags( &$state, $query = null, $max_depth = 1000 ) {
		if ( empty( $state ) ) {
			$state['budget'] = 1000;
			$state['tag_name'] = $this->get_tag();
			$state['balanced_depth'] = 1;
			$state['depth'] = 1;

			if ( self::is_html_void_element( $this->get_tag() ) ) {
				return false;
			}
		}

		while ( $this->next_tag( array( 'tag_closers' => 'visit' ) ) && $state['budget']-- > 0 ) {
			if (
				$this->get_tag() === $state['tag_name'] &&
				$this->is_tag_closer() &&
				$state['balanced_depth'] === 1
			) {
				return false;
			}

			if ( $state['depth'] <= $max_depth ) {
				$this->parse_query( $query );
				if ( $this->matches() ) {
					return true;
				}
			}

			if ( ! self::is_html_void_element( $this->get_tag() ) ) {
				$state['depth'] += $this->is_tag_closer() ? -1 : 1;
			}

			if ( $this->get_tag() === $state['tag_name'] ) {
				$state['balanced_depth'] += $this->is_tag_closer() ? -1 : 1;
			}
		}

		return false;
	}

	public function get_content_inside_balanced_tags() {
		static $start_name = null;
		static $end_name = null;

		if ( null === $start_name || array_key_exists( $start_name, $this->bookmarks ) ) {
			$rand_id = rand( 1, PHP_INT_MAX );
			$start_name = "start_{$rand_id}";
		}

		if ( null === $end_name || array_key_exists( $end_name, $this->bookmarks ) ) {
			$rand_id = rand( 1, PHP_INT_MAX );
			$end_name = "start_{$rand_id}";
		}

		$this->set_bookmark( $start_name );
		$tag_name = $this->get_tag();
		$depth = 1;

		if ( self::is_html_void_element( $tag_name ) ) {
			return '';
		}

		while ( $this->next_tag( [ 'tag_closers' => 'visit' ] ) ) {
			if ( $this->get_tag() !== $tag_name ) {
				continue;
			}

			if ( $this->is_tag_closer() && $depth === 1 ) {
				$this->set_bookmark( $end_name );
				break;
			}

			$depth += $this->is_tag_closer() ? -1 : 1;
		}

		$content = $this->content_inside_bookmarks( $start_name, $end_name );
		$this->seek( $start_name );

		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		return $content;
	}

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
