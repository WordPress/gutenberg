<?php
/**
 * Footnotes block tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Footnotes block.
 *
 * @group blocks
 */
class Tests_Blocks_Footnotes extends WP_UnitTestCase {
	/**
	 * Post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$post_id       = $factory->post->create();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id, true );
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * The footnotes meta is protected so the Custom Fields meta box does not
	 * list it; a value edited there would overwrite the footnotes saved by the
	 * editor.
	 */
	public function test_footnotes_meta_is_protected_for_posts() {
		$this->assertTrue( is_protected_meta( 'footnotes', 'post' ) );
	}

	/**
	 * The protection is scoped to post meta; a `footnotes` key on another
	 * object type is unaffected.
	 */
	public function test_footnotes_meta_is_not_protected_for_other_meta_types() {
		$this->assertFalse( is_protected_meta( 'footnotes', 'user' ) );
	}

	/**
	 * Despite the protection, the registered auth callback lets users who can
	 * edit the post save footnotes through the editor.
	 */
	public function test_users_who_can_edit_the_post_can_edit_footnotes_meta() {
		$this->assertTrue( user_can( self::$admin_id, 'edit_post_meta', self::$post_id, 'footnotes' ) );
		$this->assertTrue( user_can( self::$admin_id, 'add_post_meta', self::$post_id, 'footnotes' ) );
	}

	/**
	 * Users who cannot edit the post cannot edit its footnotes meta.
	 */
	public function test_users_who_cannot_edit_the_post_cannot_edit_footnotes_meta() {
		$this->assertFalse( user_can( self::$subscriber_id, 'edit_post_meta', self::$post_id, 'footnotes' ) );
	}
}
