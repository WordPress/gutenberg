<?php
/**
 * Tests for Quick Edit blocking while a post has an active edit lock.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_QuickEditCollaborationLock extends WP_UnitTestCase {

	private static int $post_id;
	private static int $admin_id;
	private static int $editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create(
			array(
				'post_title' => 'Quick Edit lock post',
				'post_type'  => 'post',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		delete_post_meta( self::$post_id, '_edit_lock' );
		unset( $_POST['post_ID'], $_POST['_inline_edit'], $_REQUEST['_inline_edit'] );

		parent::tear_down();
	}

	private function set_edit_lock( int $user_id, int $age = 0 ) {
		update_post_meta( self::$post_id, '_edit_lock', ( time() - $age ) . ':' . $user_id );
	}

	private function quick_edit_actions(): array {
		return array(
			'edit'                 => '<a href="#">Edit</a>',
			'inline hide-if-no-js' => '<button>Quick Edit</button>',
		);
	}

	private function prime_inline_save_request() {
		$_POST['post_ID']      = self::$post_id;
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		// check_ajax_referer() reads the nonce from $_REQUEST; in a real
		// request PHP populates it from $_POST, but not when assigning to
		// superglobals directly in tests.
		$_REQUEST['_inline_edit'] = $_POST['_inline_edit'];
	}

	private function shutdown_callback_count(): int {
		global $wp_filter;
		return isset( $wp_filter['shutdown'] ) ? count( $wp_filter['shutdown']->callbacks, COUNT_RECURSIVE ) : 0;
	}

	public function test_active_edit_lock_user_reflects_lock_state() {
		$this->assertSame( 0, gutenberg_get_active_edit_lock_user( self::$post_id ), 'Without a lock the helper should return 0.' );

		$this->set_edit_lock( self::$admin_id, 1000 );
		$this->assertSame( 0, gutenberg_get_active_edit_lock_user( self::$post_id ), 'A stale lock should return 0.' );

		$this->set_edit_lock( self::$admin_id );
		$this->assertSame( self::$admin_id, gutenberg_get_active_edit_lock_user( self::$post_id ), 'A fresh lock should return its holder.' );
	}

	public function test_heartbeat_marks_only_fresh_own_locks() {
		$key  = 'post-' . self::$post_id;
		$data = array( 'wp-check-locked-posts' => array( $key ) );

		$this->set_edit_lock( self::$admin_id, 1000 );
		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc( array(), $data );
		$this->assertArrayNotHasKey( 'wp-check-locked-posts', $response, 'A stale own lock should not mark the row as locked.' );

		$this->set_edit_lock( self::$admin_id );
		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc( array(), $data );
		$this->assertSame(
			array( 'text' => 'Currently being edited' ),
			$response['wp-check-locked-posts'][ $key ],
			'A fresh own lock should mark the row as locked, without user details.'
		);
	}

	public function test_heartbeat_still_anonymizes_other_user_entries() {
		$this->set_edit_lock( self::$editor_id );
		$key = 'post-' . self::$post_id;

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc(
			array(
				'wp-check-locked-posts' => array(
					$key => array(
						'text'       => 'Editor is currently editing',
						'avatar_src' => 'https://example.com/avatar.png',
					),
				),
			),
			array( 'wp-check-locked-posts' => array( $key ) )
		);

		$this->assertSame( 'Currently being edited', $response['wp-check-locked-posts'][ $key ]['text'] );
		$this->assertArrayNotHasKey( 'avatar_src', $response['wp-check-locked-posts'][ $key ] );
	}

	public function test_row_actions_remove_quick_edit_only_for_own_fresh_lock() {
		$post = get_post( self::$post_id );

		$filtered = gutenberg_post_list_collaboration_row_actions( $this->quick_edit_actions(), $post );
		$this->assertArrayHasKey( 'inline hide-if-no-js', $filtered, 'Quick Edit should stay without a lock.' );

		// Other users' locks are handled by core: the row renders with
		// .wp-locked and core CSS hides the Quick Edit action.
		$this->set_edit_lock( self::$editor_id );
		$filtered = gutenberg_post_list_collaboration_row_actions( $this->quick_edit_actions(), $post );
		$this->assertArrayHasKey( 'inline hide-if-no-js', $filtered, "Another user's lock is left to core." );

		$this->set_edit_lock( self::$admin_id );
		$filtered = gutenberg_post_list_collaboration_row_actions( $this->quick_edit_actions(), $post );
		$this->assertArrayNotHasKey( 'inline hide-if-no-js', $filtered, "Quick Edit should be removed for the current user's own fresh lock." );
	}

	public function test_inline_save_guard_is_registered_on_core_quick_edit_ajax_hook() {
		// Core fires "wp_ajax_{$_POST['action']}" and Quick Edit posts
		// action=inline-save — guard against a hook-name typo regression.
		update_option( 'wp_collaboration_enabled', '1' );

		gutenberg_post_list_collaboration_ui();

		$this->assertSame(
			0,
			has_action( 'wp_ajax_inline-save', 'gutenberg_block_quick_edit_for_active_lock' )
		);

		remove_action( 'wp_ajax_inline-save', 'gutenberg_block_quick_edit_for_active_lock', 0 );
		remove_filter( 'heartbeat_received', 'gutenberg_filter_locked_posts_heartbeat_for_rtc', 20 );
	}

	public function test_inline_save_guard_rejects_save_for_own_fresh_lock() {
		$this->set_edit_lock( self::$admin_id );
		$this->prime_inline_save_request();

		$this->expectException( 'WPDieException' );
		$this->expectExceptionMessage( 'Quick Edit is disabled: You are currently editing this post in another tab or window.' );

		gutenberg_block_quick_edit_for_active_lock();
	}

	public function test_inline_save_guard_defers_other_users_lock_to_core() {
		$this->set_edit_lock( self::$editor_id );
		$this->prime_inline_save_request();
		$before = $this->shutdown_callback_count();

		gutenberg_block_quick_edit_for_active_lock();

		$this->assertSame( $before, $this->shutdown_callback_count(), "Another user's lock is core's to reject; no lock release should be scheduled." );
	}

	public function test_inline_save_guard_ignores_disabled_post_types() {
		$this->set_edit_lock( self::$admin_id );
		$this->prime_inline_save_request();
		add_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );
		$before = $this->shutdown_callback_count();

		gutenberg_block_quick_edit_for_active_lock();

		remove_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );
		$this->assertSame( $before, $this->shutdown_callback_count(), 'With collaboration disabled for the post type the guard should neither reject nor schedule a lock release.' );
	}

	public function test_inline_save_guard_schedules_lock_release_when_save_proceeds() {
		$this->prime_inline_save_request();
		$before = $this->shutdown_callback_count();

		gutenberg_block_quick_edit_for_active_lock();

		$this->assertGreaterThan( $before, $this->shutdown_callback_count() );
	}

	public function test_release_own_edit_lock_only_deletes_own_fresh_lock() {
		$this->set_edit_lock( self::$editor_id );
		gutenberg_release_own_edit_lock( self::$post_id );
		$this->assertNotSame( '', get_post_meta( self::$post_id, '_edit_lock', true ), "Another user's lock should be kept." );

		$this->set_edit_lock( self::$admin_id );
		gutenberg_release_own_edit_lock( self::$post_id );
		$this->assertSame( '', get_post_meta( self::$post_id, '_edit_lock', true ), "The current user's own fresh lock should be deleted." );
	}
}
