<?php
/**
 * Suggestion mode: Tag Processor with token spans.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_Suggestion_Marker_Processor' ) ) {
	/**
	 * Tag Processor exposing the byte span of the current token, which
	 * `WP_HTML_Tag_Processor` does not provide publicly yet.
	 *
	 * The HTML API has no public way to remove a tag (or a tag and everything
	 * up to its closer) yet - it is on the roadmap,
	 * https://github.com/WordPress/gutenberg/discussions/54583 - so the
	 * suggestion walks read spans here and splice the input themselves.
	 */
	class Gutenberg_Suggestion_Marker_Processor extends WP_HTML_Tag_Processor {
		/**
		 * Returns the byte span of the current token in the input HTML.
		 *
		 * A single bookmark name is reused for every token, so a walk never
		 * nears the bookmark limit however many markers the input holds. No
		 * edit is ever enqueued on this processor, so the offsets always refer
		 * to the unmodified input.
		 *
		 * @return int[]|null Start offset and length, or null when the
		 *                    processor is not paused on a token.
		 */
		public function get_token_span(): ?array {
			if ( ! $this->set_bookmark( 'here' ) ) {
				return null;
			}
			return array( $this->bookmarks['here']->start, $this->bookmarks['here']->length );
		}
	}
}
