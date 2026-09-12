<?php
/**
 * Tests detection of edit locks held by editors without collaboration support.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_PostLockCollaborative extends WP_UnitTestCase {

	private static int $post_id;
	private static int $author_id;
	private static int $editor_id;
	private static int $third_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$third_id  = $factory->user->create( array( 'role' => 'author' ) );
		self::$post_id   = $factory->post->create(
			array(
				'post_title'  => 'Collaborative lock post',
				'post_type'   => 'post',
				'post_author' => self::$author_id,
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$author_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$third_id );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$editor_id );
	}

	public function tear_down() {
		delete_post_meta( self::$post_id, '_edit_lock' );
		delete_post_meta( self::$post_id, GUTENBERG_COLLABORATIVE_SESSION_META_KEY );
		$this->clear_awareness();
		wp_cache_delete( self::$post_id, GUTENBERG_COLLABORATIVE_LOCK_CACHE_GROUP );

		parent::tear_down();
	}

	/**
	 * Locks the post on behalf of a user, as wp_set_post_lock() does.
	 *
	 * @param int $user_id User holding the lock.
	 * @param int $age     How many seconds ago the lock was taken.
	 */
	private function lock_post( $user_id, $age = 0 ) {
		update_post_meta( self::$post_id, '_edit_lock', ( time() - $age ) . ':' . $user_id );
	}

	/**
	 * Records a collaborative session for a user at a point in the past.
	 *
	 * @param int $user_id User in the session.
	 * @param int $age     How many seconds ago the session was reported.
	 */
	private function set_session( $user_id, $age ) {
		update_post_meta(
			self::$post_id,
			GUTENBERG_COLLABORATIVE_SESSION_META_KEY,
			array( (int) $user_id => time() - $age )
		);
	}

	private function room() {
		return 'postType/post:' . self::$post_id;
	}

	/**
	 * Records awareness for a user, as the sync server does while polling.
	 *
	 * @param int $user_id User in the collaborative session.
	 * @param int $age     How many seconds ago the awareness was recorded.
	 */
	private function set_awareness( $user_id, $age = 0 ) {
		gutenberg_get_sync_storage()->set_awareness_state(
			$this->room(),
			array(
				array(
					'client_id'  => 1,
					'state'      => array(),
					'updated_at' => time() - $age,
					'wp_user_id' => $user_id,
				),
			)
		);
	}

	private function clear_awareness() {
		gutenberg_get_sync_storage()->set_awareness_state( $this->room(), array() );
	}

	public function test_unlocked_post_is_collaborative() {
		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_expired_lock_is_collaborative() {
		$this->lock_post( self::$author_id, DAY_IN_SECONDS );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_own_lock_is_collaborative() {
		$this->lock_post( self::$editor_id );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_lock_without_a_collaborative_session_is_not_collaborative() {
		$this->lock_post( self::$author_id );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_lock_with_live_awareness_is_collaborative() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_lock_with_expired_awareness_is_not_collaborative() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id, WP_HTTP_Polling_Sync_Server::AWARENESS_TIMEOUT + 1 );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_awareness_for_another_user_does_not_make_the_lock_collaborative() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$editor_id );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_session_marker_covers_a_session_that_has_not_polled_yet() {
		$this->lock_post( self::$author_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$author_id );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_a_third_session_does_not_displace_the_lock_holder() {
		$this->lock_post( self::$author_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$author_id );

		// A second and third collaborator open the same post.
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$editor_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$third_id );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_clearing_one_session_leaves_the_others() {
		$this->lock_post( self::$author_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$author_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$editor_id );

		gutenberg_clear_collaborative_edit_session( self::$post_id, self::$editor_id );

		$this->assertSame(
			array( self::$author_id ),
			array_keys( gutenberg_get_collaborative_edit_sessions( self::$post_id ) )
		);
	}

	public function test_expired_session_marker_is_ignored() {
		$this->lock_post( self::$author_id );
		$this->set_session( self::$author_id, gutenberg_get_collaborative_session_window() + 1 );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_session_marker_outlives_the_awareness_timeout() {
		$this->lock_post( self::$author_id );
		$this->set_session( self::$author_id, WP_HTTP_Polling_Sync_Server::AWARENESS_TIMEOUT + 1 );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	/**
	 * Sends a lock refresh heartbeat as the current user.
	 *
	 * @param bool $collaborative Whether the editor reports a collaborative session.
	 */
	private function send_lock_heartbeat( $collaborative ) {
		gutenberg_track_collaborative_session_heartbeat(
			array(),
			array(
				'wp-refresh-post-lock' => array(
					'post_id'       => self::$post_id,
					'lock'          => '1:' . get_current_user_id(),
					'collaborative' => $collaborative ? 1 : 0,
				),
			)
		);
	}

	public function test_heartbeat_from_a_collaborative_editor_refreshes_the_marker() {
		wp_set_current_user( self::$author_id );
		$this->lock_post( self::$author_id );
		$this->send_lock_heartbeat( true );

		wp_set_current_user( self::$editor_id );

		$this->assertTrue( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_heartbeat_from_a_non_collaborative_editor_clears_the_marker() {
		wp_set_current_user( self::$author_id );
		$this->lock_post( self::$author_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$author_id );
		$this->send_lock_heartbeat( false );

		wp_set_current_user( self::$editor_id );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_heartbeat_from_someone_other_than_the_lock_holder_is_ignored() {
		$this->lock_post( self::$author_id );

		// The editor is not the lock holder, so this must not mark the lock.
		$this->send_lock_heartbeat( true );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_session_marker_for_another_user_is_ignored() {
		$this->lock_post( self::$author_id );
		gutenberg_mark_collaborative_edit_session( self::$post_id, self::$editor_id );

		$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
	}

	public function test_disabled_post_type_is_not_collaborative() {
		add_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );

		try {
			$this->assertFalse( gutenberg_is_post_lock_collaborative( self::$post_id ) );
		} finally {
			remove_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );
		}
	}

	public function test_missing_post_is_not_collaborative() {
		$this->assertFalse( gutenberg_is_post_lock_collaborative( 0 ) );
	}

	public function test_row_actions_omit_join_for_a_non_collaborative_lock() {
		$this->lock_post( self::$author_id );

		$actions = array( 'edit' => '<a href="#">Edit</a>' );

		$this->assertSame(
			$actions,
			gutenberg_post_list_collaboration_row_actions( $actions, get_post( self::$post_id ) )
		);
	}

	public function test_row_actions_include_join_for_a_collaborative_lock() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id );

		$actions = gutenberg_post_list_collaboration_row_actions(
			array( 'edit' => '<a href="#">Edit</a>' ),
			get_post( self::$post_id )
		);

		$this->assertStringContainsString( 'join-action-text', $actions['edit'] );
	}

	public function test_row_class_is_not_added_for_a_non_collaborative_lock() {
		$this->lock_post( self::$author_id );

		$this->assertNotContains(
			'is-collaborative-lock',
			gutenberg_post_list_collaboration_row_class( array(), array(), self::$post_id )
		);
	}

	public function test_row_class_is_added_for_a_collaborative_lock() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id );

		$this->assertContains(
			'is-collaborative-lock',
			gutenberg_post_list_collaboration_row_class( array(), array(), self::$post_id )
		);
	}

	public function test_heartbeat_keeps_core_lock_details_for_a_non_collaborative_lock() {
		$this->lock_post( self::$author_id );

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc(
			array(
				'wp-check-locked-posts' => array(
					'post-' . self::$post_id => array(
						'text'          => 'The Author is currently editing',
						'avatar_src'    => 'https://example.org/avatar.png',
						'avatar_src_2x' => 'https://example.org/avatar-2x.png',
					),
				),
			)
		);

		$lock_data = $response['wp-check-locked-posts'][ 'post-' . self::$post_id ];

		$this->assertSame( 'The Author is currently editing', $lock_data['text'] );
		$this->assertArrayHasKey( 'avatar_src', $lock_data );
	}

	public function test_heartbeat_genericizes_a_collaborative_lock() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id );

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc(
			array(
				'wp-check-locked-posts' => array(
					'post-' . self::$post_id => array(
						'text'          => 'The Author is currently editing',
						'avatar_src'    => 'https://example.org/avatar.png',
						'avatar_src_2x' => 'https://example.org/avatar-2x.png',
					),
				),
			)
		);

		$lock_data = $response['wp-check-locked-posts'][ 'post-' . self::$post_id ];

		$this->assertSame( 'Currently being edited', $lock_data['text'] );
		$this->assertArrayNotHasKey( 'avatar_src', $lock_data );
	}

	/**
	 * Runs the lock text filter with the given post set up as the current row.
	 *
	 * WP_Posts_List_Table::single_row() sets the global post before rendering.
	 *
	 * @param int $post_id Post ID of the row being rendered.
	 * @return string Filtered lock text.
	 */
	private function filter_lock_text( $post_id ) {
		global $post;

		$original_post = $post;
		$post          = get_post( $post_id );

		try {
			return gutenberg_filter_locked_post_text_for_rtc(
				'%s is currently editing',
				'%s is currently editing',
				'default'
			);
		} finally {
			$post = $original_post;
		}
	}

	public function test_lock_text_is_kept_for_a_non_collaborative_row() {
		$this->lock_post( self::$author_id );

		$this->assertSame(
			'%s is currently editing',
			$this->filter_lock_text( self::$post_id )
		);
	}

	public function test_lock_text_is_replaced_for_a_collaborative_row() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id );

		$this->assertSame(
			'Currently being edited',
			$this->filter_lock_text( self::$post_id )
		);
	}

	public function test_lock_text_is_kept_for_a_domain_other_than_default() {
		$this->lock_post( self::$author_id );
		$this->set_awareness( self::$author_id );

		$this->assertSame(
			'%s is currently editing',
			gutenberg_filter_locked_post_text_for_rtc(
				'%s is currently editing',
				'%s is currently editing',
				'some-plugin'
			)
		);
	}
}
