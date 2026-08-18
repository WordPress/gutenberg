<?php
/**
 * Tests for note mention notifications.
 *
 * @package gutenberg
 */
class Tests_Notes_Mentions extends WP_UnitTestCase {

	/**
	 * Post the notes are attached to.
	 */
	private static WP_Post $post;

	/**
	 * Author of the post (notified by core, not by the mention path).
	 */
	private static WP_User $post_author;

	/**
	 * A user who writes notes.
	 */
	private static WP_User $commenter;

	/**
	 * A user who gets mentioned.
	 */
	private static WP_User $mentioned;

	/**
	 * Captured wp_mail() calls for the current test.
	 *
	 * @var array<array{to: string[], subject: string, message: string}>
	 */
	private array $sent = array();

	/**
	 * Captured wp_mail() recipients for the current test.
	 *
	 * @var string[]
	 */
	private array $sent_to = array();

	/**
	 * Sets up shared fixtures.
	 */
	public static function wpSetUpBeforeClass(): void {
		self::$post_author = self::create_user( 'editor' );
		self::$commenter   = self::create_user( 'editor' );
		self::$mentioned   = self::create_user( 'editor' );

		$post = self::factory()->post->create_and_get( array( 'post_author' => self::$post_author->ID ) );
		if ( ! $post instanceof WP_Post ) {
			throw new Exception( 'Expected WP_Post' );
		}
		self::$post = $post;
	}

	/**
	 * Creates a user with the given role.
	 *
	 * @param string $role Role to assign.
	 * @return WP_User The created user.
	 */
	private static function create_user( string $role ): WP_User {
		$user = self::factory()->user->create_and_get( array( 'role' => $role ) );
		if ( ! $user instanceof WP_User ) {
			throw new Exception( 'Expected WP_User' );
		}
		return $user;
	}

	public function set_up(): void {
		parent::set_up();
		$this->sent    = array();
		$this->sent_to = array();
		// Short-circuit wp_mail() and record what would have been sent.
		add_filter( 'pre_wp_mail', array( $this, 'capture_mail' ), 10, 2 );
	}

	/**
	 * Records wp_mail() calls and short-circuits delivery.
	 *
	 * @param null                                              $short_circuit Short-circuit value.
	 * @param array{ to: string|string[], subject: string, message: string } $atts wp_mail() arguments.
	 * @return bool Always true to indicate a "sent" message.
	 */
	public function capture_mail( $short_circuit, $atts ): bool {
		$to           = (array) $atts['to'];
		$this->sent[] = array(
			'to'      => $to,
			'subject' => (string) $atts['subject'],
			'message' => (string) $atts['message'],
		);
		foreach ( $to as $recipient ) {
			$this->sent_to[] = $recipient;
		}
		return true;
	}

	/**
	 * Builds a note comment for the shared post.
	 *
	 * @param string             $content   Note content.
	 * @param int                $user_id   Author user ID.
	 * @param int|numeric-string $parent_id Parent note ID (0 for a top-level note).
	 * @return WP_Comment The inserted note.
	 */
	private function insert_note( string $content, int $user_id, $parent_id = 0 ): WP_Comment {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => self::$post->ID,
				'comment_type'    => 'note',
				'comment_content' => $content,
				'comment_parent'  => $parent_id,
				'user_id'         => $user_id,
			)
		);
		assert( is_int( $comment_id ) );
		$comment = get_comment( $comment_id );
		assert( $comment instanceof WP_Comment );
		return $comment;
	}

	/**
	 * Builds mention markup for a user.
	 *
	 * @param int    $user_id User to mention.
	 * @param string $label   Visible mention label.
	 * @return string Mention chip markup.
	 */
	private static function mention( int $user_id, string $label = '@User' ): string {
		return sprintf( '<span class="wp-note-mention user-%d">%s</span>', $user_id, $label );
	}

	/**
	 * @covers ::gutenberg_get_note_mentioned_user_ids
	 */
	public function test_parses_mentioned_user_ids(): void {
		$content = '<p>Hi <span class="wp-note-mention user-5">@Jane</span> and '
			. '<span class="wp-note-mention user-9">@Bob</span>.</p>';

		$this->assertSame(
			array( 5, 9 ),
			gutenberg_get_note_mentioned_user_ids( $content )
		);
	}

	/**
	 * @covers ::gutenberg_get_note_mentioned_user_ids
	 */
	public function test_ignores_non_mentions_and_deduplicates(): void {
		$content = '<p><span class="user-7">not a mention</span> '
			. '<a class="wp-note-mention user-7" href="#">an anchor, not a chip</a> '
			. '<span class="wp-note-mention user-5">@Jane</span> '
			. '<span class="wp-note-mention user-5">@Jane again</span> '
			. '<span class="wp-note-mention">no user class</span></p>';

		$this->assertSame(
			array( 5 ),
			gutenberg_get_note_mentioned_user_ids( $content )
		);
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 * @covers ::gutenberg_send_note_notification
	 */
	public function test_mentioned_user_is_emailed(): void {
		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);

		gutenberg_notify_note_mentions( $note );

		$this->assertContains( self::$mentioned->user_email, $this->sent_to );
	}

	/**
	 * @covers ::gutenberg_send_note_notification
	 */
	public function test_email_contains_context_and_editor_link(): void {
		// The editor link comes from get_edit_post_link(), which is scoped to
		// the current user; in the REST flow that is the note's author.
		wp_set_current_user( self::$commenter->ID );

		$note = $this->insert_note(
			'<p>Please review ' . self::mention( self::$mentioned->ID, '@Reviewer' ) . '</p>',
			self::$commenter->ID
		);

		gutenberg_notify_note_mentions( $note );

		$this->assertCount( 1, $this->sent );
		$email = $this->sent[0];

		$this->assertStringContainsString( 'You were mentioned in a note', $email['subject'] );
		// The note text is included, stripped of markup.
		$this->assertStringContainsString( 'Please review @Reviewer', $email['message'] );
		$this->assertStringNotContainsString( '<span', $email['message'] );
		// The email links to the post editor, as core's own note email does.
		$this->assertStringContainsString(
			get_edit_post_link( self::$post->ID, 'url' ),
			$email['message']
		);
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_author_is_not_notified_about_their_own_note(): void {
		$note = $this->insert_note(
			'Note to ' . self::mention( self::$commenter->ID, '@Me' ),
			self::$commenter->ID
		);

		gutenberg_notify_note_mentions( $note );

		$this->assertNotContains( self::$commenter->user_email, $this->sent_to );
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_post_author_is_left_to_core(): void {
		$note = $this->insert_note(
			'Hey ' . self::mention( self::$post_author->ID, '@Author' ),
			self::$commenter->ID
		);

		gutenberg_notify_note_mentions( $note );

		// Core notifies the post author of every note; the mention path must
		// not also email them or they would receive a duplicate.
		$this->assertNotContains( self::$post_author->user_email, $this->sent_to );
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_mentioned_user_without_note_access_is_not_emailed(): void {
		$subscriber_user = self::create_user( 'subscriber' );

		$note = $this->insert_note(
			'Ping ' . self::mention( $subscriber_user->ID, '@Subscriber' ),
			self::$commenter->ID
		);

		gutenberg_notify_note_mentions( $note );

		// Notes are only readable by users who can edit them; a subscriber
		// cannot, so emailing them would leak content they cannot see.
		$this->assertNotContains( $subscriber_user->user_email, $this->sent_to );
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_mentioning_a_nonexistent_user_sends_nothing(): void {
		$note = $this->insert_note(
			'Ghost ' . self::mention( 999999, '@Ghost' ),
			self::$commenter->ID
		);

		gutenberg_notify_note_mentions( $note );

		$this->assertEmpty( $this->sent_to );
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_no_notifications_when_disabled(): void {
		update_option( 'wp_notes_notify', 0 );

		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);
		gutenberg_notify_note_mentions( $note );

		$this->assertEmpty( $this->sent_to );

		update_option( 'wp_notes_notify', 1 );
	}

	/**
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_editing_a_note_does_not_renotify(): void {
		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);

		// Simulate the update path of rest_insert_comment ($creating false).
		gutenberg_notify_note_mentions( $note, null, false );

		$this->assertEmpty( $this->sent_to );
	}

	/**
	 * Creating a note through the real REST endpoint must trigger the mention
	 * email: this exercises the `rest_insert_comment` wiring (hook name,
	 * priority, argument count), which the direct-call tests above bypass.
	 *
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_rest_note_creation_triggers_mention_email(): void {
		wp_set_current_user( self::$commenter->ID );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param(
			'content',
			'Ping ' . self::mention( self::$mentioned->ID )
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$this->assertContains( self::$mentioned->user_email, $this->sent_to );
	}

	/**
	 * Updating a note through the real REST endpoint must not re-notify.
	 *
	 * @covers ::gutenberg_notify_note_mentions
	 */
	public function test_rest_note_update_does_not_renotify(): void {
		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);

		wp_set_current_user( self::$commenter->ID );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $note->comment_ID );
		$request->set_param(
			'content',
			'Edited ping ' . self::mention( self::$mentioned->ID )
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotContains( self::$mentioned->user_email, $this->sent_to );
	}
}
