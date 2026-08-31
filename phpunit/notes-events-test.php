<?php
/**
 * Tests for note thread event (resolve/reopen) notifications.
 *
 * @package gutenberg
 */
class Tests_Notes_Events extends WP_UnitTestCase {

	/**
	 * Post the notes are attached to.
	 */
	private static WP_Post $post;

	/**
	 * Author of the post.
	 */
	private static WP_User $post_author;

	/**
	 * A user who starts note threads.
	 */
	private static WP_User $commenter;

	/**
	 * A user who follows threads without starting them.
	 */
	private static WP_User $follower;

	/**
	 * A user who resolves and reopens threads.
	 */
	private static WP_User $resolver;

	/**
	 * Captured wp_mail() calls for the current test.
	 *
	 * @var array<array{to: string[], subject: string, message: string}>
	 */
	private array $sent = array();

	/**
	 * Sets up shared fixtures.
	 */
	public static function wpSetUpBeforeClass(): void {
		self::$post_author = self::create_user( 'editor' );
		self::$commenter   = self::create_user( 'editor' );
		self::$follower    = self::create_user( 'editor' );
		self::$resolver    = self::create_user( 'editor' );

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
		$this->sent = array();
		// Short-circuit wp_mail() and record what would have been sent.
		add_filter( 'pre_wp_mail', array( $this, 'capture_mail' ), 10, 2 );
	}

	public function tear_down(): void {
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Records wp_mail() calls and short-circuits delivery.
	 *
	 * @param null                                                           $short_circuit Short-circuit value.
	 * @param array{ to: string|string[], subject: string, message: string } $atts          wp_mail() arguments.
	 * @return bool Always true to indicate a "sent" message.
	 */
	public function capture_mail( $short_circuit, $atts ): bool {
		$this->sent[] = array(
			'to'      => (array) $atts['to'],
			'subject' => (string) $atts['subject'],
			'message' => (string) $atts['message'],
		);
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
	 * Starts a note thread through the REST API and returns its root note.
	 *
	 * Dispatching real requests keeps core's own handlers in the picture, so
	 * the tests prove the suppression and dedupe interplay rather than the
	 * plugin's handlers in isolation.
	 *
	 * @param string $content Note content.
	 * @param int    $user_id Author user ID.
	 * @return WP_Comment The thread's top-level note.
	 */
	private function start_thread( string $content, int $user_id ): WP_Comment {
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'content', $content );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status(), 'Failed to create the thread root.' );

		$data    = $response->get_data();
		$comment = get_comment( $data['id'] );
		$this->assertInstanceOf( WP_Comment::class, $comment );

		$this->sent = array();

		return $comment;
	}

	/**
	 * Resolves or reopens a thread the way the editor does: a child note
	 * carrying the resolution status as comment meta.
	 *
	 * @param WP_Comment $root    The thread's top-level note.
	 * @param int        $user_id The user performing the action.
	 * @param string     $event   'resolved' or 'reopen'.
	 * @param string     $content Message to include, if any.
	 * @return WP_Comment The system note recording the event.
	 */
	private function post_event( WP_Comment $root, int $user_id, string $event, string $content = '' ): WP_Comment {
		wp_set_current_user( $user_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', $root->comment_ID );
		$request->set_param( 'content', $content );
		$request->set_param( 'status', 'resolved' === $event ? 'approved' : 'hold' );
		$request->set_param( 'meta', array( '_wp_note_status' => $event ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status(), 'Failed to create the system note.' );

		$data    = $response->get_data();
		$comment = get_comment( $data['id'] );
		$this->assertInstanceOf( WP_Comment::class, $comment );

		return $comment;
	}

	/**
	 * A resolve reaches the thread's followers with copy about the event, not
	 * the generic "added a note" email whose body would be empty.
	 *
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_resolving_notifies_followers_about_the_event(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$emails = $this->emails_to( self::$follower->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'was resolved', $emails[0]['subject'] );
		$this->assertStringContainsString( 'resolved a note thread', $emails[0]['message'] );
		$this->assertStringNotContainsString( 'added a note', $emails[0]['message'] );
	}

	/**
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_reopening_notifies_followers_and_carries_the_message(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'reopen', 'Still broken on mobile' );

		$emails = $this->emails_to( self::$follower->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'was reopened', $emails[0]['subject'] );
		$this->assertStringContainsString( 'Still broken on mobile', $emails[0]['message'] );
	}

	/**
	 * The post author hears about the event instead of core's generic "a new
	 * note was added" email, which for a resolve would have an empty body.
	 *
	 * @covers ::gutenberg_suppress_core_note_event_notification
	 */
	public function test_post_author_gets_the_event_email_instead_of_the_generic_one(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$emails = $this->emails_to( self::$post_author->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'was resolved', $emails[0]['subject'] );
	}

	/**
	 * The suppression is scoped to the note carrying the event: an ordinary
	 * reply in the same request cycle still reaches the post author.
	 *
	 * @covers ::gutenberg_suppress_core_note_event_notification
	 */
	public function test_plain_replies_still_notify_the_post_author_and_followers(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );
		$this->sent = array();

		// A regular reply, with no resolution metadata.
		wp_set_current_user( self::$resolver->ID );
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', $root->comment_ID );
		$request->set_param( 'content', 'One more thing' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$follower_emails = $this->emails_to( self::$follower->user_email );
		$this->assertCount( 1, $follower_emails );
		$this->assertStringContainsString( 'a note you follow', $follower_emails[0]['subject'] );
		$this->assertCount( 1, $this->emails_to( self::$post_author->user_email ) );
	}

	/**
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_the_actor_is_not_emailed_about_their_own_action(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$resolver->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$this->assertEmpty( $this->emails_to( self::$resolver->user_email ) );
	}

	/**
	 * The post author following their own post is one recipient, not two.
	 *
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_a_following_post_author_receives_exactly_one_email(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$post_author->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$this->assertCount( 1, $this->emails_to( self::$post_author->user_email ) );
	}

	/**
	 * A reopen message can mention someone. They get the mention email, which
	 * says more than the event email, and only that one.
	 *
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_mentioned_users_get_the_mention_email_only(): void {
		$mentioned = self::create_user( 'editor' );

		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( $mentioned->ID ) );

		$this->post_event(
			$root,
			self::$resolver->ID,
			'reopen',
			'Back to you ' . self::mention( $mentioned->ID )
		);

		$emails = $this->emails_to( $mentioned->user_email );
		$this->assertCount( 1, $emails );
		$this->assertStringContainsString( 'You were mentioned', $emails[0]['subject'] );
	}

	/**
	 * Notes are internal, so the event email is held to the same visibility
	 * bar as the note itself.
	 *
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_followers_without_note_access_are_not_emailed(): void {
		$subscriber = self::create_user( 'subscriber' );

		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( $subscriber->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$this->assertEmpty( $this->emails_to( $subscriber->user_email ) );
	}

	/**
	 * The site-wide setting silences event emails along with the rest.
	 *
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_no_event_emails_while_notes_notifications_are_off(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		update_option( 'wp_notes_notify', 0 );
		$this->post_event( $root, self::$resolver->ID, 'resolved' );
		update_option( 'wp_notes_notify', 1 );

		$this->assertEmpty( $this->sent );
	}

	/**
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_recipients_filter_can_add_and_remove_users(): void {
		$outsider = self::create_user( 'editor' );

		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		$follower_id = self::$follower->ID;
		add_filter(
			'wp_note_event_notification_recipients',
			static function ( $recipients ) use ( $outsider, $follower_id ) {
				$recipients   = array_values( array_diff( $recipients, array( $follower_id ) ) );
				$recipients[] = $outsider->ID;
				return $recipients;
			}
		);

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$this->assertEmpty( $this->emails_to( self::$follower->user_email ) );
		$this->assertCount( 1, $this->emails_to( $outsider->user_email ) );
	}

	/**
	 * @covers ::gutenberg_send_note_event_notification
	 */
	public function test_event_emails_can_be_rewritten_by_filters(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		add_filter(
			'wp_note_event_notification_subject',
			static fn ( $subject, $user, $comment, $event ) => "[{$event}] rewritten",
			10,
			4
		);
		add_filter(
			'wp_note_event_notification_text',
			static fn ( $body, $user, $comment, $event ) => "body for {$event}",
			10,
			4
		);

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$emails = $this->emails_to( self::$follower->user_email );
		$this->assertCount( 1, $emails );
		$this->assertSame( '[resolved] rewritten', $emails[0]['subject'] );
		$this->assertSame( 'body for resolved', $emails[0]['message'] );
	}

	/**
	 * Followers can leave the thread from the email; a post author who never
	 * joined it has no subscription to offer them out of.
	 *
	 * @covers ::gutenberg_send_note_event_notification
	 */
	public function test_only_followers_are_offered_the_unfollow_link(): void {
		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'resolved' );

		$follower_email = $this->emails_to( self::$follower->user_email )[0];
		$this->assertStringContainsString(
			gutenberg_get_note_unfollow_url( (int) $root->comment_ID, self::$follower->ID ),
			$follower_email['message']
		);

		$author_email = $this->emails_to( self::$post_author->user_email )[0];
		$this->assertStringNotContainsString( 'wp_note_unfollow', $author_email['message'] );
	}

	/**
	 * @covers ::gutenberg_notify_note_event
	 */
	public function test_notification_sent_action_reports_the_event_context(): void {
		$fired = array();
		add_action(
			'wp_note_notification_sent',
			static function ( $user_id, $comment, $context, $sent ) use ( &$fired ): void {
				$fired[] = array(
					'user_id' => $user_id,
					'context' => $context,
					'sent'    => $sent,
				);
			},
			10,
			4
		);

		$root = $this->start_thread( 'Please look at this', self::$commenter->ID );
		gutenberg_add_note_followers( $root->comment_ID, array( self::$follower->ID ) );

		$this->post_event( $root, self::$resolver->ID, 'reopen', 'Once more' );

		$this->assertContains(
			array(
				'user_id' => self::$follower->ID,
				'context' => 'reopen',
				'sent'    => true,
			),
			$fired
		);
	}

	/**
	 * Nothing here may touch comment types other than notes.
	 *
	 * @covers ::gutenberg_notify_note_event
	 * @covers ::gutenberg_suppress_core_note_event_notification
	 */
	public function test_regular_comments_are_left_alone(): void {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => self::$post->ID,
				'comment_content' => 'A regular comment',
				'user_id'         => self::$commenter->ID,
			)
		);
		$comment    = get_comment( $comment_id );
		$this->assertInstanceOf( WP_Comment::class, $comment );
		update_comment_meta( $comment_id, '_wp_note_status', 'resolved' );

		do_action( 'rest_after_insert_comment', $comment, null, true );

		$this->assertEmpty( $this->sent );
	}
}
