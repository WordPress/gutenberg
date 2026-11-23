<?php
/**
 * Tests that the render-side marker code stays bounded on hostile input: the
 * pairing walk is linear, a fragment with too many markers fails closed, and
 * the character-level formatting revert gives up on a run too long to split.
 *
 * Time limits here are far above what a linear walk needs and far below what
 * a quadratic one takes, so they do not depend on the machine.
 *
 * @group suggestions
 */
class Tests_Suggestion_Render_Bounds extends WP_UnitTestCase {

	/**
	 * Seconds a single walk over these inputs may take.
	 */
	private const TIME_LIMIT = 3.0;

	/**
	 * Runs the render strip and returns its output and how long it took.
	 *
	 * @param string $html Block HTML.
	 * @return array{string, float} Output and seconds.
	 */
	private function timed_strip( string $html ): array {
		$start  = hrtime( true );
		$output = gutenberg_strip_inline_suggestion_markers( $html );
		return array( $output, ( hrtime( true ) - $start ) / 1e9 );
	}

	public function test_closers_with_no_open_match_are_walked_in_linear_time(): void {
		$html = '<span class="wp-suggestion">x</span>' . str_repeat( '<div>', 8000 ) . str_repeat( '</p>', 8000 );

		list( $output, $seconds ) = $this->timed_strip( $html );

		$this->assertSame( $html, $output );
		$this->assertLessThan( self::TIME_LIMIT, $seconds );
	}

	public function test_closers_blocked_by_a_special_element_are_walked_in_linear_time(): void {
		// Each `</b>` has an open `<b>`, but the `<p>` keeps it out of reach.
		$html = '<span class="wp-suggestion">x</span><b><p>' . str_repeat( '<span>', 8000 ) . str_repeat( '</b>', 8000 );

		list( $output, $seconds ) = $this->timed_strip( $html );

		$this->assertSame( $html, $output );
		$this->assertLessThan( self::TIME_LIMIT, $seconds );
	}

	public function test_many_unclosed_markers_are_paired_in_linear_time(): void {
		$html = '<p>' . str_repeat( '<mark class="wp-suggestion-del">Q', 30000 );

		$start   = hrtime( true );
		$markers = gutenberg_pair_inline_suggestion_markers( $html );
		$seconds = ( hrtime( true ) - $start ) / 1e9;

		$this->assertIsArray( $markers );
		$this->assertCount( 30000, $markers );
		// Every marker is still open at the end, so each holds all later ones.
		$this->assertSame( 29999, $markers[0]['inner_markers'] );
		$this->assertSame( 0, $markers[29999]['inner_markers'] );
		$this->assertLessThan( self::TIME_LIMIT, $seconds );
	}

	public function test_inner_markers_counts_the_markers_opening_inside_each_run(): void {
		$add = '<mark class="wp-suggestion-add" data-suggestion-id="1">';
		$del = '<mark class="wp-suggestion-del" data-suggestion-id="2">';
		// An addition holding two deletions, a lone deletion, then a deletion
		// left open over one more.
		$html = "<p>{$add}a{$del}b</mark>{$del}c</mark></mark>{$del}d</mark>{$del}e{$del}f</mark></p>";

		$markers = gutenberg_pair_inline_suggestion_markers( $html );

		$this->assertIsArray( $markers );
		$this->assertSame( array( 2, 0, 0, 0, 1, 0 ), array_column( $markers, 'inner_markers' ) );
	}

	public function test_inner_markers_of_a_crossing_marker_reach_its_lexical_closer(): void {
		$add = '<mark class="wp-suggestion-add" data-suggestion-id="1">';
		$del = '<mark class="wp-suggestion-del" data-suggestion-id="2">';
		// The `</p>` ends the addition in the tree; its `</mark>` comes after
		// the deletion in the next paragraph.
		$html = "<p>{$add}a</p><p>{$del}b</mark>c</mark></p>";

		$markers = gutenberg_pair_inline_suggestion_markers( $html );

		$this->assertIsArray( $markers );
		$this->assertSame( array( 1, 0 ), array_column( $markers, 'inner_markers' ) );
	}

	public function test_a_fragment_at_the_marker_limit_is_stripped(): void {
		$pairs = (int) ( GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT / 2 );
		$html  = '<p>' . str_repeat( '<mark class="wp-suggestion-add">N</mark><mark class="wp-suggestion-del">K</mark>', $pairs ) . '</p>';

		$this->assertSame( '<p>' . str_repeat( 'K', $pairs ) . '</p>', gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	public function test_a_fragment_over_the_marker_limit_fails_closed(): void {
		$html = '<p>real' . str_repeat( '<mark class="wp-suggestion-add">PENDING</mark>', GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT + 1 ) . '</p>';

		$this->assertNull( gutenberg_pair_inline_suggestion_markers( $html, GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT ) );
		// Nothing proposed renders, and the published view agrees.
		$this->assertSame( '', gutenberg_strip_inline_suggestion_markers( $html ) );
		$this->assertSame( '', gutenberg_get_inline_suggestion_view( $html, array() ) );
	}

	public function test_the_marker_limit_is_opt_in(): void {
		// The save pass pairs a whole post at once and must not lose anchors.
		$html = str_repeat( '<mark class="wp-suggestion-add">PENDING</mark>', GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT + 1 );

		$this->assertCount( GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT + 1, (array) gutenberg_pair_inline_suggestion_markers( $html ) );
	}

	/**
	 * Builds a formatting marker.
	 *
	 * @param int    $id    Suggestion id.
	 * @param string $inner Marked run.
	 * @return string Marker HTML.
	 */
	private static function format_marker( int $id, string $inner ): string {
		return '<mark class="wp-suggestion-format" data-suggestion-id="' . $id . '">' . $inner . '</mark>';
	}

	public function test_characters_are_split_up_to_the_limit(): void {
		$this->assertCount( 5, (array) gutenberg_get_inline_suggestion_characters( '<em>ab</em>c<br>d', 5 ) );
		$this->assertNull( gutenberg_get_inline_suggestion_characters( '<em>ab</em>c<br>d', 4 ) );
		$this->assertNull( gutenberg_get_inline_suggestion_characters( '<em>abcd</em><br>', 4 ) );
		// Multibyte text counts in characters, not bytes.
		$this->assertCount( 4, (array) gutenberg_get_inline_suggestion_characters( "\u{1F600}\u{1F600}\u{1F600}\u{1F600}", 4 ) );
		$this->assertNull( gutenberg_get_inline_suggestion_characters( "\u{1F600}\u{1F600}\u{1F600}\u{1F600}\u{1F600}", 4 ) );
	}

	public function test_format_revert_handles_a_run_at_the_character_limit(): void {
		$filler = str_repeat( 'x', GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT - 4 );
		$html   = '<p>' . self::format_marker( 1, '<strong>ab</strong>' ) . $filler . self::format_marker( 2, '<strong>cd</strong>' ) . '</p>';

		$this->assertSame(
			'<p>ab' . $filler . 'cd</p>',
			gutenberg_revert_inline_format_suggestions(
				$html,
				array(
					1 => 'ab',
					2 => 'cd',
				)
			)
		);
	}

	public function test_format_revert_gives_up_on_a_run_over_the_character_limit(): void {
		$filler = str_repeat( 'x', GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT - 3 );
		$html   = '<p>' . self::format_marker( 1, '<strong>ab</strong>' ) . $filler . self::format_marker( 2, '<strong>cd</strong>' ) . '</p>';

		$this->assertNull(
			gutenberg_revert_inline_format_suggestions(
				$html,
				array(
					1 => 'ab',
					2 => 'cd',
				)
			)
		);
	}

	public function test_format_revert_gives_up_when_the_originals_are_over_the_character_limit(): void {
		// Three stacked changes on one run: each original is as long as the
		// run, and together they are over the limit.
		$run  = str_repeat( 'x', (int) ( GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT / 2 ) );
		$html = '<p>' . self::format_marker( 1, self::format_marker( 2, self::format_marker( 3, '<strong>' . $run . '</strong>' ) ) ) . '</p>';

		$this->assertSame(
			'<p>' . $run . '</p>',
			gutenberg_revert_inline_format_suggestions( $html, array( 1 => $run ) + array_fill( 2, 2, '<em>' . $run . '</em>' ) )
		);
		$this->assertNull(
			gutenberg_revert_inline_format_suggestions( $html, array_fill( 1, 3, $run ), array( 3 ) )
		);
	}

	public function test_a_run_over_the_character_limit_is_reverted_marker_by_marker(): void {
		$post_id = self::factory()->post->create();
		$this->assertIsInt( $post_id );
		$notes = array();
		foreach ( array( 'ab', 'cd' ) as $text ) {
			$note_id = self::factory()->comment->create(
				array(
					'comment_post_ID'  => $post_id,
					'comment_type'     => 'note',
					'comment_approved' => '0',
				)
			);
			$this->assertIsInt( $note_id );
			$payload = array(
				'operations' => array(
					array(
						'type'           => 'inline-suggestion',
						'attribute'      => 'content',
						'suggestionType' => 'format',
						'beforeHTML'     => '<em>' . $text . '</em>',
					),
				),
			);
			update_comment_meta( $note_id, '_wp_suggestion', wp_slash( (string) wp_json_encode( $payload ) ) );
			$notes[ $text ] = $note_id;
		}
		$filler  = str_repeat( 'x', GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT );
		$html    = '<p>' . self::format_marker( $notes['ab'], '<strong>ab</strong>' ) . $filler . self::format_marker( $notes['cd'], '<strong>cd</strong>' ) . '</p>';
		$content = '<!-- wp:paragraph -->' . $html . '<!-- /wp:paragraph -->';
		/** @var wpdb $wpdb */
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $post_id ) );
		clean_post_cache( $post_id );
		$GLOBALS['post'] = get_post( $post_id );

		$rendered = apply_filters( 'the_content', $content );
		$this->assertIsString( $rendered );

		$this->assertSame( '<p><em>ab</em>' . $filler . '<em>cd</em></p>', str_replace( ' class="wp-block-paragraph"', '', trim( $rendered ) ) );
	}

	public function test_format_markers_naming_many_missing_notes_cost_a_bounded_number_of_queries(): void {
		/** @var wpdb $wpdb */
		global $wpdb;
		$post_id = self::factory()->post->create();
		$this->assertIsInt( $post_id );
		$html = '<p>';
		for ( $i = 1; $i <= 400; $i++ ) {
			$html .= self::format_marker( 900000 + $i, '<strong>x</strong>' );
		}
		$html           .= '</p>';
		$GLOBALS['post'] = get_post( $post_id );
		gutenberg_push_suggestion_content_owner( '' );

		$before   = $wpdb->num_queries;
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );
		$queries  = $wpdb->num_queries - $before;
		gutenberg_pop_suggestion_content_owner( '' );

		$this->assertSame( '<p>' . str_repeat( '<strong>x</strong>', 400 ) . '</p>', $stripped );
		$this->assertLessThan( 200, $queries );
	}
}
