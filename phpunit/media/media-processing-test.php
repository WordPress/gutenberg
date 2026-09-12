<?php

/**
 * Tests for client-side media processing.
 *
 * Client-side media processing is a core feature that uses the browser's
 * capabilities to handle tasks like image resizing and compression before
 * uploading to the server. It can be disabled via the
 * 'wp_client_side_media_processing_enabled' filter or checked using
 * the gutenberg_is_client_side_media_processing_enabled() helper function.
 */
class Media_Processing_Test extends WP_UnitTestCase {
	/**
	 * @var int Administrator ID.
	 */
	protected static $admin_id;

	/**
	 * @var string Image file path.
	 */
	private static $image_file;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public function set_up() {
		parent::set_up();

		self::$image_file = get_temp_dir() . 'canola.jpg';
		if ( ! file_exists( self::$image_file ) ) {
			copy( DIR_TESTDATA . '/images/canola.jpg', self::$image_file );
		}
	}

	public function tear_down() {
		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * @covers gutenberg_get_all_image_sizes
	 */
	public function test_get_all_image_sizes() {
		$sizes = gutenberg_get_all_image_sizes();
		$this->assertNotEmpty( $sizes );
		foreach ( $sizes as $size ) {
			$this->assertIsInt( $size['width'] );
			$this->assertIsInt( $size['height'] );
			$this->assertIsString( $size['name'] );
		}
	}

	/**
	 * @covers gutenberg_filter_attachment_post_type_args
	 */
	public function test_filter_attachment_post_type_args() {
		$post_type_object = get_post_type_object( 'attachment' );
		$this->assertInstanceOf( Gutenberg_REST_Attachments_Controller::class, $post_type_object->get_rest_controller() );

		$this->assertSame(
			array( 'rest_controller_class' => Gutenberg_REST_Attachments_Controller::class ),
			gutenberg_filter_attachment_post_type_args( array(), 'attachment' )
		);
		$this->assertSame(
			array(),
			gutenberg_filter_attachment_post_type_args( array(), 'post' )
		);
	}

	/**
	 * @covers ::gutenberg_rest_get_attachment_filesize
	 */
	public function test_rest_get_attachment_filesize() {
		$attachment_id = self::factory()->attachment->create_object(
			self::$image_file,
			0,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_excerpt'   => 'A sample caption',
			)
		);

		$this->assertSame( wp_filesize( self::$image_file ), gutenberg_rest_get_attachment_filesize( array( 'id' => $attachment_id ) ) );
	}

	/**
	 * @covers ::gutenberg_rest_get_attachment_filename
	 */
	public function test_rest_get_attachment_filename() {
		$attachment_id = self::factory()->attachment->create_object(
			self::$image_file,
			0,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_excerpt'   => 'A sample caption',
			)
		);

		$this->assertSame( 'canola.jpg', gutenberg_rest_get_attachment_filename( array( 'id' => $attachment_id ) ) );
	}

	/**
	 * @covers ::gutenberg_media_processing_filter_rest_index
	 */
	public function test_get_rest_index_should_return_additional_settings() {
		$server = new WP_REST_Server();

		$request = new WP_REST_Request( 'GET', '/' );
		$index   = $server->dispatch( $request );
		$data    = $index->get_data();

		$this->assertArrayNotHasKey( 'image_size_threshold', $data );
		$this->assertArrayNotHasKey( 'image_output_formats', $data );
		$this->assertArrayNotHasKey( 'jpeg_interlaced', $data );
		$this->assertArrayNotHasKey( 'png_interlaced', $data );
		$this->assertArrayNotHasKey( 'gif_interlaced', $data );
		$this->assertArrayNotHasKey( 'image_sizes', $data );
		$this->assertArrayNotHasKey( 'image_strip_meta', $data );
		$this->assertArrayNotHasKey( 'image_max_bit_depth', $data );
	}

	/**
	 * @covers ::gutenberg_media_processing_filter_rest_index
	 */
	public function test_get_rest_index_should_return_additional_settings_can_upload_files() {
		wp_set_current_user( self::$admin_id );

		$server = new WP_REST_Server();

		$request = new WP_REST_Request( 'GET', '/' );
		$index   = $server->dispatch( $request );
		$data    = $index->get_data();

		$this->assertArrayHasKey( 'image_size_threshold', $data );
		/*
		 * TODO: Reactivate these assertions once the Core PR below merges into trunk:
		 * https://github.com/WordPress/wordpress-develop/pull/12007
		 *
		 * Core's re-introduced client-side media processing still exposes these
		 * file-less output-format settings on the REST API root index. PR #12007
		 * removes them in favor of the per-attachment `image_output_format` and
		 * `image_save_progressive` response fields (completing the migration from
		 * Gutenberg #75793). Until that lands in Core, these keys are present when
		 * running against Core trunk, so the assertions are temporarily disabled.
		 */
		// $this->assertArrayNotHasKey( 'image_output_formats', $data );
		// $this->assertArrayNotHasKey( 'jpeg_interlaced', $data );
		// $this->assertArrayNotHasKey( 'png_interlaced', $data );
		// $this->assertArrayNotHasKey( 'gif_interlaced', $data );
		$this->assertArrayHasKey( 'image_sizes', $data );
		$this->assertArrayHasKey( 'image_strip_meta', $data );
		$this->assertTrue( $data['image_strip_meta'] );
		$this->assertArrayHasKey( 'image_max_bit_depth', $data );
		$this->assertSame( 16, $data['image_max_bit_depth'] );
	}

	/**
	 * @covers ::gutenberg_media_processing_filter_rest_index
	 */
	public function test_get_rest_index_honors_image_strip_meta_filter() {
		wp_set_current_user( self::$admin_id );

		add_filter( 'image_strip_meta', '__return_false' );

		$server = new WP_REST_Server();

		$request = new WP_REST_Request( 'GET', '/' );
		$index   = $server->dispatch( $request );
		$data    = $index->get_data();

		$this->assertFalse( $data['image_strip_meta'] );
	}

	/**
	 * @covers ::gutenberg_media_processing_filter_rest_index
	 */
	public function test_get_rest_index_honors_image_max_bit_depth_filter() {
		wp_set_current_user( self::$admin_id );

		add_filter(
			'image_max_bit_depth',
			static function ( $max_depth ) {
				return min( 8, $max_depth );
			}
		);

		$server = new WP_REST_Server();

		$request = new WP_REST_Request( 'GET', '/' );
		$index   = $server->dispatch( $request );
		$data    = $index->get_data();

		$this->assertSame( 8, $data['image_max_bit_depth'] );
	}

	/**
	 * Tests that the media template processing strips the crossorigin
	 * attribute WordPress 7.1 forces onto AUDIO, IMG, and VIDEO tags, leaves
	 * other crossorigin values alone, and does not touch non-template scripts.
	 *
	 * @covers ::gutenberg_remove_media_template_crossorigin_attributes
	 */
	public function test_gutenberg_remove_media_template_crossorigin_attributes(): void {
		$html = <<<HTML
<script type="text/html" id="tmpl-test-media">
	<img crossorigin="anonymous" src="{{ data.url }}" draggable="false" alt="" />
	<audio crossorigin="anonymous" controls src="{{ data.url }}"></audio>
	<audio crossorigin="use-credentials" controls src="{{ data.url }}"></audio>
	<video crossorigin="anonymous" controls src="{{ data.url }}"></video>
</script>
<script type="text/javascript">var notATemplate = '<img crossorigin="anonymous" src="test.jpg" />';</script>
HTML;

		$actual = gutenberg_remove_media_template_crossorigin_attributes( $html );

		$this->assertSame(
			2,
			substr_count( $actual, 'crossorigin' ),
			'Only the use-credentials value and the non-template script should keep a crossorigin attribute.'
		);
		$this->assertStringContainsString(
			'<audio crossorigin="use-credentials" controls src="{{ data.url }}"></audio>',
			$actual,
			'Other crossorigin values must be preserved.'
		);
		$this->assertStringContainsString(
			"var notATemplate = '<img crossorigin=\"anonymous\" src=\"test.jpg\" />';",
			$actual,
			'Script tags that are not text/html templates must not be modified.'
		);
	}

	/**
	 * Tests that client-side media processing is enabled by default in the Gutenberg plugin.
	 *
	 * @covers ::gutenberg_is_client_side_media_processing_enabled
	 */
	public function test_client_side_media_processing_enabled_by_default_in_plugin() {
		$this->assertTrue( gutenberg_is_client_side_media_processing_enabled() );
	}

	/**
	 * Tests that client-side media processing can be disabled via filter.
	 *
	 * @covers ::gutenberg_is_client_side_media_processing_enabled
	 */
	public function test_client_side_media_processing_can_be_disabled_via_filter() {
		add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
		$this->assertFalse( gutenberg_is_client_side_media_processing_enabled() );
		remove_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
	}

	/**
	 * Tests that the 7.1 compat REST controller is used when filter disables client-side media.
	 *
	 * @covers ::gutenberg_override_attachments_rest_controller
	 */
	public function test_compat_rest_controller_used_when_filter_disabled() {
		add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );

		$result = gutenberg_override_attachments_rest_controller( array(), 'attachment' );

		remove_filter( 'wp_client_side_media_processing_enabled', '__return_false' );

		$this->assertSame(
			array( 'rest_controller_class' => 'Gutenberg_REST_Attachments_Controller_7_1' ),
			$result
		);
	}

	/**
	 * Tests that the 7.1 compat REST controller is not used when filter is enabled.
	 *
	 * @covers ::gutenberg_override_attachments_rest_controller
	 */
	public function test_compat_rest_controller_not_used_when_filter_enabled() {
		// Feature is enabled by default (core compat layer).
		$result = gutenberg_override_attachments_rest_controller( array(), 'attachment' );

		$this->assertSame( array(), $result );
	}
}
