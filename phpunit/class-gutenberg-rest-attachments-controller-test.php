<?php
/**
 * Unit tests covering Gutenberg_REST_Attachments_Controller_Test functionality.
 *
 * @package Gutenberg
 *
 * @covers Gutenberg_REST_Attachments_Controller_Test
 */
class Gutenberg_REST_Attachments_Controller_Test extends WP_Test_REST_Post_Type_Controller_Testcase {
	/**
	 * @var int Administrator ID.
	 */
	protected static $admin_id;

	/**
	 * @var string The path to a test file.
	 */
	private static $test_file;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		if ( file_exists( self::$test_file ) ) {
			unlink( self::$test_file );
		}
	}

	public function set_up() {
		parent::set_up();
		$this->remove_added_uploads();
		self::$test_file = get_temp_dir() . 'canola.jpg';
		if ( ! file_exists( self::$test_file ) ) {
			copy( DIR_TESTDATA . '/images/canola.jpg', self::$test_file );
		}
	}

	public function tear_down() {
		$this->remove_added_uploads();

		if ( class_exists( WP_Image_Editor_Mock::class ) ) {
			WP_Image_Editor_Mock::$spy         = array();
			WP_Image_Editor_Mock::$edit_return = array();
			WP_Image_Editor_Mock::$size_return = null;
		}

		parent::tear_down();
	}

	/**
	 * Sets up the mock image editor.
	 *
	 * @since 5.5.0
	 */
	protected function setup_mock_editor() {
		require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
		require_once DIR_TESTDATA . '/../includes/mock-image-editor.php';

		add_filter(
			'wp_image_editors',
			static function () {
				return array( 'WP_Image_Editor_Mock' );
			}
		);
	}

	/**
	 * Tests that the attachment fields caption, description, and title, post and alt_text are updated correctly.
	 * @ticket ???
	 * @requires function imagejpeg
	 */
	public function test_edit_image_updates_attachment_fields() {
		wp_set_current_user( self::$admin_id );
		$attachment = self::factory()->attachment->create_upload_object( self::$test_file );

		// In order to test the edit endpoint editable fields, we need to create a new attachment.
		$params = array(
			'src'         => wp_get_attachment_image_url( $attachment, 'full' ),
			'modifiers'   => array(
				array(
					'type' => 'crop',
					'args' => array(
						'left'   => 10,
						'top'    => 10,
						'width'  => 80,
						'height' => 80,
					),
				),
			),
			'caption'     => 'Test Caption',
			'description' => 'Test Description',
			'title'       => 'Test Title',
			'post'        => 1,
			'alt_text'    => 'Test Alt Text',
		);

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/{$attachment}/edit" );
		$request->set_body_params( $params );
		$response = rest_do_request( $request );

		// The edit endpoint creates a new attachment, so we expect a 201 status
		$this->assertEquals( 201, $response->get_status() );

		// Get the response data to find the new attachment ID
		$data              = $response->get_data();
		$new_attachment_id = $data['id'];

		// Get the updated attachment post
		$updated_attachment = get_post( $new_attachment_id );

		// Title is stored in post_title field
		$this->assertSame( 'Test Title', $updated_attachment->post_title );

		// Caption is stored in post_excerpt field
		$this->assertSame( 'Test Caption', $updated_attachment->post_excerpt );

		// Description is stored in post_content field
		$this->assertSame( 'Test Description', $updated_attachment->post_content );

		// Post parent is stored in post_parent field
		$this->assertSame( 1, $updated_attachment->post_parent );

		// Alt text is stored in post meta
		$this->assertSame( 'Test Alt Text', get_post_meta( $new_attachment_id, '_wp_attachment_image_alt', true ) );
	}

	/**
	 * Tests that the image is flipped correctly.
	 *
	 * @ticket ???
	 * @requires function imagejpeg
	 */
	public function test_edit_image_flip() {
		wp_set_current_user( self::$admin_id );
		$attachment = self::factory()->attachment->create_upload_object( self::$test_file );

		$this->setup_mock_editor();
		WP_Image_Editor_Mock::$edit_return['flip'] = new WP_Error();

		$params = array(
			'flip' => array(
				'vertical'   => 1,
				'horizontal' => 1,
			),
			'src'  => wp_get_attachment_image_url( $attachment, 'full' ),
		);

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/{$attachment}/edit" );
		$request->set_body_params( $params );
		$response = rest_do_request( $request );
		$this->assertErrorResponse( 'rest_image_flip_failed', $response, 500 );

		$this->assertCount( 1, WP_Image_Editor_Mock::$spy['flip'] );
		// The controller converts the integer values to booleans: 0 !== (int) 1 = true
		$this->assertSame( array( true, true ), WP_Image_Editor_Mock::$spy['flip'][0] );
	}

	public function test_register_routes() {
		$this->markTestSkipped( 'No need to implement' );
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

	public function test_create_item() {
		$this->markTestSkipped( 'No need to implement' );
	}

	public function test_prepare_item() {
		$this->markTestSkipped( 'No need to implement' );
	}
}
