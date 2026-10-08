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

	public function test_planted_sentinel_on_plain_mark_is_ignored_and_removed() {
		// A user-planted `data-wp-suggestion-strip` sentinel on a non-suggestion
		// <mark> must neither influence the offset pass (the text is kept) nor
		// survive into public output.
		$html     = '<p><mark data-wp-suggestion-strip="add">keep me</mark> tail</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertStringContainsString( 'keep me', $stripped );
		$this->assertStringNotContainsString( 'data-wp-suggestion-strip', $stripped );
	}

	public function test_planted_sentinel_does_not_affect_a_genuine_marker_pass() {
		// The planted "add" sentinel on the first (plain) mark is defused, so
		// its text survives; the genuine deletion marker still unwraps.
		$html     = '<p><mark data-wp-suggestion-strip="add">safe</mark><mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del">old</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertStringContainsString( 'safe', $stripped );
		$this->assertStringContainsString( 'old', $stripped );
		$this->assertStringNotContainsString( 'data-wp-suggestion-strip', $stripped );
		$this->assertStringNotContainsString( 'wp-suggestion"', $stripped );
	}

	public function test_planted_sentinel_on_non_mark_tag_is_removed() {
		$html     = '<p><span data-wp-suggestion-strip="del">x</span> ok</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertStringContainsString( 'x</span> ok', $stripped );
		$this->assertStringNotContainsString( 'data-wp-suggestion-strip', $stripped );
	}

	public function test_unpaired_flagged_opener_leaks_no_sentinel() {
		// A suggestion opener with no closer can't be paired by the offset
		// pass; the marker stays (defaulting safe: text kept) but the internal
		// sentinel must not leak into public output.
		$html     = '<p><mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add">oops</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertStringContainsString( 'oops', $stripped );
		$this->assertStringNotContainsString( 'data-wp-suggestion-strip', $stripped );
	}

	/**
	 * Creates a pending format suggestion note on a post.
	 *
	 * @param int    $post_id     Post the note belongs to.
	 * @param string $before_html Original run recorded on the note.
	 * @param string $status      Suggestion lifecycle status, if any.
	 * @return int Note comment ID.
	 */
	private function create_format_note( $post_id, $before_html, $status = '' ) {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
			)
		);
		$payload = array(
			'operations' => array(
				array(
					'type'           => 'inline-suggestion',
					'attribute'      => 'content',
					'suggestionType' => 'format',
					'beforeHTML'     => $before_html,
					'afterHTML'      => '<strong>' . $before_html . '</strong>',
				),
			),
		);
		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( wp_json_encode( $payload ) ) );
		if ( $status ) {
			update_comment_meta( $note_id, '_wp_suggestion_status', $status );
		}
		return $note_id;
	}

	/**
	 * Renders a block as if it were part of the given post.
	 *
	 * @param int    $post_id Post being rendered.
	 * @param string $html    Block HTML.
	 * @return string Filtered block HTML.
	 */
	private function strip_in_post( $post_id, $html ) {
		$GLOBALS['post'] = get_post( $post_id );
		return gutenberg_strip_inline_suggestion_markers( $html );
	}

	public function test_pending_format_restores_the_original_run() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'world' );
		$html    = '<p>Hello <mark class="wp-suggestion" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark></p>';

		// The proposed bold must not reach readers until it is accepted.
		$this->assertSame( '<p>Hello world</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_pending_format_restores_original_formatting() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, '<em>world</em>' );
		$html    = '<p>Hello <mark class="wp-suggestion" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark>!</p>';

		$this->assertSame( '<p>Hello <em>world</em>!</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_applied_format_keeps_the_proposed_formatting() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'world', 'applied' );
		$html    = '<p>Hello <mark class="wp-suggestion" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark></p>';

		$this->assertSame( '<p>Hello <strong>world</strong></p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_format_note_from_another_post_is_not_rendered() {
		// A marker copied into another post must not pull that post's
		// (possibly private) text onto this page.
		$other_id = self::factory()->post->create( array( 'post_status' => 'private' ) );
		$post_id  = self::factory()->post->create();
		$note_id  = $this->create_format_note( $other_id, 'secret' );
		$html     = '<p><mark class="wp-suggestion" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark></p>';

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_format_marker_without_a_note_unwraps() {
		$post_id = self::factory()->post->create();
		$html    = '<p><mark class="wp-suggestion" data-suggestion-id="999999" data-suggestion-type="format"><strong>world</strong></mark></p>';

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_restored_run_is_not_reparsed_for_markers() {
		// A marker inside the recorded original is unwrapped, never resolved
		// again, so a note cannot reference itself into a loop.
		$post_id = self::factory()->post->create();
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
			)
		);
		$inner   = '<mark class="wp-suggestion" data-suggestion-id="' . $note_id . '" data-suggestion-type="format">world</mark>';
		update_comment_meta(
			$note_id,
			'_wp_suggestion',
			wp_slash(
				wp_json_encode(
					array(
						'operations' => array(
							array(
								'type'           => 'inline-suggestion',
								'suggestionType' => 'format',
								'beforeHTML'     => $inner,
							),
						),
					)
				)
			)
		);
		$html = '<p>' . $inner . '</p>';

		$this->assertSame( '<p>world</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_filter_is_registered_on_render_block() {
		$this->assertNotFalse(
			has_filter( 'render_block', 'gutenberg_strip_inline_suggestion_markers' )
		);
	}
}
