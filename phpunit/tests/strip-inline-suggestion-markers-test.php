<?php
/**
 * Tests that inline suggestion markers are stripped from rendered block output
 * via the render_block filter, type-aware, while raw post content is untouched.
 *
 * A `<mark class="wp-suggestion" data-suggestion-type="del|add">` wrapper is
 * removed entirely. A deletion keeps the marked text (it is only removed when
 * the suggestion is accepted in the editor); an addition removes the marked text
 * too (un-accepted proposed content must never reach the public HTML).
 *
 * @group suggestions
 */
class Tests_Strip_Inline_Suggestion_Markers extends WP_UnitTestCase {

	public function test_deletion_unwraps_wrapper_but_keeps_text() {
		$html     = '<p>Hello <mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="del">marked</mark> world</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>Hello marked world</p>', $stripped );
	}

	public function test_addition_removes_wrapper_and_text() {
		$html     = '<p>Hello <mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="add">added </mark>world</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>Hello world</p>', $stripped );
	}

	public function test_missing_type_defaults_to_deletion() {
		// A malformed marker with no type must keep its text rather than drop it.
		$html     = '<p><mark class="wp-suggestion" data-suggestion-id="7">kept</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>kept</p>', $stripped );
	}

	public function test_mixed_deletion_and_addition_in_one_block() {
		$html     = '<p><mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">old</mark> and <mark class="wp-suggestion" data-suggestion-id="2" data-suggestion-type="add">new</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		// Deletion keeps "old"; addition drops "new".
		$this->assertSame( '<p>old and </p>', $stripped );
	}

	public function test_passes_through_block_content_without_markers() {
		$html     = '<p>Plain text with no suggestions here.</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_leaves_unrelated_marks_untouched() {
		// A user highlight (`core/text-color`) serializes as a plain `<mark>`.
		$html     = '<p><mark style="background-color:#ff0">keep me</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_leaves_note_markers_untouched() {
		// An inline note marker is a different class and is stripped by its own
		// filter, never by the suggestion strip.
		$html     = '<p><mark class="wp-note" data-id="3">noted</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_does_not_match_partial_class_names() {
		$html     = '<p><mark class="wp-suggestion-foo">keep me</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( $html, $stripped );
	}

	public function test_deletion_preserves_nested_formatting() {
		$html     = '<p><mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">a <span style="color:red">red</span> b</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>a <span style="color:red">red</span> b</p>', $stripped );
	}

	public function test_addition_removes_nested_formatting() {
		// The whole proposed span goes, including any nested formatting.
		$html     = '<p>keep<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add"> a <span style="color:red">red</span> b</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>keep</p>', $stripped );
	}

	public function test_deletion_nested_inside_addition_removes_whole_span() {
		// A deletion marker nested inside an addition: the whole addition span is
		// removed, so the nested deletion's wrappers cannot corrupt offsets.
		$html     = '<p>x<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add">a<mark class="wp-suggestion" data-suggestion-id="2" data-suggestion-type="del">b</mark>c</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xy</p>', $stripped );
	}

	public function test_addition_nested_inside_deletion_keeps_del_text_drops_add_text() {
		// A deletion wrapping an addition: the deletion unwraps (text kept) while
		// the inner addition drops its own wrapper and text.
		$html     = '<p><mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">keep <mark class="wp-suggestion" data-suggestion-id="2" data-suggestion-type="add">new</mark> end</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>keep  end</p>', $stripped );
	}

	public function test_filter_is_registered_on_render_block() {
		$this->assertNotFalse(
			has_filter( 'render_block', 'gutenberg_strip_inline_suggestion_markers' )
		);
	}
}
