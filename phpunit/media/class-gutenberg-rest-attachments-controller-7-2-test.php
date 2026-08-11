<?php
/**
 * Tests for the `resize` image modifier added by
 * Gutenberg_REST_Attachments_Controller_7_2.
 *
 * These run real image processing rather than a mock editor, so they assert
 * the dimensions actually written to disk and recorded in the new
 * attachment's metadata.
 *
 * @coversDefaultClass \Gutenberg_REST_Attachments_Controller_7_2
 */
class Gutenberg_REST_Attachments_Controller_7_2_Test extends WP_Test_REST_TestCase {

	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Source image. 640x480.
	 *
	 * @var string
	 */
	protected static $test_file;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$test_file = DIR_TESTDATA . '/images/canola.jpg';
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		$this->remove_added_uploads();
		parent::tear_down();
	}

	/**
	 * Posts modifiers to the `/edit` route for a freshly uploaded image.
	 *
	 * @param array $modifiers Modifiers to send.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	private function edit_test_image( $modifiers ) {
		$attachment_id = self::factory()->attachment->create_upload_object( self::$test_file );

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/{$attachment_id}/edit" );
		$request->set_body_params(
			array(
				'src'       => wp_get_attachment_image_url( $attachment_id, 'full' ),
				'modifiers' => $modifiers,
			)
		);

		return rest_do_request( $request );
	}

	/**
	 * Reads the width and height recorded for an edited attachment.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array{0:int,1:int} Width and height.
	 */
	private function get_saved_dimensions( $attachment_id ) {
		$meta = wp_get_attachment_metadata( $attachment_id );
		return array( (int) $meta['width'], (int) $meta['height'] );
	}

	/**
	 * The controller Gutenberg registers for the media route must inherit the
	 * `resize` support, otherwise the modifier is silently unavailable.
	 *
	 * @covers ::edit_media_item
	 */
	public function test_registered_attachments_controller_supports_resize() {
		$post_type = get_post_type_object( 'attachment' );

		$this->assertTrue(
			is_a( $post_type->rest_controller_class, 'Gutenberg_REST_Attachments_Controller_7_2', true ),
			'The controller serving /wp/v2/media does not extend the 7.2 controller.'
		);
	}

	/**
	 * @covers ::edit_media_item
	 */
	public function test_resize_scales_the_saved_image_down() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'resize',
					'args' => array(
						'width'  => 320,
						'height' => 240,
					),
				),
			)
		);

		$this->assertSame( 201, $response->get_status() );

		$this->assertSame(
			array( 320, 240 ),
			$this->get_saved_dimensions( $response->get_data()['id'] )
		);
	}

	/**
	 * A resize is an edit in its own right, so it must produce a new
	 * attachment rather than being pruned as a no-op.
	 *
	 * @covers ::edit_media_item
	 */
	public function test_resize_alone_creates_a_new_attachment() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'resize',
					'args' => array(
						'width'  => 200,
						'height' => 150,
					),
				),
			)
		);

		$data = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertNotEmpty( $data['id'] );
		$this->assertStringContainsString( '-edited', $data['media_details']['file'] );
	}

	/**
	 * Enlarging cannot add detail, so it is refused. Matches the rule the
	 * classic Edit Image screen applies.
	 *
	 * @covers ::edit_media_item
	 */
	public function test_resize_larger_than_the_source_is_rejected() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'resize',
					'args' => array(
						'width'  => 1280,
						'height' => 960,
					),
				),
			)
		);

		$this->assertErrorResponse( 'rest_image_resize_too_large', $response, 400 );
	}

	/**
	 * Only one side needs to exceed the source for the request to be refused.
	 *
	 * @covers ::edit_media_item
	 */
	public function test_resize_larger_on_one_axis_is_rejected() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'resize',
					'args' => array(
						'width'  => 700,
						'height' => 240,
					),
				),
			)
		);

		$this->assertErrorResponse( 'rest_image_resize_too_large', $response, 400 );
	}

	/**
	 * Crop arguments are percentages, so a preceding resize scales the source
	 * without moving where the crop lands. 640x480 scaled to 320x240, then the
	 * top-left quarter cropped, is 160x120.
	 *
	 * @covers ::edit_media_item
	 */
	public function test_resize_applies_before_a_following_crop() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'resize',
					'args' => array(
						'width'  => 320,
						'height' => 240,
					),
				),
				array(
					'type' => 'crop',
					'args' => array(
						'left'   => 0,
						'top'    => 0,
						'width'  => 50,
						'height' => 50,
					),
				),
			)
		);

		$this->assertSame( 201, $response->get_status() );

		$this->assertSame(
			array( 160, 120 ),
			$this->get_saved_dimensions( $response->get_data()['id'] )
		);
	}

	/**
	 * Requests without a resize modifier are handed to core untouched.
	 *
	 * @covers ::edit_media_item
	 */
	public function test_crop_without_resize_still_works() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'crop',
					'args' => array(
						'left'   => 0,
						'top'    => 0,
						'width'  => 50,
						'height' => 50,
					),
				),
			)
		);

		$this->assertSame( 201, $response->get_status() );

		$this->assertSame(
			array( 320, 240 ),
			$this->get_saved_dimensions( $response->get_data()['id'] )
		);
	}

	/**
	 * @covers ::get_edit_media_item_args
	 */
	public function test_resize_modifier_is_advertised_in_the_schema() {
		$routes = rest_get_server()->get_routes();
		$route  = $routes['/wp/v2/media/(?P<id>[\d]+)/edit'][0];

		$titles = wp_list_pluck( $route['args']['modifiers']['items']['oneOf'], 'title' );

		$this->assertContains( 'Resize', $titles );
	}

	/**
	 * An unknown modifier type is still rejected by schema validation.
	 *
	 * @covers ::get_edit_media_item_args
	 */
	public function test_unknown_modifier_type_is_rejected() {
		$response = $this->edit_test_image(
			array(
				array(
					'type' => 'sharpen',
					'args' => array( 'amount' => 5 ),
				),
			)
		);

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
	}
}
