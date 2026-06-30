<?php
/**
 * Tests for the experimental circle mask support shared by the Gutenberg
 * attachment REST controllers and the Gutenberg image editor subclasses.
 *
 * Covers:
 * - `_gutenberg_validate_image_mask_args()` argument validation.
 * - The `mask` modifier added to the `/edit` route schema.
 * - The image editor `mask()` implementation (GD or Imagick, whichever the
 *   environment provides).
 * - The controller routing: mask requests produce a transparent PNG, while
 *   non-mask requests delegate to Core unchanged.
 *
 * @group media
 */
class Gutenberg_Image_Editor_Mask_Test extends WP_UnitTestCase {
	/**
	 * @var int Administrator ID.
	 */
	protected static $admin_id;

	/**
	 * @var string[] Files to remove after each test.
	 */
	private $created_files = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();

		// Loads `_gutenberg_validate_image_mask_args()` and the editor subclasses.
		gutenberg_register_mask_image_editors( array() );
	}

	public function tear_down() {
		foreach ( $this->created_files as $file ) {
			if ( file_exists( $file ) ) {
				wp_delete_file( $file );
			}
		}
		$this->created_files = array();

		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * Requests a mask-capable image editor for the given file, registering the
	 * Gutenberg editors only for the duration of the selection — exactly as the
	 * controller does.
	 *
	 * @param string $file File path.
	 * @return WP_Image_Editor|WP_Error
	 */
	private function get_mask_editor( $file ) {
		add_filter( 'wp_image_editors', 'gutenberg_register_mask_image_editors' );
		$editor = wp_get_image_editor(
			$file,
			array(
				'methods'          => array( 'mask' ),
				'output_mime_type' => 'image/png',
			)
		);
		remove_filter( 'wp_image_editors', 'gutenberg_register_mask_image_editors' );

		return $editor;
	}

	public function test_validate_image_mask_args_accepts_circle() {
		$this->assertSame(
			array( 'shape' => 'circle' ),
			_gutenberg_validate_image_mask_args( array( 'shape' => 'circle' ) )
		);
	}

	public function test_validate_image_mask_args_rejects_unknown_shape() {
		$result = _gutenberg_validate_image_mask_args( array( 'shape' => 'triangle' ) );
		$this->assertWPError( $result );
		$this->assertSame( 'image_mask_unsupported', $result->get_error_code() );
	}

	public function test_validate_image_mask_args_rejects_non_array() {
		$this->assertWPError( _gutenberg_validate_image_mask_args( 'circle' ) );
	}

	/**
	 * The `/edit` route schema should advertise the `mask` modifier so requests
	 * with `{ type: 'mask', args: { shape: 'circle' } }` pass validation.
	 */
	public function test_edit_media_item_args_include_mask_modifier() {
		$controller = new Gutenberg_REST_Attachments_Controller_7_1( 'attachment' );

		$method = new ReflectionMethod( $controller, 'get_edit_media_item_args' );
		$method->setAccessible( true );
		$args = $method->invoke( $controller );

		$this->assertArrayHasKey( 'modifiers', $args );
		$one_of = $args['modifiers']['items']['oneOf'];

		$mask_schema = null;
		foreach ( $one_of as $schema ) {
			if ( isset( $schema['properties']['args']['properties']['shape'] ) ) {
				$mask_schema = $schema;
				break;
			}
		}

		$this->assertNotNull( $mask_schema, 'A mask modifier schema should be present.' );
		$this->assertSame( 'object', $mask_schema['type'] );
		$this->assertSame(
			array( 'circle' ),
			$mask_schema['properties']['args']['properties']['shape']['enum']
		);
	}

	/**
	 * Masking an opaque JPEG should produce a PNG with transparent corners and
	 * an opaque center. This also guards the JPEG-stays-opaque regression: the
	 * editor must enable an alpha channel before masking.
	 */
	public function test_mask_makes_corners_transparent_on_jpeg() {
		$uploads = wp_upload_dir();
		$source  = trailingslashit( $uploads['path'] ) . 'mask-source.jpg';
		copy( DIR_TESTDATA . '/images/canola.jpg', $source );
		$this->created_files[] = $source;

		$editor = $this->get_mask_editor( $source );
		if ( is_wp_error( $editor ) ) {
			$this->markTestSkipped( 'No mask-capable image editor is available.' );
		}

		$this->assertNotWPError( $editor->mask( array( 'shape' => 'circle' ) ) );

		$target                = trailingslashit( $uploads['path'] ) . 'mask-output.png';
		$saved                 = $editor->save( $target, 'image/png' );
		$this->created_files[] = $target;

		$this->assertNotWPError( $saved );
		$this->assertSame( 'image/png', $saved['mime-type'] );

		$image = imagecreatefrompng( $saved['path'] );
		$this->assertNotFalse( $image );

		$width  = imagesx( $image );
		$height = imagesy( $image );

		// Top-left corner is outside the inscribed circle: fully transparent (alpha 127).
		$corner_alpha = ( imagecolorat( $image, 0, 0 ) >> 24 ) & 0x7F;
		$this->assertSame( 127, $corner_alpha, 'Corner pixels should be fully transparent.' );

		// Center is inside the circle: opaque (alpha 0).
		$center_alpha = ( imagecolorat( $image, (int) ( $width / 2 ), (int) ( $height / 2 ) ) >> 24 ) & 0x7F;
		$this->assertSame( 0, $center_alpha, 'Center pixels should be opaque.' );

		imagedestroy( $image );
	}

	/**
	 * Exercises the GD scanline mask directly (the engine-agnostic test above
	 * may select Imagick when it is installed). Verifies corners clear, the
	 * center stays opaque, and the horizontal span fill clears pixels well
	 * outside the inscribed circle on the center row.
	 */
	public function test_gd_mask_clears_pixels_outside_circle() {
		if (
			! class_exists( 'Gutenberg_Image_Editor_GD' ) ||
			! Gutenberg_Image_Editor_GD::test( array( 'methods' => array( 'mask' ) ) )
		) {
			$this->markTestSkipped( 'GD mask support is not available.' );
		}

		$uploads = wp_upload_dir();
		$source  = trailingslashit( $uploads['path'] ) . 'gd-mask-source.jpg';
		copy( DIR_TESTDATA . '/images/canola.jpg', $source );
		$this->created_files[] = $source;

		$editor = new Gutenberg_Image_Editor_GD( $source );
		$this->assertNotWPError( $editor->load() );
		$this->assertNotWPError( $editor->mask( array( 'shape' => 'circle' ) ) );

		$target                = trailingslashit( $uploads['path'] ) . 'gd-mask-output.png';
		$saved                 = $editor->save( $target, 'image/png' );
		$this->created_files[] = $target;
		$this->assertNotWPError( $saved );

		$image = imagecreatefrompng( $saved['path'] );
		$this->assertNotFalse( $image );

		$width  = imagesx( $image );
		$height = imagesy( $image );
		$radius = (int) ( min( $width, $height ) / 2 );

		$alpha_at = static function ( $x, $y ) use ( $image ) {
			return ( imagecolorat( $image, $x, $y ) >> 24 ) & 0x7F;
		};

		// Corner: outside the circle, fully transparent.
		$this->assertSame( 127, $alpha_at( 0, 0 ), 'Corner pixels should be transparent.' );

		// Center row, beyond the radius: cleared by the horizontal span fill.
		$outside_x = (int) ( $width / 2 ) + $radius + 5;
		$this->assertLessThan( $width, $outside_x );
		$this->assertSame( 127, $alpha_at( $outside_x, (int) ( $height / 2 ) ), 'Pixels outside the circle on the center row should be transparent.' );

		// Center: inside the circle, opaque.
		$this->assertSame( 0, $alpha_at( (int) ( $width / 2 ), (int) ( $height / 2 ) ), 'Center pixels should be opaque.' );

		imagedestroy( $image );
	}

	/**
	 * A circle mask edit request should create a new transparent PNG attachment.
	 */
	public function test_edit_media_item_with_circle_mask_creates_png() {
		wp_set_current_user( self::$admin_id );

		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/edit" );
		$request->set_body_params(
			array(
				'src'       => wp_get_attachment_image_url( $attachment_id, 'full' ),
				'modifiers' => array(
					array(
						'type' => 'crop',
						'args' => array(
							'left'   => 10,
							'top'    => 10,
							'width'  => 50,
							'height' => 50,
						),
					),
					array(
						'type' => 'mask',
						'args' => array( 'shape' => 'circle' ),
					),
				),
			)
		);

		$response = rest_do_request( $request );
		$data     = $response->get_data();

		if ( 500 === $response->get_status() && isset( $data['code'] ) && 'rest_image_mask_unsupported' === $data['code'] ) {
			$this->markTestSkipped( 'No mask-capable image editor is available.' );
		}

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'image/png', $data['mime_type'] );
		$this->assertStringEndsWith( '.png', $data['source_url'] );
	}

	/**
	 * When the site's output-format filter targets an alpha-capable format
	 * (e.g. WebP), a masked edit should honor it rather than forcing PNG.
	 */
	public function test_edit_media_item_with_mask_honors_alpha_capable_output_format() {
		$editor = $this->get_mask_editor( DIR_TESTDATA . '/images/canola.jpg' );
		if ( is_wp_error( $editor ) || ! $editor->supports_mime_type( 'image/webp' ) ) {
			$this->markTestSkipped( 'The image editor cannot output WebP.' );
		}

		wp_set_current_user( self::$admin_id );

		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

		$to_webp = static function () {
			return array( 'image/jpeg' => 'image/webp' );
		};
		add_filter( 'image_editor_output_format', $to_webp );

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/edit" );
		$request->set_body_params(
			array(
				'src'       => wp_get_attachment_image_url( $attachment_id, 'full' ),
				'modifiers' => array(
					array(
						'type' => 'mask',
						'args' => array( 'shape' => 'circle' ),
					),
				),
			)
		);

		$response = rest_do_request( $request );

		remove_filter( 'image_editor_output_format', $to_webp );

		$data = $response->get_data();
		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'image/webp', $data['mime_type'] );
		$this->assertStringEndsWith( '.webp', $data['source_url'] );
	}

	/**
	 * Regression guard: an edit request without a mask modifier must delegate to
	 * Core and keep the original (non-PNG) output format.
	 */
	public function test_edit_media_item_without_mask_delegates_to_core() {
		wp_set_current_user( self::$admin_id );

		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/$attachment_id/edit" );
		$request->set_body_params(
			array(
				'src'       => wp_get_attachment_image_url( $attachment_id, 'full' ),
				'modifiers' => array(
					array(
						'type' => 'crop',
						'args' => array(
							'left'   => 10,
							'top'    => 10,
							'width'  => 50,
							'height' => 50,
						),
					),
				),
			)
		);

		$response = rest_do_request( $request );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'image/jpeg', $response->get_data()['mime_type'] );
	}
}
