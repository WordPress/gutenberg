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

	public function test_active_edit_lock_user_returns_holder_for_fresh_lock() {
		$this->set_edit_lock( self::$admin_id );

		$this->assertSame( self::$admin_id, gutenberg_get_active_edit_lock_user( self::$post_id ) );
	}

	public function test_active_edit_lock_user_returns_zero_for_stale_lock() {
		$this->set_edit_lock( self::$admin_id, 1000 );

		$this->assertSame( 0, gutenberg_get_active_edit_lock_user( self::$post_id ) );
	}

	public function test_active_edit_lock_user_returns_zero_without_lock() {
		$this->assertSame( 0, gutenberg_get_active_edit_lock_user( self::$post_id ) );
	}

	public function test_heartbeat_adds_posts_locked_by_current_user() {
		$this->set_edit_lock( self::$admin_id );
		$key = 'post-' . self::$post_id;

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc(
			array(),
			array( 'wp-check-locked-posts' => array( $key ) ),
			'edit-post'
		);

		$this->assertArrayHasKey( $key, $response['wp-check-locked-posts'] );
		$this->assertSame(
			'Currently being edited',
			$response['wp-check-locked-posts'][ $key ]['text']
		);
	}

	public function test_heartbeat_ignores_stale_own_lock() {
		$this->set_edit_lock( self::$admin_id, 1000 );
		$key = 'post-' . self::$post_id;

		$response = gutenberg_filter_locked_posts_heartbeat_for_rtc(
			array(),
			array( 'wp-check-locked-posts' => array( $key ) ),
			'edit-post'
		);

		$this->assertArrayNotHasKey( 'wp-check-locked-posts', $response );
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
			array( 'wp-check-locked-posts' => array( $key ) ),
			'edit-post'
		);

		$this->assertSame( 'Currently being edited', $response['wp-check-locked-posts'][ $key ]['text'] );
		$this->assertArrayNotHasKey( 'avatar_src', $response['wp-check-locked-posts'][ $key ] );
	}

	public function test_row_actions_remove_quick_edit_for_own_fresh_lock() {
		$this->set_edit_lock( self::$admin_id );
		$post = get_post( self::$post_id );

		$filtered = gutenberg_post_list_collaboration_row_actions( $this->quick_edit_actions(), $post );

		$this->assertArrayNotHasKey( 'inline hide-if-no-js', $filtered );
	}

	public function test_row_actions_keep_quick_edit_without_lock() {
		$post = get_post( self::$post_id );

		$filtered = gutenberg_post_list_collaboration_row_actions( $this->quick_edit_actions(), $post );

		$this->assertArrayHasKey( 'inline hide-if-no-js', $filtered );
	}

	public function test_row_actions_keep_quick_edit_for_other_users_lock() {
		// Other users' locks are handled by core: the row renders with
		// .wp-locked and core CSS hides the Quick Edit action.
		$this->set_edit_lock( self::$editor_id );
		$post = get_post( self::$post_id );

		$filtered = gutenberg_post_list_collaboration_row_actions( $this->quick_edit_actions(), $post );

		$this->assertArrayHasKey( 'inline hide-if-no-js', $filtered );
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
		$_POST['post_ID']      = self::$post_id;
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		// check_ajax_referer() reads the nonce from $_REQUEST; in a real
		// request PHP populates it from $_POST, but not when assigning to
		// superglobals directly in tests.
		$_REQUEST['_inline_edit'] = $_POST['_inline_edit'];

		$this->expectException( 'WPDieException' );
		$this->expectExceptionMessage( 'Quick Edit is disabled: You are currently editing this post in another tab or window.' );

		gutenberg_block_quick_edit_for_active_lock();
	}

	public function test_inline_save_guard_allows_save_without_lock() {
		$this->expectNotToPerformAssertions();
		$_POST['post_ID']      = self::$post_id;
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		// check_ajax_referer() reads the nonce from $_REQUEST; assigning to
		// $_POST does not sync superglobals the way a real request does.
		$_REQUEST['_inline_edit'] = $_POST['_inline_edit'];

		gutenberg_block_quick_edit_for_active_lock();
	}

	public function test_inline_save_guard_defers_other_users_lock_to_core() {
		$this->expectNotToPerformAssertions();
		$this->set_edit_lock( self::$editor_id );
		$_POST['post_ID']      = self::$post_id;
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		// check_ajax_referer() reads the nonce from $_REQUEST; assigning to
		// $_POST does not sync superglobals the way a real request does.
		$_REQUEST['_inline_edit'] = $_POST['_inline_edit'];

		gutenberg_block_quick_edit_for_active_lock();
	}

	public function test_release_own_edit_lock_deletes_own_fresh_lock() {
		$this->set_edit_lock( self::$admin_id );

		gutenberg_release_own_edit_lock( self::$post_id );

		$this->assertSame( '', get_post_meta( self::$post_id, '_edit_lock', true ) );
	}

	public function test_release_own_edit_lock_keeps_other_users_lock() {
		$this->set_edit_lock( self::$editor_id );

		gutenberg_release_own_edit_lock( self::$post_id );

		$this->assertNotSame( '', get_post_meta( self::$post_id, '_edit_lock', true ) );
	}

	public function test_inline_save_guard_schedules_lock_release_when_save_proceeds() {
		global $wp_filter;
		$_POST['post_ID']      = self::$post_id;
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		// check_ajax_referer() reads the nonce from $_REQUEST; assigning to
		// $_POST does not sync superglobals the way a real request does.
		$_REQUEST['_inline_edit'] = $_POST['_inline_edit'];

		$before = isset( $wp_filter['shutdown'] ) ? count( $wp_filter['shutdown']->callbacks, COUNT_RECURSIVE ) : 0;

		gutenberg_block_quick_edit_for_active_lock();

		$after = isset( $wp_filter['shutdown'] ) ? count( $wp_filter['shutdown']->callbacks, COUNT_RECURSIVE ) : 0;
		$this->assertGreaterThan( $before, $after );
	}
}
