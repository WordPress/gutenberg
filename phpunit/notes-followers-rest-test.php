<?php
/**
 * Tests for the note thread follow/unfollow REST endpoint.
 *
 * @package gutenberg
 */
class Tests_Notes_Followers_Rest extends WP_UnitTestCase {

	/**
	 * Post the notes are attached to.
	 */
	private static WP_Post $post;

	/**
	 * A user who can edit notes.
	 */
	private static WP_User $editor;

	/**
	 * A user who cannot read notes.
	 */
	private static WP_User $subscriber;

	/**
	 * Sets up shared fixtures.
	 */
	public static function wpSetUpBeforeClass(): void {
		self::$editor     = self::create_user( 'editor' );
		self::$subscriber = self::create_user( 'subscriber' );

		$post = self::factory()->post->create_and_get( array( 'post_author' => self::$editor->ID ) );
		if ( ! $post instanceof WP_Post ) {
			throw new Exception( 'Expected WP_Post' );
		}
		self::$post = $post;
	}

	public function set_up(): void {
		parent::set_up();
		// The routes are registered on rest_api_init; make sure the test
		// server picked them up.
		rest_get_server();
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

	/**
	 * Builds a note comment for the shared post.
	 *
	 * @param int                $user_id   Author user ID.
	 * @param int|numeric-string $parent_id Parent note ID (0 for a top-level note).
	 * @return WP_Comment The inserted note.
	 */
	private function insert_note( int $user_id, $parent_id = 0 ): WP_Comment {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => self::$post->ID,
				'comment_type'    => 'note',
				'comment_content' => 'A note',
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
	 * Dispatches a follow or unfollow request for a note.
	 *
	 * @param string $method  Request method (POST or DELETE).
	 * @param int    $note_id Note ID.
	 * @return WP_REST_Response The response.
	 */
	private function dispatch_follow_request( string $method, int $note_id ): WP_REST_Response {
		$request = new WP_REST_Request( $method, sprintf( '/wp/v2/comments/%d/followers/me', $note_id ) );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * @covers ::gutenberg_rest_follow_note_thread
	 */
	public function test_follow_subscribes_the_current_user(): void {
		$note = $this->insert_note( self::$editor->ID );
		$user = self::create_user( 'editor' );
		wp_set_current_user( $user->ID );

		$response = $this->dispatch_follow_request( 'POST', (int) $note->comment_ID );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['following'] );
		$this->assertSame( (int) $note->comment_ID, $data['root'] );
		$this->assertContains( $user->ID, $data['followers'] );
		$this->assertContains( $user->ID, gutenberg_get_note_followers( (int) $note->comment_ID ) );
	}

	/**
	 * Following any note in a thread subscribes to the thread root.
	 *
	 * @covers ::gutenberg_rest_follow_note_thread
	 */
	public function test_follow_via_a_reply_targets_the_thread_root(): void {
		$root  = $this->insert_note( self::$editor->ID );
		$reply = $this->insert_note( self::$editor->ID, $root->comment_ID );
		$user  = self::create_user( 'editor' );
		wp_set_current_user( $user->ID );

		$response = $this->dispatch_follow_request( 'POST', (int) $reply->comment_ID );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( (int) $root->comment_ID, $response->get_data()['root'] );
		$this->assertContains( $user->ID, gutenberg_get_note_followers( (int) $root->comment_ID ) );
		$this->assertSame( array(), gutenberg_get_note_followers( (int) $reply->comment_ID ) );
	}

	/**
	 * @covers ::gutenberg_rest_unfollow_note_thread
	 */
	public function test_unfollow_removes_the_current_user(): void {
		$note = $this->insert_note( self::$editor->ID );
		$user = self::create_user( 'editor' );
		gutenberg_add_note_followers( (int) $note->comment_ID, array( $user->ID ) );
		wp_set_current_user( $user->ID );

		$response = $this->dispatch_follow_request( 'DELETE', (int) $note->comment_ID );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['following'] );
		$this->assertNotContains( $user->ID, gutenberg_get_note_followers( (int) $note->comment_ID ) );
	}

	/**
	 * The follow endpoint only manages the current user; other followers are
	 * untouched by a toggle.
	 *
	 * @covers ::gutenberg_rest_unfollow_note_thread
	 */
	public function test_toggle_leaves_other_followers_untouched(): void {
		$note  = $this->insert_note( self::$editor->ID );
		$other = self::create_user( 'editor' );
		$user  = self::create_user( 'editor' );
		gutenberg_add_note_followers( (int) $note->comment_ID, array( $other->ID, $user->ID ) );
		wp_set_current_user( $user->ID );

		$this->dispatch_follow_request( 'DELETE', (int) $note->comment_ID );

		$this->assertSame(
			array( $other->ID ),
			gutenberg_get_note_followers( (int) $note->comment_ID )
		);
	}

	/**
	 * @covers ::gutenberg_rest_note_followers_permissions_check
	 */
	public function test_follow_requires_authentication(): void {
		$note = $this->insert_note( self::$editor->ID );
		wp_set_current_user( 0 );

		$response = $this->dispatch_follow_request( 'POST', (int) $note->comment_ID );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * A user who cannot read the note cannot subscribe to its thread.
	 *
	 * @covers ::gutenberg_rest_note_followers_permissions_check
	 */
	public function test_follow_requires_note_visibility(): void {
		$note = $this->insert_note( self::$editor->ID );
		wp_set_current_user( self::$subscriber->ID );

		$response = $this->dispatch_follow_request( 'POST', (int) $note->comment_ID );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_cannot_manage_note_followers', $response->get_data()['code'] );
	}

	/**
	 * The note author may manage their subscription even without broader
	 * comment-editing capabilities.
	 *
	 * @covers ::gutenberg_rest_note_followers_permissions_check
	 */
	public function test_note_author_can_manage_their_subscription(): void {
		$note = $this->insert_note( self::$subscriber->ID );
		wp_set_current_user( self::$subscriber->ID );

		$response = $this->dispatch_follow_request( 'POST', (int) $note->comment_ID );

		$this->assertSame( 200, $response->get_status() );
		$this->assertContains( self::$subscriber->ID, gutenberg_get_note_followers( (int) $note->comment_ID ) );
	}

	/**
	 * @covers ::gutenberg_rest_get_note_for_follow_request
	 */
	public function test_follow_rejects_missing_notes(): void {
		wp_set_current_user( self::$editor->ID );

		$response = $this->dispatch_follow_request( 'POST', 987654321 );

		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Regular comments are not note threads.
	 *
	 * @covers ::gutenberg_rest_get_note_for_follow_request
	 */
	public function test_follow_rejects_non_note_comments(): void {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => self::$post->ID,
				'comment_content' => 'A regular comment',
				'user_id'         => self::$editor->ID,
			)
		);
		assert( is_int( $comment_id ) );
		wp_set_current_user( self::$editor->ID );

		$response = $this->dispatch_follow_request( 'POST', $comment_id );

		$this->assertSame( 404, $response->get_status() );
	}
}
