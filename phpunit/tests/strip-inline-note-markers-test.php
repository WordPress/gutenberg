<?php
/**
 * Tests that inline note markers are unwrapped in rendered block output via the
 * render_block filter, while raw post content is left untouched.
 *
 * The `<mark class="wp-note">` wrapper is removed entirely - both the open tag
 * and its matching closer - so no note marker or metadata reaches the public
 * HTML, while the marked text (and any nested formatting) is preserved.
 *
 * @group notes
 */
class Tests_Strip_Inline_Note_Markers extends WP_UnitTestCase {

	public function test_strip_unwraps_marker_from_mark() {
		$html     = '<p>Hello <mark class="wp-note" data-id="7">marked</mark> world</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>Hello marked world</p>', $stripped );
	}

	public function test_strip_handles_multiple_markers_in_one_block() {
		$html     = '<p><mark class="wp-note" data-id="1">a</mark> and <mark class="wp-note" data-id="2">b</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>a and b</p>', $stripped );
	}

	public function test_strip_passes_through_block_content_without_markers() {
		$html     = '<p>Plain text with no notes here.</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_keeps_other_classes_when_removing_wp_note() {
		// The whole wrapper is removed, so any companion classes go with it.
		$html     = '<p><mark class="custom wp-note other" data-id="3">x</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>x</p>', $stripped );
	}

	public function test_strip_leaves_unrelated_marks_untouched() {
		// A user highlight (`core/text-color`) serializes as a plain `<mark>` and
		// must survive untouched.
		$html     = '<p><mark style="background-color:#ff0">keep me</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_does_not_match_partial_class_names() {
		// `wp-note-foo` is a different class and must not be treated as a marker;
		// a regex word boundary would incorrectly match it.
		$html     = '<p><mark class="wp-note-foo">keep me</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_strip_preserves_user_mark_attributes_next_to_note() {
		// A user/plugin `<mark>` with several attributes sitting beside a note
		// marker must be returned byte-for-byte; only the `wp-note` wrapper goes.
		$html     = '<p><mark class="highlight" style="background-color:#ff0" data-id="99" title="kept">user</mark> and <mark class="wp-note" data-id="4">noted</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p><mark class="highlight" style="background-color:#ff0" data-id="99" title="kept">user</mark> and noted</p>', $stripped );
	}

	public function test_strip_preserves_nested_formatting() {
		// A note wrapping already-formatted text (e.g. coloured text) serializes
		// with nested inline elements. The wrapper is removed while the inner
		// markup is preserved intact.
		$html     = '<p><mark class="wp-note" data-id="1">a <span style="color:red">red</span> b</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>a <span style="color:red">red</span> b</p>', $stripped );
	}

	public function test_strip_unwraps_note_but_keeps_inner_highlight_mark() {
		// A note wrapping a user highlight nests `<mark>` inside `<mark>`. Only the
		// note wrapper is removed; the inner highlight `<mark>` is preserved, and
		// the closer pairing must not unbalance.
		$html     = '<p><mark class="wp-note" data-id="1">a <mark style="background-color:#ff0">hi</mark> b</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>a <mark style="background-color:#ff0">hi</mark> b</p>', $stripped );
	}

	public function test_strip_handles_overlapping_nested_note_markers() {
		// Two notes anchored on overlapping text serialize as nested `<mark>`s.
		// Both wrappers are removed and the text survives.
		$html     = '<p><mark class="wp-note" data-id="1">a<mark class="wp-note" data-id="2">b</mark>c</mark></p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>abc</p>', $stripped );
	}

	public function test_strip_ignores_mark_like_text_inside_a_comment() {
		// A `</mark>` sequence inside an HTML comment is text, not a tag. Walking
		// the parsed token stream ignores it; a raw regex over the string would
		// mistake it for the note's closer, unbalance the pairing, and corrupt
		// both the comment and the real wrapper.
		$html     = '<p><mark class="wp-note" data-id="1">a<!-- </mark> -->b</mark>tail</p>';
		$stripped = gutenberg_strip_inline_note_markers( $html );

		$this->assertSame( '<p>a<!-- </mark> -->btail</p>', $stripped );
	}

	public function test_strip_filter_is_registered_on_render_block() {
		// Guards against future hook rewiring that would silently leave
		// inline-note markers in rendered output.
		$this->assertNotFalse(
			has_filter( 'render_block', 'gutenberg_strip_inline_note_markers' )
		);
	}
}
