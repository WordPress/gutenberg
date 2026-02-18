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

	/**
	 * Verifies that exif_orientation field is returned in REST API response.
	 *
	 * @covers ::prepare_item_for_response
	 * @covers ::get_item_schema
	 */
	public function test_exif_orientation_field_returned_in_response() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'exif_orientation', $data );
		// canola.jpg has no EXIF orientation, so it should default to 1.
		$this->assertSame( 1, $data['exif_orientation'] );
	}

	/**
	 * Verifies that exif_orientation field is returned for image with non-1 orientation.
	 *
	 * Uses test-image-upside-down.jpg which has EXIF orientation value 3 (180° rotation).
	 *
	 * @covers ::prepare_item_for_response
	 * @covers ::create_item
	 * @requires extension exif
	 */
	public function test_exif_orientation_returned_for_rotated_image() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=test-image-upside-down.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image-upside-down.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'exif_orientation', $data );
		// test-image-upside-down.jpg has EXIF orientation 3 (180° rotation).
		$this->assertSame( 3, $data['exif_orientation'] );
	}

	/**
	 * Verifies that server-side EXIF rotation is disabled when generate_sub_sizes is false.
	 *
	 * When client-side processing is enabled (generate_sub_sizes=false), the server should
	 * NOT rotate the image based on EXIF orientation. The original orientation value should
	 * be preserved in metadata so the client can handle rotation.
	 *
	 * @covers ::create_item
	 * @requires extension exif
	 */
	public function test_server_side_exif_rotation_disabled_for_client_side_processing() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=test-image-upside-down.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image-upside-down.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );

		// Get the attachment metadata directly from the database.
		$metadata = wp_get_attachment_metadata( $data['id'], true );

		// The orientation should still be 3 (not reset to 1) because server-side rotation was disabled.
		$this->assertArrayHasKey( 'image_meta', $metadata );
		$this->assertArrayHasKey( 'orientation', $metadata['image_meta'] );
		$this->assertSame( '3', $metadata['image_meta']['orientation'] );

		// The exif_orientation in the REST response should also be 3.
		$this->assertSame( 3, $data['exif_orientation'] );
	}

	/**
	 * Verifies that full EXIF metadata is extracted and stored during client-side upload flow.
	 *
	 * Uses 2004-07-22-DSC_0008.jpg which has rich EXIF data from a Nikon D70 camera.
	 *
	 * @covers ::create_item
	 * @covers ::prepare_item_for_response
	 * @requires extension exif
	 */
	public function test_full_exif_metadata_extracted_for_client_side_upload() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=2004-07-22-DSC_0008.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/2004-07-22-DSC_0008.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'media_details', $data );
		$this->assertArrayHasKey( 'image_meta', $data['media_details'] );

		$image_meta = $data['media_details']['image_meta'];

		// Verify the full EXIF data is extracted (same data as server-side upload).
		$this->assertSame( '6.3', $image_meta['aperture'] );
		$this->assertSame( 'NIKON D70', $image_meta['camera'] );
		$this->assertSame( '27', $image_meta['focal_length'] );
		$this->assertSame( '400', $image_meta['iso'] );
		// Verify timestamp is set (Nikon D70 image has created_timestamp).
		$this->assertNotEmpty( $image_meta['created_timestamp'] );
	}

	/**
	 * Verifies that EXIF metadata with IPTC data is extracted correctly.
	 *
	 * Uses 2004-07-22-DSC_0007.jpg which has both EXIF and IPTC data.
	 *
	 * @covers ::create_item
	 * @covers ::prepare_item_for_response
	 * @requires extension exif
	 */
	public function test_exif_and_iptc_metadata_extracted() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=2004-07-22-DSC_0007.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/2004-07-22-DSC_0007.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );

		$image_meta = $data['media_details']['image_meta'];

		// Verify EXIF data from camera.
		$this->assertSame( '6.3', $image_meta['aperture'] );
		$this->assertSame( 'NIKON D70', $image_meta['camera'] );
		$this->assertSame( '18', $image_meta['focal_length'] );
		$this->assertSame( '200', $image_meta['iso'] );

		// Verify IPTC data.
		$this->assertSame( 'IPTC Creator', $image_meta['credit'] );
		$this->assertSame( 'IPTC Caption', $image_meta['caption'] );
		$this->assertSame( 'IPTC Copyright', $image_meta['copyright'] );
		$this->assertSame( 'IPTC Headline', $image_meta['title'] );
	}

	/**
	 * Verifies that sideloading sub-sizes preserves the original image_meta.
	 *
	 * @covers ::sideload_item
	 * @requires extension exif
	 */
	public function test_sideload_preserves_image_meta() {
		wp_set_current_user( self::$admin_id );

		// First, upload an image with EXIF data using client-side upload flow.
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=2004-07-22-DSC_0008.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/2004-07-22-DSC_0008.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		// Record the original image_meta.
		$original_image_meta = $data['media_details']['image_meta'];

		// Now sideload a sub-size.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=2004-07-22-DSC_0008-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// Use a smaller image for the sub-size (dimensions don't matter for this test).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Verify the image_meta is preserved after sideloading.
		$this->assertArrayHasKey( 'image_meta', $data['media_details'] );
		$sideloaded_image_meta = $data['media_details']['image_meta'];

		// The EXIF data should be unchanged.
		$this->assertSame( $original_image_meta['aperture'], $sideloaded_image_meta['aperture'] );
		$this->assertSame( $original_image_meta['camera'], $sideloaded_image_meta['camera'] );
		$this->assertSame( $original_image_meta['focal_length'], $sideloaded_image_meta['focal_length'] );
		$this->assertSame( $original_image_meta['iso'], $sideloaded_image_meta['iso'] );
	}

	/**
	 * Verifies that sideloaded sub-sizes include expected metadata fields.
	 *
	 * Sub-sizes should have file, width, height, mime_type, and filesize in their metadata.
	 *
	 * @covers ::sideload_item
	 */
	public function test_sideloaded_subsize_has_complete_metadata() {
		wp_set_current_user( self::$admin_id );

		$attachment_id = self::factory()->attachment->create_object(
			DIR_TESTDATA . '/images/canola.jpg',
			0,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);

		wp_update_attachment_metadata(
			$attachment_id,
			wp_generate_attachment_metadata( $attachment_id, DIR_TESTDATA . '/images/canola.jpg' )
		);

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-300x200.jpg' );
		$request->set_param( 'image_size', 'medium' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'sizes', $data['media_details'] );
		$this->assertArrayHasKey( 'medium', $data['media_details']['sizes'] );

		$medium_size = $data['media_details']['sizes']['medium'];

		// Verify all expected metadata fields are present for the sub-size.
		$this->assertArrayHasKey( 'file', $medium_size );
		$this->assertArrayHasKey( 'width', $medium_size );
		$this->assertArrayHasKey( 'height', $medium_size );
		$this->assertArrayHasKey( 'mime_type', $medium_size );
		$this->assertArrayHasKey( 'filesize', $medium_size );

		$this->assertSame( 'canola-300x200.jpg', $medium_size['file'] );
		$this->assertSame( 'image/jpeg', $medium_size['mime_type'] );
		$this->assertGreaterThan( 0, $medium_size['filesize'] );
	}

	/**
	 * Verifies that exif_orientation is in the schema for images.
	 *
	 * @covers ::get_item_schema
	 */
	public function test_exif_orientation_in_schema() {
		$controller = new Gutenberg_REST_Attachments_Controller( 'attachment' );
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'exif_orientation', $schema['properties'] );
		$this->assertSame( 'integer', $schema['properties']['exif_orientation']['type'] );
		$this->assertContains( 'edit', $schema['properties']['exif_orientation']['context'] );
		$this->assertTrue( $schema['properties']['exif_orientation']['readonly'] );
	}

	/**
	 * Verifies metadata consistency between server-side and client-side upload flows.
	 *
	 * The same image uploaded with server-side processing (generate_sub_sizes=true)
	 * should have the same image_meta as when uploaded with client-side processing
	 * (generate_sub_sizes=false).
	 *
	 * @covers ::create_item
	 * @requires extension exif
	 */
	public function test_metadata_consistency_between_upload_flows() {
		wp_set_current_user( self::$admin_id );

		// Upload with server-side processing (default).
		$request_server = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request_server->set_header( 'Content-Type', 'image/jpeg' );
		$request_server->set_header( 'Content-Disposition', 'attachment; filename=server-side-upload.jpg' );
		$request_server->set_param( 'generate_sub_sizes', true );

		$request_server->set_body( file_get_contents( DIR_TESTDATA . '/images/2004-07-22-DSC_0008.jpg' ) );
		$response_server = rest_get_server()->dispatch( $request_server );
		$data_server     = $response_server->get_data();

		// Upload with client-side processing.
		$request_client = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request_client->set_header( 'Content-Type', 'image/jpeg' );
		$request_client->set_header( 'Content-Disposition', 'attachment; filename=client-side-upload.jpg' );
		$request_client->set_param( 'generate_sub_sizes', false );

		$request_client->set_body( file_get_contents( DIR_TESTDATA . '/images/2004-07-22-DSC_0008.jpg' ) );
		$response_client = rest_get_server()->dispatch( $request_client );
		$data_client     = $response_client->get_data();

		$this->assertSame( 201, $response_server->get_status() );
		$this->assertSame( 201, $response_client->get_status() );

		$meta_server = $data_server['media_details']['image_meta'];
		$meta_client = $data_client['media_details']['image_meta'];

		// The core EXIF fields should be identical.
		$this->assertSame( $meta_server['aperture'], $meta_client['aperture'] );
		$this->assertSame( $meta_server['camera'], $meta_client['camera'] );
		$this->assertSame( $meta_server['focal_length'], $meta_client['focal_length'] );
		$this->assertSame( $meta_server['iso'], $meta_client['iso'] );
		$this->assertSame( $meta_server['shutter_speed'], $meta_client['shutter_speed'] );
		$this->assertSame( $meta_server['created_timestamp'], $meta_client['created_timestamp'] );
	}
}
