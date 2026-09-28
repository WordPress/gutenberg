<?php
/**
 * Tests for collaborative editing post list row actions.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_PostListCollaborationRowActions extends WP_UnitTestCase {

	private static int $post_id;
	private static int $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$post_id  = $factory->post->create(
			array(
				'post_title' => 'Collaboration row action post',
				'post_type'  => 'post',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		remove_filter( 'wp_is_post_type_collaboration_disabled', array( $this, 'disable_post_collaboration' ) );

		parent::tear_down();
	}

	public function test_post_list_collaboration_row_actions_include_join_action() {
		$post    = get_post( self::$post_id );
		$actions = array(
			'edit' => '<a href="#">Edit</a>',
		);

		$filtered_actions = gutenberg_post_list_collaboration_row_actions( $actions, $post );

		$this->assertStringContainsString( 'edit-action-text', $filtered_actions['edit'] );
		$this->assertStringContainsString( 'join-action-text', $filtered_actions['edit'] );
		$this->assertStringContainsString( '>Join</a>', $filtered_actions['edit'] );
	}

	public function test_post_list_collaboration_row_actions_are_unchanged_for_disabled_post_type() {
		add_filter( 'wp_is_post_type_collaboration_disabled', array( $this, 'disable_post_collaboration' ), 10, 2 );

		$post    = get_post( self::$post_id );
		$actions = array(
			'edit' => '<a href="#">Edit</a>',
		);

		$this->assertSame(
			$actions,
			gutenberg_post_list_collaboration_row_actions( $actions, $post )
		);
	}

	public function disable_post_collaboration( $disabled, $post_type ) {
		return 'post' === $post_type ? true : $disabled;
	}
}
