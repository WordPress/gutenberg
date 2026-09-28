<?php
/**
 * Tests the note mention kses allowance.
 *
 * The `<span class="wp-note-mention user-N">` mention chip must survive
 * sanitization when a note is written by a user without `unfiltered_html`.
 * The allowance is always on - it applies to every comment type - but it is
 * narrow: `span` may only carry the two mention class tokens, and every other
 * tag and attribute is sanitized exactly as by core's defaults.
 *
 * @group notes
 */
class Tests_Notes_Mention_Kses extends WP_UnitTestCase {

	const MENTION_CONTENT = 'Hi <span class="wp-note-mention user-2">@admin</span>!';

	public function test_mention_markup_survives_note_content_filtering() {
		$filtered = $this->filter_comment_with_kses( 'note' );

		$this->assertSame( self::MENTION_CONTENT, wp_unslash( $filtered['comment_content'] ) );
	}

	public function test_mention_markup_survives_regular_comment_content_filtering() {
		// The allowance is always on rather than armed per note write: the
		// mention markup is inert, so uniform sanitization beats stateful
		// per-comment-type kses arming.
		$filtered = $this->filter_comment_with_kses( 'comment' );

		$this->assertSame( self::MENTION_CONTENT, wp_unslash( $filtered['comment_content'] ) );
	}

	public function test_comment_kses_strips_mention_span_by_default() {
		// Baseline proving the allowance is required at all: without the
		// notes filter, the comment kses context strips `span` entirely.
		// WordPress trunk ships the allowance natively (see r62832), hooked
		// as `_wp_kses_allow_note_mention_span`, so detach that one too.
		remove_filter( 'wp_kses_allowed_html', 'gutenberg_notes_allow_mention_span' );
		remove_filter( 'wp_kses_allowed_html', '_wp_kses_allow_note_mention_span' );

		$stripped = wp_kses( self::MENTION_CONTENT, 'pre_comment_content' );

		$this->assertSame( 'Hi @admin!', $stripped );
	}

	public function test_class_tokens_beyond_the_mention_tokens_are_stripped() {
		$filtered = $this->filter_comment_with_kses(
			'note',
			'Hi <span class="wp-note-mention user-2 is-destructive components-button">@admin</span>!'
		);

		$this->assertSame(
			self::MENTION_CONTENT,
			wp_unslash( $filtered['comment_content'] ),
			'Class tokens beyond `wp-note-mention` and `user-N` should be stripped from spans.'
		);
	}

	public function test_class_tokens_are_stripped_from_uppercase_span_tags() {
		// kses preserves tag-name casing, so the class reduction must match
		// `SPAN` case-insensitively rather than bail on a `<span` substring check.
		$filtered = $this->filter_comment_with_kses(
			'note',
			'Hi <SPAN class="wp-note-mention user-2 is-destructive">@admin</SPAN>!'
		);

		$this->assertEqualHTML(
			self::MENTION_CONTENT,
			wp_unslash( $filtered['comment_content'] ),
			'<body>',
			'Class tokens should be reduced on spans regardless of tag-name casing.'
		);
	}

	public function test_class_attribute_is_removed_when_no_mention_tokens_remain() {
		$filtered = $this->filter_comment_with_kses(
			'comment',
			'Hi <span class="is-destructive user-0 user-x wp-note-mention-foo">there</span>!'
		);

		// Markup-equivalence assertion: the HTML API's whitespace handling
		// when removing the final attribute is not part of its contract.
		$this->assertEqualHTML(
			'Hi <span>there</span>!',
			wp_unslash( $filtered['comment_content'] ),
			'<body>',
			'A span with no valid mention tokens should lose its class attribute entirely.'
		);
	}

	public function test_other_span_attributes_are_stripped() {
		$filtered = $this->filter_comment_with_kses(
			'note',
			'Hi <span class="wp-note-mention user-2" data-user-id="2" onclick="alert(1)" style="color:red" id="mention">@admin</span>!'
		);

		$this->assertSame(
			self::MENTION_CONTENT,
			wp_unslash( $filtered['comment_content'] ),
			'Attributes beyond `class` should be stripped from spans.'
		);
	}

	public function test_class_is_still_stripped_from_other_tags() {
		$filtered = $this->filter_comment_with_kses(
			'note',
			'Hi <a class="wp-note-mention user-2" href="https://example.com/">@admin</a>!'
		);

		$this->assertSame(
			'Hi <a href="https://example.com/" rel="nofollow ugc">@admin</a>!',
			wp_unslash( $filtered['comment_content'] ),
			'The class allowance is scoped to spans; links keep core\'s default sanitization.'
		);
	}

	public function test_class_reduction_skipped_when_restrictive_kses_is_inactive() {
		// Users with `unfiltered_html` are filtered through
		// `wp_filter_post_kses` (or not at all); the mention class reduction
		// must not narrow what core allows them to post. kses_init() hooks
		// wp_filter_kses by default in the test environment, so detach it to
		// simulate the unfiltered_html configuration.
		remove_filter( 'pre_comment_content', 'wp_filter_kses' );

		$content = 'Hi <span class="components-button is-destructive">there</span>!';

		$this->assertSame(
			wp_slash( $content ),
			gutenberg_notes_sanitize_mention_classes( wp_slash( $content ) ),
			'Span classes should be left untouched when wp_filter_kses is not active.'
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
		$this->assertSame( self::MENTION_CONTENT, get_comment( $comment_id )->comment_content );
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

		/*
		 * REST creation reaches kses through wp_filter_comment() directly, not
		 * through wp_new_comment(), so this proves the always-on allowance
		 * covers the REST write path too.
		 */
		$data = $response->get_data();
		$this->assertSame(
			self::MENTION_CONTENT,
			get_comment( (int) $data['id'] )->comment_content
		);
	}

	/**
	 * Runs commentdata of the given type through the insert-path sanitization.
	 *
	 * Mirrors wp_new_comment(): wp_filter_comment() with kses attached as it
	 * is for users without `unfiltered_html`.
	 *
	 * @param string $comment_type The comment type to filter.
	 * @param string $content      Optional. The comment content to filter.
	 * @return array The filtered, still-slashed commentdata.
	 */
	private function filter_comment_with_kses( $comment_type, $content = self::MENTION_CONTENT ) {
		add_filter( 'pre_comment_content', 'wp_filter_kses' );

		$filtered = wp_filter_comment( wp_slash( $this->get_commentdata( $comment_type, $content ) ) );

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
