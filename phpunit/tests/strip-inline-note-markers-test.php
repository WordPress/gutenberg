<?php
/**
 * Tests that inline note span markers are unwrapped from rendered block output
 * via the render_block filter, while raw post content is left untouched.
 *
 * @group notes
 */
class Tests_Strip_Inline_Note_Markers extends WP_UnitTestCase {

	public function test_strip_unwraps_wp_note_span_to_inner_text() {
		$html     = '<p>Hello <span class="wp-note" data-id="7">marked</span> world</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>Hello marked world</p>', $stripped );
	}

	public function test_strip_handles_multiple_markers_in_one_block() {
		$html     = '<p><span class="wp-note" data-id="1">a</span> and <span class="wp-note" data-id="2">b</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>a and b</p>', $stripped );
	}

	public function test_strip_passes_through_block_content_without_markers() {
		$html     = '<p>Plain text with no notes here.</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_matches_wp_note_class_alongside_others() {
		$html     = '<p><span class="custom wp-note other" data-id="3">x</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>x</p>', $stripped );
	}

	public function test_strip_leaves_unrelated_spans_untouched() {
		$html     = '<p><span class="other-thing">keep me</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_filter_is_registered_on_render_block() {
		// Guards against future hook rewiring that would silently leave
		// inline-note markers in rendered output.
		$this->assertNotFalse(
			has_filter( 'render_block', 'gutenberg_strip_inline_note_markers' )
		);
	}
}
