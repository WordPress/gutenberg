<?php
/**
 * Tests for note mention and follower notifications.
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
		$this->sent_to = array();
		// Short-circuit wp_mail() and record who would have been emailed.
		add_filter( 'pre_wp_mail', array( $this, 'capture_mail' ), 10, 2 );
	}

	/**
	 * Records wp_mail() recipients and short-circuits delivery.
	 *
	 * @param null                       $short_circuit Short-circuit value.
	 * @param array{ to: string[], ... } $atts          wp_mail() arguments.
	 * @return bool Always true to indicate a "sent" message.
	 */
	public function capture_mail( $short_circuit, $atts ): bool {
		foreach ( (array) $atts['to'] as $to ) {
			$this->sent_to[] = $to;
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

	public function test_parses_mentioned_user_ids(): void {
		$content = '<p>Hi <a class="wp-note-mention" data-user-id="5" href="#">@Jane</a> and '
			. '<a class="wp-note-mention" data-user-id="9" href="#">@Bob</a>.</p>';

		$this->assertSame(
			array( 5, 9 ),
			gutenberg_get_note_mentioned_user_ids( $content )
		);
	}

	public function test_ignores_plain_links_and_deduplicates(): void {
		$content = '<p><a href="https://example.com" data-user-id="7">not a mention</a> '
			. '<a class="wp-note-mention" data-user-id="5" href="#">@Jane</a> '
			. '<a class="wp-note-mention" data-user-id="5" href="#">@Jane again</a></p>';

		$this->assertSame(
			array( 5 ),
			gutenberg_get_note_mentioned_user_ids( $content )
		);
	}

	public function test_mention_markup_survives_kses_for_authors(): void {
		$author  = self::create_user( 'author' );
		$post_id = self::factory()->post->create( array( 'post_author' => $author->ID ) );
		$this->assertIsInt( $post_id );

		// Authors lack unfiltered_html, so comment kses filters their content.
		wp_set_current_user( $author->ID );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );

		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="http://example.com/">@Mentioned</a>',
			self::$mentioned->ID
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'content', "Ping $mention" );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'id', $data );

		// The mention attributes must survive the comment kses pass or the
		// mention is silently dropped from parsing and notifications.
		$comment = get_comment( (int) $data['id'] );
		$this->assertInstanceOf( WP_Comment::class, $comment );
		$this->assertSame(
			array( self::$mentioned->ID ),
			gutenberg_get_note_mentioned_user_ids( $comment->comment_content )
		);
	}

	public function test_thread_root_is_parent_for_replies(): void {
		$root  = $this->insert_note( 'Top level', self::$commenter->ID );
		$reply = $this->insert_note( 'A reply', self::$commenter->ID, $root->comment_ID );

		$this->assertSame(
			(int) $root->comment_ID,
			gutenberg_get_note_thread_root_id( $reply )
		);
		$this->assertSame(
			(int) $root->comment_ID,
			gutenberg_get_note_thread_root_id( $root )
		);
	}

	public function test_mentioned_user_is_emailed_and_subscribed(): void {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned->ID
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter->ID );

		gutenberg_notify_note_mentions( $note );

		$this->assertContains( self::$mentioned->user_email, $this->sent_to );

		// The mentioned user and the note author both follow the thread now.
		$followers = gutenberg_get_note_followers( $note->comment_ID );
		$this->assertContains( self::$mentioned->ID, $followers );
		$this->assertContains( self::$commenter->ID, $followers );
	}

	public function test_author_is_not_notified_about_their_own_note(): void {
		$self_mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Me</a>',
			self::$commenter->ID
		);
		$note         = $this->insert_note( "Note to $self_mention", self::$commenter->ID );

		gutenberg_notify_note_mentions( $note );

		$this->assertNotContains( self::$commenter->user_email, $this->sent_to );
	}

	public function test_post_author_is_left_to_core(): void {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Author</a>',
			self::$post_author->ID
		);
		$note    = $this->insert_note( "Hey $mention", self::$commenter->ID );

		gutenberg_notify_note_mentions( $note );

		// Core notifies the post author of every note; the mention path must
		// not also email them or they would receive a duplicate.
		$this->assertNotContains( self::$post_author->user_email, $this->sent_to );
	}

	public function test_mentioned_user_without_note_access_is_not_emailed(): void {
		$subscriber_user = self::create_user( 'subscriber' );

		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Subscriber</a>',
			$subscriber_user->ID
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter->ID );

		gutenberg_notify_note_mentions( $note );

		// Notes are only readable by users who can edit them; a subscriber
		// cannot, so emailing them would leak content they cannot see.
		$subscriber_email = $subscriber_user->user_email;
		$this->assertNotContains( $subscriber_email, $this->sent_to );

		// They are still recorded as a follower in case their role changes.
		$this->assertContains(
			$subscriber_user->ID,
			gutenberg_get_note_followers( $note->comment_ID )
		);
	}

	public function test_followers_are_notified_of_replies(): void {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned->ID
		);
		$root    = $this->insert_note( "Start $mention", self::$commenter->ID );
		gutenberg_notify_note_mentions( $root );

		// A different user replies; the mentioned user follows and should be
		// notified even though they are not mentioned in the reply itself.
		$this->sent_to = array();
		$replier       = self::create_user( 'editor' );
		$reply         = $this->insert_note( 'Following up', $replier->ID, $root->comment_ID );
		gutenberg_notify_note_mentions( $reply );

		$this->assertContains( self::$mentioned->user_email, $this->sent_to );
	}

	public function test_no_notifications_when_disabled(): void {
		update_option( 'wp_notes_notify', 0 );

		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned->ID
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter->ID );
		gutenberg_notify_note_mentions( $note );

		$this->assertEmpty( $this->sent_to );

		update_option( 'wp_notes_notify', 1 );
	}

	public function test_editing_a_note_does_not_renotify(): void {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned->ID
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter->ID );

		// Simulate the update path of rest_insert_comment ($creating false).
		gutenberg_notify_note_mentions( $note, null, false );

		$this->assertEmpty( $this->sent_to );
	}

	public function test_recipients_filter_can_add_and_remove(): void {
		$extra_user = self::create_user( 'editor' );

		$filter = function ( array $ids ) use ( $extra_user ) {
			/** @var int[] $ids */
			$ids[] = $extra_user->ID;
			return array_values( array_diff( $ids, array( self::$mentioned->ID ) ) );
		};
		add_filter( 'wp_note_notification_recipients', $filter );

		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned->ID
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter->ID );
		gutenberg_notify_note_mentions( $note );

		$this->assertContains( $extra_user->user_email, $this->sent_to );
		$this->assertNotContains( self::$mentioned->user_email, $this->sent_to );
	}

	public function test_followers_can_be_removed(): void {
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

	public function test_followers_meta_is_registered_for_rest(): void {
		gutenberg_register_note_followers_meta();

		$registered = get_registered_meta_keys( 'comment' );
		$this->assertArrayHasKey( '_wp_note_followers', $registered );
		$this->assertNotFalse( $registered['_wp_note_followers']['show_in_rest'] );
	}
}
