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
}
