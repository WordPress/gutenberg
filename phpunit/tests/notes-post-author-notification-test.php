<?php
/**
 * Tests for the post author's note notification email.
 *
 * `wp_notify_postauthor()` places the note content in its plain text email as
 * stored, and the plugin reduces it to its text on `comment_notification_text`.
 *
 * @group notes
 */
class Tests_Notes_Post_Author_Notification extends WP_UnitTestCase {

	/**
	 * Post the comments and notes are attached to.
	 */
	private static WP_Post $post;

	/**
	 * Author of the post, who receives the notification.
	 */
	private static WP_User $post_author;

	/**
	 * A user who writes comments and notes on the post.
	 */
	private static WP_User $commenter;

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
	 * Inserts a comment on the shared post, written by the commenter.
	 *
	 * @param string $content Comment content, as stored.
	 * @param string $type    Comment type.
	 * @return int The comment ID.
	 */
	private function insert_comment( string $content, string $type = 'comment' ): int {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'      => self::$post->ID,
				'comment_type'         => $type,
				'comment_content'      => $content,
				'user_id'              => self::$commenter->ID,
				'comment_author'       => self::$commenter->display_name,
				'comment_author_email' => self::$commenter->user_email,
			)
		);
		assert( is_int( $comment_id ) );
		return $comment_id;
	}

	/**
	 * @covers ::gutenberg_strip_note_markup_from_notification_text
	 */
	public function test_note_email_drops_the_markup_around_a_mention(): void {
		$note_id = $this->insert_comment(
			'Hi <span class="wp-note-mention user-7">@Reviewer</span>, please check the intro.',
			'note'
		);

		$this->assertTrue( wp_notify_postauthor( $note_id ) );
		$this->assertCount( 1, $this->sent );
		$this->assertSame( array( self::$post_author->user_email ), $this->sent[0]['to'] );
		$this->assertStringContainsString( "Note: \r\nHi @Reviewer, please check the intro.", $this->sent[0]['message'] );
		$this->assertStringNotContainsString( '<span', $this->sent[0]['message'] );
	}

	/**
	 * Text the author typed as an escaped tag is text, and is not read as a tag and dropped.
	 *
	 * @covers ::gutenberg_strip_note_markup_from_notification_text
	 */
	public function test_note_email_keeps_escaped_text(): void {
		$note_id = $this->insert_comment( 'Rename &lt;code&gt; to &lt;kbd&gt; here.', 'note' );

		wp_notify_postauthor( $note_id );

		$this->assertCount( 1, $this->sent );
		$this->assertStringContainsString( 'Rename <code> to <kbd> here.', $this->sent[0]['message'] );
	}

	/**
	 * The content of a regular comment is placed in the email as it always was.
	 *
	 * @covers ::gutenberg_strip_note_markup_from_notification_text
	 */
	public function test_comment_email_leaves_the_content_as_is(): void {
		$comment_id = $this->insert_comment( 'A <strong>bold</strong> <a href="https://example.com/">claim</a>.' );

		wp_notify_postauthor( $comment_id );

		$this->assertCount( 1, $this->sent );
		$this->assertStringContainsString( 'A <strong>bold</strong> <a href="https://example.com/">claim</a>.', $this->sent[0]['message'] );
	}

	/**
	 * A WordPress version that reduces the note content to its text itself composes a
	 * message without the stored markup, which the filter must leave unchanged.
	 *
	 * @covers ::gutenberg_strip_note_markup_from_notification_text
	 */
	public function test_filter_leaves_a_message_without_the_stored_content_unchanged(): void {
		$note_id = $this->insert_comment( 'Hi <span class="wp-note-mention user-7">@Reviewer</span>.', 'note' );
		$message = "Note: \r\nHi @Reviewer.\r\n";

		$this->assertSame( $message, gutenberg_strip_note_markup_from_notification_text( $message, $note_id ) );
	}
}
