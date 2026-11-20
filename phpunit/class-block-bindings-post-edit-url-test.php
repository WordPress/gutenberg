<?php
/**
 * Tests for the core/post-edit-url block binding source.
 *
 * @package Gutenberg
 * @subpackage BlockBindings
 */

/**
 * Test class for Block_Bindings_Post_Edit_Url.
 */
class Block_Bindings_Post_Edit_Url_Test extends WP_UnitTestCase {

	/**
	 * Admin user ID.
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

	/**
	 * Test post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Sets up the class environment before tests run.
	 *
	 * @param WP_UnitTest_Factory $factory The unit test factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$post_id       = $factory->post->create();
	}

	/**
	 * Tears down the test environment after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Helper function to create a dummy WP_Block instance.
	 *
	 * @param array  $context    Block context.
	 * @param string $block_name Block name.
	 * @param array  $attrs      Block attributes.
	 * @return WP_Block The dummy block instance.
	 */
	private function create_dummy_block_instance( $context = array(), $block_name = 'core/button', $attrs = array() ) {
		$parsed_block            = array(
			'blockName' => $block_name,
			'attrs'     => $attrs,
		);
		$block_instance          = new WP_Block( $parsed_block );
		$block_instance->context = $context;

		return $block_instance;
	}

	/**
	 * Tests that the binding returns a valid edit link for an authorized user.
	 */
	public function test_returns_link_for_authorized_user_with_context() {
		wp_set_current_user( self::$admin_id );

		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ) );
		$result         = gutenberg_block_bindings_post_edit_url_callback( array(), $block_instance );
		$expected       = get_edit_post_link( self::$post_id, 'raw' );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests that the binding returns null for an unauthorized user.
	 */
	public function test_returns_null_for_unauthorized_user_with_context() {
		wp_set_current_user( self::$subscriber_id );

		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ) );
		$result         = gutenberg_block_bindings_post_edit_url_callback( array(), $block_instance );

		$this->assertNull( $result );
	}

	/**
	 * Tests that the binding returns null for a logged out user.
	 */
	public function test_returns_null_for_logged_out_user() {
		wp_set_current_user( 0 );

		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ) );
		$result         = gutenberg_block_bindings_post_edit_url_callback( array(), $block_instance );

		$this->assertNull( $result );
	}

	/**
	 * Tests that the binding falls back to the global post ID when context is missing.
	 */
	public function test_returns_link_using_global_post_fallback() {
		wp_set_current_user( self::$admin_id );

		$this->go_to( get_permalink( self::$post_id ) );

		$block_instance = $this->create_dummy_block_instance( array() );
		$result         = gutenberg_block_bindings_post_edit_url_callback( array(), $block_instance );
		$expected       = get_edit_post_link( self::$post_id, 'raw' );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests that the binding returns null when there is no post context available.
	 */
	public function test_returns_null_when_no_post_exists() {
		wp_set_current_user( self::$admin_id );

		// Navigate to a guaranteed 404 page so WP_Query correctly yields no global post,
		// rather than home_url() which populates $post via the Latest Posts loop.
		$this->go_to( '/?p=99999999' );

		$block_instance = $this->create_dummy_block_instance( array() );
		$result         = gutenberg_block_bindings_post_edit_url_callback( array(), $block_instance );

		$this->assertNull( $result );
	}

	/**
	 * Tests that the render block filter allows the block for authorized users.
	 */
	public function test_render_block_keeps_authorized_bound_block() {
		wp_set_current_user( self::$admin_id );

		$attrs          = array(
			'metadata' => array(
				'bindings' => array(
					'url' => array( 'source' => 'core/post-edit-url' ),
				),
			),
		);
		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ), 'core/button', $attrs );
		$original_html  = '<div class="wp-block-button"><a href="...">Edit</a></div>';

		$result = gutenberg_hide_post_edit_url_bound_blocks( $original_html, $block_instance->parsed_block, $block_instance );

		$this->assertSame( $original_html, $result );
	}

	/**
	 * Tests that the render block filter strips the block for unauthorized users.
	 */
	public function test_render_block_hides_unauthorized_bound_block() {
		wp_set_current_user( self::$subscriber_id );

		$attrs          = array(
			'metadata' => array(
				'bindings' => array(
					'url' => array( 'source' => 'core/post-edit-url' ),
				),
			),
		);
		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ), 'core/button', $attrs );
		$original_html  = '<div class="wp-block-button"><a href="#">Edit</a></div>';

		$result = gutenberg_hide_post_edit_url_bound_blocks( $original_html, $block_instance->parsed_block, $block_instance );

		$this->assertSame( '', $result, 'Filter should return empty string for unauthorized user.' );
	}

	/**
	 * Tests that the render block filter removes the wrapper if all buttons were stripped.
	 */
	public function test_render_block_removes_empty_buttons_wrapper() {
		wp_set_current_user( self::$subscriber_id );

		$attrs          = array( 'className' => 'wp-block-post-edit-link-wrapper' );
		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ), 'core/buttons', $attrs );

		$empty_wrapper_html = '<div class="wp-block-buttons wp-block-post-edit-link-wrapper"></div>';

		$result = gutenberg_hide_post_edit_url_bound_blocks( $empty_wrapper_html, $block_instance->parsed_block, $block_instance );

		$this->assertSame( '', $result, 'Filter should strip the wrapper if it contains no buttons.' );
	}

	/**
	 * Tests that the render block filter preserves the wrapper if it contains other buttons.
	 */
	public function test_render_block_keeps_buttons_wrapper_with_sibling() {
		wp_set_current_user( self::$subscriber_id );

		$attrs          = array( 'className' => 'wp-block-post-edit-link-wrapper' );
		$block_instance = $this->create_dummy_block_instance( array( 'postId' => self::$post_id ), 'core/buttons', $attrs );

		$wrapper_with_sibling = '<div class="wp-block-buttons wp-block-post-edit-link-wrapper"><div class="wp-block-button"><a href="/about">Read More</a></div></div>';

		$result = gutenberg_hide_post_edit_url_bound_blocks( $wrapper_with_sibling, $block_instance->parsed_block, $block_instance );

		$this->assertSame( $wrapper_with_sibling, $result, 'Filter should preserve the wrapper if other buttons exist inside it.' );
	}
}
