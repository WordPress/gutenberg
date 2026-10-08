<?php
/**
 * Tests for the media usage detection.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_Media_Usage
 */

class Gutenberg_Media_Usage_Test extends WP_UnitTestCase {

	/**
	 * @var int Administrator ID.
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
		Gutenberg_Media_Usage::flush_cache();
	}

	/**
	 * Creates an attachment from a fixture image.
	 *
	 * @return int Attachment ID.
	 */
	private function create_attachment() {
		return self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg'
		);
	}

	public function test_attachment_with_no_references_is_unused() {
		$attachment_id = $this->create_attachment();

		$this->assertFalse( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_attachment_referenced_by_block_id_is_used() {
		$attachment_id = $this->create_attachment();

		self::factory()->post->create(
			array(
				'post_content' => "<!-- wp:image {\"id\":{$attachment_id}} --><figure></figure><!-- /wp:image -->",
			)
		);

		$this->assertTrue( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_attachment_referenced_by_wp_image_class_is_used() {
		$attachment_id = $this->create_attachment();

		self::factory()->post->create(
			array(
				'post_content' => "<img class=\"wp-image-{$attachment_id}\" src=\"...\" />",
			)
		);

		$this->assertTrue( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_attachment_referenced_by_gallery_ids_is_used() {
		$attachment_id = $this->create_attachment();

		self::factory()->post->create(
			array(
				'post_content' => "<!-- wp:gallery {\"ids\":[{$attachment_id}]} --><!-- /wp:gallery -->",
			)
		);

		$this->assertTrue( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_non_media_id_attribute_is_not_mistaken_for_an_attachment() {
		$attachment_id = $this->create_attachment();

		// `core/navigation-link` stores a post or term ID in its `id` attribute,
		// not an attachment ID. Even when the number coincides with an existing
		// attachment, it must not count as a reference to it.
		self::factory()->post->create(
			array(
				'post_content' => "<!-- wp:navigation-link {\"id\":{$attachment_id},\"url\":\"https://example.com\"} /-->",
			)
		);

		$this->assertFalse( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_attachment_used_as_featured_image_is_used() {
		$attachment_id = $this->create_attachment();
		$post_id       = self::factory()->post->create();

		set_post_thumbnail( $post_id, $attachment_id );

		$this->assertTrue( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_attachment_used_as_site_logo_is_used() {
		$attachment_id = $this->create_attachment();

		update_option( 'site_logo', $attachment_id );

		$this->assertTrue( Gutenberg_Media_Usage::is_used( $attachment_id ) );
	}

	public function test_collection_params_are_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( 'used', $routes['/wp/v2/media'][0]['args'] );
		$this->assertSame( 'boolean', $routes['/wp/v2/media'][0]['args']['used']['type'] );
		$this->assertArrayHasKey( 'include_used', $routes['/wp/v2/media'][0]['args'] );
	}

	public function test_query_filter_used_false_excludes_used_attachments() {
		$used_id   = $this->create_attachment();
		$unused_id = $this->create_attachment();

		self::factory()->post->create(
			array(
				'post_content' => "<!-- wp:image {\"id\":{$used_id}} --><!-- /wp:image -->",
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'used', false );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$ids = wp_list_pluck( $response->get_data(), 'id' );

		$this->assertContains( $unused_id, $ids );
		$this->assertNotContains( $used_id, $ids );
	}

	public function test_query_filter_used_true_includes_only_used_attachments() {
		$used_id   = $this->create_attachment();
		$unused_id = $this->create_attachment();

		self::factory()->post->create(
			array(
				'post_content' => "<!-- wp:image {\"id\":{$used_id}} --><!-- /wp:image -->",
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'used', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$ids = wp_list_pluck( $response->get_data(), 'id' );

		$this->assertContains( $used_id, $ids );
		$this->assertNotContains( $unused_id, $ids );
	}

	public function test_rest_field_reports_used_state_when_requested() {
		$attachment_id = $this->create_attachment();

		self::factory()->post->create(
			array(
				'post_content' => "<!-- wp:image {\"id\":{$attachment_id}} --><!-- /wp:image -->",
			)
		);

		$request = new WP_REST_Request( 'GET', "/wp/v2/media/{$attachment_id}" );
		$request->set_param( 'include_used', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['used'] );
	}

	public function test_rest_field_is_null_when_usage_not_requested() {
		$attachment_id = $this->create_attachment();

		$request  = new WP_REST_Request( 'GET', "/wp/v2/media/{$attachment_id}" );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( $response->get_data()['used'] );
	}
}
