<?php
/**
 * Unit tests covering WP_REST_Attachments_Controller functionality
 *
 * @package WordPress
 * @subpackage REST API
 */

/**
 * @group restapi
 */
class WP_Test_REST_Attachments_Controller extends WP_Test_REST_Post_Type_Controller_Testcase {

	protected static $superadmin_id;
	protected static $editor_id;
	protected static $author_id;
	protected static $contributor_id;
	protected static $uploader_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$superadmin_id = $factory->user->create( array(
			'role'       => 'administrator',
			'user_login' => 'superadmin',
		) );
		self::$editor_id = $factory->user->create( array(
			'role' => 'editor',
		) );
		self::$author_id = $factory->user->create( array(
			'role' => 'author',
		) );
		self::$contributor_id = $factory->user->create( array(
			'role' => 'contributor',
		) );
		self::$uploader_id = $factory->user->create( array(
			'role' => 'uploader',
		) );

		if ( is_multisite() ) {
			update_site_option( 'site_admins', array( 'superadmin' ) );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$author_id );
		self::delete_user( self::$contributor_id );
		self::delete_user( self::$uploader_id );
	}

	public function setUp() {
		parent::setUp();

		// Add an uploader role to test upload capabilities.
		add_role( 'uploader', 'File upload role' );
		$role = get_role( 'uploader' );
		$role->add_cap( 'upload_files' );
		$role->add_cap( 'read' );
		$role->add_cap( 'level_0' );

		$orig_file = DIR_TESTDATA . '/images/canola.jpg';
		$this->test_file = '/tmp/canola.jpg';
		copy( $orig_file, $this->test_file );
		$orig_file2 = DIR_TESTDATA . '/images/codeispoetry.png';
		$this->test_file2 = '/tmp/codeispoetry.png';
		copy( $orig_file2, $this->test_file2 );
	}

	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/wp/v2/media', $routes );
		$this->assertCount( 2, $routes['/wp/v2/media'] );
		$this->assertArrayHasKey( '/wp/v2/media/(?P<id>[\d]+)', $routes );
		$this->assertCount( 3, $routes['/wp/v2/media/(?P<id>[\d]+)'] );
	}

	public static function disposition_provider() {
		return array(
			// Types
			array( 'attachment; filename="foo.jpg"', 'foo.jpg' ),
			array( 'inline; filename="foo.jpg"', 'foo.jpg' ),
			array( 'form-data; filename="foo.jpg"', 'foo.jpg' ),

			// Formatting
			array( 'attachment; filename="foo.jpg"', 'foo.jpg' ),
			array( 'attachment; filename=foo.jpg', 'foo.jpg' ),
			array( 'attachment;filename="foo.jpg"', 'foo.jpg' ),
			array( 'attachment;filename=foo.jpg', 'foo.jpg' ),
			array( 'attachment; filename = "foo.jpg"', 'foo.jpg' ),
			array( 'attachment; filename = foo.jpg', 'foo.jpg' ),
			array( "attachment;\tfilename\t=\t\"foo.jpg\"", 'foo.jpg' ),
			array( "attachment;\tfilename\t=\tfoo.jpg", 'foo.jpg' ),
			array( 'attachment; filename = my foo picture.jpg', 'my foo picture.jpg' ),

			// Extensions
			array( 'form-data; name="myfile"; filename="foo.jpg"', 'foo.jpg' ),
			array( 'form-data; name="myfile"; filename="foo.jpg"; something="else"', 'foo.jpg' ),
			array( 'form-data; name=myfile; filename=foo.jpg; something=else', 'foo.jpg' ),
			array( 'form-data; name=myfile; filename=my foo.jpg; something=else', 'my foo.jpg' ),

			// Invalid
			array( 'filename="foo.jpg"', null ),
			array( 'filename-foo.jpg', null ),
			array( 'foo.jpg', null ),
			array( 'unknown; notfilename="foo.jpg"', null ),
		);
	}

	/**
	 * @dataProvider disposition_provider
	 */
	public function test_parse_disposition( $header, $expected ) {
		$header_list = array( $header );
		$parsed = WP_REST_Attachments_Controller::get_filename_from_disposition( $header_list );
		$this->assertEquals( $expected, $parsed );
	}

	public function test_context_param() {
		// Collection
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/media/' . $attachment_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEquals( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	public function test_registered_query_params() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$keys = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array(
			'after',
			'author',
			'author_exclude',
			'before',
			'context',
			'exclude',
			'include',
			'media_type',
			'mime_type',
			'offset',
			'order',
			'orderby',
			'page',
			'parent',
			'parent_exclude',
			'per_page',
			'search',
			'slug',
			'status',
			), $keys );
		$media_types = array(
			'application',
			'video',
			'image',
			'audio',
		);
		if ( ! is_multisite() ) {
			$media_types[] = 'text';
		}
		$this->assertEqualSets( $media_types, $data['endpoints'][0]['args']['media_type']['enum'] );
	}

	public function test_registered_get_item_params() {
		$id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'OPTIONS', sprintf( '/wp/v2/media/%d', $id1 ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$keys = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals( array( 'context', 'id' ), $keys );
	}

	public function test_get_items() {
		wp_set_current_user( 0 );
		$id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$draft_post = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$id2 = $this->factory->attachment->create_object( $this->test_file, $draft_post, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$published_post = $this->factory->post->create( array( 'post_status' => 'publish' ) );
		$id3 = $this->factory->attachment->create_object( $this->test_file, $published_post, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertCount( 2, $data );
		$ids = wp_list_pluck( $data, 'id' );
		$this->assertTrue( in_array( $id1, $ids, true ) );
		$this->assertFalse( in_array( $id2, $ids, true ) );
		$this->assertTrue( in_array( $id3, $ids, true ) );

		$this->check_get_posts_response( $response );
	}

	public function test_get_items_logged_in_editor() {
		wp_set_current_user( self::$editor_id );
		$id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$draft_post = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$id2 = $this->factory->attachment->create_object( $this->test_file, $draft_post, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$published_post = $this->factory->post->create( array( 'post_status' => 'publish' ) );
		$id3 = $this->factory->attachment->create_object( $this->test_file, $published_post, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$this->assertCount( 3, $data );
		$ids = wp_list_pluck( $data, 'id' );
		$this->assertTrue( in_array( $id1, $ids, true ) );
		$this->assertTrue( in_array( $id2, $ids, true ) );
		$this->assertTrue( in_array( $id3, $ids, true ) );
	}

	public function test_get_items_media_type() {
		$id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $id1, $data[0]['id'] );
		// media_type=video
		$request->set_param( 'media_type', 'video' );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 0, $response->get_data() );
		// media_type=image
		$request->set_param( 'media_type', 'image' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $id1, $data[0]['id'] );
	}

	public function test_get_items_mime_type() {
		$id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $id1, $data[0]['id'] );
		// mime_type=image/png
		$request->set_param( 'mime_type', 'image/png' );
		$response = $this->server->dispatch( $request );
		$this->assertCount( 0, $response->get_data() );
		// mime_type=image/jpeg
		$request->set_param( 'mime_type', 'image/jpeg' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( $id1, $data[0]['id'] );
	}

	public function test_get_items_parent() {
		$post_id = $this->factory->post->create( array( 'post_title' => 'Test Post' ) );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$attachment_id2 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		// all attachments
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 2, count( $response->get_data() ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		// attachments without a parent
		$request->set_param( 'parent', 0 );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $attachment_id2, $data[0]['id'] );
		// attachments with parent=post_id
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'parent', $post_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 1, count( $data ) );
		$this->assertEquals( $attachment_id, $data[0]['id'] );
		// attachments with invalid parent
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'parent', REST_TESTS_IMPOSSIBLY_HIGH_NUMBER );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertEquals( 0, count( $data ) );
	}

	public function test_get_items_invalid_status_param_is_error_response() {
		wp_set_current_user( self::$editor_id );
		$this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'status', 'publish' );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertCount( 3, $data );
		$this->assertEquals( 'rest_invalid_param', $data['code'] );
	}

	public function test_get_items_private_status() {
		// Logged out users can't make the request
		wp_set_current_user( 0 );
		$attachment_id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_status'    => 'private',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'status', 'private' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		// Properly authorized users can make the request
		wp_set_current_user( self::$editor_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( $attachment_id1, $data[0]['id'] );
	}

	public function test_get_items_multiple_statuses() {
		// Logged out users can't make the request
		wp_set_current_user( 0 );
		$attachment_id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_status'    => 'private',
		) );
		$attachment_id2 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_status'    => 'trash',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'status', array( 'private', 'trash' ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		// Properly authorized users can make the request
		wp_set_current_user( self::$editor_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 2, count( $data ) );
		$ids = array(
			$data[0]['id'],
			$data[1]['id'],
		);
		sort( $ids );
		$this->assertEquals( array( $attachment_id1, $attachment_id2 ), $ids );
	}

	public function test_get_items_invalid_date() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'after', rand_str() );
		$request->set_param( 'before', rand_str() );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_get_items_valid_date() {
		$id1 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_date'      => '2016-01-15T00:00:00Z',
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$id2 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_date'      => '2016-01-16T00:00:00Z',
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$id3 = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_date'      => '2016-01-17T00:00:00Z',
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'after', '2016-01-15T00:00:00Z' );
		$request->set_param( 'before', '2016-01-17T00:00:00Z' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertEquals( $id2, $data[0]['id'] );
	}

	public function test_get_item() {
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', 'Sample alt text' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $attachment_id );
		$response = $this->server->dispatch( $request );
		$this->check_get_post_response( $response );
		$data = $response->get_data();
		$this->assertEquals( 'image/jpeg', $data['mime_type'] );
	}

	public function test_get_item_sizes() {
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		), $this->test_file );

		add_image_size( 'rest-api-test', 119, 119, true );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $this->test_file ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $attachment_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$image_src = wp_get_attachment_image_src( $attachment_id, 'rest-api-test' );
		$original_image_src = wp_get_attachment_image_src( $attachment_id, 'full' );
		remove_image_size( 'rest-api-test' );

		$this->assertEquals( $image_src[0], $data['media_details']['sizes']['rest-api-test']['source_url'] );
		$this->assertEquals( 'image/jpeg', $data['media_details']['sizes']['rest-api-test']['mime_type'] );
		$this->assertEquals( $original_image_src[0], $data['media_details']['sizes']['full']['source_url'] );
		$this->assertEquals( 'image/jpeg', $data['media_details']['sizes']['full']['mime_type'] );
	}

	public function test_get_item_sizes_with_no_url() {
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		), $this->test_file );

		add_image_size( 'rest-api-test', 119, 119, true );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $this->test_file ) );

		add_filter( 'wp_get_attachment_image_src', '__return_false' );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $attachment_id );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		remove_filter( 'wp_get_attachment_image_src', '__return_false' );
		remove_image_size( 'rest-api-test' );

		$this->assertFalse( isset( $data['media_details']['sizes']['rest-api-test']['source_url'] ) );
	}

	public function test_get_item_private_post() {
		wp_set_current_user( 0 );
		$draft_post = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$id1 = $this->factory->attachment->create_object( $this->test_file, $draft_post, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $id1 );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
	}

	public function test_create_item() {
		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_param( 'title', 'My title is very cool' );
		$request->set_param( 'caption', 'This is a better caption.' );
		$request->set_param( 'description', 'Without a description, my attachment is descriptionless.' );
		$request->set_param( 'alt_text', 'Alt text is stored outside post schema.' );

		$request->set_body( file_get_contents( $this->test_file ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertEquals( 201, $response->get_status() );
		$this->assertEquals( 'image', $data['media_type'] );

		$attachment = get_post( $data['id'] );
		$this->assertEquals( 'My title is very cool', $data['title']['raw'] );
		$this->assertEquals( 'My title is very cool', $attachment->post_title );
		$this->assertEquals( 'This is a better caption.', $data['caption']['raw'] );
		$this->assertEquals( 'This is a better caption.', $attachment->post_excerpt );
		$this->assertEquals( 'Without a description, my attachment is descriptionless.', $data['description']['raw'] );
		$this->assertEquals( 'Without a description, my attachment is descriptionless.', $attachment->post_content );
		$this->assertEquals( 'Alt text is stored outside post schema.', $data['alt_text'] );
		$this->assertEquals( 'Alt text is stored outside post schema.', get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true ) );
	}

	public function test_create_item_default_filename_title() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_file_params( array(
			'file' => array(
				'file'     => file_get_contents( $this->test_file2 ),
				'name'     => 'codeispoetry.png',
				'size'     => filesize( $this->test_file2 ),
				'tmp_name' => $this->test_file2,
			),
		) );
		$request->set_header( 'Content-MD5', md5_file( $this->test_file2 ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'codeispoetry', $data['title']['raw'] );
	}

	public function test_create_item_with_files() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_file_params( array(
			'file' => array(
				'file'     => file_get_contents( $this->test_file ),
				'name'     => 'canola.jpg',
				'size'     => filesize( $this->test_file ),
				'tmp_name' => $this->test_file,
			),
		) );
		$request->set_header( 'Content-MD5', md5_file( $this->test_file ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
	}

	public function test_create_item_with_upload_files_role() {
		wp_set_current_user( self::$uploader_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_file_params( array(
			'file' => array(
				'file'     => file_get_contents( $this->test_file ),
				'name'     => 'canola.jpg',
				'size'     => filesize( $this->test_file ),
				'tmp_name' => $this->test_file,
			),
		) );
		$request->set_header( 'Content-MD5', md5_file( $this->test_file ) );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
	}

	public function test_create_item_empty_body() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_upload_no_data', $response, 400 );
	}

	public function test_create_item_missing_content_type() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_body( file_get_contents( $this->test_file ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_upload_no_content_type', $response, 400 );
	}

	public function test_create_item_missing_content_disposition() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_body( file_get_contents( $this->test_file ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_upload_no_content_disposition', $response, 400 );
	}

	public function test_create_item_bad_md5_header() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_header( 'Content-MD5', 'abc123' );
		$request->set_body( file_get_contents( $this->test_file ) );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_upload_hash_mismatch', $response, 412 );
	}

	public function test_create_item_with_files_bad_md5_header() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_file_params( array(
			'file' => array(
				'file'     => file_get_contents( $this->test_file ),
				'name'     => 'canola.jpg',
				'size'     => filesize( $this->test_file ),
				'tmp_name' => $this->test_file,
			),
		) );
		$request->set_header( 'Content-MD5', 'abc123' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_upload_hash_mismatch', $response, 412 );
	}

	public function test_create_item_invalid_upload_files_capability() {
		wp_set_current_user( self::$contributor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
	}

	public function test_create_item_invalid_edit_permissions() {
		$post_id = $this->factory->post->create( array( 'post_author' => self::$editor_id ) );
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_param( 'post', $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_create_item_invalid_upload_permissions() {
		$post_id = $this->factory->post->create( array( 'post_author' => self::$editor_id ) );
		wp_set_current_user( self::$uploader_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_param( 'post', $post_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_create_item_invalid_post_type() {
		$attachment_id = $this->factory->post->create( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'post_parent' => 0 ) );
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_body( file_get_contents( $this->test_file ) );
		$request->set_param( 'post', $attachment_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function test_create_item_alt_text() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );

		$request->set_body( file_get_contents( $this->test_file ) );
		$request->set_param( 'alt_text', 'test alt text' );
		$response = $this->server->dispatch( $request );
		$attachment = $response->get_data();
		$this->assertEquals( 'test alt text', $attachment['alt_text'] );
	}

	public function test_create_item_unsafe_alt_text() {
		wp_set_current_user( self::$author_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_body( file_get_contents( $this->test_file ) );
		$request->set_param( 'alt_text', '<script>alert(document.cookie)</script>' );
		$response = $this->server->dispatch( $request );
		$attachment = $response->get_data();
		$this->assertEquals( '', $attachment['alt_text'] );
	}

	public function test_update_item() {
		wp_set_current_user( self::$editor_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => self::$editor_id,
		) );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media/' . $attachment_id );
		$request->set_param( 'title', 'My title is very cool' );
		$request->set_param( 'caption', 'This is a better caption.' );
		$request->set_param( 'description', 'Without a description, my attachment is descriptionless.' );
		$request->set_param( 'alt_text', 'Alt text is stored outside post schema.' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$attachment = get_post( $data['id'] );
		$this->assertEquals( 'My title is very cool', $data['title']['raw'] );
		$this->assertEquals( 'My title is very cool', $attachment->post_title );
		$this->assertEquals( 'This is a better caption.', $data['caption']['raw'] );
		$this->assertEquals( 'This is a better caption.', $attachment->post_excerpt );
		$this->assertEquals( 'Without a description, my attachment is descriptionless.', $data['description']['raw'] );
		$this->assertEquals( 'Without a description, my attachment is descriptionless.', $attachment->post_content );
		$this->assertEquals( 'Alt text is stored outside post schema.', $data['alt_text'] );
		$this->assertEquals( 'Alt text is stored outside post schema.', get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true ) );
	}

	public function test_update_item_parent() {
		wp_set_current_user( self::$editor_id );
		$original_parent = $this->factory->post->create( array() );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, $original_parent, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => $this->editor_id,
		) );

		$attachment = get_post( $attachment_id );
		$this->assertEquals( $original_parent, $attachment->post_parent );

		$new_parent = $this->factory->post->create( array() );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media/' . $attachment_id );
		$request->set_param( 'post', $new_parent );
		$this->server->dispatch( $request );

		$attachment = get_post( $attachment_id );
		$this->assertEquals( $new_parent, $attachment->post_parent );
	}

	public function test_update_item_invalid_permissions() {
		wp_set_current_user( self::$author_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => self::$editor_id,
		) );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media/' . $attachment_id );
		$request->set_param( 'caption', 'This is a better caption.' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	public function test_update_item_invalid_post_type() {
		$attachment_id = $this->factory->post->create( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'post_parent' => 0 ) );
		wp_set_current_user( self::$editor_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => self::$editor_id,
		) );
		$request = new WP_REST_Request( 'POST', '/wp/v2/media/' . $attachment_id );
		$request->set_param( 'post', $attachment_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}

	public function verify_attachment_roundtrip( $input = array(), $expected_output = array() ) {
		// Create the post
		$request = new WP_REST_Request( 'POST', '/wp/v2/media' );
		$request->set_header( 'Content-Type', 'image/jpeg' );
		$request->set_header( 'Content-Disposition', 'attachment; filename=canola.jpg' );
		$request->set_body( file_get_contents( $this->test_file ) );

		foreach ( $input as $name => $value ) {
			$request->set_param( $name, $value );
		}
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$actual_output = $response->get_data();

		// Remove <p class="attachment"> from rendered description
		// see https://core.trac.wordpress.org/ticket/38679
		$content = $actual_output['description']['rendered'];
		$content = explode( "\n", trim( $content ) );
		if ( preg_match( '/^<p class="attachment">/', $content[0] ) ) {
			$content = implode( "\n", array_slice( $content, 1 ) );
			$actual_output['description']['rendered'] = $content;
		}

		// Compare expected API output to actual API output
		$this->assertEquals( $expected_output['title']['raw']           , $actual_output['title']['raw'] );
		$this->assertEquals( $expected_output['title']['rendered']      , trim( $actual_output['title']['rendered'] ) );
		$this->assertEquals( $expected_output['description']['raw']     , $actual_output['description']['raw'] );
		$this->assertEquals( $expected_output['description']['rendered'], trim( $actual_output['description']['rendered'] ) );
		$this->assertEquals( $expected_output['caption']['raw']         , $actual_output['caption']['raw'] );
		$this->assertEquals( $expected_output['caption']['rendered']    , trim( $actual_output['caption']['rendered'] ) );

		// Compare expected API output to WP internal values
		$post = get_post( $actual_output['id'] );
		$this->assertEquals( $expected_output['title']['raw'], $post->post_title );
		$this->assertEquals( $expected_output['description']['raw'], $post->post_content );
		$this->assertEquals( $expected_output['caption']['raw'], $post->post_excerpt );

		// Update the post
		$request = new WP_REST_Request( 'PUT', sprintf( '/wp/v2/media/%d', $actual_output['id'] ) );
		foreach ( $input as $name => $value ) {
			$request->set_param( $name, $value );
		}
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$actual_output = $response->get_data();

		// Remove <p class="attachment"> from rendered description
		// see https://core.trac.wordpress.org/ticket/38679
		$content = $actual_output['description']['rendered'];
		$content = explode( "\n", trim( $content ) );
		if ( preg_match( '/^<p class="attachment">/', $content[0] ) ) {
			$content = implode( "\n", array_slice( $content, 1 ) );
			$actual_output['description']['rendered'] = $content;
		}

		// Compare expected API output to actual API output
		$this->assertEquals( $expected_output['title']['raw']           , $actual_output['title']['raw'] );
		$this->assertEquals( $expected_output['title']['rendered']      , trim( $actual_output['title']['rendered'] ) );
		$this->assertEquals( $expected_output['description']['raw']     , $actual_output['description']['raw'] );
		$this->assertEquals( $expected_output['description']['rendered'], trim( $actual_output['description']['rendered'] ) );
		$this->assertEquals( $expected_output['caption']['raw']         , $actual_output['caption']['raw'] );
		$this->assertEquals( $expected_output['caption']['rendered']    , trim( $actual_output['caption']['rendered'] ) );

		// Compare expected API output to WP internal values
		$post = get_post( $actual_output['id'] );
		$this->assertEquals( $expected_output['title']['raw']  , $post->post_title );
		$this->assertEquals( $expected_output['description']['raw'], $post->post_content );
		$this->assertEquals( $expected_output['caption']['raw'], $post->post_excerpt );
	}

	public static function attachment_roundtrip_provider() {
		return array(
			array(
				// Raw values.
				array(
					'title'   => '\o/ ¯\_(ツ)_/¯',
					'description' => '\o/ ¯\_(ツ)_/¯',
					'caption' => '\o/ ¯\_(ツ)_/¯',
				),
				// Expected returned values.
				array(
					'title' => array(
						'raw'      => '\o/ ¯\_(ツ)_/¯',
						'rendered' => '\o/ ¯\_(ツ)_/¯',
					),
					'description' => array(
						'raw'      => '\o/ ¯\_(ツ)_/¯',
						'rendered' => '<p>\o/ ¯\_(ツ)_/¯</p>',
					),
					'caption' => array(
						'raw'      => '\o/ ¯\_(ツ)_/¯',
						'rendered' => '<p>\o/ ¯\_(ツ)_/¯</p>',
					),
				)
			),
			array(
				// Raw values.
				array(
					'title'   => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
					'description' => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
					'caption' => '\\\&\\\ &amp; &invalid; < &lt; &amp;lt;',
				),
				// Expected returned values.
				array(
					'title' => array(
						'raw'      => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
						'rendered' => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
					),
					'description' => array(
						'raw'      => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
						'rendered' => '<p>\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;</p>',
					),
					'caption' => array(
						'raw'      => '\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;',
						'rendered' => '<p>\\\&amp;\\\ &amp; &amp;invalid; &lt; &lt; &amp;lt;</p>',
					),
				),
			),
			array(
				// Raw values.
				array(
					'title'   => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
					'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
					'caption' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				),
				// Expected returned values.
				array(
					'title' => array(
						'raw'      => 'div <strong>strong</strong> oh noes',
						'rendered' => 'div <strong>strong</strong> oh noes',
					),
					'description' => array(
						'raw'      => '<div>div</div> <strong>strong</strong> oh noes',
						'rendered' => "<div>div</div>\n<p> <strong>strong</strong> oh noes</p>",
					),
					'caption' => array(
						'raw'      => '<div>div</div> <strong>strong</strong> oh noes',
						'rendered' => "<div>div</div>\n<p> <strong>strong</strong> oh noes</p>",
					),
				)
			),
			array(
				// Raw values.
				array(
					'title'   => '<a href="#" target="_blank" data-unfiltered=true>link</a>',
					'description' => '<a href="#" target="_blank" data-unfiltered=true>link</a>',
					'caption' => '<a href="#" target="_blank" data-unfiltered=true>link</a>',
				),
				// Expected returned values.
				array(
					'title' => array(
						'raw'      => '<a href="#">link</a>',
						'rendered' => '<a href="#">link</a>',
					),
					'description' => array(
						'raw'      => '<a href="#" target="_blank">link</a>',
						'rendered' => '<p><a href="#" target="_blank">link</a></p>',
					),
					'caption' => array(
						'raw'      => '<a href="#" target="_blank">link</a>',
						'rendered' => '<p><a href="#" target="_blank">link</a></p>',
					),
				)
			),
		);
	}

	/**
	 * @dataProvider attachment_roundtrip_provider
	 */
	public function test_post_roundtrip_as_author( $raw, $expected ) {
		wp_set_current_user( self::$author_id );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
		$this->verify_attachment_roundtrip( $raw, $expected );
	}

	public function test_attachment_roundtrip_as_editor_unfiltered_html() {
		wp_set_current_user( self::$editor_id );
		if ( is_multisite() ) {
			$this->assertFalse( current_user_can( 'unfiltered_html' ) );
			$this->verify_attachment_roundtrip( array(
				'title'       => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'caption'     => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			), array(
				'title' => array(
					'raw'      => 'div <strong>strong</strong> oh noes',
					'rendered' => 'div <strong>strong</strong> oh noes',
				),
				'description' => array(
					'raw'      => '<div>div</div> <strong>strong</strong> oh noes',
					'rendered' => "<div>div</div>\n<p> <strong>strong</strong> oh noes</p>",
				),
				'caption' => array(
					'raw'      => '<div>div</div> <strong>strong</strong> oh noes',
					'rendered' => "<div>div</div>\n<p> <strong>strong</strong> oh noes</p>",
				),
			) );
		} else {
			$this->assertTrue( current_user_can( 'unfiltered_html' ) );
			$this->verify_attachment_roundtrip( array(
				'title'       => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'caption'     => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			), array(
				'title' => array(
					'raw'      => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
					'rendered' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				),
				'description' => array(
					'raw'      => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
					'rendered' => "<div>div</div>\n<p> <strong>strong</strong> <script>oh noes</script></p>",
				),
				'caption' => array(
					'raw'      => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
					'rendered' => "<div>div</div>\n<p> <strong>strong</strong> <script>oh noes</script></p>",
				),
			) );
		}
	}

	public function test_attachment_roundtrip_as_superadmin_unfiltered_html() {
		wp_set_current_user( self::$superadmin_id );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$this->verify_attachment_roundtrip( array(
			'title'       => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'description' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			'caption'     => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
		), array(
			'title' => array(
				'raw'      => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'rendered' => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
			),
			'description' => array(
				'raw'      => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'rendered' => "<div>div</div>\n<p> <strong>strong</strong> <script>oh noes</script></p>",
			),
			'caption' => array(
				'raw'      => '<div>div</div> <strong>strong</strong> <script>oh noes</script>',
				'rendered' => "<div>div</div>\n<p> <strong>strong</strong> <script>oh noes</script></p>",
			),
		) );
	}

	public function test_delete_item() {
		wp_set_current_user( self::$editor_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/media/' . $attachment_id );
		$request['force'] = true;
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
	}

	public function test_delete_item_no_trash() {
		wp_set_current_user( self::$editor_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );

		// Attempt trashing
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/media/' . $attachment_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		$request->set_param( 'force', 'false' );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_trash_not_supported', $response, 501 );

		// Ensure the post still exists
		$post = get_post( $attachment_id );
		$this->assertNotEmpty( $post );
	}

	public function test_delete_item_invalid_delete_permissions() {
		wp_set_current_user( self::$author_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => self::$editor_id,
		) );
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/media/' . $attachment_id );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_delete', $response, 403 );
	}

	public function test_prepare_item() {
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => self::$editor_id,
		) );

		$attachment = get_post( $attachment_id );
		$request = new WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $attachment_id ) );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->check_post_data( $attachment, $data, 'view', $response->get_links() );
		$this->check_post_data( $attachment, $data, 'embed', $response->get_links() );
	}

	public function test_get_item_schema() {
		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/media' );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 24, count( $properties ) );
		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'alt_text', $properties );
		$this->assertArrayHasKey( 'caption', $properties );
		$this->assertArrayHasKey( 'raw', $properties['caption']['properties'] );
		$this->assertArrayHasKey( 'rendered', $properties['caption']['properties'] );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'raw', $properties['description']['properties'] );
		$this->assertArrayHasKey( 'rendered', $properties['description']['properties'] );
		$this->assertArrayHasKey( 'comment_status', $properties );
		$this->assertArrayHasKey( 'date', $properties );
		$this->assertArrayHasKey( 'date_gmt', $properties );
		$this->assertArrayHasKey( 'guid', $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'link', $properties );
		$this->assertArrayHasKey( 'media_type', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'mime_type', $properties );
		$this->assertArrayHasKey( 'media_details', $properties );
		$this->assertArrayHasKey( 'modified', $properties );
		$this->assertArrayHasKey( 'modified_gmt', $properties );
		$this->assertArrayHasKey( 'post', $properties );
		$this->assertArrayHasKey( 'ping_status', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'source_url', $properties );
		$this->assertArrayHasKey( 'template', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'raw', $properties['title']['properties'] );
		$this->assertArrayHasKey( 'rendered', $properties['title']['properties'] );
		$this->assertArrayHasKey( 'type', $properties );
	}

	public function test_get_additional_field_registration() {

		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'attachment', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
		) );

		$request = new WP_REST_Request( 'OPTIONS', '/wp/v2/media' );

		$response = $this->server->dispatch( $request );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'my_custom_int', $data['schema']['properties'] );
		$this->assertEquals( $schema, $data['schema']['properties']['my_custom_int'] );

		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
		) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $attachment_id );

		$response = $this->server->dispatch( $request );
		$this->assertArrayHasKey( 'my_custom_int', $response->data );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function test_additional_field_update_errors() {
		$schema = array(
			'type'        => 'integer',
			'description' => 'Some integer of mine',
			'enum'        => array( 1, 2, 3, 4 ),
			'context'     => array( 'view', 'edit' ),
		);

		register_rest_field( 'attachment', 'my_custom_int', array(
			'schema'          => $schema,
			'get_callback'    => array( $this, 'additional_field_get_callback' ),
			'update_callback' => array( $this, 'additional_field_update_callback' ),
		) );

		wp_set_current_user( self::$editor_id );
		$attachment_id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_excerpt'   => 'A sample caption',
			'post_author'    => self::$editor_id,
		) );
		// Check for error on update.
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/media/%d', $attachment_id ) );
		$request->set_body_params(array(
			'my_custom_int' => 'returnError',
		));

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );

		global $wp_rest_additional_fields;
		$wp_rest_additional_fields = array();
	}

	public function test_search_item_by_filename() {
		$id = $this->factory->attachment->create_object( $this->test_file, 0, array(
			'post_mime_type' => 'image/jpeg',
		) );
		$id2 = $this->factory->attachment->create_object( $this->test_file2, 0, array(
			'post_mime_type' => 'image/png',
		) );

		$filename = basename( $this->test_file2 );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'search', $filename );
		$response = $this->server->dispatch( $request );
		$data = $response->get_data();

		$this->assertCount( 1, $data );
		$this->assertEquals( $id2, $data[0]['id'] );
		$this->assertEquals( 'image/png', $data[0]['mime_type'] );
	}

	public function additional_field_get_callback( $object, $request ) {
		return 123;
	}

	public function additional_field_update_callback( $value, $attachment ) {
		if ( 'returnError' === $value ) {
			return new WP_Error( 'rest_invalid_param', 'Testing an error.', array( 'status' => 400 ) );
		}
	}

	public function tearDown() {
		parent::tearDown();
		if ( file_exists( $this->test_file ) ) {
			unlink( $this->test_file );
		}
		if ( file_exists( $this->test_file2 ) ) {
			unlink( $this->test_file2 );
		}

		$this->remove_added_uploads();
	}

	protected function check_post_data( $attachment, $data, $context = 'view', $links ) {
		parent::check_post_data( $attachment, $data, $context, $links );

		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertArrayNotHasKey( 'excerpt', $data );

		$this->assertEquals( get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true ), $data['alt_text'] );
		if ( 'edit' === $context ) {
			$this->assertEquals( $attachment->post_excerpt, $data['caption']['raw'] );
			$this->assertEquals( $attachment->post_content, $data['description']['raw'] );
		} else {
			$this->assertFalse( isset( $data['caption']['raw'] ) );
			$this->assertFalse( isset( $data['description']['raw'] ) );
		}
		$this->assertTrue( isset( $data['media_details'] ) );

		if ( $attachment->post_parent ) {
			$this->assertEquals( $attachment->post_parent, $data['post'] );
		} else {
			$this->assertNull( $data['post'] );
		}

		$this->assertEquals( wp_get_attachment_url( $attachment->ID ), $data['source_url'] );

	}

}
