<?php
/**
 * Interactivity API: WP_Interactivity_API_Directives_Processor class.
 *
 * @package WordPress
 * @subpackage Interactivity API
 */

if ( ! class_exists( 'WP_Interactivity_API_Directives_Processor' ) ) {
	/**
	 * Class used to iterate over the tags of an HTML string and help process the
	 * directive attributes.
	 *
	 * @access private
	 */
	class WP_Interactivity_API_Directives_Processor extends Gutenberg_HTML_Tag_Processor_6_5 {
		/**
		 * Returns the content between two balanced tags.
		 *
		 * @access private
		 *
		 * @return string|null The content between the current opening and its matching closing tag or null if it doesn't
		 *                     find the matching closing tag.
		 */
		public function get_content_between_balanced_tags() {
			$bookmarks = $this->get_balanced_tag_bookmarks();
			if ( ! $bookmarks ) {
				return null;
			}
			list( $start_name, $end_name ) = $bookmarks;

			$start = $this->bookmarks[ $start_name ]->start + $this->bookmarks[ $start_name ]->length + 1;
			$end   = $this->bookmarks[ $end_name ]->start;

			$this->seek( $start_name );
			$this->release_bookmark( $start_name );
			$this->release_bookmark( $end_name );

			return substr( $this->html, $start, $end - $start );
		}

		/**
		 * Sets the content between two balanced tags.
		 *
		 * @access private
		 *
		 * @param string $new_content The string to replace the content between the matching tags.
		 * @return bool Whether the content was successfully replaced.
		 */
		public function set_content_between_balanced_tags( string $new_content ): bool {
			$this->get_updated_html();

			$bookmarks = $this->get_balanced_tag_bookmarks();
			if ( ! $bookmarks ) {
				return false;
			}
			list( $start_name, $end_name ) = $bookmarks;

			$start = $this->bookmarks[ $start_name ]->start + $this->bookmarks[ $start_name ]->length + 1;
			$end   = $this->bookmarks[ $end_name ]->start;

			$this->seek( $start_name );
			$this->release_bookmark( $start_name );
			$this->release_bookmark( $end_name );

			$this->lexical_updates[] = new Gutenberg_HTML_Text_Replacement_6_5( $start, $end - $start, esc_html( $new_content ) );
			return true;
		}

		/**
		 * Appends content after the closing tag of a balanced template tag.
		 *
		 * This method positions the processor in the last tag of the appended
		 * content, if it exists.
		 *
		 * @access private
		 *
		 * @param string $new_content The string to append after the closing template tag.
		 * @return bool Whether the content was successfully appended.
		 */
		public function append_content_after_closing_tag_on_balanced_template_tags( string $new_content ): bool {
			// Refuse to process if the content is empty or this is not an opener template tag.
			if ( empty( $new_content ) || 'TEMPLATE' !== $this->get_tag() || $this->is_tag_closer() ) {
				return false;
			}

			$this->get_updated_html();

			$bookmarks = $this->get_balanced_tag_bookmarks();
			if ( ! $bookmarks ) {
				return false;
			}
			list( $start_name, $end_name ) = $bookmarks;

			$end = $this->bookmarks[ $end_name ]->start + $this->bookmarks[ $end_name ]->length + 1;

			$this->release_bookmark( $start_name );
			$this->release_bookmark( $end_name );

			$this->lexical_updates[] = new Gutenberg_HTML_Text_Replacement_6_5( $end, 0, $new_content );

			// Move the processor to the opening tag of the appended content.
			$this->next_tag();

			return true;
		}

		/**
		 * Returns a pair of bookmarks for the current opening tag and the matching
		 * closing tag.
		 *
		 * @return array|null A pair of bookmarks, or null if there's no matching closing tag.
		 */
		private function get_balanced_tag_bookmarks() {
			static $i   = 0;
			$start_name = 'start_of_balanced_tag_' . ++$i;

			$this->set_bookmark( $start_name );
			if ( ! $this->next_balanced_tag_closer_tag() ) {
				$this->release_bookmark( $start_name );
				return null;
			}

			$end_name = 'end_of_balanced_tag_' . ++$i;
			$this->set_bookmark( $end_name );

			return array( $start_name, $end_name );
		}

		/**
		 * Finds the matching closing tag for an opening tag.
		 *
		 * When called while the processor is on an open tag, it traverses the HTML
		 * until it finds the matching closing tag, respecting any in-between
		 * content, including nested tags of the same name. Returns false when
		 * called on a closing or void tag, or if no matching closing tag was found.
		 *
		 * @access private
		 *
		 * @return bool Whether a matching closing tag was found.
		 */
		public function next_balanced_tag_closer_tag(): bool {
			$depth    = 0;
			$tag_name = $this->get_tag();

			if ( $this->is_void() ) {
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
		 * Checks whether the current tag is void.
		 *
		 * @access private
		 *
		 * @return bool Whether the current tag is void or not.
		 */
		public function is_void(): bool {
			$tag_name = $this->get_tag();
			return Gutenberg_HTML_Processor_6_5::is_void( null !== $tag_name ? $tag_name : '' );
		}
	}
}
