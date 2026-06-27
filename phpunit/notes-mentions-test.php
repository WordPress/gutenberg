<?php
/**
 * Tests for note mention and follower notifications.
 *
 * @package gutenberg
 */
class Tests_Notes_Mentions extends WP_UnitTestCase {

	/**
	 * Post the notes are attached to.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Author of the post (notified by core, not by the mention path).
	 *
	 * @var int
	 */
	private static $post_author_id;

	/**
	 * A user who writes notes.
	 *
	 * @var int
	 */
	private static $commenter_id;

	/**
	 * A user who gets mentioned.
	 *
	 * @var int
	 */
	private static $mentioned_id;

	/**
	 * Captured wp_mail() recipients for the current test.
	 *
	 * @var string[]
	 */
	private $sent_to = array();

	/**
	 * Sets up shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_author_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$commenter_id   = $factory->user->create( array( 'role' => 'editor' ) );
		self::$mentioned_id   = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id        = $factory->post->create(
			array( 'post_author' => self::$post_author_id )
		);
	}

	public function set_up() {
		parent::set_up();
		$this->sent_to = array();
		// Short-circuit wp_mail() and record who would have been emailed.
		add_filter( 'pre_wp_mail', array( $this, 'capture_mail' ), 10, 2 );
	}

	public function tear_down() {
		remove_filter( 'pre_wp_mail', array( $this, 'capture_mail' ), 10 );
		parent::tear_down();
	}

	/**
	 * Records wp_mail() recipients and short-circuits delivery.
	 *
	 * @param null  $short_circuit Short-circuit value.
	 * @param array $atts          wp_mail() arguments.
	 * @return bool Always true to indicate a "sent" message.
	 */
	public function capture_mail( $short_circuit, $atts ) {
		foreach ( (array) $atts['to'] as $to ) {
			$this->sent_to[] = $to;
		}
		return true;
	}

	/**
	 * Builds a note comment for the shared post.
	 *
	 * @param string $content Note content.
	 * @param int    $user_id Author user ID.
	 * @param int    $parent_id Parent note ID (0 for a top-level note).
	 * @return WP_Comment The inserted note.
	 */
	private function insert_note( $content, $user_id, $parent_id = 0 ) {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => self::$post_id,
				'comment_type'    => 'note',
				'comment_content' => $content,
				'comment_parent'  => $parent_id,
				'user_id'         => $user_id,
			)
		);
		return get_comment( $comment_id );
	}

	public function test_parses_mentioned_user_ids() {
		$content = '<p>Hi <a class="wp-note-mention" data-user-id="5" href="#">@Jane</a> and '
			. '<a class="wp-note-mention" data-user-id="9" href="#">@Bob</a>.</p>';

		$this->assertSame(
			array( 5, 9 ),
			gutenberg_get_note_mentioned_user_ids( $content )
		);
	}

	public function test_ignores_plain_links_and_deduplicates() {
		$content = '<p><a href="https://example.com" data-user-id="7">not a mention</a> '
			. '<a class="wp-note-mention" data-user-id="5" href="#">@Jane</a> '
			. '<a class="wp-note-mention" data-user-id="5" href="#">@Jane again</a></p>';

		$this->assertSame(
			array( 5 ),
			gutenberg_get_note_mentioned_user_ids( $content )
		);
	}

	public function test_thread_root_is_parent_for_replies() {
		$root  = $this->insert_note( 'Top level', self::$commenter_id );
		$reply = $this->insert_note( 'A reply', self::$commenter_id, $root->comment_ID );

		$this->assertSame(
			(int) $root->comment_ID,
			gutenberg_get_note_thread_root_id( $reply )
		);
		$this->assertSame(
			(int) $root->comment_ID,
			gutenberg_get_note_thread_root_id( $root )
		);
	}

	public function test_mentioned_user_is_emailed_and_subscribed() {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned_id
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter_id );

		gutenberg_notify_note_mentions( $note );

		$mentioned_email = get_userdata( self::$mentioned_id )->user_email;
		$this->assertContains( $mentioned_email, $this->sent_to );

		// The mentioned user and the note author both follow the thread now.
		$followers = gutenberg_get_note_followers( $note->comment_ID );
		$this->assertContains( self::$mentioned_id, $followers );
		$this->assertContains( self::$commenter_id, $followers );
	}

	public function test_author_is_not_notified_about_their_own_note() {
		$self_mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Me</a>',
			self::$commenter_id
		);
		$note         = $this->insert_note( "Note to $self_mention", self::$commenter_id );

		gutenberg_notify_note_mentions( $note );

		$author_email = get_userdata( self::$commenter_id )->user_email;
		$this->assertNotContains( $author_email, $this->sent_to );
	}

	public function test_post_author_is_left_to_core() {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Author</a>',
			self::$post_author_id
		);
		$note    = $this->insert_note( "Hey $mention", self::$commenter_id );

		gutenberg_notify_note_mentions( $note );

		// Core notifies the post author of every note; the mention path must
		// not also email them or they would receive a duplicate.
		$author_email = get_userdata( self::$post_author_id )->user_email;
		$this->assertNotContains( $author_email, $this->sent_to );
	}

	public function test_followers_are_notified_of_replies() {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned_id
		);
		$root    = $this->insert_note( "Start $mention", self::$commenter_id );
		gutenberg_notify_note_mentions( $root );

		// A different user replies; the mentioned user follows and should be
		// notified even though they are not mentioned in the reply itself.
		$this->sent_to = array();
		$replier_id    = self::factory()->user->create( array( 'role' => 'editor' ) );
		$reply         = $this->insert_note( 'Following up', $replier_id, $root->comment_ID );
		gutenberg_notify_note_mentions( $reply );

		$mentioned_email = get_userdata( self::$mentioned_id )->user_email;
		$this->assertContains( $mentioned_email, $this->sent_to );
	}

	public function test_no_notifications_when_disabled() {
		update_option( 'wp_notes_notify', 0 );

		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned_id
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter_id );
		gutenberg_notify_note_mentions( $note );

		$this->assertEmpty( $this->sent_to );

		update_option( 'wp_notes_notify', 1 );
	}

	public function test_editing_a_note_does_not_renotify() {
		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned_id
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter_id );

		// Simulate the update path of rest_insert_comment ($creating false).
		gutenberg_notify_note_mentions( $note, null, false );

		$this->assertEmpty( $this->sent_to );
	}

	public function test_recipients_filter_can_add_and_remove() {
		$extra_id = self::factory()->user->create( array( 'role' => 'editor' ) );

		$filter = function ( $ids ) use ( $extra_id ) {
			$ids[] = $extra_id;
			return array_values( array_diff( $ids, array( self::$mentioned_id ) ) );
		};
		add_filter( 'gutenberg_note_notification_recipients', $filter );

		$mention = sprintf(
			'<a class="wp-note-mention" data-user-id="%d" href="#">@Mentioned</a>',
			self::$mentioned_id
		);
		$note    = $this->insert_note( "Ping $mention", self::$commenter_id );
		gutenberg_notify_note_mentions( $note );

		remove_filter( 'gutenberg_note_notification_recipients', $filter );

		$this->assertContains( get_userdata( $extra_id )->user_email, $this->sent_to );
		$this->assertNotContains( get_userdata( self::$mentioned_id )->user_email, $this->sent_to );
	}
}
