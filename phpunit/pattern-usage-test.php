<?php
/**
 * Unit tests covering the pattern usage endpoint.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_get_pattern_usage
 */
class Gutenberg_Pattern_Usage_Test extends WP_Test_REST_TestCase {

	protected static $admin_id;
	protected static $subscriber_id;
	protected static $pattern_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );

		self::$pattern_id = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_title'   => 'Joe testimonial',
				'post_content' => '<!-- wp:paragraph -->A testimonial.<!-- /wp:paragraph -->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$pattern_id, true );
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Dispatches a request for the pattern created for this test class.
	 *
	 * @param int|null $pattern_id Pattern to look up. Defaults to the test pattern.
	 * @return WP_REST_Response The response.
	 */
	private function get_usage( $pattern_id = null ) {
		$pattern_id = null === $pattern_id ? self::$pattern_id : $pattern_id;

		return rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wp/v2/blocks/' . $pattern_id . '/usage' )
		);
	}

	/**
	 * Returns the entry IDs the response reports for a given post type.
	 *
	 * @param WP_REST_Response $response The response.
	 * @param string           $type     Post type name.
	 * @return int[] The reported IDs.
	 */
	private function get_reported_ids( $response, $type ) {
		foreach ( $response->get_data()['groups'] as $group ) {
			if ( $type === $group['type'] ) {
				return wp_list_pluck( $group['items'], 'id' );
			}
		}

		return array();
	}

	public function test_reports_entries_grouped_by_post_type() {
		wp_set_current_user( self::$admin_id );

		$page = self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_title'   => 'About',
				'post_content' => '<!-- wp:block {"ref":' . self::$pattern_id . '} /-->',
			)
		);
		// Nested inside another block, and with sibling attributes.
		$post = self::factory()->post->create(
			array(
				'post_content' => '<!-- wp:group --><!-- wp:block {"align":"wide","ref":' . self::$pattern_id . '} /--><!-- /wp:group -->',
			)
		);

		$response = $this->get_usage();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 2, $response->get_data()['total'] );
		$this->assertSame( array( $page ), $this->get_reported_ids( $response, 'page' ) );
		$this->assertSame( array( $post ), $this->get_reported_ids( $response, 'post' ) );
	}

	public function test_reports_templates() {
		wp_set_current_user( self::$admin_id );

		$template = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_title'   => 'Single Posts',
				'post_content' => '<!-- wp:block {"ref":' . self::$pattern_id . '} /-->',
			)
		);

		$response = $this->get_usage();

		$this->assertSame( array( $template ), $this->get_reported_ids( $response, 'wp_template' ) );
	}

	public function test_ignores_a_reference_to_another_pattern() {
		wp_set_current_user( self::$admin_id );

		// `"ref":12` is a substring of `"ref":123`, so the database search
		// matches this post even though it references another pattern.
		self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_content' => '<!-- wp:block {"ref":' . self::$pattern_id . '0} /-->',
			)
		);

		$response = $this->get_usage();

		$this->assertSame( 0, $response->get_data()['total'] );
	}

	public function test_ignores_the_ref_attribute_of_other_blocks() {
		wp_set_current_user( self::$admin_id );

		// `core/navigation` points at a `wp_navigation` post with an attribute
		// of the same name.
		self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_content' => '<!-- wp:navigation {"ref":' . self::$pattern_id . '} /-->',
			)
		);

		$response = $this->get_usage();

		$this->assertSame( 0, $response->get_data()['total'] );
	}

	public function test_ignores_trashed_entries() {
		wp_set_current_user( self::$admin_id );

		$page = self::factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_content' => '<!-- wp:block {"ref":' . self::$pattern_id . '} /-->',
			)
		);
		wp_trash_post( $page );

		$response = $this->get_usage();

		$this->assertSame( 0, $response->get_data()['total'] );
	}

	public function test_reports_no_usage_for_an_unused_pattern() {
		wp_set_current_user( self::$admin_id );

		$response = $this->get_usage();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $response->get_data()['total'] );
		$this->assertSame( array(), $response->get_data()['groups'] );
	}

	public function test_requires_permission_to_edit_the_pattern() {
		wp_set_current_user( self::$subscriber_id );

		$this->assertErrorResponse( 'rest_cannot_read_pattern_usage', $this->get_usage(), 403 );
	}

	public function test_returns_404_for_a_post_that_is_not_a_pattern() {
		wp_set_current_user( self::$admin_id );

		$page = self::factory()->post->create( array( 'post_type' => 'page' ) );

		$this->assertErrorResponse( 'rest_post_invalid_id', $this->get_usage( $page ), 404 );
	}
}
