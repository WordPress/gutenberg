<?php
/**
 * Tests for the `action-set-homepage` and `action-set-posts-page` links on
 * page REST responses.
 *
 * @package gutenberg
 */

/**
 * @group restapi
 *
 * @covers ::gutenberg_add_page_homepage_action_links
 */
class Gutenberg_REST_Homepage_Action_Links_Test extends WP_Test_REST_TestCase {

	const RELS = array(
		'https://api.w.org/action-set-homepage',
		'https://api.w.org/action-set-posts-page',
	);

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user ID (lacks `manage_options`).
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Published page ID.
	 *
	 * @var int
	 */
	protected static $page_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$page_id   = $factory->post->create( array( 'post_type' => 'page' ) );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Returns the links of the REST response of a post.
	 *
	 * @param string $route  REST route.
	 * @param array  $params Query parameters.
	 * @return array Response links.
	 */
	private function get_links( $route, $params = array( 'context' => 'edit' ) ) {
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_query_params( $params );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status(), 'The request should succeed.' );

		return $response->get_links();
	}

	/**
	 * Asserts that the links include both relations, once each.
	 *
	 * @param array $links Response links.
	 */
	private function assert_has_links( $links ) {
		foreach ( self::RELS as $rel ) {
			$this->assertArrayHasKey( $rel, $links, "The $rel link should be present." );
			$this->assertCount( 1, $links[ $rel ], "The $rel link should be added once." );
		}
	}

	/**
	 * Asserts that the links include neither relation.
	 *
	 * @param array $links Response links.
	 */
	private function assert_has_no_links( $links ) {
		foreach ( self::RELS as $rel ) {
			$this->assertArrayNotHasKey( $rel, $links, "The $rel link should be absent." );
		}
	}

	public function test_published_page_has_the_links() {
		$links = $this->get_links( '/wp/v2/pages/' . self::$page_id );

		$this->assert_has_links( $links );
		$this->assertSame( $links['self'][0]['href'], $links[ self::RELS[0] ][0]['href'], 'The link should target the page.' );
	}

	public function test_page_has_no_links_in_view_context() {
		$this->assert_has_no_links( $this->get_links( '/wp/v2/pages/' . self::$page_id, array( 'context' => 'view' ) ) );
	}

	public function test_draft_page_has_no_links() {
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
			)
		);

		$this->assert_has_no_links( $this->get_links( '/wp/v2/pages/' . $page_id ) );
	}

	public function test_homepage_has_no_links() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::$page_id );

		$this->assert_has_no_links( $this->get_links( '/wp/v2/pages/' . self::$page_id ) );
	}

	public function test_posts_page_has_no_links() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', self::$page_id );

		$this->assert_has_no_links( $this->get_links( '/wp/v2/pages/' . self::$page_id ) );
	}

	public function test_other_pages_keep_the_links() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::$page_id );

		$this->assert_has_links( $this->get_links( '/wp/v2/pages/' . $page_id ) );
	}

	public function test_page_has_no_links_when_user_cannot_manage_options() {
		wp_set_current_user( self::$editor_id );

		$this->assert_has_no_links( $this->get_links( '/wp/v2/pages/' . self::$page_id ) );
	}

	public function test_post_has_no_links() {
		$post_id = self::factory()->post->create();

		$this->assert_has_no_links( $this->get_links( '/wp/v2/posts/' . $post_id ) );
	}

	public function test_links_added_by_core_are_kept() {
		// Mirrors WordPress 7.2, which adds the links in `get_available_actions()`.
		add_filter(
			'rest_prepare_page',
			static function ( $response ) {
				$links = $response->get_links();
				foreach ( self::RELS as $rel ) {
					if ( ! isset( $links[ $rel ] ) ) {
						$response->add_link( $rel, $links['self'][0]['href'] );
					}
				}
				return $response;
			},
			9
		);

		$this->assert_has_links( $this->get_links( '/wp/v2/pages/' . self::$page_id ) );
	}

	public function test_pages_in_a_collection_have_the_links() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/pages' );
		$request->set_query_params(
			array(
				'context' => 'edit',
				'include' => array( self::$page_id ),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = rest_get_server()->response_to_data( $response, false );

		$this->assertCount( 1, $data, 'The page should be listed.' );
		$this->assertArrayHasKey( 'wp:action-set-homepage', $data[0]['_links'], 'The link should be compacted as `wp:action-set-homepage`.' );
		$this->assertArrayHasKey( 'wp:action-set-posts-page', $data[0]['_links'], 'The link should be compacted as `wp:action-set-posts-page`.' );
	}
}
