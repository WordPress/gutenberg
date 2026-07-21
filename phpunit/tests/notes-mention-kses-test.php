<?php
/**
 * Tests the note mention kses allowance for comment content.
 *
 * The `<a data-wp-note-mention-user="N" href="…">` markup must survive
 * sanitization when a note is written by a user without `unfiltered_html`. The
 * mention attribute is a single inert, purpose-specific data attribute, so the
 * allowance is registered globally for the `pre_comment_content` context rather
 * than armed per note write. Every other link attribute (`class`, event
 * handlers, styles, other data attributes) still stays stripped as in core's
 * defaults.
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
	const MENTION_CONTENT  = 'Hi <a data-wp-note-mention-user="2" href="https://example.com/author/admin/">@admin</a>!';
	const MENTION_FILTERED = 'Hi <a data-wp-note-mention-user="2" href="https://example.com/author/admin/" rel="nofollow ugc">@admin</a>!';
	const STRIPPED_CONTENT = 'Hi <a href="https://example.com/author/admin/" rel="nofollow ugc">@admin</a>!';

	/**
	 * Baseline: without the notes allowance, the comment kses context strips the
	 * mention data attribute.
	 *
	 * This documents the load-bearing fact the allowance exists for: unlike the
	 * `post` context, the `pre_comment_content` context does not allow `data-*`
	 * attributes by default, so a mention would lose its user ID on save for any
	 * user without `unfiltered_html`.
	 */
	public function test_comment_kses_strips_data_attribute_by_default() {
		remove_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes' );

		$filtered = wp_kses( self::MENTION_CONTENT, 'pre_comment_content' );

		add_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_attributes', 10, 2 );

		$this->assertSame(
			'Hi <a href="https://example.com/author/admin/">@admin</a>!',
			$filtered,
			'The comment kses context should strip the mention data attribute without the notes allowance.'
		);
	}

	public function test_mention_markup_survives_note_content_filtering() {
		$filtered = $this->filter_comment_with_kses( 'note' );

		$this->assertSame( self::MENTION_FILTERED, wp_unslash( $filtered['comment_content'] ) );
	}

	/**
	 * The mention attribute is inert and allowed globally in comment content, so
	 * it also survives in a regular (non-note) comment. This documents the
	 * intended behavior change from the previous per-note-armed `class`
	 * allowance.
	 */
	public function test_mention_attribute_survives_regular_comment_content() {
		$filtered = $this->filter_comment_with_kses( 'comment' );

		$this->assertSame( self::MENTION_FILTERED, wp_unslash( $filtered['comment_content'] ) );
	}

	public function test_only_the_mention_attribute_and_default_link_attributes_are_allowed() {
		$filtered = $this->filter_comment_with_kses(
			'note',
			'Hi <a data-wp-note-mention-user="2" href="https://example.com/author/admin/" class="danger" data-user-id="2" onclick="alert(1)" style="color:red">@admin</a>!'
		);

		$this->assertSame(
			self::MENTION_FILTERED,
			wp_unslash( $filtered['comment_content'] ),
			'Attributes beyond `data-wp-note-mention-user` and the default link attributes should be stripped from note links.'
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

	public function test_mention_markup_survives_rest_note_creation_end_to_end() {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id   = self::factory()->post->create( array( 'post_author' => $author_id ) );

		// Authors lack `unfiltered_html`, so comment kses filters their content.
		wp_set_current_user( $author_id );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'content', self::MENTION_CONTENT );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame(
			self::MENTION_FILTERED,
			get_comment( (int) $data['id'] )->comment_content
		);
	}

	/**
	 * Runs commentdata of the given type through the insert-path sanitization.
	 *
	 * Mirrors wp_new_comment(): the 'preprocess_comment' filter followed by
	 * wp_filter_comment() with kses attached as it is for users without
	 * `unfiltered_html`.
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
