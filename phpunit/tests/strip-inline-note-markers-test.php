<?php
/**
 * Tests that inline note span markers are neutralized in rendered block output
 * via the render_block filter, while raw post content is left untouched.
 *
 * The marker's `wp-note` class and `data-id` attribute are removed so no note
 * metadata reaches the public HTML; the now-inert `<span>` wrapper remains.
 *
 * Note: `WP_HTML_Tag_Processor::remove_attribute()` leaves the whitespace that
 * preceded a removed attribute, so neutralized tags keep a residual space
 * (e.g. `<span  >`). This is valid, renders identically, and is asserted
 * verbatim below so the tests track actual output rather than an idealized form.
 *
 * @group notes
 */
class Tests_Strip_Inline_Note_Markers extends WP_UnitTestCase {

	public function test_strip_removes_marker_metadata_from_span() {
		$html     = '<p>Hello <span class="wp-note" data-id="7">marked</span> world</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>Hello <span  >marked</span> world</p>', $stripped );
	}

	public function test_strip_handles_multiple_markers_in_one_block() {
		$html     = '<p><span class="wp-note" data-id="1">a</span> and <span class="wp-note" data-id="2">b</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p><span  >a</span> and <span  >b</span></p>', $stripped );
	}

	public function test_strip_passes_through_block_content_without_markers() {
		$html     = '<p>Plain text with no notes here.</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_keeps_other_classes_when_removing_wp_note() {
		$html     = '<p><span class="custom wp-note other" data-id="3">x</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p><span class="custom other" >x</span></p>', $stripped );
	}

	public function test_strip_leaves_unrelated_spans_untouched() {
		$html     = '<p><span class="other-thing">keep me</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_does_not_match_partial_class_names() {
		// `wp-note-foo` is a different class and must not be treated as a marker;
		// a regex word boundary would incorrectly match it.
		$html     = '<p><span class="wp-note-foo">keep me</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_preserves_nested_formatting_spans() {
		// A note wrapping already-formatted text (e.g. coloured text) serializes
		// as nested spans. The marker must be neutralized without unbalancing the
		// inner markup, which the previous backreference regex failed to do.
		$html     = '<p><span class="wp-note" data-id="1">a <span style="color:red">red</span> b</span></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p><span  >a <span style="color:red">red</span> b</span></p>', $stripped );
	}

	public function test_strip_filter_is_registered_on_render_block() {
		// Guards against future hook rewiring that would silently leave
		// inline-note markers in rendered output.
		$this->assertNotFalse(
			has_filter( 'render_block', 'gutenberg_strip_inline_note_markers' )
		);
	}
}
