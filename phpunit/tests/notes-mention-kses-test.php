<?php
/**
 * Tests that the note mention kses allowance is scoped to `note` comments.
 *
 * The `<a class="wp-note-mention user-N" href="…">` markup must survive
 * sanitization when a note is written by a user without `unfiltered_html`,
 * while the sanitization of every other comment type - which reaches back to
 * anonymous front-end comments - stays byte-identical to core's defaults.
 *
 * @group notes
 */
class Tests_Notes_Mention_Kses extends WP_UnitTestCase {

	/*
	 * The mention href is external to the test site so that core's
	 * wp_rel_ugc() 'pre_comment_content' filter - which applies to notes like
	 * any other comment - deterministically appends `rel="nofollow ugc"`
	 * regardless of the test environment's home URL.
	 */
	const MENTION_CONTENT  = 'Hi <a class="wp-note-mention user-2" href="https://example.com/author/admin/">@admin</a>!';
	const MENTION_FILTERED = 'Hi <a class="wp-note-mention user-2" href="https://example.com/author/admin/" rel="nofollow ugc">@admin</a>!';
	const STRIPPED_CONTENT = 'Hi <a href="https://example.com/author/admin/" rel="nofollow ugc">@admin</a>!';

	public function test_mention_markup_survives_note_content_filtering() {
		$filtered = $this->filter_comment_with_kses( 'note' );

		$this->assertSame( self::MENTION_FILTERED, wp_unslash( $filtered['comment_content'] ) );
	}

	public function test_mention_markup_stripped_from_regular_comment_content() {
		$filtered = $this->filter_comment_with_kses( 'comment' );

		$this->assertSame( self::STRIPPED_CONTENT, wp_unslash( $filtered['comment_content'] ) );
	}

	public function test_only_default_link_attributes_and_class_are_allowed_on_note_links() {
		$filtered = $this->filter_comment_with_kses(
			'note',
			'Hi <a class="wp-note-mention user-2" href="https://example.com/author/admin/" data-user-id="2" onclick="alert(1)" style="color:red">@admin</a>!'
		);

		$this->assertSame(
			self::MENTION_FILTERED,
			wp_unslash( $filtered['comment_content'] ),
			'Attributes beyond `class` and the default link attributes should be stripped from note links.'
		);
	}

	public function test_mention_allowance_does_not_leak_after_note_filtering() {
		$this->filter_comment_with_kses( 'note' );

		// A regular comment filtered after a note still gets the default rules.
		$filtered = $this->filter_comment_with_kses( 'comment' );
		$this->assertSame(
			self::STRIPPED_CONTENT,
			wp_unslash( $filtered['comment_content'] ),
			'The mention markup should be stripped from a regular comment filtered after a note.'
		);

		$this->assertFalse(
			has_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes' ),
			'The allowlist filter should not outlive the note write that armed it.'
		);
		$this->assertFalse(
			has_filter( 'pre_comment_content', 'gutenberg_notes_disarm_mention_kses' ),
			'The disarm filter should remove itself.'
		);
		$this->assertFalse(
			has_filter( 'rest_request_after_callbacks', 'gutenberg_notes_disarm_mention_kses' ),
			'The disarm backstop should remove itself.'
		);
	}

	public function test_rest_prepare_arms_for_note_update() {
		$post_id = self::factory()->post->create();
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'id', $note_id );

		// Updates do not carry the comment type in the prepared data.
		gutenberg_notes_scope_mention_kses_rest( array(), $request );

		$this->assertNotFalse(
			has_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes' ),
			'Updating a note should arm the mention allowance.'
		);

		gutenberg_notes_disarm_mention_kses();
	}

	public function test_rest_prepare_does_not_arm_for_regular_comment_update() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->set_param( 'id', $comment_id );

		gutenberg_notes_scope_mention_kses_rest( array(), $request );

		$this->assertFalse(
			has_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes' ),
			'Updating a regular comment should not arm the mention allowance.'
		);
	}

	public function test_mention_markup_survives_note_insert_end_to_end() {
		$author_id = self::factory()->user->create( array( 'role' => 'editor' ) );
		$post_id   = self::factory()->post->create();

		// Sanitize as for a user without `unfiltered_html`.
		add_filter( 'pre_comment_content', 'wp_filter_kses' );

		$comment_id = wp_new_comment(
			wp_slash(
				array_merge(
					$this->get_commentdata( 'note' ),
					array(
						'comment_post_ID' => $post_id,
						'user_id'         => $author_id,
					)
				)
			)
		);

		remove_filter( 'pre_comment_content', 'wp_filter_kses' );

		$this->assertIsInt( $comment_id );
		$this->assertSame( self::MENTION_FILTERED, get_comment( $comment_id )->comment_content );
	}

	/**
	 * Runs commentdata of the given type through the insert-path sanitization.
	 *
	 * Mirrors wp_new_comment(): the 'preprocess_comment' filter (which arms the
	 * allowance for notes) followed by wp_filter_comment() with kses attached as
	 * it is for users without `unfiltered_html`.
	 *
	 * @param string $comment_type The comment type to filter.
	 * @param string $content      Optional. The comment content to filter.
	 * @return array The filtered, still-slashed commentdata.
	 */
	private function filter_comment_with_kses( $comment_type, $content = self::MENTION_CONTENT ) {
		add_filter( 'pre_comment_content', 'wp_filter_kses' );

		$commentdata = apply_filters( 'preprocess_comment', wp_slash( $this->get_commentdata( $comment_type, $content ) ) );
		$filtered    = wp_filter_comment( $commentdata );

		remove_filter( 'pre_comment_content', 'wp_filter_kses' );

		return $filtered;
	}

	/**
	 * Builds a commentdata array containing every field wp_filter_comment() reads.
	 *
	 * @param string $comment_type The comment type.
	 * @param string $content      Optional. The comment content.
	 * @return array The commentdata.
	 */
	private function get_commentdata( $comment_type, $content = self::MENTION_CONTENT ) {
		return array(
			'comment_content'      => $content,
			'comment_type'         => $comment_type,
			'comment_author'       => 'Note Author',
			'comment_author_IP'    => '127.0.0.1',
			'comment_author_url'   => 'http://example.org',
			'comment_author_email' => 'note-author@example.org',
			'comment_agent'        => '',
		);
	}
}
