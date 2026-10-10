<?php
/**
 * Tests that inline suggestion markers are stripped from rendered block output
 * via the render_block filter, type-aware, while raw post content is untouched.
 *
 * A `<mark class="wp-suggestion-del|add|format">` wrapper is removed entirely. A deletion keeps the marked text (it is only removed when
 * the suggestion is accepted in the editor); an addition removes the marked text
 * too (un-accepted proposed content must never reach the public HTML).
 *
 * @group suggestions
 */
class Tests_Strip_Inline_Suggestion_Markers extends WP_UnitTestCase {

	public function test_deletion_unwraps_wrapper_but_keeps_text() {
		$html     = '<p>Hello <mark class="wp-suggestion-del" data-suggestion-id="7" data-suggestion-type="del">marked</mark> world</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>Hello marked world</p>', $stripped );
	}

	public function test_addition_removes_wrapper_and_text() {
		$html     = '<p>Hello <mark class="wp-suggestion-add" data-suggestion-id="7" data-suggestion-type="add">added </mark>world</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>Hello world</p>', $stripped );
	}

	public function test_deletion_without_a_type_attribute_keeps_its_text() {
		// The class says what the marker is; the type attribute is optional.
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="7">kept</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>kept</p>', $stripped );
	}

	public function test_mixed_deletion_and_addition_in_one_block() {
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">old</mark> and <mark class="wp-suggestion-add" data-suggestion-id="2" data-suggestion-type="add">new</mark></p>';
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
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">a <span style="color:red">red</span> b</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>a <span style="color:red">red</span> b</p>', $stripped );
	}

	public function test_addition_removes_nested_formatting() {
		// The whole proposed span goes, including any nested formatting.
		$html     = '<p>keep<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add"> a <span style="color:red">red</span> b</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>keep</p>', $stripped );
	}

	public function test_deletion_nested_inside_addition_removes_whole_span() {
		// A deletion marker nested inside an addition: the whole addition span is
		// removed, so the nested deletion's wrappers cannot corrupt offsets.
		$html     = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">a<mark class="wp-suggestion-del" data-suggestion-id="2" data-suggestion-type="del">b</mark>c</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xy</p>', $stripped );
	}

	public function test_addition_nested_inside_deletion_keeps_del_text_drops_add_text() {
		// A deletion wrapping an addition: the deletion unwraps (text kept) while
		// the inner addition drops its own wrapper and text.
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">keep <mark class="wp-suggestion-add" data-suggestion-id="2" data-suggestion-type="add">new</mark> end</mark></p>';
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
		$html     = '<p><mark data-wp-suggestion-strip="add">safe</mark><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">old</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertStringContainsString( 'safe', $stripped );
		$this->assertStringContainsString( 'old', $stripped );
		$this->assertStringNotContainsString( 'data-wp-suggestion-strip', $stripped );
		$this->assertStringNotContainsString( 'wp-suggestion-', $stripped );
	}

	public function test_planted_sentinel_on_non_mark_tag_is_removed() {
		$html     = '<p><span data-wp-suggestion-strip="del">x</span> ok</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertStringContainsString( 'x</span> ok', $stripped );
		$this->assertStringNotContainsString( 'data-wp-suggestion-strip', $stripped );
	}

	public function test_unpaired_flagged_opener_leaks_no_sentinel() {
		// An addition with no closer still never shows its text, and the
		// internal sentinel must not leak into public output.
		$html     = '<p><mark class="wp-suggestion-add" data-wp-suggestion-strip="del" data-suggestion-id="1" data-suggestion-type="add">oops</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p></p>', $stripped );
	}

	public function test_closer_inside_attribute_of_addition_child_does_not_end_the_addition() {
		// A literal `</mark>` inside an attribute value is not a tag; the
		// addition still spans to its real closer and is removed whole.
		$html     = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">a<span title="</mark>">b</span>c</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xy</p>', $stripped );
	}

	public function test_closer_inside_attribute_of_deletion_child_is_kept_verbatim() {
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">a<span title="</mark>">b</span>c</mark>d</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>a<span title="</mark>">b</span>cd</p>', $stripped );
	}

	public function test_mark_lookalikes_inside_attributes_outside_markers_are_kept() {
		$html     = '<p><span title="</mark>">t</span><span title="<mark class=wp-suggestion>">u</span><mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">new</mark>z</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p><span title="</mark>">t</span><span title="<mark class=wp-suggestion>">u</span>z</p>', $stripped );
	}

	public function test_sentinel_lookalike_in_attribute_value_outside_markers_is_ignored() {
		// The sentinel-shaped text is an attribute value, not an attribute, so
		// the plain highlight must survive byte-for-byte.
		$plain    = '<mark title=\'x data-wp-suggestion-strip="add"\'>keep</mark>';
		$html     = '<p>' . $plain . '<mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">old</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>' . $plain . 'old</p>', $stripped );
	}

	public function test_sentinel_lookalike_in_attribute_value_inside_deletion_is_ignored() {
		$plain    = '<mark title=\'x data-wp-suggestion-strip="add"\'>keep</mark>';
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">a' . $plain . 'b</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>a' . $plain . 'b</p>', $stripped );
	}

	public function test_sentinel_lookalike_in_attribute_value_inside_addition_is_removed_with_it() {
		$html     = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">a<mark title=\'data-wp-suggestion-strip="del" </mark>\'>k</mark>b</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xy</p>', $stripped );
	}

	public function test_closer_inside_html_comment_in_addition_does_not_end_the_addition() {
		$html     = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">a<!-- </mark> -->b</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xy</p>', $stripped );
	}

	public function test_closer_inside_html_comment_in_deletion_is_kept_verbatim() {
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">a<!-- </mark> -->b</mark>c</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>a<!-- </mark> -->bc</p>', $stripped );
	}

	public function test_uppercase_mark_tags_are_stripped() {
		$html     = '<p>x<MARK class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">new</Mark>y<MARK class="wp-suggestion-del" data-suggestion-id="2" data-suggestion-type="del">old</MARK></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xyold</p>', $stripped );
	}

	public function test_unclosed_addition_ends_with_its_enclosing_element() {
		// The `</p>` implicitly closes the addition, as it does in a browser and
		// in the editor: the pending text up to it is removed, and its metadata
		// never renders.
		$html     = '<p>keep <mark class="wp-suggestion-add" data-suggestion-type="add" data-author="3" data-suggestion-id="1">PENDING</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>keep </p>', $stripped );
	}

	public function test_addition_left_open_by_a_closed_plain_mark_is_removed() {
		// The `</mark>` closes the inner plain mark, leaving the addition open.
		$html     = '<p><mark class="wp-suggestion-add" data-suggestion-type="add" data-author="3" data-suggestion-id="1">PENDING<mark>x</mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p></p>', $stripped );
	}

	public function test_unclosed_addition_is_removed_with_a_closed_inner_deletion() {
		// The `</mark>` closes the inner deletion, leaving the addition open.
		$html     = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">a<mark class="wp-suggestion-del" data-suggestion-id="2" data-suggestion-type="del">b</mark>c</p><p>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>x</p><p>y</p>', $stripped );
	}

	public function test_unclosed_addition_runs_to_the_end_of_the_block() {
		$html     = 'a<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">PENDING<span>more';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( 'a', $stripped );
	}

	public function test_unclosed_addition_is_not_ended_by_a_closer_outside_table_scope() {
		// A browser ignores `</div>` inside the table cell, so the cell (and
		// the text after it) stays inside the addition.
		$html     = '<div>a<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add"><table><tr><td>X</div>Y</td></tr></table></div>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<div>a</div>', $stripped );
	}

	public function test_unclosed_deletion_keeps_its_text_but_drops_the_marker() {
		$html     = '<p>a<mark class="wp-suggestion-del" data-suggestion-type="del" data-author="3" data-suggestion-id="1">kept</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>akept</p>', $stripped );
	}

	public function test_unclosed_format_is_removed() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'orig' );
		$html    = '<p>a<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>b</strong></p>';

		$this->assertSame( '<p>a</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_planted_sentinel_on_unclosed_marker_is_removed() {
		$html     = '<p><mark class="wp-suggestion-del" data-wp-suggestion-strip="add" data-suggestion-id="1" data-suggestion-type="del">kept</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>kept</p>', $stripped );
	}

	public function test_planted_sentinel_inside_deletion_is_removed() {
		$html     = '<p><mark class="wp-suggestion-del" data-wp-suggestion-strip="add" data-suggestion-id="1" data-suggestion-type="del">a<span data-wp-suggestion-strip="add" class="c">b</span></mark></p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>a<span class="c">b</span></p>', $this->normalize_tag_whitespace( $stripped ) );
	}

	public function test_deeply_nested_markers_are_all_stripped() {
		// More open markers than the tag processor's default bookmark limit.
		$html = '<p>';
		for ( $i = 1; $i <= 15; $i++ ) {
			$html .= '<mark class="wp-suggestion-del" data-suggestion-id="' . $i . '" data-suggestion-type="del">' . $i;
		}
		$html    .= str_repeat( '</mark>', 15 ) . '</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>' . implode( '', range( 1, 15 ) ) . '</p>', $stripped );
	}

	public function test_many_planted_sentinels_inside_an_addition_are_removed_with_it() {
		// Enough attribute updates to make the tag processor flush its queue
		// mid-walk, before the addition's closer is reached.
		$html     = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">' . str_repeat( '<span data-wp-suggestion-strip="add">s</span>', 1200 ) . '</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>xy</p>', $stripped );
	}

	public function test_many_planted_sentinels_inside_a_deletion_are_removed() {
		$html     = '<p><mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">' . str_repeat( '<span data-wp-suggestion-strip="add">s</span>', 1200 ) . '</mark>y</p>';
		$stripped = gutenberg_strip_inline_suggestion_markers( $html );

		$this->assertSame( '<p>' . str_repeat( '<span>s</span>', 1200 ) . 'y</p>', $this->normalize_tag_whitespace( $stripped ) );
	}

	/**
	 * Collapses the whitespace `remove_attribute()` leaves behind inside a tag.
	 *
	 * @param string $html HTML.
	 * @return string HTML with redundant in-tag whitespace removed.
	 */
	private function normalize_tag_whitespace( $html ) {
		return preg_replace( array( '~\s+>~', '~(<[a-z][^>]*?)\s{2,}~i' ), array( '>', '$1 ' ), $html );
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
	 * Stores markup as a post's content without content filters, so the
	 * markers survive as written.
	 *
	 * @param int    $post_id Post to update.
	 * @param string $content Post content.
	 */
	private function set_post_content( $post_id, $content ) {
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $post_id ) );
		clean_post_cache( $post_id );
	}

	/**
	 * Renders a paragraph block as the content of the given post.
	 *
	 * @param int    $post_id Post being rendered.
	 * @param string $html    Paragraph HTML.
	 * @param bool   $store   Whether to store the paragraph as the post's
	 *                        content first.
	 * @return string Rendered content.
	 */
	private function strip_in_post( $post_id, $html, $store = true ) {
		$content = '<!-- wp:paragraph -->' . $html . '<!-- /wp:paragraph -->';
		if ( $store ) {
			$this->set_post_content( $post_id, $content );
		}
		$GLOBALS['post'] = get_post( $post_id );
		return $this->without_paragraph_class( trim( apply_filters( 'the_content', $content ) ) );
	}

	/**
	 * Removes the class the paragraph block adds on render.
	 *
	 * @param string $html Rendered HTML.
	 * @return string HTML without the paragraph block class.
	 */
	private function without_paragraph_class( $html ) {
		return str_replace( ' class="wp-block-paragraph"', '', $html );
	}

	/**
	 * Builds a format marker.
	 *
	 * @param int    $note_id Note comment ID.
	 * @param string $inner   Marked run.
	 * @return string Marker HTML.
	 */
	private function format_marker( $note_id, $inner ) {
		return '<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format">' . $inner . '</mark>';
	}

	/**
	 * Creates a published post whose paragraph holds a pending format change
	 * recorded with the original `SECRET`.
	 *
	 * @return int[] Post ID and note ID.
	 */
	private function create_post_with_format_change() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'SECRET' );
		$this->set_post_content( $post_id, '<!-- wp:paragraph --><p>Hello ' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p><!-- /wp:paragraph -->' );
		return array( $post_id, $note_id );
	}

	/**
	 * Renders a page holding a Query Loop of posts.
	 *
	 * @param string $template Inner blocks of the post template.
	 * @return string Rendered content.
	 */
	private function render_page_with_query_loop( $template ) {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$content = '<!-- wp:query {"queryId":1,"query":{"postType":"post","perPage":5,"inherit":false}} --><div class="wp-block-query"><!-- wp:post-template -->' . $template . '<!-- /wp:post-template --></div><!-- /wp:query -->';
		$this->set_post_content( $page_id, $content );
		$GLOBALS['post'] = get_post( $page_id );
		return $this->without_paragraph_class( apply_filters( 'the_content', $content ) );
	}

	public function test_query_loop_item_does_not_resolve_a_queried_posts_note() {
		list( , $note_id ) = $this->create_post_with_format_change();

		$rendered = $this->render_page_with_query_loop(
			'<!-- wp:paragraph --><p>' . $this->format_marker( $note_id, '<strong>planted</strong>' ) . '</p><!-- /wp:paragraph -->'
		);

		// The paragraph belongs to the page, so the queried post's note is
		// not consulted and the marker unwraps.
		$this->assertStringNotContainsString( 'SECRET', $rendered );
		$this->assertStringContainsString( '<p><strong>planted</strong></p>', $rendered );
	}

	public function test_query_loop_post_content_restores_each_posts_own_original() {
		$this->create_post_with_format_change();

		$rendered = $this->render_page_with_query_loop( '<!-- wp:post-content /-->' );

		$this->assertStringContainsString( '<p>Hello SECRET</p>', $rendered );
	}

	public function test_post_content_restores_its_own_original() {
		list( $post_id ) = $this->create_post_with_format_change();
		$GLOBALS['post'] = get_post( $post_id );

		$this->assertStringContainsString( '<p>Hello SECRET</p>', $this->without_paragraph_class( apply_filters( 'the_content', get_post( $post_id )->post_content ) ) );
	}

	public function test_marker_outside_post_content_is_not_resolved() {
		list( , $note_id ) = $this->create_post_with_format_change();

		$this->assertSame( '<p><strong>world</strong></p>', gutenberg_strip_inline_suggestion_markers( '<p>' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p>' ) );
	}

	public function test_note_missing_from_its_posts_content_is_not_used() {
		list( $post_id, $note_id ) = $this->create_post_with_format_change();

		$this->set_post_content( $post_id, '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' );
		$html = '<p>' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p>';

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, $html, false ) );
	}

	public function test_trashed_note_is_not_used() {
		list( $post_id, $note_id ) = $this->create_post_with_format_change();
		wp_trash_comment( $note_id );

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, '<p>' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p>' ) );
	}

	public function test_spam_note_is_not_used() {
		list( $post_id, $note_id ) = $this->create_post_with_format_change();
		wp_spam_comment( $note_id );

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, '<p>' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p>' ) );
	}

	public function test_rejected_note_is_not_used() {
		list( $post_id, $note_id ) = $this->create_post_with_format_change();
		update_comment_meta( $note_id, '_wp_suggestion_status', 'rejected' );

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, '<p>' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p>' ) );
	}

	public function test_password_protected_post_is_not_resolved() {
		list( $post_id, $note_id ) = $this->create_post_with_format_change();
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_password' => 'pass' ), array( 'ID' => $post_id ) );
		clean_post_cache( $post_id );

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, '<p>' . $this->format_marker( $note_id, '<strong>world</strong>' ) . '</p>' ) );
	}

	public function test_pending_format_restores_the_original_run() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'world' );
		$html    = '<p>Hello <mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark></p>';

		// The proposed bold must not reach readers until it is accepted.
		$this->assertSame( '<p>Hello world</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_pending_format_restores_original_formatting() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, '<em>world</em>' );
		$html    = '<p>Hello <mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark>!</p>';

		$this->assertSame( '<p>Hello <em>world</em>!</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_applied_format_keeps_the_proposed_formatting() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'world', 'applied' );
		$html    = '<p>Hello <mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark></p>';

		$this->assertSame( '<p>Hello <strong>world</strong></p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_format_note_from_another_post_is_not_rendered() {
		// A marker copied into another post must not pull that post's
		// (possibly private) text onto this page.
		$other_id = self::factory()->post->create( array( 'post_status' => 'private' ) );
		$post_id  = self::factory()->post->create();
		$note_id  = $this->create_format_note( $other_id, 'secret' );
		$html     = '<p><mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>world</strong></mark></p>';

		$this->assertSame( '<p><strong>world</strong></p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_format_marker_without_a_note_unwraps() {
		$post_id = self::factory()->post->create();
		$html    = '<p><mark class="wp-suggestion-format" data-suggestion-id="999999" data-suggestion-type="format"><strong>world</strong></mark></p>';

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
		$inner   = '<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format">world</mark>';
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

	public function test_format_nested_inside_addition_is_removed_with_it() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'orig' );
		$html    = '<p>x<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">a<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>b</strong></mark>c</mark>y</p>';

		$this->assertSame( '<p>xy</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_markers_nested_inside_a_restored_format_run_are_replaced_with_it() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'orig' );
		$html    = '<p>x<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>a<mark class="wp-suggestion-add" data-suggestion-id="2" data-suggestion-type="add">b</mark><mark class="wp-suggestion-del" data-suggestion-id="3" data-suggestion-type="del">c</mark></strong></mark>y</p>';

		$this->assertSame( '<p>xorigy</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_restored_format_run_has_its_own_markers_and_sentinels_stripped() {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, '<span data-wp-suggestion-strip="add">o</span><mark class="wp-suggestion-add" data-suggestion-id="5" data-suggestion-type="add">new</mark>' );
		$html    = '<p><mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>b</strong></mark></p>';

		$this->assertSame( '<p><span>o</span></p>', $this->normalize_tag_whitespace( $this->strip_in_post( $post_id, $html ) ) );
	}

	/**
	 * Builds a paragraph with many unclosed deletion openers followed by a
	 * closed addition.
	 *
	 * @param int $deletions Number of unclosed deletion openers.
	 * @return string Block HTML.
	 */
	private function many_open_deletions_then_addition( $deletions ) {
		$html = '<p>';
		for ( $i = 1; $i <= $deletions; $i++ ) {
			$html .= '<mark class="wp-suggestion-del" data-suggestion-id="' . $i . '" data-suggestion-type="del">Q';
		}
		return $html . '<mark class="wp-suggestion-add" data-suggestion-id="0" data-suggestion-type="add">PENDING</mark></p>';
	}

	public function test_addition_after_999_open_deletions_is_removed_once() {
		$stripped = gutenberg_strip_inline_suggestion_markers( $this->many_open_deletions_then_addition( 999 ) );

		$this->assertSame( '<p>' . str_repeat( 'Q', 999 ) . '</p>', $stripped );
	}

	public function test_addition_after_1000_open_deletions_is_removed_once() {
		$stripped = gutenberg_strip_inline_suggestion_markers( $this->many_open_deletions_then_addition( 1000 ) );

		$this->assertSame( '<p>' . str_repeat( 'Q', 1000 ) . '</p>', $stripped );
	}

	public function test_restored_format_run_has_its_note_markers_stripped() {
		// The note-marker strip has already run on the block by the time the
		// original is swapped in, so the original needs its own pass.
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'a<mark class="wp-note" data-note-id="4">orig</mark>b' );
		$html    = '<p><mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>x</strong></mark></p>';

		$this->assertSame( '<p>aorigb</p>', $this->strip_in_post( $post_id, $html ) );
	}

	/**
	 * Data provider: additions whose lexical span and browser span differ.
	 *
	 * @return array[] Input HTML and expected output.
	 */
	public function data_unbalanced_additions() {
		$add = '<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add" data-author="3">';
		return array(
			'crossing </p><p>'               => array( '<p>a' . $add . 'X</p><p>Y</mark>b</p>', '<p>ab</p>' ),
			'block-level start tag inside'   => array( '<p>a' . $add . 'X<div>Y</div></mark>b</p>', '<p>ab</p>' ),
			'crossing </td> in a table cell' => array( '<table><tr><td>a' . $add . 'X</td><td>Y</mark>b</td></tr></table>', '<table><tr><td>ab</td></tr></table>' ),
			'crossing </li> in a list item'  => array( '<ul><li>a' . $add . 'X</li><li>Y</mark>b</li></ul>', '<ul><li>ab</li></ul>' ),
			'closer ignored inside a div'    => array( '<div>a' . $add . 'X<div>Y</mark>Z</div>W</div>c', '<div>a</div>c' ),
			'closer ignored inside a table'  => array( '<div>a' . $add . '<table></mark>LEAK</table>Z</div>c', '<div>a</div>c' ),
			'formatting closer past a div'   => array( '<p><b>a' . $add . 'X<div>Y</b>Z</div>W</p>', '<p><b>a</p>' ),
			'format crossing </p><p>'        => array( '<p>a<mark class="wp-suggestion-format" data-suggestion-id="999999" data-suggestion-type="format">X</p><p>Y</mark>b</p>', '<p>ab</p>' ),
		);
	}

	/**
	 * @dataProvider data_unbalanced_additions
	 *
	 * @param string $html     Block HTML.
	 * @param string $expected Expected output.
	 */
	public function test_unbalanced_addition_fails_closed( $html, $expected ) {
		$this->assertSame( $expected, gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	public function test_unbalanced_deletion_keeps_its_text() {
		$html = '<p>a<mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">X</p><p>Y</mark>b</p>';

		$this->assertSame( '<p>aX</p><p>Yb</p>', gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	public function test_class_wins_over_a_mismatched_type_attribute() {
		$html = '<p><mark class="wp-suggestion-del" data-suggestion-id="7" data-suggestion-type="add">kept</mark></p>';

		$this->assertSame( '<p>kept</p>', gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	public function test_leaves_the_old_single_class_untouched() {
		// The single `wp-suggestion` class predates the per-kind markers and
		// is no longer a marker.
		$html = '<p><mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="del">x</mark></p>';

		$this->assertSame( $html, gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	/**
	 * Markers of different kinds nested in both orders. `%f` is replaced
	 * with the id of a pending format note whose original run is `orig`.
	 *
	 * @dataProvider data_nested_kinds
	 *
	 * @param string $html     Block HTML.
	 * @param string $expected Rendered HTML.
	 */
	public function test_nested_marker_kinds( $html, $expected ) {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'orig' );
		$html    = str_replace( '%f', (string) $note_id, $html );

		$this->assertSame( $expected, $this->strip_in_post( $post_id, $html ) );
	}

	/**
	 * @return array[]
	 */
	public function data_nested_kinds() {
		$add = '<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">';
		$del = '<mark class="wp-suggestion-del" data-suggestion-id="2" data-suggestion-type="del">';
		$fmt = '<mark class="wp-suggestion-format" data-suggestion-id="%f" data-suggestion-type="format">';
		return array(
			'del inside add'    => array( "<p>x{$add}a{$del}b</mark>c</mark>y</p>", '<p>xy</p>' ),
			'add inside del'    => array( "<p>x{$del}a{$add}b</mark>c</mark>y</p>", '<p>xacy</p>' ),
			'format inside add' => array( "<p>x{$add}a{$fmt}<strong>b</strong></mark></mark>y</p>", '<p>xy</p>' ),
			'add inside format' => array( "<p>x{$fmt}<strong>a{$add}b</mark></strong></mark>y</p>", '<p>xorigy</p>' ),
			'del inside format' => array( "<p>x{$fmt}<strong>a{$del}b</mark></strong></mark>y</p>", '<p>xorigy</p>' ),
			'format inside del' => array( "<p>x{$del}a{$fmt}<strong>b</strong></mark>c</mark>y</p>", '<p>xaorigcy</p>' ),
			'all three'         => array( "<p>x{$add}a{$fmt}<strong>b{$del}c</mark></strong></mark>{$del}d</mark></mark>y</p>", '<p>xy</p>' ),
		);
	}

	public function test_format_marker_split_by_a_deletion_restores_the_original_once() {
		// Canonical order never splits a format marker, but merged or
		// hand-edited markup can: the first fragment carries the whole
		// original and the later ones render nothing.
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'ab' );
		$fmt     = '<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format">';
		$del     = '<mark class="wp-suggestion-del" data-suggestion-id="6" data-suggestion-type="del">';
		$html    = "<p>x{$fmt}<strong>a</strong></mark>{$del}{$fmt}<strong>b</strong></mark>c</mark>y</p>";

		$this->assertSame( '<p>xabcy</p>', $this->strip_in_post( $post_id, $html ) );
	}

	public function test_format_fragments_are_counted_per_render() {
		// The first-fragment rule is per strip call: rendering the same block
		// twice restores the original both times.
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, 'ab' );
		$html    = '<p><mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format"><strong>ab</strong></mark></p>';

		$this->assertSame( '<p>ab</p>', $this->strip_in_post( $post_id, $html ) );
		$this->assertSame( '<p>ab</p>', $this->strip_in_post( $post_id, $html ) );
	}

	/**
	 * annezazu's example (#73411): A adds " Bright red apples fell.", B
	 * bolds "red apples" inside it, C deletes "apples fell" inside it. Each
	 * case is the content a sequence of decisions leaves, with the rest
	 * still pending; `%b` is B's format note, whose original is the run
	 * without the bold (shrunk when C's deletion was accepted).
	 *
	 * @dataProvider data_annezazu_states
	 *
	 * @param string $html     Block HTML.
	 * @param string $original B's recorded original run.
	 * @param string $expected Rendered HTML.
	 */
	public function test_annezazu_states( $html, $original, $expected ) {
		$post_id = self::factory()->post->create();
		$note_id = $this->create_format_note( $post_id, $original );
		$html    = str_replace( '%b', (string) $note_id, $html );

		$this->assertSame( $expected, $this->strip_in_post( $post_id, $html ) );
	}

	/**
	 * @return array[]
	 */
	public function data_annezazu_states() {
		$a  = '<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add" data-author="1">';
		$b  = '<mark class="wp-suggestion-format" data-suggestion-id="%b" data-suggestion-type="format" data-author="2">';
		$c  = '<mark class="wp-suggestion-del" data-suggestion-id="3" data-suggestion-type="del" data-author="3">';
		$bc = "{$b}<strong>red </strong>{$c}<strong>apples</strong></mark></mark>{$c} fell</mark>";
		return array(
			'all pending'      => array( "<p>Intro.{$a} Bright {$bc}.</mark></p>", 'red apples', '<p>Intro.</p>' ),
			'a accepted'       => array( "<p>Intro. Bright {$bc}.</p>", 'red apples', '<p>Intro. Bright red apples fell.</p>' ),
			'a, b accepted'    => array( "<p>Intro. Bright <strong>red </strong>{$c}<strong>apples</strong></mark>{$c} fell</mark>.</p>", 'red apples', '<p>Intro. Bright <strong>red </strong><strong>apples</strong> fell.</p>' ),
			'a, c accepted'    => array( "<p>Intro. Bright {$b}<strong>red </strong></mark>.</p>", 'red ', '<p>Intro. Bright red .</p>' ),
			'c accepted first' => array( "<p>Intro.{$a} Bright {$b}<strong>red </strong></mark>.</mark></p>", 'red ', '<p>Intro.</p>' ),
		);
	}

	public function test_filter_is_registered_on_render_block() {
		$this->assertNotFalse(
			has_filter( 'render_block', 'gutenberg_strip_inline_suggestion_markers' )
		);
	}
}
