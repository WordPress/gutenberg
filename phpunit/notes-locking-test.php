<?php
/**
 * Tests for note locking.
 *
 * @package gutenberg
 */
class Tests_Notes_Locking extends WP_UnitTestCase {

	/**
	 * Post the notes are attached to.
	 */
	private static WP_Post $post;

	/**
	 * An administrator.
	 */
	private static WP_User $admin;

	/**
	 * An editor, who owns the review thread.
	 */
	private static WP_User $editor;

	/**
	 * An author, who may edit their own post but not lock its notes.
	 */
	private static WP_User $author;

	/**
	 * Arguments the `note_action_is_locked` filter was last called with.
	 *
	 * @var array<int, array<int, mixed>>
	 */
	private array $filter_calls = array();

	/**
	 * Sets up shared fixtures.
	 */
	public static function wpSetUpBeforeClass(): void {
		self::$admin  = self::create_user( 'administrator' );
		self::$editor = self::create_user( 'editor' );
		self::$author = self::create_user( 'author' );

		$post = self::factory()->post->create_and_get(
			array(
				'post_author' => self::$author->ID,
				'post_status' => 'publish',
			)
		);
		if ( ! $post instanceof WP_Post ) {
			throw new Exception( 'Expected WP_Post' );
		}
		self::$post = $post;
	}

	/**
	 * Creates a user with the given role.
	 *
	 * @param string $role Role name.
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
	 * Boots a REST server so `rest_request_before_callbacks` actually runs.
	 */
	public function set_up(): void {
		parent::set_up();

		/*
		 * The test case unregisters every meta key on set up, discarding what
		 * the plugin registered on `init`.
		 */
		gutenberg_register_notes_lock_meta();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );

		wp_set_current_user( self::$editor->ID );
	}

	/**
	 * Tears down the REST server.
	 */
	public function tear_down(): void {
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	/**
	 * Locks every note action on the shared post.
	 */
	private function lock_post(): void {
		update_post_meta( self::$post->ID, '_wp_notes_locked', true );
	}

	/**
	 * Dispatches a request to create a note.
	 *
	 * @param array<string, mixed> $params Extra request parameters.
	 * @return WP_REST_Response The response.
	 */
	private function create_note( array $params = array() ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'content', 'A note.' );

		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Creates a note directly, bypassing the REST gate, so tests can seed a
	 * thread on a post that is already locked.
	 *
	 * @param array<string, mixed> $args Extra comment arguments.
	 * @return int The note ID.
	 */
	private function seed_note( array $args = array() ): int {
		$note_id = wp_insert_comment(
			array_merge(
				array(
					'comment_post_ID'  => self::$post->ID,
					'comment_type'     => 'note',
					'comment_content'  => 'Seeded note.',
					'comment_approved' => '0',
					'user_id'          => self::$editor->ID,
				),
				$args
			)
		);

		$this->assertIsInt( $note_id, 'Expected the seeded note to be created.' );

		return $note_id;
	}

	/**
	 * Dispatches a request to update a note.
	 *
	 * @param int                  $note_id Note ID.
	 * @param array<string, mixed> $params  Request parameters.
	 * @return WP_REST_Response The response.
	 */
	private function update_note( int $note_id, array $params ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments/' . $note_id );

		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Dispatches a request to delete a note.
	 *
	 * @param int  $note_id Note ID.
	 * @param bool $force   Whether to bypass the trash.
	 * @return WP_REST_Response The response.
	 */
	private function delete_note( int $note_id, bool $force = true ): WP_REST_Response {
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'force', $force );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Asserts that a response was rejected by the lock.
	 *
	 * @param WP_REST_Response $response The response.
	 * @param string           $message  Assertion message.
	 */
	private function assertLocked( WP_REST_Response $response, string $message ): void {
		$this->assertSame( 403, $response->get_status(), $message );
		$this->assertSame( 'rest_notes_locked', $response->as_error()->get_error_code(), $message );
	}

	/**
	 * Records every `note_action_is_locked` call, leaving the value untouched.
	 *
	 * @param bool            $locked  Whether the action is locked.
	 * @param string          $action  The action name.
	 * @param WP_Post         $post    The post.
	 * @param WP_Comment|null $comment The note being mutated, if any.
	 * @return bool The unchanged value.
	 */
	public function record_filter_call( $locked, $action, $post, $comment ) {
		$this->filter_calls[] = array( $locked, $action, $post, $comment );

		return $locked;
	}

	/**
	 * Every note flow works when nothing is locked.
	 */
	public function test_unlocked_post_allows_every_note_action(): void {
		$created = $this->create_note();
		$this->assertSame( 201, $created->get_status(), 'Expected the note to be created.' );
		$note_id = $created->get_data()['id'];

		$reply = $this->create_note(
			array(
				'parent'  => $note_id,
				'content' => 'A reply.',
			)
		);
		$this->assertSame( 201, $reply->get_status(), 'Expected the reply to be created.' );

		$edited = $this->update_note( $note_id, array( 'content' => 'An edited note.' ) );
		$this->assertSame( 200, $edited->get_status(), 'Expected the note to be edited.' );

		$resolved = $this->update_note( $note_id, array( 'status' => 'approved' ) );
		$this->assertSame( 200, $resolved->get_status(), 'Expected the note to be resolved.' );

		$marker = $this->create_note(
			array(
				'parent'  => $note_id,
				'content' => '',
				'status'  => 'approved',
				'meta'    => array( '_wp_note_status' => 'resolved' ),
			)
		);
		$this->assertSame( 201, $marker->get_status(), 'Expected the resolution marker note to be created.' );

		$deleted = $this->delete_note( $note_id );
		$this->assertSame( 200, $deleted->get_status(), 'Expected the note to be deleted.' );
	}

	/**
	 * The per-post meta locks every mutation.
	 */
	public function test_locked_post_rejects_every_note_mutation(): void {
		$note_id  = $this->seed_note();
		$reply_id = $this->seed_note( array( 'comment_parent' => $note_id ) );

		$this->lock_post();

		$this->assertLocked( $this->create_note(), 'Expected note creation to be locked.' );
		$this->assertLocked(
			$this->create_note( array( 'parent' => $note_id ) ),
			'Expected replies to be locked.'
		);
		$this->assertLocked(
			$this->create_note(
				array(
					'parent'  => $note_id,
					'content' => '',
					'status'  => 'approved',
					'meta'    => array( '_wp_note_status' => 'resolved' ),
				)
			),
			'Expected resolution marker notes to be locked.'
		);
		$this->assertLocked(
			$this->update_note( $note_id, array( 'content' => 'Edited.' ) ),
			'Expected note edits to be locked.'
		);
		$this->assertLocked(
			$this->update_note( $note_id, array( 'status' => 'approved' ) ),
			'Expected resolving to be locked.'
		);
		$this->assertLocked( $this->delete_note( $reply_id, false ), 'Expected trashing a reply to be locked.' );
		$this->assertLocked( $this->delete_note( $note_id ), 'Expected deleting a note to be locked.' );
	}

	/**
	 * Administrators are bound by the lock too.
	 */
	public function test_lock_binds_administrators(): void {
		$note_id = $this->seed_note();
		$this->lock_post();

		wp_set_current_user( self::$admin->ID );

		$this->assertLocked( $this->create_note(), 'Expected note creation to be locked for administrators.' );
		$this->assertLocked( $this->delete_note( $note_id ), 'Expected deletion to be locked for administrators.' );
	}

	/**
	 * Regular comments are untouched by a lock.
	 */
	public function test_lock_does_not_affect_regular_comments(): void {
		$this->lock_post();
		wp_set_current_user( self::$admin->ID );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'content', 'A regular comment.' );
		$created = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $created->get_status(), 'Expected the comment to be created.' );
		$comment_id = $created->get_data()['id'];

		$edited = $this->update_note( $comment_id, array( 'content' => 'An edited comment.' ) );
		$this->assertSame( 200, $edited->get_status(), 'Expected the comment to be edited.' );

		$deleted = $this->delete_note( $comment_id );
		$this->assertSame( 200, $deleted->get_status(), 'Expected the comment to be deleted.' );
	}

	/**
	 * Reading notes stays open on a locked post.
	 */
	public function test_lock_does_not_affect_reading_notes(): void {
		$note_id = $this->seed_note();
		$this->lock_post();

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post->ID );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status(), 'Expected notes to be readable.' );
		$this->assertSame(
			array( $note_id ),
			wp_list_pluck( $response->get_data(), 'id' ),
			'Expected the seeded note to be listed.'
		);
	}

	/**
	 * The filter can lock notes site-wide, with no meta set.
	 */
	public function test_filter_can_lock_every_post(): void {
		add_filter( 'note_action_is_locked', '__return_true' );

		$this->assertLocked( $this->create_note(), 'Expected the site-wide filter to lock note creation.' );
	}

	/**
	 * The filter can lock a single action and receives the expected arguments.
	 */
	public function test_filter_can_lock_a_single_action(): void {
		$note_id = $this->seed_note();

		add_filter( 'note_action_is_locked', array( $this, 'record_filter_call' ), 5, 4 );
		add_filter(
			'note_action_is_locked',
			static function ( $locked, $action ) {
				return 'delete' === $action ? true : $locked;
			},
			10,
			2
		);

		$created = $this->create_note();
		$this->assertSame( 201, $created->get_status(), 'Expected creation to stay open.' );

		$edited = $this->update_note( $note_id, array( 'content' => 'Edited.' ) );
		$this->assertSame( 200, $edited->get_status(), 'Expected editing to stay open.' );

		$resolved = $this->update_note( $note_id, array( 'status' => 'approved' ) );
		$this->assertSame( 200, $resolved->get_status(), 'Expected resolving to stay open.' );

		$this->assertLocked( $this->delete_note( $note_id ), 'Expected deletion to be locked.' );

		$this->assertSame(
			array( 'create', 'edit', 'resolve', 'delete' ),
			wp_list_pluck( $this->filter_calls, 1 ),
			'Expected the filter to classify each request.'
		);

		list( $locked, , $post, $comment ) = $this->filter_calls[0];
		$this->assertFalse( $locked, 'Expected an unlocked default.' );
		$this->assertSame( self::$post->ID, $post->ID, 'Expected the filter to receive the target post.' );
		$this->assertNull( $comment, 'Expected no comment on create.' );

		list( , , , $delete_comment ) = $this->filter_calls[3];
		$this->assertInstanceOf( WP_Comment::class, $delete_comment, 'Expected the filter to receive the note.' );
		$this->assertSame( (string) $note_id, $delete_comment->comment_ID, 'Expected the targeted note.' );
	}

	/**
	 * The filter can exempt a capability from a lock.
	 */
	public function test_filter_can_exempt_a_capability(): void {
		$editors_note = $this->seed_note();
		$admins_note  = $this->seed_note();

		$this->lock_post();
		add_filter(
			'note_action_is_locked',
			static function ( $locked, $action ) {
				return 'delete' === $action && current_user_can( 'manage_options' ) ? false : $locked;
			},
			10,
			2
		);

		$this->assertLocked(
			$this->delete_note( $editors_note ),
			'Expected the editor to be blocked from deleting.'
		);

		wp_set_current_user( self::$admin->ID );
		$deleted = $this->delete_note( $admins_note );
		$this->assertSame( 200, $deleted->get_status(), 'Expected the administrator to delete the note.' );
	}

	/**
	 * Writing the lock meta requires more than authoring the post.
	 */
	public function test_lock_meta_write_requires_edit_others_posts(): void {
		wp_set_current_user( self::$author->ID );

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . self::$post->ID );
		$request->set_param( 'meta', array( '_wp_notes_locked' => true ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status(), 'Expected the author to be refused.' );
		$this->assertFalse(
			(bool) get_post_meta( self::$post->ID, '_wp_notes_locked', true ),
			'Expected the post to stay unlocked.'
		);

		wp_set_current_user( self::$editor->ID );
		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . self::$post->ID );
		$request->set_param( 'meta', array( '_wp_notes_locked' => true ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status(), 'Expected the editor to lock the post.' );
		$this->assertTrue(
			$response->get_data()['meta']['_wp_notes_locked'],
			'Expected the lock to round-trip as a boolean.'
		);
	}

	/**
	 * The meta is only registered for post types that support notes.
	 */
	public function test_lock_meta_is_only_registered_for_note_capable_post_types(): void {
		register_post_type( 'gutenberg_no_notes', array( 'supports' => array( 'editor' ) ) );
		gutenberg_register_notes_lock_meta();

		$this->assertTrue(
			registered_meta_key_exists( 'post', '_wp_notes_locked', 'post' ),
			'Expected the meta on a post type that supports notes.'
		);
		$this->assertFalse(
			registered_meta_key_exists( 'post', '_wp_notes_locked', 'gutenberg_no_notes' ),
			'Expected no meta on a post type without notes support.'
		);

		unregister_post_type( 'gutenberg_no_notes' );
	}

	/**
	 * The gate bails cleanly when it cannot resolve the note or its post.
	 */
	public function test_gate_bails_on_unresolvable_targets(): void {
		add_filter( 'note_action_is_locked', '__return_true' );
		wp_set_current_user( self::$admin->ID );

		$missing = $this->delete_note( 999999 );
		$this->assertNotSame(
			'rest_notes_locked',
			$missing->as_error()->get_error_code(),
			'Expected the gate to leave a missing comment to the controller.'
		);

		$orphan   = $this->seed_note( array( 'comment_post_ID' => 999999 ) );
		$response = $this->delete_note( $orphan );
		$this->assertNotSame( 500, $response->get_status(), 'Expected no fatal on an orphaned note.' );
		$this->assertNotSame(
			'rest_notes_locked',
			is_wp_error( $response->as_error() ) ? $response->as_error()->get_error_code() : '',
			'Expected the gate to leave a note with no post to the controller.'
		);
	}

	/**
	 * The editor settings advertise the locked actions.
	 */
	public function test_editor_settings_expose_locked_actions(): void {
		$context = new WP_Block_Editor_Context( array( 'post' => self::$post ) );

		$settings = apply_filters( 'block_editor_settings_all', array(), $context );
		$this->assertSame(
			array(),
			$settings['lockedNoteActions'],
			'Expected no locked actions by default.'
		);

		$this->lock_post();
		$settings = apply_filters( 'block_editor_settings_all', array(), $context );
		$this->assertSame(
			array( 'create', 'reply', 'edit', 'resolve', 'delete' ),
			$settings['lockedNoteActions'],
			'Expected every action to be locked.'
		);

		delete_post_meta( self::$post->ID, '_wp_notes_locked' );
		add_filter(
			'note_action_is_locked',
			static function ( $locked, $action ) {
				return 'delete' === $action ? true : $locked;
			},
			10,
			2
		);
		$settings = apply_filters( 'block_editor_settings_all', array(), $context );
		$this->assertSame(
			array( 'delete' ),
			$settings['lockedNoteActions'],
			'Expected only the filtered action to be locked.'
		);
	}
}
