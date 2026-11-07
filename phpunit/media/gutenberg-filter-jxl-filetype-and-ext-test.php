<?php
/**
 * Tests for gutenberg_filter_jxl_filetype_and_ext().
 *
 * @group media
 * @covers ::gutenberg_filter_jxl_filetype_and_ext
 */
class Gutenberg_Filter_JXL_Filetype_And_Ext_Test extends WP_UnitTestCase {

	/**
	 * Copy of a real JPEG XL file, named with its .jxl extension.
	 *
	 * @var string
	 */
	private $jxl_file;

	public function set_up(): void {
		parent::set_up();

		$this->jxl_file = wp_tempnam( 'photo.jxl' );
		copy( dirname( __DIR__, 2 ) . '/test/e2e/assets/200x150_e2e_test_image_decode.jxl', $this->jxl_file );
	}

	public function tear_down(): void {
		if ( file_exists( $this->jxl_file ) ) {
			unlink( $this->jxl_file );
		}

		parent::tear_down();
	}

	public function test_allows_a_jxl_upload_when_jxl_is_an_allowed_type(): void {
		$result = wp_check_filetype_and_ext( $this->jxl_file, 'photo.jxl' );

		$this->assertSame( 'jxl', $result['ext'] );
		$this->assertSame( 'image/jxl', $result['type'] );
	}

	/**
	 * A site that removes JXL from its upload types, like a network's
	 * "Upload file types" setting does, must not have it restored.
	 */
	public function test_rejects_a_jxl_upload_when_the_site_disallows_jxl(): void {
		$remove_jxl = static function ( array $mimes ): array {
			unset( $mimes['jxl'] );
			return $mimes;
		};
		add_filter( 'upload_mimes', $remove_jxl, 20 );

		$result = wp_check_filetype_and_ext( $this->jxl_file, 'photo.jxl' );

		$this->assertFalse( $result['ext'] );
		$this->assertFalse( $result['type'] );
	}

	public function test_rejects_a_jxl_upload_when_the_passed_mimes_exclude_jxl(): void {
		$result = wp_check_filetype_and_ext( $this->jxl_file, 'photo.jxl', array( 'jpg|jpeg|jpe' => 'image/jpeg' ) );

		$this->assertFalse( $result['ext'] );
		$this->assertFalse( $result['type'] );
	}

	public function test_ignores_a_file_that_is_not_a_jxl(): void {
		$not_jxl = wp_tempnam( 'fake.jxl' );
		file_put_contents( $not_jxl, 'not a jpeg xl image' );

		$result = wp_check_filetype_and_ext( $not_jxl, 'fake.jxl' );
		unlink( $not_jxl );

		$this->assertFalse( $result['type'] );
	}

	/**
	 * @covers ::gutenberg_is_jxl_file
	 */
	public function test_does_not_sniff_a_jxl_container_without_a_codestream_as_jxl(): void {
		$container = wp_tempnam( 'empty.jxl' );
		file_put_contents( $container, "\x00\x00\x00\x0C\x4A\x58\x4C\x20\x0D\x0A\x87\x0A\x00\x00\x00\x14ftypjxl \x00\x00\x00\x00jxl " );

		$is_jxl = gutenberg_is_jxl_file( $container );
		unlink( $container );

		$this->assertFalse( $is_jxl );
	}

	/**
	 * Core does not type the filename, and some callers pass null.
	 */
	public function test_passes_through_a_filename_that_is_not_a_string(): void {
		$data = array(
			'ext'             => false,
			'type'            => false,
			'proper_filename' => false,
		);

		$this->assertSame( $data, gutenberg_filter_jxl_filetype_and_ext( $data, $this->jxl_file, null ) );
	}

	/**
	 * A network's "Upload file types" setting must still decide whether JXL
	 * is allowed, so JXL has to be registered before check_upload_mimes().
	 *
	 * @group ms-required
	 */
	public function test_respects_the_network_upload_file_types(): void {
		$original = get_site_option( 'upload_filetypes' );

		update_site_option( 'upload_filetypes', 'jpg jpeg png' );
		$without_jxl = get_allowed_mime_types();

		update_site_option( 'upload_filetypes', 'jpg jpeg png jxl' );
		$with_jxl = get_allowed_mime_types();

		update_site_option( 'upload_filetypes', $original );

		$this->assertArrayNotHasKey( 'jxl', $without_jxl );
		$this->assertSame( 'image/jxl', $with_jxl['jxl'] ?? null );
	}
}
