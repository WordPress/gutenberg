<?php

/**
 * Tests for experimental client-side media processing.
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
		$this->assertArrayHasKey( 'image_output_formats', $data );
		$this->assertArrayHasKey( 'jpeg_interlaced', $data );
		$this->assertArrayHasKey( 'png_interlaced', $data );
		$this->assertArrayHasKey( 'gif_interlaced', $data );
		$this->assertArrayHasKey( 'image_sizes', $data );
	}

	/**
	 * @covers ::gutenberg_add_crossorigin_attributes
	 */
	public function test_add_crossorigin_attributes() {
		$html = <<<HTML
<img src="https://www.someothersite.com/test1.jpg" />
<img src="test2.jpg" />
<audio><source src="https://www.someothersite.com/test1.mp3"></audio>
<audio src="https://www.someothersite.com/test1.mp3"></audio>
<audio src="/test2.mp3"></audio>
<video><source src="https://www.someothersite.com/test1.mp4"></video>
<video src="https://www.someothersite.com/test1.mp4"></video>
<video src="/test2.mp4"></video>
<script src="https://www.someothersite.com/test1.js"></script>
<script src="/test2.js"></script>
<link href="https://www.someothersite.com/test1.css"></link>
<link href="/test2.css"></link>
HTML;

		$expected = <<<HTML
<img crossorigin="anonymous" src="https://www.someothersite.com/test1.jpg" />
<img crossorigin="anonymous" src="test2.jpg" />
<audio crossorigin="anonymous"><source src="https://www.someothersite.com/test1.mp3"></audio>
<audio crossorigin="anonymous" src="https://www.someothersite.com/test1.mp3"></audio>
<audio src="/test2.mp3"></audio>
<video crossorigin="anonymous"><source src="https://www.someothersite.com/test1.mp4"></video>
<video crossorigin="anonymous" src="https://www.someothersite.com/test1.mp4"></video>
<video src="/test2.mp4"></video>
<script crossorigin="anonymous" src="https://www.someothersite.com/test1.js"></script>
<script src="/test2.js"></script>
<link crossorigin="anonymous" href="https://www.someothersite.com/test1.css"></link>
<link href="/test2.css"></link>
HTML;

		$actual = gutenberg_add_crossorigin_attributes( $html );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @covers ::gutenberg_override_media_templates
	 */
	public function test_gutenberg_override_media_templates(): void {
		if ( ! function_exists( '\wp_print_media_templates' ) ) {
			require_once ABSPATH . WPINC . '/media-template.php';
		}

		gutenberg_override_media_templates();

		ob_start();
		do_action( 'admin_footer' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$output = ob_get_clean();

		$this->assertStringContainsString( '<audio crossorigin="anonymous"', $output );
		$this->assertStringContainsString( '<img crossorigin="anonymous"', $output );
		$this->assertStringContainsString( '<video crossorigin="anonymous"', $output );
	}
}
