<?php
/**
 * Tests for gutenberg_get_jxl_info() and gutenberg_add_jxl_attachment_metadata().
 *
 * @group media
 * @covers ::gutenberg_get_jxl_info
 * @covers ::gutenberg_add_jxl_attachment_metadata
 */
class Gutenberg_Get_JXL_Info_Test extends WP_UnitTestCase {

	/**
	 * Temporary files written by a test.
	 *
	 * @var string[]
	 */
	private $temp_files = array();

	public function tear_down(): void {
		foreach ( $this->temp_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
		}

		parent::tear_down();
	}

	/**
	 * @dataProvider data_fixtures
	 *
	 * @param string $fixture JXL fixture in test/e2e/assets.
	 */
	public function test_reads_the_dimensions_of_a_jxl( string $fixture ): void {
		$info = gutenberg_get_jxl_info( dirname( __DIR__, 2 ) . '/test/e2e/assets/' . $fixture );

		$this->assertSame(
			array(
				'width'  => 200,
				'height' => 150,
			),
			$info
		);
	}

	/**
	 * @return array<string, array{string}>
	 */
	public function data_fixtures(): array {
		return array(
			'naked codestream'    => array( '200x150_e2e_test_image_decode.jxl' ),
			'ISOBMFF container'   => array( '200x150_e2e_test_image_hdr.jxl' ),
			'gain map codestream' => array( '200x150_e2e_test_image_gainmap.jxl' ),
		);
	}

	public function test_reads_dimensions_stored_as_multiples_of_eight(): void {
		// div8 = 1, height 16, ratio 0, width 64, no extra fields.
		$info = gutenberg_get_jxl_info( $this->write_temp_file( "\xFF\x0A\x03\x0E\x00" ) );

		$this->assertSame(
			array(
				'width'  => 64,
				'height' => 16,
			),
			$info
		);
	}

	public function test_swaps_the_dimensions_for_a_transposing_orientation(): void {
		// The 64x16 image above, with orientation 6 (rotate 90 degrees).
		$info = gutenberg_get_jxl_info( $this->write_temp_file( "\xFF\x0A\x03\x8E\x05" ) );

		$this->assertSame(
			array(
				'width'  => 16,
				'height' => 64,
			),
			$info
		);
	}

	public function test_returns_false_for_a_file_that_is_not_a_jxl(): void {
		$this->assertFalse( gutenberg_get_jxl_info( DIR_TESTDATA . '/images/canola.jpg' ) );
	}

	public function test_returns_false_for_a_container_without_a_codestream(): void {
		$container = "\x00\x00\x00\x0C\x4A\x58\x4C\x20\x0D\x0A\x87\x0A\x00\x00\x00\x14ftypjxl \x00\x00\x00\x00jxl ";

		$this->assertFalse( gutenberg_get_jxl_info( $this->write_temp_file( $container ) ) );
	}

	public function test_returns_false_for_a_missing_file(): void {
		$this->assertFalse( gutenberg_get_jxl_info( '/nonexistent/photo.jxl' ) );
	}

	public function test_records_the_dimensions_of_an_uploaded_jxl(): void {
		$attachment_id = self::factory()->attachment->create_upload_object(
			dirname( __DIR__, 2 ) . '/test/e2e/assets/200x150_e2e_test_image_decode.jxl'
		);

		$metadata = wp_get_attachment_metadata( $attachment_id );

		$this->assertSame( 'image/jxl', get_post_mime_type( $attachment_id ) );
		$this->assertSame( 200, $metadata['width'] );
		$this->assertSame( 150, $metadata['height'] );
		$this->assertSame( _wp_relative_upload_path( get_attached_file( $attachment_id ) ), $metadata['file'] );
		$this->assertSame( array(), $metadata['sizes'] );
	}

	public function test_leaves_the_metadata_of_other_images_alone(): void {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$metadata      = array( 'filesize' => 1 );

		$this->assertSame( $metadata, gutenberg_add_jxl_attachment_metadata( $metadata, $attachment_id ) );
	}

	/**
	 * Writes bytes to a temporary file that is removed after the test.
	 *
	 * @param string $bytes File contents.
	 * @return string Path to the file.
	 */
	private function write_temp_file( string $bytes ): string {
		$file = wp_tempnam( 'photo.jxl' );
		file_put_contents( $file, $bytes );
		$this->temp_files[] = $file;
		return $file;
	}
}
