<?php
/**
 * Tests for note thread follower subscriptions and notifications.
 *
 * @package gutenberg
 */
class Tests_Notes_Followers extends WP_UnitTestCase {

	/**
	 * Post the notes are attached to.
	 */
	private static WP_Post $post;

	/**
	 * Author of the post.
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
	 * @param null                                                            $short_circuit Short-circuit value.
	 * @param array{ to: string|string[], subject: string, message: string } $atts          wp_mail() arguments.
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
	 * Returns the captured emails sent to the given address.
	 *
	 * @param string $email Recipient address.
	 * @return array<array{to: string[], subject: string, message: string}>
	 */
	private function emails_to( string $email ): array {
		return array_values(
			array_filter(
				$this->sent,
				fn ( $mail ) => in_array( $email, $mail['to'], true )
			)
		);
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
	 * Updates a note's content as its author, preserving mention markup.
	 *
	 * Comment updates run through kses for users without `unfiltered_html`,
	 * which strips the mention classes until #80221 arms the notes kses
	 * allowance outside creation. Editing as a sufficiently privileged user
	 * keeps the fixture markup intact.
	 *
	 * @param WP_Comment $note    The note to update.
	 * @param string     $content New note content.
	 * @return WP_Comment The updated note.
	 */
	private function update_note_content( WP_Comment $note, string $content ): WP_Comment {
		$editor_id = (int) $note->user_id;
		if ( is_multisite() ) {
			grant_super_admin( $editor_id );
		}
		$previous_user_id = get_current_user_id();
		wp_set_current_user( $editor_id );

		wp_update_comment(
			array(
				'comment_ID'      => $note->comment_ID,
				'comment_content' => $content,
			)
		);

		wp_set_current_user( $previous_user_id );
		if ( is_multisite() ) {
			revoke_super_admin( $editor_id );
		}

		$updated = get_comment( $note->comment_ID );
		assert( $updated instanceof WP_Comment );
		return $updated;
	}

	/**
	 * Fires the real `rest_insert_comment` action for a note, exercising all
	 * registered handlers (core's post-author notification, the mention path,
	 * and the follower handlers) in their true priority order.
	 *
	 * @param WP_Comment $comment  The note.
	 * @param bool       $creating Whether to simulate a create or an update.
	 */
	private function fire_rest_insert( WP_Comment $comment, bool $creating = true ): void {
		do_action( 'rest_insert_comment', $comment, null, $creating );
	}

	/**
	 * Builds mention markup for a user.
	 *
	 * @param int    $user_id User to mention.
	 * @param string $label   Visible mention label.
	 * @return string Mention anchor markup.
	 */
	private static function mention( int $user_id, string $label = '@User' ): string {
		return sprintf( '<a class="wp-note-mention user-%d" href="#">%s</a>', $user_id, $label );
	}

	/**
	 * @covers ::gutenberg_add_note_followers
	 * @covers ::gutenberg_get_note_followers
	 * @covers ::gutenberg_remove_note_followers
	 */
	public function test_followers_can_be_added_and_removed(): void {
		$note = $this->insert_note( 'Top level', self::$commenter->ID );

		gutenberg_add_note_followers(
			$note->comment_ID,
			array( self::$commenter->ID, self::$mentioned->ID )
		);

		$remaining = gutenberg_remove_note_followers(
			$note->comment_ID,
			array( self::$mentioned->ID )
		);

		$this->assertSame( array( self::$commenter->ID ), $remaining );
		$this->assertSame(
			array( self::$commenter->ID ),
			gutenberg_get_note_followers( $note->comment_ID )
		);

		// Removing the last follower clears the meta entirely.
		gutenberg_remove_note_followers( $note->comment_ID, array( self::$commenter->ID ) );
		$this->assertSame( '', get_comment_meta( $note->comment_ID, '_wp_note_followers', true ) );
	}

	/**
	 * @covers ::gutenberg_register_note_followers_meta
	 */
	public function test_followers_meta_is_registered_for_rest(): void {
		gutenberg_register_note_followers_meta();

		$registered = get_registered_meta_keys( 'comment' );
		$this->assertArrayHasKey( '_wp_note_followers', $registered );
		$this->assertNotFalse( $registered['_wp_note_followers']['show_in_rest'] );
	}

	/**
	 * @covers ::gutenberg_maintain_note_followers
	 */
	public function test_author_and_mentioned_users_follow_a_new_thread(): void {
		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);

		$this->fire_rest_insert( $note );

		$followers = gutenberg_get_note_followers( $note->comment_ID );
		$this->assertContains( self::$commenter->ID, $followers );
		$this->assertContains( self::$mentioned->ID, $followers );
	}

	/**
	 * @covers ::gutenberg_maintain_note_followers
	 */
	public function test_replying_subscribes_the_replier_to_the_thread_root(): void {
		$root = $this->insert_note( 'Top level', self::$commenter->ID );
		$this->fire_rest_insert( $root );

		$replier = self::create_user( 'editor' );
		$reply   = $this->insert_note( 'A reply', $replier->ID, $root->comment_ID );
		$this->fire_rest_insert( $reply );

		$this->assertContains(
			$replier->ID,
			gutenberg_get_note_followers( $root->comment_ID )
		);
		// The reply itself carries no follower list; the root anchors it.
		$this->assertSame( array(), gutenberg_get_note_followers( $reply->comment_ID ) );
	}

	/**
	 * Subscription bookkeeping must run even while notifications are off, so
	 * enabling notifications later works for existing threads.
	 *
	 * @covers ::gutenberg_maintain_note_followers
	 */
	public function test_subscriptions_are_maintained_while_notifications_are_disabled(): void {
		update_option( 'wp_notes_notify', 0 );

		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);
		$this->fire_rest_insert( $note );

		$this->assertEmpty( $this->sent_to );
		$followers = gutenberg_get_note_followers( $note->comment_ID );
		$this->assertContains( self::$commenter->ID, $followers );
		$this->assertContains( self::$mentioned->ID, $followers );

		update_option( 'wp_notes_notify', 1 );
	}

	/**
	 * @covers ::gutenberg_notify_note_followers
	 */
	public function test_followers_are_notified_of_replies(): void {
		$root = $this->insert_note(
			'Start ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);
		$this->fire_rest_insert( $root );

		// A different user replies; the mentioned user follows and should be
		// notified even though the reply doesn't mention them.
		$this->sent    = array();
		$this->sent_to = array();
		$replier       = self::create_user( 'editor' );
		$reply         = $this->insert_note( 'Following up', $replier->ID, $root->comment_ID );
		$this->fire_rest_insert( $reply );

		$emails = $this->emails_to( self::$mentioned->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'a note you follow', $emails[0]['subject'] );
		// The follower email carries the unfollow link for the thread.
		$this->assertStringContainsString(
			gutenberg_get_note_unfollow_url( (int) $root->comment_ID, self::$mentioned->ID ),
			$emails[0]['message']
		);
	}

	/**
	 * A follower who is also mentioned in the reply gets the mention email
	 * only, never two emails about the same note.
	 *
	 * @covers ::gutenberg_notify_note_followers
	 */
	public function test_mentioned_followers_are_not_double_notified(): void {
		$root = $this->insert_note(
			'Start ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);
		$this->fire_rest_insert( $root );

		$this->sent    = array();
		$this->sent_to = array();
		$replier       = self::create_user( 'editor' );
		$reply         = $this->insert_note(
			'Again ' . self::mention( self::$mentioned->ID ),
			$replier->ID,
			$root->comment_ID
		);
		$this->fire_rest_insert( $reply );

		$emails = $this->emails_to( self::$mentioned->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'You were mentioned', $emails[0]['subject'] );
	}

	/**
	 * @covers ::gutenberg_notify_new_mentions_on_note_update
	 * @covers ::gutenberg_maintain_note_followers
	 */
	public function test_edit_that_adds_a_mention_notifies_and_subscribes_the_new_user(): void {
		$note = $this->insert_note( 'No mentions yet', self::$commenter->ID );
		$this->fire_rest_insert( $note );
		$this->assertEmpty( $this->emails_to( self::$mentioned->user_email ) );

		// Edit the note to add a mention.
		$updated = $this->update_note_content(
			$note,
			'Now ping ' . self::mention( self::$mentioned->ID )
		);
		$this->fire_rest_insert( $updated, false );

		$emails = $this->emails_to( self::$mentioned->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'You were mentioned', $emails[0]['subject'] );
		$this->assertContains(
			self::$mentioned->ID,
			gutenberg_get_note_followers( $note->comment_ID )
		);
	}

	/**
	 * Users already following the thread are not re-notified when an edit
	 * repeats their mention.
	 *
	 * @covers ::gutenberg_notify_new_mentions_on_note_update
	 */
	public function test_edit_does_not_renotify_existing_followers(): void {
		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);
		$this->fire_rest_insert( $note );

		$this->sent    = array();
		$this->sent_to = array();
		$updated       = $this->update_note_content(
			$note,
			'Edited, still ' . self::mention( self::$mentioned->ID )
		);
		$this->fire_rest_insert( $updated, false );

		/*
		 * Scoped to the mention/follower paths: core's own
		 * wp_new_comment_via_rest_notify_postauthor() ignores the $creating
		 * flag and re-emails the post author on note updates too, which is a
		 * core issue outside this feature's control.
		 */
		$this->assertEmpty( $this->emails_to( self::$mentioned->user_email ) );
		$this->assertEmpty( $this->emails_to( self::$commenter->user_email ) );
	}

	/**
	 * A mentioned post author receives the mention email, and core's generic
	 * post-author notification is suppressed for that note.
	 *
	 * @covers ::gutenberg_route_post_author_mention_notification
	 */
	public function test_mentioned_post_author_gets_the_mention_email_not_the_generic_one(): void {
		$note = $this->insert_note(
			'Hey ' . self::mention( self::$post_author->ID, '@Author' ),
			self::$commenter->ID
		);

		$this->fire_rest_insert( $note );

		$emails = $this->emails_to( self::$post_author->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'You were mentioned', $emails[0]['subject'] );
	}

	/**
	 * Without a mention, core's generic post-author email is untouched.
	 *
	 * @covers ::gutenberg_route_post_author_mention_notification
	 */
	public function test_unmentioned_post_author_still_gets_the_core_email(): void {
		$note = $this->insert_note( 'Just a note', self::$commenter->ID );

		$this->fire_rest_insert( $note );

		$emails = $this->emails_to( self::$post_author->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringNotContainsString( 'You were mentioned', $emails[0]['subject'] );
	}

	/**
	 * @covers ::gutenberg_add_note_unfollow_link_to_email
	 */
	public function test_mention_email_carries_the_unfollow_link(): void {
		$note = $this->insert_note(
			'Ping ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);

		$this->fire_rest_insert( $note );

		$emails = $this->emails_to( self::$mentioned->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString(
			gutenberg_get_note_unfollow_url( (int) $note->comment_ID, self::$mentioned->ID ),
			$emails[0]['message']
		);
	}

	/**
	 * @covers ::gutenberg_handle_note_unfollow
	 */
	public function test_unfollow_link_removes_the_follower(): void {
		$note = $this->insert_note( 'Top level', self::$commenter->ID );
		gutenberg_add_note_followers( $note->comment_ID, array( self::$mentioned->ID ) );

		$_GET['comment'] = (string) $note->comment_ID;
		$_GET['uid']     = (string) self::$mentioned->ID;
		$_GET['token']   = gutenberg_get_note_unfollow_token( (int) $note->comment_ID, self::$mentioned->ID );

		try {
			gutenberg_handle_note_unfollow();
			$this->fail( 'Expected wp_die() confirmation.' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'no longer be notified', $e->getMessage() );
		} finally {
			unset( $_GET['comment'], $_GET['uid'], $_GET['token'] );
		}

		$this->assertNotContains(
			self::$mentioned->ID,
			gutenberg_get_note_followers( $note->comment_ID )
		);
	}

	/**
	 * @covers ::gutenberg_handle_note_unfollow
	 */
	public function test_unfollow_link_rejects_a_bad_token(): void {
		$note = $this->insert_note( 'Top level', self::$commenter->ID );
		gutenberg_add_note_followers( $note->comment_ID, array( self::$mentioned->ID ) );

		$_GET['comment'] = (string) $note->comment_ID;
		$_GET['uid']     = (string) self::$mentioned->ID;
		$_GET['token']   = 'forged-token';

		try {
			gutenberg_handle_note_unfollow();
			$this->fail( 'Expected wp_die() rejection.' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'not valid', $e->getMessage() );
		} finally {
			unset( $_GET['comment'], $_GET['uid'], $_GET['token'] );
		}

		// The follower list is untouched.
		$this->assertContains(
			self::$mentioned->ID,
			gutenberg_get_note_followers( $note->comment_ID )
		);
	}

	/**
	 * A follower who cannot read the note is never emailed its content.
	 *
	 * @covers ::gutenberg_notify_note_followers
	 */
	public function test_followers_without_note_access_are_not_emailed(): void {
		$subscriber_user = self::create_user( 'subscriber' );

		$root = $this->insert_note( 'Top level', self::$commenter->ID );
		$this->fire_rest_insert( $root );
		gutenberg_add_note_followers( $root->comment_ID, array( $subscriber_user->ID ) );

		$this->sent    = array();
		$this->sent_to = array();
		$replier       = self::create_user( 'editor' );
		$reply         = $this->insert_note( 'Following up', $replier->ID, $root->comment_ID );
		$this->fire_rest_insert( $reply );

		$this->assertNotContains( $subscriber_user->user_email, $this->sent_to );
	}

	/**
	 * Creating a reply through the real REST endpoint notifies followers,
	 * proving the hook wiring end to end.
	 *
	 * @covers ::gutenberg_notify_note_followers
	 */
	public function test_rest_reply_notifies_followers(): void {
		$root = $this->insert_note(
			'Start ' . self::mention( self::$mentioned->ID ),
			self::$commenter->ID
		);
		$this->fire_rest_insert( $root );

		$this->sent    = array();
		$this->sent_to = array();

		$replier = self::create_user( 'editor' );
		wp_set_current_user( $replier->ID );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', $root->comment_ID );
		$request->set_param( 'content', 'Following up over REST' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$this->assertContains( self::$mentioned->user_email, $this->sent_to );
	}
}
