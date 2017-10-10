<?php
/**
 * Admin Tests
 *
 * @package Gutenberg
 */

/**
 * Test functions in register.php
 */
class Admin_Test extends WP_UnitTestCase {

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_user_id;

	/**
	 * ID for a post containing blocks.
	 *
	 * @var int
	 */
	protected static $post_with_blocks;

	/**
	 * ID for a post without blocks.
	 *
	 * @var int
	 */
	protected static $post_without_blocks;

	/**
	 * Set up before class.
	 */
	public static function setUpBeforeClass() {

		self::$editor_user_id      = self::factory()->user->create( array(
			'role' => 'editor',
		) );
		self::$post_with_blocks    = self::factory()->post->create( array(
			'post_title'   => 'Example',
			'post_content' => "<!-- wp:core/text {\"dropCap\":true} -->\n<p class=\"has-drop-cap\">Tester</p>\n<!-- /wp:core/text -->",
		) );
		self::$post_without_blocks = self::factory()->post->create( array(
			'post_title'   => 'Example',
			'post_content' => 'Tester',
		) );
		return parent::setUpBeforeClass();
	}

	/**
	 * Tests gutenberg_add_admin_bar_edit_link().
	 *
	 * @covers gutenberg_add_admin_bar_edit_link
	 */
	function test_gutenberg_add_admin_bar_edit_link() {
		$this->markTestIncomplete();
	}

	/**
	 * Tests gutenberg_add_edit_links().
	 *
	 * @covers gutenberg_add_edit_links
	 * @covers gutenberg_add_edit_links_filters
	 */
	function test_gutenberg_add_edit_links() {
		gutenberg_add_edit_links_filters();

		$original_actions = array(
			'edit' => 'original',
		);

		$actions = apply_filters( 'post_row_actions', $original_actions, get_post( self::$post_with_blocks ) );
		$this->assertEquals( $original_actions, $actions, 'User not logged-in so no ability to edit.' );

		wp_set_current_user( self::$editor_user_id );

		$actions = apply_filters( 'post_row_actions', $original_actions, get_post( self::$post_with_blocks ) );
		$this->assertArrayHasKey( 'gutenberg hide-if-no-js', $actions );
		$this->assertArrayHasKey( 'classic hide-if-no-js', $actions );
		$this->assertContains( 'post.php', $actions['classic hide-if-no-js'] );

		$actions = apply_filters( 'post_row_actions', $original_actions, get_post( self::$post_without_blocks ) );
		$this->assertArrayHasKey( 'gutenberg hide-if-no-js', $actions );
		$this->assertArrayHasKey( 'classic hide-if-no-js', $actions );
		$this->assertContains( 'post.php', $actions['classic hide-if-no-js'] );

		$trashed_post = $this->factory()->post->create( array(
			'post_status' => 'trash',
		) );
		$actions      = apply_filters( 'post_row_actions', $original_actions, get_post( $trashed_post ) );
		$this->assertArrayNotHasKey( 'gutenberg hide-if-no-js', $actions );
		$this->assertArrayNotHasKey( 'classic hide-if-no-js', $actions );

		register_post_type( 'not_shown_in_rest', array(
			'supports'     => array( 'title', 'editor' ),
			'show_in_rest' => false,
		) );
		$post_id = $this->factory()->post->create( array(
			'post_type' => 'not_shown_in_rest',
		) );
		$actions = apply_filters( 'post_row_actions', $original_actions, get_post( $post_id ) );
		$this->assertArrayNotHasKey( 'gutenberg hide-if-no-js', $actions );
		$this->assertArrayNotHasKey( 'classic hide-if-no-js', $actions );

		register_post_type( 'not_supports_editor', array(
			'show_in_rest' => true,
			'supports'     => array( 'title' ),
		) );
		$post_id = $this->factory()->post->create( array(
			'post_type' => 'not_supports_editor',
		) );
		$actions = apply_filters( 'post_row_actions', $original_actions, get_post( $post_id ) );
		$this->assertArrayNotHasKey( 'gutenberg hide-if-no-js', $actions );
		$this->assertArrayNotHasKey( 'classic hide-if-no-js', $actions );

	}

	/**
	 * Tests gutenberg_get_edit_post_url().
	 *
	 * @covers gutenberg_get_edit_post_url
	 */
	function test_gutenberg_get_edit_post_url() {
		$url = gutenberg_get_edit_post_url( self::$post_with_blocks );
		$this->assertContains( 'page=gutenberg', $url );
		$this->assertContains( 'post_id=' . self::$post_with_blocks, $url );
	}

	/**
	 * Tests gutenberg_filter_edit_post_link().
	 *
	 * @covers gutenberg_filter_edit_post_link
	 */
	function test_gutenberg_filter_edit_post_link() {
		wp_set_current_user( self::$editor_user_id );
		$this->assertContains( 'gutenberg', get_edit_post_link( self::$post_with_blocks ) );
		$this->assertNotContains( 'gutenberg', get_edit_post_link( self::$post_without_blocks ) );
	}

	/**
	 * Tests gutenberg_can_edit_post().
	 *
	 * @covers gutenberg_can_edit_post
	 */
	function test_gutenberg_can_edit_post() {
		$this->assertFalse( gutenberg_can_edit_post( -1 ) );
		$bogus_post_id = $this->factory()->post->create( array(
			'post_type' => 'bogus',
		) );
		$this->assertFalse( gutenberg_can_edit_post( $bogus_post_id ) );

		register_post_type( 'restless', array(
			'show_in_rest' => false,
		) );
		$restless_post_id = $this->factory()->post->create( array(
			'post_type' => 'restless',
		) );
		$this->assertFalse( gutenberg_can_edit_post( $restless_post_id ) );

		$generic_post_id = $this->factory()->post->create();

		wp_set_current_user( 0 );
		$this->assertFalse( gutenberg_can_edit_post( $generic_post_id ) );

		wp_set_current_user( self::$editor_user_id );
		$this->assertTrue( gutenberg_can_edit_post( $generic_post_id ) );
	}

	/**
	 * Tests gutenberg_post_has_blocks().
	 *
	 * @covers gutenberg_post_has_blocks
	 */
	function test_gutenberg_post_has_blocks() {
		$this->assertTrue( gutenberg_post_has_blocks( self::$post_with_blocks ) );
		$this->assertFalse( gutenberg_post_has_blocks( self::$post_without_blocks ) );
	}

	/**
	 * Tests gutenberg_add_gutenberg_post_state().
	 *
	 * @covers gutenberg_add_gutenberg_post_state
	 */
	function test_add_gutenberg_post_state() {
		// With blocks.
		$post_states = apply_filters( 'display_post_states', array(), get_post( self::$post_with_blocks ) );
		$this->assertEquals( array( 'Gutenberg' ), $post_states );

		// Without blocks.
		$post_states = apply_filters( 'display_post_states', array(), get_post( self::$post_without_blocks ) );
		$this->assertEquals( array(), $post_states );
	}
}
