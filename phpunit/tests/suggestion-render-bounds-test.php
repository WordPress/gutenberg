<?php
/**
 * Tests that the render-side marker code stays bounded on hostile input: the
 * pairing walk is linear, and a fragment with too many markers fails closed.
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
}
