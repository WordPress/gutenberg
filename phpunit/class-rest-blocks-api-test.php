<?php
/**
 * WP_REST_BlockAPI tests.
 *
 * @package gutenberg
 */

/**
 * Tests for WP_REST_BlockAPI.
 */
class WP_REST_BlockAPI_Test extends WP_UnitTestCase {

	/**
	 * Our fake reusable block's post ID.
	 *
	 * @var int
	 */
	protected static $test_block_post_id;

	/**
	 * Our fake reusable block's post ID.
	 *
	 * @var int
	 */
	protected static $demo_post_content;

	/**
	 * Our fake editor's user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server;
		do_action( 'rest_api_init' );

		self::$demo_post_content = file_get_contents(
			dirname( __FILE__ ) . '/fixtures/long-content.html'
		);

		self::$test_block_post_id = wp_insert_post( array(
			'post_type'    => 'post',
			'post_status'  => 'publish',
			'post_name'    => 'gutenberg-block-test',
			'post_title'   => 'My cool block',
			'post_content' => self::$demo_post_content,
		) );

		self::$editor_id = $factory->user->create( array(
			'role' => 'editor',
		) );
	}

	/**
	 * Delete our fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$test_block_post_id );

		self::delete_user( self::$editor_id );
	}

	/**
	 * Check that we can GET blocks from a post request.
	 */
	public function test_get_items() {
		global $wp_rest_server;
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$test_block_post_id );
		$this->assertNotEquals( null, $request );

		$response = $wp_rest_server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$response->get_data();

		$blocks = isset( $response->data['content']['blocks'] ) ? $response->data['content']['blocks'] : false;

		$first_block_url_attribute = wp_unslash( $blocks[0]['attributes']['url'] );
		$first_block_type          = wp_unslash( $blocks[0]['type'] );

		$this->assertEquals( count( $blocks ), 43, 'The demo post content api call should contain 43 blocks.' );
		$this->assertEquals( 'https://cldup.com/GCwahb3aOb.jpg', $first_block_url_attribute, 'Block attributes should be returned correctly.' );
		$this->assertEquals( 'core/cover-image', $first_block_type, 'Block type should be returned correctly.' );
	}

}
