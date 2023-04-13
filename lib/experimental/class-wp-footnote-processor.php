<?php
/**
 * This is a silly file that replaces inline footnotes with links to
 * footnotes and a trailing footer with a list of footnote items.
 *
 * @package gutenberg
 *
 * @since 6.3.0
 */

/**
 * Replaces inline footnotes with inline links and a footer list.
 *
 * So many things about this are fragile, broken, ad-hoc, and
 * coupling to internal details of the Tag Processor. This is
 * meant to unlock footnote rendering on the server and should
 * not be followed as an example.
 *
 * @since 6.3.0
 */
class WP_Footnote_Processor extends WP_HTML_Tag_Processor {
	/**
	 * Stores referenced footnotes, hash, and count of links referring to them.
	 *
	 * @var array[]
	 */
	private $notes = array();

	/**
	 * Replaces inline footnotes in a given HTML document with
	 * links with anchors produced by `$this->get_footer()`.
	 *
	 * @return string Transformed HTML with links instead of inline footnotes.
	 */
	public function replace_footnotes() {
		while ( $this->find_opener() ) {
			if ( ! $this->find_balanced_closer() ) {
				return $this->get_updated_html();
			}

			$note = substr( $this->get_note_content(), 2, -1 );
			$id   = md5( $note );

			if ( isset( $this->notes[ $id ] ) ) {
				$this->notes[ $id ]['count'] += 1;
			} else {
				$this->notes[ $id ] = array(
					'note'  => $note,
					'count' => 1,
				);
			}

			// List starts at 1. If the note already exists, use the existing index.
			$index = 1 + array_search( $id, array_keys( $this->notes ), true );
			$count = $this->notes[ $id ]['count'];

			$footnote_content = sprintf(
				'<sup><a class="note-link" href="#%s" id="%s-link-%d">[%d]</a></sup>',
				$id,
				$id,
				$count,
				$index
			);

			$this->replace_footnote( $footnote_content );
		}

		return $this->get_updated_html();
	}

	/**
	 * Generates a list of footnote items that can be linked to in the post.
	 *
	 * @return string The list of footnote items, if any, otherwise an empty string.
	 */
	public function get_footer() {
		if ( empty( $this->notes ) ) {
			return '';
		}

		$output = '<ol>';
		foreach ( $this->notes as $id => $info ) {
			$note    = $info['note'];
			$count   = $info['count'];
			$output .= sprintf( '<li id="%s">', $id );
			$output .= $note;
			$label   = $count > 1 ?
				/* translators: %s: footnote occurrence */
				__( 'Back to content (%s)', 'gutenberg' ) :
				__( 'Back to content', 'gutenberg' );
			$links = '';
			while ( $count ) {
				$links .= sprintf(
					'<a href="#%s-link-%d" aria-label="%s">↩︎</a>',
					$id,
					$count,
					sprintf( $label, $count )
				);
				$count--;
			}
			$output .= ' ' . $links;
			$output .= '</li>';
		}
		$output .= '</ol>';

		return $output;
	}

	/**
	 * Finds the start of the next footnote.
	 *
	 * Looks for a superscript tag with the `value=footnote` attribute.
	 *
	 * @return bool
	 */
	private function find_opener() {
		while ( $this->next_tag( array( 'tag_name' => 'sup' ) ) ) {
			$value = $this->get_attribute( 'value' );
			if ( 'core/footnote' === $value || 'footnote' === $value ) {
				$this->set_bookmark( 'start' );
				return true;
			}
		}

		return false;
	}

	/**
	 * Naively finds the end of the current footnote.
	 *
	 * @return bool Whether the end of the current footnote was found.
	 */
	private function find_balanced_closer() {
		$depth = 1;
		$query = array(
			'tag_name'    => 'sup',
			'tag_closers' => 'visit',
		);

		while ( $this->next_tag( $query ) ) {
			if ( ! $this->is_tag_closer() ) {
				$depth++;
			} else {
				$depth--;
			}

			if ( 0 <= $depth ) {
				$this->set_bookmark( 'end' );
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the content inside footnote superscript tags.
	 *
	 * @return string The content found inside footnote superscript tags.
	 */
	private function get_note_content() {
		$open  = $this->bookmarks['start'];
		$close = $this->bookmarks['end'];

		return substr( $this->html, $open->end, $close->start - $open->end );
	}

	/**
	 * Replaces the footnote entirely with new HTML.
	 *
	 * @param string $new_content Content to store in place of the existing footnote.
	 *
	 * @return void
	 */
	private function replace_footnote( $new_content ) {
		$start                   = $this->bookmarks['start']->start;
		$end                     = $this->bookmarks['end']->end + 1;
		$this->lexical_updates[] = new WP_HTML_Text_Replacement( $start, $end, $new_content );
		$this->get_updated_html();

		$this->bookmarks['start']->start = $start;
		$this->bookmarks['start']->end   = $end;
		$this->seek( 'start' );
	}
}

add_filter(
	'the_content',
	function ( $html ) {
		$p = new WP_Footnote_Processor( $html );
		$p->replace_footnotes();

		return $p->get_updated_html() . $p->get_footer();
	},
	1000,
	1
);
