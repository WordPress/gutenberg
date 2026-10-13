<?php
/**
 * Unit tests covering the synced patterns controller's 7.2 changes.
 *
 * @package gutenberg
 *
 * @group rest-api
 */
class Gutenberg_REST_Blocks_Controller_7_2_Test extends WP_Test_REST_TestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $author_id;

	/**
	 * A published pattern the administrator made.
	 *
	 * @var int
	 */
	protected static $pattern_id;

	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );

		self::$pattern_id = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_author'  => self::$admin_id,
				'post_title'   => 'Admin pattern',
				'post_content' => '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$author_id );
	}

	/**
	 * Dispatches a request the way the server does, including the `Allow`
	 * header the editor reads permissions from.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response Response.
	 */
	private function dispatch( $request ) {
		$server = rest_get_server();
		return rest_send_allow_header( rest_ensure_response( $server->dispatch( $request ) ), $server, $request );
	}

	public function test_controller_is_registered() {
		$this->assertSame( 'Gutenberg_REST_Blocks_Controller_7_2', get_post_type_object( 'wp_block' )->rest_controller_class );
	}

	public function test_author_can_read_pattern_they_cannot_edit_in_edit_context() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$pattern_id );
		$request->set_param( 'context', 'edit' );
		$response = $this->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->', $response->get_data()['content']['raw'] );
	}

	public function test_allow_header_leaves_out_writes_for_read_only_pattern() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$pattern_id );
		$request->set_param( 'context', 'edit' );
		$allow = $this->dispatch( $request )->get_headers()['Allow'];

		$this->assertStringContainsString( 'GET', $allow );
		$this->assertStringNotContainsString( 'PUT', $allow );
		$this->assertStringNotContainsString( 'DELETE', $allow );
	}

	public function test_allow_header_includes_writes_for_editable_pattern() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$pattern_id );
		$request->set_param( 'context', 'edit' );

		$this->assertStringContainsString( 'PUT', $this->dispatch( $request )->get_headers()['Allow'] );
	}

	public function test_collection_includes_pattern_author_cannot_edit_in_edit_context() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks' );
		$request->set_param( 'context', 'edit' );
		$response = $this->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertContains( self::$pattern_id, wp_list_pluck( $response->get_data(), 'id' ) );
	}

	public function test_collection_target_hints_leave_out_writes_for_read_only_pattern() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks' );
		$request->set_param( 'context', 'edit' );
		$items = rest_get_server()->dispatch( $request )->get_data();
		$item  = $items[ array_search( self::$pattern_id, wp_list_pluck( $items, 'id' ), true ) ];

		$this->assertContains( 'GET', $item['_links']['self'][0]['targetHints']['allow'] );
		$this->assertNotContains( 'PUT', $item['_links']['self'][0]['targetHints']['allow'] );
	}

	/**
	 * Each item's target hints run the single-item read check, so a pattern
	 * the user can edit, listed first, must not end the read for the rest.
	 */
	public function test_collection_includes_read_only_pattern_after_editable_one() {
		wp_set_current_user( self::$author_id );
		$own_pattern_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_block',
				'post_status' => 'publish',
				'post_author' => self::$author_id,
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks' );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'orderby', 'id' );
		$ids = wp_list_pluck( rest_get_server()->dispatch( $request )->get_data(), 'id' );

		$this->assertSame( array( $own_pattern_id, self::$pattern_id ), $ids );
	}

	public function test_author_cannot_update_pattern_they_cannot_edit() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/blocks/' . self::$pattern_id );
		$request->set_param( 'title', 'Changed' );

		$this->assertErrorResponse( 'rest_cannot_edit', rest_get_server()->dispatch( $request ), 403 );
	}

	public function test_password_protected_pattern_still_requires_edit_permission() {
		$pattern_id = self::factory()->post->create(
			array(
				'post_type'     => 'wp_block',
				'post_status'   => 'publish',
				'post_author'   => self::$admin_id,
				'post_password' => 'secret',
			)
		);
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . $pattern_id );
		$request->set_param( 'context', 'edit' );

		$this->assertErrorResponse( 'rest_forbidden_context', rest_get_server()->dispatch( $request ), 403 );
	}

	public function test_user_who_cannot_read_patterns_cannot_use_edit_context() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/blocks/' . self::$pattern_id );
		$request->set_param( 'context', 'edit' );

		$this->assertSame( 403, rest_get_server()->dispatch( $request )->get_status() );
	}
}
