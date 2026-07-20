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
		delete_post_meta( self::$post_id, '_edit_last' );
		unset( $_POST['post_ID'], $_POST['_inline_edit'], $_REQUEST['_inline_edit'] );

		parent::tear_down();
	}

	private function set_edit_lock( int $user_id, int $age = 0 ) {
		update_post_meta( self::$post_id, '_edit_lock', ( time() - $age ) . ':' . $user_id );
	}

	private function prime_inline_save_request() {
		$_POST['post_ID']      = self::$post_id;
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		// check_ajax_referer() reads the nonce from $_REQUEST; in a real
		// request PHP populates it from $_POST, but not when assigning to
		// superglobals directly in tests.
		$_REQUEST['_inline_edit'] = $_POST['_inline_edit'];
	}

	public function test_deleted_user_lock_is_treated_as_inactive() {
		$deleted_user_id = self::factory()->user->create();
		self::delete_user( $deleted_user_id );
		$this->set_edit_lock( $deleted_user_id );

		$this->assertSame( 0, gutenberg_get_active_edit_lock_user( self::$post_id ), 'A lock from a deleted user should be inactive.' );
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

	public function test_heartbeat_ignores_own_locks_for_disabled_post_types() {
		$key  = 'post-' . self::$post_id;
		$data = array( 'wp-check-locked-posts' => array( $key ) );

		$this->set_edit_lock( self::$admin_id );
		add_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc( array(), $data );

		remove_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );
		$this->assertArrayNotHasKey( 'wp-check-locked-posts', $response );
	}

	public function test_heartbeat_removes_user_details_from_other_user_entries() {
		$this->set_edit_lock( self::$editor_id );
		$key = 'post-' . self::$post_id;

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc(
			array(
				'wp-check-locked-posts' => array(
					$key => array(
						'text'          => 'Editor is currently editing',
						'avatar_src'    => 'https://example.com/avatar.png',
						'avatar_src_2x' => 'https://example.com/avatar-2x.png',
					),
				),
			),
			array( 'wp-check-locked-posts' => array( $key ) )
		);

		$this->assertSame(
			array( 'text' => 'Currently being edited' ),
			$response['wp-check-locked-posts'][ $key ]
		);
	}

	public function test_inline_save_guard_is_registered_on_core_quick_edit_ajax_hook() {
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

		gutenberg_block_quick_edit_for_active_lock();

		$this->assertSame( self::$editor_id, wp_check_post_lock( self::$post_id ), "Another user's lock should be left for Core to reject." );
	}

	public function test_inline_save_guard_ignores_disabled_post_types() {
		$this->set_edit_lock( self::$admin_id );
		$this->prime_inline_save_request();
		add_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );

		gutenberg_block_quick_edit_for_active_lock();

		remove_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );
		$new_lock = ( time() + 1 ) . ':' . self::$editor_id;
		update_post_meta( self::$post_id, '_edit_lock', $new_lock );
		$this->assertSame( $new_lock, get_post_meta( self::$post_id, '_edit_lock', true ) );
	}

	public function test_inline_save_guard_prevents_only_core_quick_edit_lock_creation() {
		$this->prime_inline_save_request();

		gutenberg_block_quick_edit_for_active_lock();

		update_post_meta( self::$post_id, '_edit_last', self::$editor_id );
		wp_set_post_lock( self::$post_id );

		$this->assertSame( self::$editor_id, (int) get_post_meta( self::$post_id, '_edit_last', true ) );
		$this->assertSame( '', get_post_meta( self::$post_id, '_edit_lock', true ) );
	}
}
