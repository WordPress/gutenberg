<?php
/**
 * Tests for Gutenberg_REST_Attachments_Controller.
 *
 * Tests the REST API controller for media attachments which provides
 * client-side media processing functionality including sideload support
 * and sub-size generation control.
 */

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
		// Core may already register the sideload route; Gutenberg only adds it when core doesn't have it.
		$this->assertGreaterThanOrEqual( 1, count( $routes['/wp/v2/media/(?P<id>[\d]+)/sideload'] ) );
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
	 * Verifies that the permissions check bypasses the image editor support check
	 * when generate_sub_sizes is false (client handles processing).
	 *
	 * Tests the permissions check directly with file params set, since the core
	 * check uses get_file_params() which is only populated for multipart uploads.
	 *
	 * @covers ::create_item_permissions_check
	 */
	public function test_create_item_skips_image_editor_support_check_when_not_generating_sub_sizes() {
		wp_set_current_user( self::$admin_id );

		// Remove all image editors so wp_image_editor_supports() returns false.
		add_filter( 'wp_image_editors', '__return_empty_array' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_file_params(
			array(
				'file' => array(
					'name'     => 'canola.jpg',
					'type'     => 'image/jpeg',
					'tmp_name' => DIR_TESTDATA . '/images/canola.jpg',
					'error'    => 0,
					'size'     => filesize( DIR_TESTDATA . '/images/canola.jpg' ),
				),
			)
		);
		$request->set_param( 'generate_sub_sizes', false );

		$controller = new Gutenberg_REST_Attachments_Controller( 'attachment' );
		$result     = $controller->create_item_permissions_check( $request );

		// Should pass because the bypass filter was applied (client handles processing).
		$this->assertTrue( $result );
	}

	/**
	 * Verifies that the permissions check still enforces the image editor support check
	 * when generate_sub_sizes is true (server handles processing).
	 *
	 * Tests the permissions check directly with file params set, since the core
	 * check uses get_file_params() which is only populated for multipart uploads.
	 *
	 * @covers ::create_item_permissions_check
	 */
	public function test_create_item_enforces_image_editor_support_check_when_generating_sub_sizes() {
		wp_set_current_user( self::$admin_id );

		// Remove all image editors so wp_image_editor_supports() returns false.
		add_filter( 'wp_image_editors', '__return_empty_array' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_file_params(
			array(
				'file' => array(
					'name'     => 'canola.jpg',
					'type'     => 'image/jpeg',
					'tmp_name' => DIR_TESTDATA . '/images/canola.jpg',
					'error'    => 0,
					'size'     => filesize( DIR_TESTDATA . '/images/canola.jpg' ),
				),
			)
		);
		// Explicitly set generate_sub_sizes since defaults aren't applied outside REST dispatch.
		$request->set_param( 'generate_sub_sizes', true );

		$controller = new Gutenberg_REST_Attachments_Controller( 'attachment' );
		$result     = $controller->create_item_permissions_check( $request );

		// Should fail because the server needs to generate sub-sizes but can't.
		$this->assertWPError( $result );
		$this->assertSame( 'rest_upload_image_type_not_supported', $result->get_error_code() );
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

		// Upload with client-side processing (no server-generated sub-sizes).
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=sideload-test.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$attachment_id = $response->get_data()['id'];

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=sideload-test-777x777.jpg' );
		$request->set_param( 'image_size', 'medium' );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints (150x150 max).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Sideload now returns sub-size data instead of a full attachment.
		$this->assertSame( 'medium', $data['image_size'] );
		$this->assertSame( 'sideload-test-777x777.jpg', $data['file'] );
		$this->assertSame( 'image/jpeg', $data['mime_type'] );
		$this->assertArrayHasKey( 'width', $data );
		$this->assertArrayHasKey( 'height', $data );
		$this->assertArrayHasKey( 'filesize', $data );
		$this->assertGreaterThan( 0, $data['width'] );
		$this->assertGreaterThan( 0, $data['height'] );
		$this->assertGreaterThan( 0, $data['filesize'] );

		// Sideload should NOT have written metadata — that happens in finalize.
		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertArrayNotHasKey( 'medium', $metadata['sizes'] ?? array(), 'Sideload should not write metadata; finalize does.' );
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
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-year-month-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints.
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		update_option( 'uploads_use_yearmonth_folders', 0 );

		$this->assertSame( 200, $response->get_status() );

		// Sideload returns sub-size data; verify the file was saved correctly.
		$this->assertSame( 'thumbnail', $data['image_size'] );
		$this->assertSame( 'canola-year-month-150x150.jpg', $data['file'] );

		// Verify the sideloaded file was placed in the parent post's year/month folder.
		$attachment     = get_post( $attachment_id );
		$attachment_url = wp_get_attachment_url( $attachment->ID );
		$this->assertSame( $attachment->post_parent, $published_post );
		$this->assertStringContainsString( '2017/02', $attachment_url );
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
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-year-month-page-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints.
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		update_option( 'uploads_use_yearmonth_folders', 0 );

		$time   = current_time( 'mysql' );
		$y      = substr( $time, 0, 4 );
		$m      = substr( $time, 5, 2 );
		$subdir = "/$y/$m";

		$this->assertSame( 200, $response->get_status() );

		// Sideload returns sub-size data.
		$this->assertSame( 'thumbnail', $data['image_size'] );

		// Verify the file is in the current year/month folder (not the page's post date).
		$attachment     = get_post( $attachment_id );
		$attachment_url = wp_get_attachment_url( $attachment->ID );
		$this->assertSame( $attachment->post_parent, $published_post );
		$this->assertStringNotContainsString( '2017/02', $attachment_url );
		$this->assertStringContainsString( $subdir, $attachment_url );
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
	 * Verifies that sideloading sub-sizes does not modify existing image_meta.
	 *
	 * Since sideload no longer writes metadata, the image_meta should remain
	 * untouched in the database after a sideload.
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

		// Record the original metadata.
		$original_metadata = wp_get_attachment_metadata( $attachment_id, true );

		// Now sideload a sub-size.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=2004-07-22-DSC_0008-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints (150x150 max).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		// Verify the metadata is untouched — sideload should not write metadata.
		$metadata_after = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertSame( $original_metadata['image_meta'], $metadata_after['image_meta'] );
		$this->assertArrayNotHasKey( 'thumbnail', $metadata_after['sizes'] ?? array() );
	}

	/**
	 * Verifies that sideload response includes all expected sub-size data fields.
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
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints (150x150 max).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Verify all expected sub-size data fields are present.
		$this->assertArrayHasKey( 'image_size', $data );
		$this->assertArrayHasKey( 'file', $data );
		$this->assertArrayHasKey( 'width', $data );
		$this->assertArrayHasKey( 'height', $data );
		$this->assertArrayHasKey( 'mime_type', $data );
		$this->assertArrayHasKey( 'filesize', $data );

		$this->assertSame( 'thumbnail', $data['image_size'] );
		$this->assertSame( 'canola-150x150.jpg', $data['file'] );
		$this->assertSame( 'image/jpeg', $data['mime_type'] );
		$this->assertGreaterThan( 0, $data['filesize'] );
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
	 * Verifies that sideloading a scaled image updates the attached file
	 * and returns the correct sub-size data including original_image.
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/trunk/tests/phpunit/tests/media.php
	 *      For similar core media tests that verify equivalent server-side behavior.
	 *
	 * @covers ::sideload_item
	 */
	public function test_sideload_scaled_updates_attached_file() {
		wp_set_current_user( self::$admin_id );

		// Upload the original image with client-side processing.
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=my-photo.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$attachment_id = $data['id'];

		// Sideload the -scaled version (simulating client-side big image threshold resize).
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=my-photo-scaled.jpg' );
		$request->set_param( 'image_size', 'scaled' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Verify sub-size data includes original_image and dimensions.
		$this->assertSame( 'scaled', $data['image_size'] );
		$this->assertArrayHasKey( 'original_image', $data );
		$this->assertSame( 'my-photo.jpg', $data['original_image'] );
		$this->assertArrayHasKey( 'width', $data );
		$this->assertArrayHasKey( 'height', $data );
		$this->assertArrayHasKey( 'filesize', $data );
		$this->assertGreaterThan( 0, $data['width'] );
		$this->assertGreaterThan( 0, $data['height'] );
		$this->assertGreaterThan( 0, $data['filesize'] );

		// Verify the attached file now points to the scaled version.
		$new_attached_file = get_attached_file( $attachment_id, true );
		$this->assertSame( 'my-photo-scaled.jpg', wp_basename( $new_attached_file ) );
	}

	/**
	 * Verifies that sideloading with image_size=original returns the file basename
	 * and does not change the attached file.
	 *
	 * @covers ::sideload_item
	 */
	public function test_sideload_original_returns_file_data() {
		wp_set_current_user( self::$admin_id );

		// Upload via REST so the file is in the uploads directory.
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$attachment_id = $data['id'];

		// The attached file before sideload.
		$attached_file_before = get_attached_file( $attachment_id, true );

		// Sideload the "original" version.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-original.jpg' );
		$request->set_param( 'image_size', 'original' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Verify sub-size data returns the file basename.
		$this->assertSame( 'original', $data['image_size'] );
		$this->assertSame( 'canola-original.jpg', $data['file'] );

		// Sideload should NOT have written metadata — that happens in finalize.
		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertArrayNotHasKey( 'original_image', $metadata, 'Sideload should not write metadata.' );

		// Verify the attached file was NOT changed (only scaled changes it).
		$attached_file_after = get_attached_file( $attachment_id, true );
		$this->assertSame( $attached_file_before, $attached_file_after, 'Attached file should not change when sideloading original.' );
	}

	/**
	 * Verifies the full client-side upload flow with scaled image:
	 * upload original, sideload sub-sizes, sideload scaled version, then finalize.
	 *
	 * After finalize, metadata should match core's server-side behavior:
	 * - original_image points to the unscaled original
	 * - attached file points to -scaled version
	 * - sub-sizes are present in metadata
	 *
	 * @covers ::create_item
	 * @covers ::sideload_item
	 * @covers ::finalize_item
	 */
	public function test_full_client_side_upload_flow_with_scaled_image() {
		wp_set_current_user( self::$admin_id );

		// Step 1: Upload the original image with client-side processing.
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=landscape.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$attachment_id = $data['id'];
		$this->assertNotEmpty( $data['missing_image_sizes'], 'Should have missing image sizes after client-side upload.' );

		// Step 2: Sideload a thumbnail sub-size (file saved, no metadata written).
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=landscape-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints (150x150 max).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response       = rest_get_server()->dispatch( $request );
		$thumbnail_data = $response->get_data();
		$this->assertSame( 200, $response->get_status() );

		// Step 3: Sideload the scaled version (big image threshold).
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=landscape-scaled.jpg' );
		$request->set_param( 'image_size', 'scaled' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response    = rest_get_server()->dispatch( $request );
		$scaled_data = $response->get_data();
		$this->assertSame( 200, $response->get_status() );

		// Before finalize: metadata should NOT have the sub-sizes.
		$metadata_before = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertArrayNotHasKey( 'thumbnail', $metadata_before['sizes'] ?? array() );

		// Step 4: Finalize with all collected sub-size data.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param( 'sub_sizes', array( $thumbnail_data, $scaled_data ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		// Verify final metadata matches expected state.
		$metadata = wp_get_attachment_metadata( $attachment_id, true );

		// original_image should point to the original unscaled file.
		$this->assertArrayHasKey( 'original_image', $metadata );
		$this->assertSame( 'landscape.jpg', $metadata['original_image'], 'original_image should be the original filename.' );

		// The attached file should now be the scaled version.
		$attached_file = get_attached_file( $attachment_id, true );
		$this->assertSame( 'landscape-scaled.jpg', wp_basename( $attached_file ), 'Attached file should be the -scaled version.' );

		// The metadata file should reflect the scaled version.
		$this->assertStringContainsString( 'landscape-scaled.jpg', $metadata['file'] );

		// Sub-sizes should be present after finalize.
		$this->assertArrayHasKey( 'thumbnail', $metadata['sizes'] );
		$this->assertSame( 'landscape-150x150.jpg', $metadata['sizes']['thumbnail']['file'] );

		// wp_get_original_image_path should resolve to the original.
		$original_path = wp_get_original_image_path( $attachment_id );
		$this->assertSame( 'landscape.jpg', wp_basename( $original_path ) );
	}

	/**
	 * Verifies that the scaled sideload filename filter works correctly
	 * and prevents WordPress from adding numeric suffixes to -scaled filenames.
	 *
	 * @covers ::sideload_item
	 */
	public function test_sideload_scaled_filename_not_suffixed() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=test-photo.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$attachment_id = $data['id'];

		// Sideload the scaled version.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=test-photo-scaled.jpg' );
		$request->set_param( 'image_size', 'scaled' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		// The filename should not have a numeric suffix like -scaled-1.jpg.
		$attached_file = get_attached_file( $attachment_id, true );
		$this->assertSame( 'test-photo-scaled.jpg', wp_basename( $attached_file ), 'Scaled filename should not have a numeric suffix.' );
		$this->assertStringNotContainsString( '-scaled-1', wp_basename( $attached_file ) );
	}

	/**
	 * Verifies that the sideload route declares `convert_format` as a boolean arg.
	 *
	 * Without this declaration, multipart/form-data requests deliver the value as
	 * a string ("false") which evaluates truthy in PHP, so the sideload handler's
	 * `if ( ! $request['convert_format'] )` check never fires and the
	 * `image_editor_output_format` filter is never suppressed — meaning the
	 * server still performs the format conversion the client opted out of.
	 *
	 * @covers ::register_routes
	 */
	public function test_sideload_route_declares_convert_format_boolean() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/media/(?P<id>[\d]+)/sideload', $routes );

		$creatable = null;
		foreach ( $routes['/wp/v2/media/(?P<id>[\d]+)/sideload'] as $route ) {
			if ( in_array( WP_REST_Server::CREATABLE, (array) $route['methods'], true ) ||
				! empty( $route['methods'][ WP_REST_Server::CREATABLE ] ) ) {
				$creatable = $route;
				break;
			}
		}

		$this->assertNotNull( $creatable, 'The sideload route should register a CREATABLE handler.' );
		$this->assertArrayHasKey( 'convert_format', $creatable['args'] );
		$this->assertSame( 'boolean', $creatable['args']['convert_format']['type'] );
		$this->assertSame( true, $creatable['args']['convert_format']['default'] );
	}

	/**
	 * Verifies that sideloading with `convert_format=false` (as a string, matching
	 * multipart/form-data semantics) suppresses the alt-extension collision check
	 * inside `wp_unique_filename()`, so a companion file that shares the attachment's
	 * basename does not get a numeric suffix.
	 *
	 * This mirrors the HEIC companion upload flow: the client uploads a JPEG
	 * derivative via the create endpoint, then sideloads the original HEIC under
	 * the same stem. Without the arg declared as boolean, "false" coerces truthy
	 * and the filter is never added, so the HEIC gets bumped to `-1` while the
	 * JPEG stays at no suffix — and the two companion files drift further apart
	 * on subsequent uploads.
	 *
	 * Uses PNG as a stand-in because a) the test environment may not ship a
	 * fully decodable HEIC via wp_handle_sideload, and b) WordPress core's
	 * default `image_editor_output_format` only maps HEIC/HEIF → JPEG. A local
	 * filter adds a PNG → JPEG mapping so PNG triggers the same alt-ext check
	 * the HEIC flow does in production.
	 *
	 * @covers ::sideload_item
	 * @covers ::register_routes
	 */
	public function test_sideload_convert_format_false_suppresses_alt_ext_suffix() {
		wp_set_current_user( self::$admin_id );

		// Upload a JPEG "parent" attachment the way client-side uploads do.
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=heic-companion.jpg' );
		$request->set_param( 'generate_sub_sizes', false );
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );

		$response      = rest_get_server()->dispatch( $request );
		$attachment_id = $response->get_data()['id'];
		$this->assertSame( 201, $response->get_status() );

		// Simulate an alt-ext conversion mapping so an alt-extension companion
		// (PNG here, HEIC in production) would otherwise get a `-1` suffix.
		$add_png_mapping = static function ( $formats ) {
			$formats['image/png'] = 'image/jpeg';
			return $formats;
		};
		add_filter( 'image_editor_output_format', $add_png_mapping, 5 );

		// Sideload a companion sharing the same basename. Pass `convert_format`
		// as the string "false" to match multipart/form-data request semantics.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/png' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=heic-companion.png' );
		$request->set_param( 'image_size', 'original-heic' );
		$request->set_param( 'convert_format', 'false' );
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/one-blue-pixel-100x100.png' ) );

		$response = rest_get_server()->dispatch( $request );

		remove_filter( 'image_editor_output_format', $add_png_mapping, 5 );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame(
			'heic-companion.png',
			$data['file'],
			'Companion file should share the attachment basename without a numeric suffix.'
		);
	}

	/**
	 * Verifies that sideloading with an array of size names returns the array
	 * preserved in the sub_size response, and that finalize registers the same
	 * file under every name.
	 *
	 * This supports deduplication of client-side generated sub-sizes when multiple
	 * registered sizes share identical dimensions (e.g. Twenty Eleven's `large`
	 * is 768x1024, matching core's `medium_large`). One physical file should be
	 * registered under every matching size name.
	 *
	 * @covers ::sideload_item
	 * @covers ::finalize_item
	 * @covers ::register_routes
	 */
	public function test_sideload_item_accepts_array_of_image_sizes() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=dedup-array.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		// Register a custom size with the same dimensions as `medium` so both
		// sizes resolve to one sideloaded file.
		add_image_size( 'duplicate_of_medium', 300, 300, false );

		// Sideload one physical file for both sizes.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=dedup-array-300x200.jpg' );
		$request->set_param( 'image_size', array( 'medium', 'duplicate_of_medium' ) );

		// Use test-image.jpg (50x50) which fits within medium (300x300) and duplicate_of_medium (300x300).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$sub_size_data = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		// The sideload response should preserve the array of size names so the
		// client can forward it to finalize as a single sub-size entry.
		$this->assertSame(
			array( 'medium', 'duplicate_of_medium' ),
			$sub_size_data['image_size']
		);
		$this->assertSame( 'dedup-array-300x200.jpg', $sub_size_data['file'] );

		// Finalize: one sub-size entry with an array of names should register
		// the same file under each name.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param( 'sub_sizes', array( $sub_size_data ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		remove_image_size( 'duplicate_of_medium' );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertArrayHasKey( 'medium', $metadata['sizes'] );
		$this->assertArrayHasKey( 'duplicate_of_medium', $metadata['sizes'] );
		$this->assertSame( 'dedup-array-300x200.jpg', $metadata['sizes']['medium']['file'] );
		$this->assertSame( 'dedup-array-300x200.jpg', $metadata['sizes']['duplicate_of_medium']['file'] );
		$this->assertSame(
			$metadata['sizes']['medium']['file'],
			$metadata['sizes']['duplicate_of_medium']['file']
		);
	}

	/**
	 * Verifies that sideloading with a single-element array of size names
	 * returns sub_size_data that finalize applies equivalently to a plain string.
	 *
	 * @covers ::sideload_item
	 * @covers ::finalize_item
	 */
	public function test_sideload_item_accepts_single_element_array() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=dedup-single.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=dedup-single-thumb.jpg' );
		$request->set_param( 'image_size', array( 'thumbnail' ) );

		// Use test-image.jpg (50x50) which fits within thumbnail constraints (150x150 max).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$sub_size_data = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'thumbnail' ), $sub_size_data['image_size'] );

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param( 'sub_sizes', array( $sub_size_data ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertArrayHasKey( 'thumbnail', $metadata['sizes'] );
		$this->assertSame( 'dedup-single-thumb.jpg', $metadata['sizes']['thumbnail']['file'] );
	}

	/**
	 * Verifies that finalize writes sub-size metadata from the sub_sizes parameter.
	 *
	 * @covers ::finalize_item
	 */
	public function test_finalize_writes_regular_sub_sizes() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=finalize-test.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		// Call finalize with sub_sizes.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param(
			'sub_sizes',
			array(
				array(
					'image_size' => 'thumbnail',
					'width'      => 150,
					'height'     => 150,
					'file'       => 'finalize-test-150x150.jpg',
					'mime_type'  => 'image/jpeg',
					'filesize'   => 5000,
				),
				array(
					'image_size' => 'medium',
					'width'      => 300,
					'height'     => 200,
					'file'       => 'finalize-test-300x200.jpg',
					'mime_type'  => 'image/jpeg',
					'filesize'   => 15000,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );

		// Verify both sub-sizes were written.
		$this->assertArrayHasKey( 'thumbnail', $metadata['sizes'] );
		$this->assertArrayHasKey( 'medium', $metadata['sizes'] );

		// Verify thumbnail metadata.
		$this->assertSame( 150, $metadata['sizes']['thumbnail']['width'] );
		$this->assertSame( 150, $metadata['sizes']['thumbnail']['height'] );
		$this->assertSame( 'finalize-test-150x150.jpg', $metadata['sizes']['thumbnail']['file'] );
		$this->assertSame( 'image/jpeg', $metadata['sizes']['thumbnail']['mime-type'] );
		$this->assertSame( 5000, $metadata['sizes']['thumbnail']['filesize'] );

		// Verify medium metadata.
		$this->assertSame( 300, $metadata['sizes']['medium']['width'] );
		$this->assertSame( 200, $metadata['sizes']['medium']['height'] );
		$this->assertSame( 'finalize-test-300x200.jpg', $metadata['sizes']['medium']['file'] );
		$this->assertSame( 'image/jpeg', $metadata['sizes']['medium']['mime-type'] );
		$this->assertSame( 15000, $metadata['sizes']['medium']['filesize'] );
	}

	/**
	 * Verifies that finalize writes scaled sub-size metadata correctly.
	 *
	 * @covers ::finalize_item
	 */
	public function test_finalize_writes_scaled_metadata() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=big-photo.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param(
			'sub_sizes',
			array(
				array(
					'image_size'     => 'scaled',
					'width'          => 2560,
					'height'         => 1920,
					'file'           => '2026/04/big-photo-scaled.jpg',
					'filesize'       => 500000,
					'original_image' => 'big-photo.jpg',
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );

		$this->assertSame( 'big-photo.jpg', $metadata['original_image'] );
		$this->assertSame( 2560, $metadata['width'] );
		$this->assertSame( 1920, $metadata['height'] );
		$this->assertSame( 500000, $metadata['filesize'] );
		$this->assertSame( '2026/04/big-photo-scaled.jpg', $metadata['file'] );
	}

	/**
	 * Verifies that finalize writes original sub-size metadata correctly.
	 *
	 * @covers ::finalize_item
	 */
	public function test_finalize_writes_original_metadata() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=rotated-photo.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		// Sideload the "original" version (simulating a rotated image).
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=rotated-photo-original.jpg' );
		$request->set_param( 'image_size', 'original' );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$original_data = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Finalize with the original sub-size data.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param( 'sub_sizes', array( $original_data ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertSame( 'rotated-photo-original.jpg', $metadata['original_image'] );
	}

	/**
	 * Verifies that finalize with empty sub_sizes still triggers the
	 * wp_generate_attachment_metadata filter.
	 *
	 * @covers ::finalize_item
	 */
	public function test_finalize_with_empty_sub_sizes() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=simple.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		$filter_called = false;
		add_filter(
			'wp_generate_attachment_metadata',
			function ( $metadata ) use ( &$filter_called ) {
				$filter_called = true;
				return $metadata;
			}
		);

		$request  = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $filter_called, 'wp_generate_attachment_metadata filter should be triggered.' );
	}

	/**
	 * Verifies that finalize preserves existing image_meta when adding sub-sizes.
	 *
	 * @covers ::finalize_item
	 * @requires extension exif
	 */
	public function test_finalize_preserves_image_meta() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=2004-07-22-DSC_0008.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/2004-07-22-DSC_0008.jpg' ) );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();
		$attachment_id = $data['id'];

		$original_image_meta = wp_get_attachment_metadata( $attachment_id, true )['image_meta'];

		// Finalize with sub-sizes.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/finalize" );
		$request->set_param(
			'sub_sizes',
			array(
				array(
					'image_size' => 'thumbnail',
					'width'      => 150,
					'height'     => 150,
					'file'       => '2004-07-22-DSC_0008-150x150.jpg',
					'mime_type'  => 'image/jpeg',
					'filesize'   => 5000,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );

		// Sub-size should be present.
		$this->assertArrayHasKey( 'thumbnail', $metadata['sizes'] );

		// EXIF data should be preserved.
		$this->assertSame( $original_image_meta['aperture'], $metadata['image_meta']['aperture'] );
		$this->assertSame( $original_image_meta['camera'], $metadata['image_meta']['camera'] );
		$this->assertSame( $original_image_meta['focal_length'], $metadata['image_meta']['focal_length'] );
		$this->assertSame( $original_image_meta['iso'], $metadata['image_meta']['iso'] );
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

	/**
	 * @covers ::sideload_item
	 * @covers ::validate_image_dimensions
	 */
	public function test_sideload_item_rejects_oversized_dimensions() {
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

		// Upload a large image claiming it's a thumbnail (typically 150x150 max).
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola-150x150.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// canola.jpg is 1024x768, much larger than thumbnail dimensions.
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_upload_dimension_mismatch', $response->get_data()['code'] );
	}

	/**
	 * @covers ::sideload_item
	 * @covers ::validate_image_dimensions
	 */
	public function test_sideload_item_accepts_valid_dimensions() {
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

		// Use a small test image that fits within thumbnail constraints.
		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/sideload" );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=test-thumbnail.jpg' );
		$request->set_param( 'image_size', 'thumbnail' );

		// test-image.jpg is 50x50, valid for thumbnail (max 150x150).
		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/test-image.jpg' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Verifies that image_output_format and image_save_progressive are in the schema.
	 *
	 * @covers ::get_item_schema
	 */
	public function test_image_output_format_in_schema() {
		$controller = new Gutenberg_REST_Attachments_Controller( 'attachment' );
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'image_output_format', $schema['properties'] );
		$this->assertSame( array( 'string', 'null' ), $schema['properties']['image_output_format']['type'] );
		$this->assertContains( 'edit', $schema['properties']['image_output_format']['context'] );
		$this->assertTrue( $schema['properties']['image_output_format']['readonly'] );

		$this->assertArrayHasKey( 'image_save_progressive', $schema['properties'] );
		$this->assertSame( 'boolean', $schema['properties']['image_save_progressive']['type'] );
		$this->assertContains( 'edit', $schema['properties']['image_save_progressive']['context'] );
		$this->assertTrue( $schema['properties']['image_save_progressive']['readonly'] );
	}

	/**
	 * Verifies that image_output_format is null by default (no conversion needed).
	 *
	 * @covers ::create_item
	 * @covers ::prepare_item_for_response
	 */
	public function test_image_output_format_in_create_response() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'image_output_format', $data );
		// No custom filter, so output format should be null (no conversion needed).
		$this->assertNull( $data['image_output_format'] );
	}

	/**
	 * Verifies that image_output_format reflects a custom filter converting JPEG to WebP.
	 *
	 * @covers ::create_item
	 * @covers ::prepare_item_for_response
	 */
	public function test_image_output_format_with_custom_filter() {
		wp_set_current_user( self::$admin_id );

		// Add a filter to convert JPEG to WebP.
		$filter = function ( $formats ) {
			$formats['image/jpeg'] = 'image/webp';
			return $formats;
		};
		add_filter( 'image_editor_output_format', $filter );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		remove_filter( 'image_editor_output_format', $filter );

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'image_output_format', $data );
		$this->assertSame( 'image/webp', $data['image_output_format'] );

		// The main file on disk should be the converted WebP so
		// wp_get_attachment_url() returns the WebP. This is what the
		// client-side editor flow relies on when it lets the server
		// handle main-file conversion (convert_format default = true).
		$attached_file = get_attached_file( $data['id'], true );
		$this->assertStringEndsWith( '.webp', (string) $attached_file );
	}

	/**
	 * Verifies that the main file is NOT converted when the client explicitly
	 * opts out with convert_format=false, and that image_output_format is still
	 * recomputed accurately in the response so the client can transcode sub-sizes.
	 *
	 * @covers ::create_item
	 * @covers ::prepare_item_for_response
	 */
	public function test_image_output_format_recomputed_when_convert_format_false() {
		wp_set_current_user( self::$admin_id );

		$filter = function ( $formats ) {
			$formats['image/jpeg'] = 'image/webp';
			return $formats;
		};
		add_filter( 'image_editor_output_format', $filter );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'generate_sub_sizes', false );
		$request->set_param( 'convert_format', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		remove_filter( 'image_editor_output_format', $filter );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'image/webp', $data['image_output_format'] );

		// With convert_format=false the server should leave the JPEG untouched.
		$attached_file = get_attached_file( $data['id'], true );
		$this->assertStringEndsWith( '.jpg', (string) $attached_file );
	}

	/**
	 * Verifies that image_save_progressive is returned in the response.
	 *
	 * @covers ::create_item
	 * @covers ::prepare_item_for_response
	 */
	public function test_image_save_progressive_in_response() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'generate_sub_sizes', false );

		$request->set_body( file_get_contents( DIR_TESTDATA . '/images/canola.jpg' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertArrayHasKey( 'image_save_progressive', $data );
		// Default is false.
		$this->assertFalse( $data['image_save_progressive'] );
	}
}
