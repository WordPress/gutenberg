<?php

class Footnote_Processor extends WP_HTML_Tag_Processor {
	public $notes = array();

	public function replace_footnotes() {
		while ( $this->next_tag( array( 'tag_name' => 'data' ) ) ) {
			$value = $this->get_attribute( 'value' );
			if ( 'core/footnote' !== $value && 'footnote' !== $value ) {
				continue;
			}

			$this->set_bookmark( 'start' );
			if ( ! $this->next_tag( array( 'tag_name' => 'data', 'tag_closers' => 'visit' ) ) ) {
				return $this->get_updated_html();
			}

			// These are internal details, not a good example, don't copy this code elsewhere.
			$this->set_bookmark( 'end' );

			// Footnote logic
			$note = substr( $this->get_inner_content( 'start', 'end' ), 2, -1 );
			$id = md5( $note );

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

			$this->set_outer_content( 'start', 'end', $footnote_content );
		}

		return $this->get_updated_html();
	}

	private function get_inner_content( $start_bookmark, $end_bookmark ) {
		$open  = $this->bookmarks[ $start_bookmark ];
		$close = $this->bookmarks[ $end_bookmark ];

		return substr( $this->html, $open->end, $close->start - $open->end );
	}

	private function set_outer_content( $start_bookmark, $end_bookmark, $new_content ) {
		$start = $this->bookmarks[ $start_bookmark ]->start;
		$end   = $this->bookmarks[ $end_bookmark ]->end + 1;
		$this->lexical_updates[] = new WP_HTML_Text_Replacement( $start, $end, $new_content );
		$this->get_updated_html();

		$this->bookmarks['start']->start = $start;
		$this->bookmarks['start']->end   = $end;
		$this->seek( 'start' );
	}
}

add_filter( 'the_content', function ( $html ) {
	$p = new Footnote_Processor( $html );
	$p->replace_footnotes();

	$output = $p->get_updated_html();
	if ( empty( $p->notes ) ) {
		return $output;
	}

	$output .= '<ol>';
	foreach ( $p->notes as $id => $info ) {
		$note    = $info['note'];
		$count   = $info['count'];
		$output .= sprintf( '<li id="%s">', $id );
		$output .= $note;
		$label = $count > 1 ?
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
}, 1000, 1 );
