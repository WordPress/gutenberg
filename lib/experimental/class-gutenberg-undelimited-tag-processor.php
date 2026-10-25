<?php
/**
 * Tag processor that tells where each token is, for optional block delimiters.
 *
 * @package gutenberg
 */

/**
 * Tag processor that tells where each token is.
 */
class Gutenberg_Undelimited_Tag_Processor extends WP_HTML_Tag_Processor {
	/**
	 * Returns where the current token starts, and its length.
	 *
	 * @return WP_HTML_Span|null
	 */
	public function get_span() {
		return $this->set_bookmark( 'here' ) ? $this->bookmarks['here'] : null;
	}
}
