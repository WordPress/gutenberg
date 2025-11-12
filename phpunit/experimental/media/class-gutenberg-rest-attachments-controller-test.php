<?php

/**
 * @coversDefaultClass \Gutenberg_REST_Attachments_Controller
 */
class Gutenberg_REST_Attachments_Controller_Test extends WP_Test_REST_Post_Type_Controller_Testcase {
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

		$this->remove_added_uploads();
	}

	public function tear_down() {
		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/media', $routes );
		$this->assertCount( 2, $routes['/wp/v2/media'] );
		$this->assertArrayHasKey( '/wp/v2/media/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes['/wp/v2/media/(?P<id>[\d]+)'] );
		$this->assertArrayHasKey( '/wp/v2/media/(?P<id>[\d]+)/sideload', $routes );
		$this->assertCount( 1, $routes['/wp/v2/media/(?P<id>[\d]+)/sideload'] );
	}

	public function test_get_items() {
		$this->markTestSkipped( 'No need to implement' );
	}

	public function test_get_item() {
		$this->markTestSkipped( 'No need to implement' );
	}

	public function test_update_item() {
		$this->markTestSkipped( 'No need to implement' );
	}

	public function test_delete_item() {
		$this->markTestSkipped( 'No need to implement' );
	}

	public function test_get_item_schema() {
		$this->markTestSkipped( 'No need to implement' );
	}

	public function test_context_param() {
		$this->markTestSkipped( 'No need to implement' );
	}

	/**
	 * Verifies that skipping sub-size generation works.
	 *
	 * @covers ::create_item
	 * @covers ::create_item_permissions_check
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'title', 'My title is very cool' );
		$request->set_param( 'caption', 'This is a better caption.' );
		$request->set_param( 'description', 'Without a description, my attachment is descriptionless.' );
		$request->set_param( 'alt_text', 'Alt text is stored outside post schema.' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'image', $data['media_type'] );
		$this->assertArrayHasKey( 'missing_image_sizes', $data );
		$this->assertNotEmpty( $data['missing_image_sizes'] );
	}

	/**
	 * Verifies that skipping sub-size generation works.
	 *
	 * @covers ::create_item
	 * @covers ::create_item_permissions_check
	 */
	public function test_create_item_insert_additional_metadata() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'title', 'My title is very cool' );
		$request->set_param( 'caption', 'This is a better caption.' );
		$request->set_param( 'description', 'Without a description, my attachment is descriptionless.' );
		$request->set_param( 'alt_text', 'Alt text is stored outside post schema.' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );

		remove_filter( 'wp_generate_attachment_metadata', '__return_empty_array', 1 );

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();

		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'image_meta', $data['media_details'] );
	}

	public function test_prepare_item() {
		$this->markTestSkipped( 'No need to implement' );
	}

	/**
	 * @covers ::prepare_item_for_response
	 */
	public function test_prepare_item_lists_missing_image_sizes_for_pdfs() {
		wp_set_current_user( self::$admin_id );

		$attachment_id = self::factory()->attachment->create_object(
			DIR_TESTDATA . '/images/test-alpha.pdf',
			0,
			array(
				'post_mime_type' => 'application/pdf',
				'post_excerpt'   => 'A sample caption',
			)
		);

		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $attachment_id ) );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'missing_image_sizes', $data );
		$this->assertNotEmpty( $data['missing_image_sizes'] );
		$this->assertArrayHasKey( 'filename', $data );
		$this->assertArrayHasKey( 'filesize', $data );
	}

	/**
	 * @covers ::sideload_item
	 * @covers ::sideload_item_permissions_check
	 */
	public function test_sideload_item() {
		wp_set_current_user( self::$admin_id );

		$attachment_id = self::factory()->attachment->create_object(
			DIR_TESTDATA . '/images/canola.jpg',
			0,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_excerpt'   => 'A sample caption',
			)
		);

		wp_update_attachment_metadata(
			$attachment_id,
			wp_generate_attachment_metadata( $attachment_id, DIR_TESTDATA . '/images/canola.jpg' )
		);

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-777x777.jpg' );
		$request->set_param( 'image_size', 'medium' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'image', $data['media_type'] );
		$this->assertArrayHasKey( 'missing_image_sizes', $data );
		$this->assertEmpty( $data['missing_image_sizes'] );
		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'medium', $data['media_details']['sizes'] );
		$this->assertArrayHasKey( 'file', $data['media_details']['sizes']['medium'] );
		$this->assertSame( 'canola-777x777.jpg', $data['media_details']['sizes']['medium']['file'] );
	}

	/**
	 * @covers ::sideload_item
	 * @covers ::sideload_item_permissions_check
	 */
	public function test_sideload_item_year_month_based_folders() {
		if ( version_compare( get_bloginfo( 'version' ), '6.6-beta1', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 6.6+' );
		}

		update_option( 'uploads_use_yearmonth_folders', 1 );

		wp_set_current_user( self::$admin_id );

		$published_post = self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_date'     => '2017-02-14 00:00:00',
				'post_date_gmt' => '2017-02-14 00:00:00',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-year-month.jpg' );
		$request->set_param( 'post', $published_post );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$attachment_id = $data['id'];

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-year-month-777x777.jpg' );
		$request->set_param( 'image_size', 'medium' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		update_option( 'uploads_use_yearmonth_folders', 0 );

		$this->assertSame( 200, $response->get_status() );

		$attachment = get_post( $data['id'] );

		$this->assertSame( $attachment->post_parent, $data['post'] );
		$this->assertSame( $attachment->post_parent, $published_post );
		$this->assertSame( wp_get_attachment_url( $attachment->ID ), $data['source_url'] );
		$this->assertStringContainsString( '2017/02', $data['source_url'] );
	}

	/**
	 * @covers ::sideload_item
	 * @covers ::sideload_item_permissions_check
	 */
	public function test_sideload_item_year_month_based_folders_page_post_type() {
		if ( version_compare( get_bloginfo( 'version' ), '6.6-beta1', '<' ) ) {
			$this->markTestSkipped( 'This test requires WordPress 6.6+' );
		}

		update_option( 'uploads_use_yearmonth_folders', 1 );

		wp_set_current_user( self::$admin_id );

		$published_post = self::factory()->post->create(
			array(
				'post_type'     => 'page',
				'post_status'   => 'publish',
				'post_date'     => '2017-02-14 00:00:00',
				'post_date_gmt' => '2017-02-14 00:00:00',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-year-month-page.jpg' );
		$request->set_param( 'post', $published_post );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$attachment_id = $data['id'];

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-year-month-page-777x777.jpg' );
		$request->set_param( 'image_size', 'medium' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		update_option( 'uploads_use_yearmonth_folders', 0 );

		$time   = current_time( 'mysql' );
		$y      = substr( $time, 0, 4 );
		$m      = substr( $time, 5, 2 );
		$subdir = "/$y/$m";

		$this->assertSame( 200, $response->get_status() );

		$attachment = get_post( $data['id'] );

		$this->assertSame( $attachment->post_parent, $data['post'] );
		$this->assertSame( $attachment->post_parent, $published_post );
		$this->assertSame( wp_get_attachment_url( $attachment->ID ), $data['source_url'] );
		$this->assertStringNotContainsString( '2017/02', $data['source_url'] );
		$this->assertStringContainsString( $subdir, $data['source_url'] );
	}
}
