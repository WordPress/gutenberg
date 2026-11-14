<?php
/**
 * Tests for the post author's note notification email.
 *
 * `wp_notify_postauthor()` places the note content in its plain text email as
 * stored, and the plugin unwraps the mention chips in it on
 * `comment_notification_text`.
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
	 *
	 * @param WP_UnitTest_Factory $factory Factory.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		self::$post_author = $factory->user->create_and_get( array( 'role' => 'editor' ) );
		self::$commenter   = $factory->user->create_and_get( array( 'role' => 'editor' ) );
		self::$post        = $factory->post->create_and_get( array( 'post_author' => self::$post_author->ID ) );
	}

	public function set_up(): void {
		parent::set_up();
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
		$this->assertIsInt( $comment_id );
		return $comment_id;
	}

	/**
	 * Notifies the post author about a comment and returns the message they receive.
	 *
	 * @param string $content Comment content, as stored.
	 * @param string $type    Comment type.
	 * @return string The email message.
	 */
	private function notify_post_author( string $content, string $type = 'comment' ): string {
		$this->assertTrue( wp_notify_postauthor( $this->insert_comment( $content, $type ) ) );
		$this->assertCount( 1, $this->sent );
		$this->assertSame( array( self::$post_author->user_email ), $this->sent[0]['to'] );

		return $this->sent[0]['message'];
	}

	/**
	 * @covers ::gutenberg_unwrap_note_mentions_in_notification_text
	 */
	public function test_note_email_drops_the_markup_around_a_mention(): void {
		$message = $this->notify_post_author( 'Hi <span class="wp-note-mention user-7">@Reviewer</span>, please check the intro.', 'note' );

		$this->assertStringContainsString( "Note: \r\nHi @Reviewer, please check the intro.", $message );
		$this->assertStringNotContainsString( '<span', $message );
	}

	/**
	 * Only the mention chips are unwrapped. The rest of the note, including the
	 * formatting the author chose, is placed in the email as it is, like a comment.
	 *
	 * @covers ::gutenberg_unwrap_note_mentions_in_notification_text
	 */
	public function test_note_email_keeps_the_rest_of_the_content_as_is(): void {
		$message = $this->notify_post_author( '<strong>Bold</strong> &lt;code&gt;<br><span class="wp-note-mention user-7">@Reviewer</span>', 'note' );

		$this->assertStringContainsString( "Note: \r\n<strong>Bold</strong> <code><br>@Reviewer", $message );
	}

	/**
	 * A note without content marks a thread as resolved or reopened, which the email says.
	 *
	 * @covers ::gutenberg_unwrap_note_mentions_in_notification_text
	 */
	public function test_note_email_keeps_the_wording_for_an_empty_note(): void {
		$message = $this->notify_post_author( '', 'note' );

		$this->assertStringContainsString( "Note: \r\nresolved/reopened", $message );
	}

	/**
	 * The content of a regular comment is placed in the email as it always was.
	 *
	 * @covers ::gutenberg_unwrap_note_mentions_in_notification_text
	 */
	public function test_comment_email_leaves_the_content_as_is(): void {
		$message = $this->notify_post_author( 'A <strong>bold</strong> <a href="https://example.com/">claim</a>.' );

		$this->assertStringContainsString( 'A <strong>bold</strong> <a href="https://example.com/">claim</a>.', $message );
	}

	/**
	 * The stored content is replaced wherever WordPress places it, with the chips
	 * unwrapped before the entities are decoded.
	 *
	 * @covers ::gutenberg_unwrap_note_mentions_in_notification_text
	 */
	public function test_filter_unwraps_the_chips_in_the_stored_content(): void {
		$note_id = $this->insert_comment( '<strong>Bold</strong> &lt;code&gt;<br><span class="wp-note-mention user-7">@Reviewer</span>', 'note' );
		$message = "Note: \r\n<strong>Bold</strong> <code><br><span class=\"wp-note-mention user-7\">@Reviewer</span>\r\n";

		$this->assertSame(
			"Note: \r\n<strong>Bold</strong> <code><br>@Reviewer\r\n",
			gutenberg_unwrap_note_mentions_in_notification_text( $message, $note_id )
		);
	}

	/**
	 * A WordPress version that unwraps the chips itself composes a message
	 * without the stored content, which the filter must leave unchanged.
	 *
	 * @covers ::gutenberg_unwrap_note_mentions_in_notification_text
	 */
	public function test_filter_leaves_a_message_without_the_stored_content_unchanged(): void {
		$note_id = $this->insert_comment( 'Hi <span class="wp-note-mention user-7">@Reviewer</span>.', 'note' );
		$message = "Note: \r\nHi @Reviewer.\r\n";

		$this->assertSame( $message, gutenberg_unwrap_note_mentions_in_notification_text( $message, $note_id ) );
	}
}
