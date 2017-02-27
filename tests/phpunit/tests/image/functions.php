<?php

/**
 * @group image
 * @group media
 * @group upload
 */
class Tests_Image_Functions extends WP_UnitTestCase {

	/**
	 * Setup test fixture
	 */
	public function setUp() {
		parent::setUp();

		require_once( ABSPATH . WPINC . '/class-wp-image-editor.php' );
		require_once( ABSPATH . WPINC . '/class-wp-image-editor-gd.php' );
		require_once( ABSPATH . WPINC . '/class-wp-image-editor-imagick.php' );

		include_once( DIR_TESTDATA . '/../includes/mock-image-editor.php' );

		// Ensure no legacy / failed tests detritus.
		$folder = '/tmp/wordpress-gsoc-flyer*.{jpg,pdf}';

		foreach ( glob( $folder, GLOB_BRACE ) as $file ) {
			unlink( $file );
		}
	}

	/**
	 * Get the MIME type of a file
	 * @param string $filename
	 * @return string
	 */
	protected function get_mime_type( $filename ) {
		$mime_type = '';
		if ( extension_loaded( 'fileinfo' ) ) {
			$finfo = new finfo();
			$mime_type = $finfo->file( $filename, FILEINFO_MIME );
		}
		if ( false !== strpos( $mime_type, ';' ) ) {
			list( $mime_type, $charset ) = explode( ';', $mime_type, 2 );
		}
		return $mime_type;
	}

	function test_is_image_positive() {
		// these are all image files recognized by php
		$files = array(
			'test-image-cmyk.jpg',
			'test-image.bmp',
			'test-image-grayscale.jpg',
			'test-image.gif',
			'test-image.png',
			'test-image.tiff',
			'test-image-lzw.tiff',
			'test-image.jp2',
			'test-image.psd',
			'test-image-zip.tiff',
			'test-image.jpg',
			);

		foreach ($files as $file) {
			$this->assertTrue( file_is_valid_image( DIR_TESTDATA.'/images/'.$file ), "file_is_valid_image($file) should return true" );
		}
	}

	function test_is_image_negative() {
		// these are actually image files but aren't recognized or usable by php
		$files = array(
			'test-image.pct',
			'test-image.tga',
			'test-image.sgi',
			);

		foreach ($files as $file) {
			$this->assertFalse( file_is_valid_image( DIR_TESTDATA.'/images/'.$file ), "file_is_valid_image($file) should return false" );
		}
	}

	function test_is_displayable_image_positive() {
		// these are all usable in typical web browsers
		$files = array(
			'test-image.gif',
			'test-image.png',
			'test-image.jpg',
			);

		foreach ($files as $file) {
			$this->assertTrue( file_is_displayable_image( DIR_TESTDATA.'/images/'.$file ), "file_is_valid_image($file) should return true" );
		}
	}

	function test_is_displayable_image_negative() {
		// these are image files but aren't suitable for web pages because of compatibility or size issues
		$files = array(
			// 'test-image-cmyk.jpg', Allowed in r9727
			// 'test-image.bmp', Allowed in r28589
			// 'test-image-grayscale.jpg', Allowed in r9727
			'test-image.pct',
			'test-image.tga',
			'test-image.sgi',
			'test-image.tiff',
			'test-image-lzw.tiff',
			'test-image.jp2',
			'test-image.psd',
			'test-image-zip.tiff',
			);

		foreach ($files as $file) {
			$this->assertFalse( file_is_displayable_image( DIR_TESTDATA.'/images/'.$file ), "file_is_valid_image($file) should return false" );
		}
	}

	/**
	 * Test save image file and mime_types
	 * @ticket 6821
	 */
	public function test_wp_save_image_file() {
		if ( ! extension_loaded( 'fileinfo' ) ) {
			$this->markTestSkipped( 'The fileinfo PHP extension is not loaded.' );
		}

		include_once( ABSPATH . 'wp-admin/includes/image-edit.php' );

		// Mime types
		$mime_types = array(
			'image/jpeg',
			'image/gif',
			'image/png'
		);

		// Test each image editor engine
		$classes = array('WP_Image_Editor_GD', 'WP_Image_Editor_Imagick');
		foreach ( $classes as $class ) {

			// If the image editor isn't available, skip it
			if ( ! call_user_func( array( $class, 'test' ) ) ) {
				continue;
			}

			$img = new $class( DIR_TESTDATA . '/images/canola.jpg' );
			$loaded = $img->load();

			// Save a file as each mime type, assert it works
			foreach ( $mime_types as $mime_type ) {
				if ( ! $img->supports_mime_type( $mime_type ) ) {
					continue;
				}

				$file = wp_tempnam();
				$ret = wp_save_image_file( $file, $img, $mime_type, 1 );
				$this->assertNotEmpty( $ret );
				$this->assertNotInstanceOf( 'WP_Error', $ret );
				$this->assertEquals( $mime_type, $this->get_mime_type( $ret['path'] ) );

				// Clean up
				unlink( $file );
				unlink( $ret['path'] );
			}

			// Clean up
			unset( $img );
		}
	}

	/**
	 * Test that a passed mime type overrides the extension in the filename
	 * @ticket 6821
	 */
	public function test_mime_overrides_filename() {
		if ( ! extension_loaded( 'fileinfo' ) ) {
			$this->markTestSkipped( 'The fileinfo PHP extension is not loaded.' );
		}

		// Test each image editor engine
		$classes = array('WP_Image_Editor_GD', 'WP_Image_Editor_Imagick');
		foreach ( $classes as $class ) {

			// If the image editor isn't available, skip it
			if ( ! call_user_func( array( $class, 'test' ) ) ) {
				continue;
			}

			$img = new $class( DIR_TESTDATA . '/images/canola.jpg' );
			$loaded = $img->load();

			// Save the file
			$mime_type = 'image/gif';
			$file = wp_tempnam( 'tmp.jpg' );
			$ret = $img->save( $file, $mime_type );

			// Make assertions
			$this->assertNotEmpty( $ret );
			$this->assertNotInstanceOf( 'WP_Error', $ret );
			$this->assertEquals( $mime_type, $this->get_mime_type( $ret['path'] ) );

			// Clean up
			unlink( $file );
			unlink( $ret['path'] );
			unset( $img );
		}
	}

	/**
	 * Test that mime types are correctly inferred from file extensions
	 * @ticket 6821
	 */
	public function test_inferred_mime_types() {
		if ( ! extension_loaded( 'fileinfo' ) ) {
			$this->markTestSkipped( 'The fileinfo PHP extension is not loaded.' );
		}

		// Mime types
		$mime_types = array(
			'jpg'  => 'image/jpeg',
			'jpeg' => 'image/jpeg',
			'jpe'  => 'image/jpeg',
			'gif'  => 'image/gif',
			'png'  => 'image/png',
			'unk'  => 'image/jpeg' // Default, unknown
		);

		// Test each image editor engine
		$classes = array('WP_Image_Editor_GD', 'WP_Image_Editor_Imagick');
		foreach ( $classes as $class ) {

			// If the image editor isn't available, skip it
			if ( ! call_user_func( array( $class, 'test' ) ) ) {
				continue;
			}

			$img = new $class( DIR_TESTDATA . '/images/canola.jpg' );
			$loaded = $img->load();

			// Save the image as each file extension, check the mime type
			$img = wp_get_image_editor( DIR_TESTDATA . '/images/canola.jpg' );
			$this->assertNotInstanceOf( 'WP_Error', $img );

			$temp = get_temp_dir();
			foreach ( $mime_types as $ext => $mime_type ) {
				if ( ! $img->supports_mime_type( $mime_type ) ) {
					continue;
				}

				$file = wp_unique_filename( $temp, uniqid() . ".$ext" );
				$ret = $img->save( trailingslashit( $temp ) . $file );
				$this->assertNotEmpty( $ret );
				$this->assertNotInstanceOf( 'WP_Error', $ret );
				$this->assertEquals( $mime_type, $this->get_mime_type( $ret['path'] ) );
				unlink( $ret['path'] );
			}

			// Clean up
			unset( $img );
		}
	}

	/**
	 * Try loading a directory
	 *
	 * @ticket 17814
	 * @expectedDeprecated wp_load_image
	 */
	public function test_load_directory() {

		// First, test with deprecated wp_load_image function
		$editor1 = wp_load_image( DIR_TESTDATA );
		$this->assertNotInternalType( 'resource', $editor1 );

		$editor2 = wp_get_image_editor( DIR_TESTDATA );
		$this->assertNotInternalType( 'resource', $editor2 );

		// Then, test with editors.
		$classes = array('WP_Image_Editor_GD', 'WP_Image_Editor_Imagick');
		foreach ( $classes as $class ) {
			// If the image editor isn't available, skip it
			if ( ! call_user_func( array( $class, 'test' ) ) ) {
				continue;
			}

			$editor = new $class( DIR_TESTDATA );
			$loaded = $editor->load();

			$this->assertInstanceOf( 'WP_Error', $loaded );
			$this->assertEquals( 'error_loading_image', $loaded->get_error_code() );
		}
	}

	public function test_wp_crop_image_file() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		$file = wp_crop_image( DIR_TESTDATA . '/images/canola.jpg',
							  0, 0, 100, 100, 100, 100 );
		$this->assertNotInstanceOf( 'WP_Error', $file );
		$this->assertFileExists( $file );
		$image = wp_get_image_editor( $file );
		$size = $image->get_size();
		$this->assertEquals( 100, $size['height'] );
		$this->assertEquals( 100, $size['width'] );

		unlink( $file );
	}

	public function test_wp_crop_image_url() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		if ( ! extension_loaded( 'openssl' ) ) {
			$this->markTestSkipped( 'Tests_Image_Functions::test_wp_crop_image_url() requires openssl.' );
		}

		$file = wp_crop_image( 'https://asdftestblog1.files.wordpress.com/2008/04/canola.jpg',
							  0, 0, 100, 100, 100, 100, false,
							  DIR_TESTDATA . '/images/' . __FUNCTION__ . '.jpg' );
		$this->assertNotInstanceOf( 'WP_Error', $file );
		$this->assertFileExists( $file );
		$image = wp_get_image_editor( $file );
		$size = $image->get_size();
		$this->assertEquals( 100, $size['height'] );
		$this->assertEquals( 100, $size['width'] );

		unlink( $file );
	}

	public function test_wp_crop_image_file_not_exist() {
		$file = wp_crop_image( DIR_TESTDATA . '/images/canoladoesnotexist.jpg',
							  0, 0, 100, 100, 100, 100 );
		$this->assertInstanceOf( 'WP_Error', $file );
	}

	public function test_wp_crop_image_url_not_exist() {
		if ( ! extension_loaded( 'openssl' ) ) {
			$this->markTestSkipped( 'Tests_Image_Functions::test_wp_crop_image_url_not_exist() requires openssl.' );
		}

		$file = wp_crop_image( 'https://asdftestblog1.files.wordpress.com/2008/04/canoladoesnotexist.jpg',
							  0, 0, 100, 100, 100, 100 );
		$this->assertInstanceOf( 'WP_Error', $file );
	}

	function mock_image_editor( $editors ) {
		return array( 'WP_Image_Editor_Mock' );
	}

	/**
	 * @ticket 23325
	 */
	public function test_wp_crop_image_error_on_saving() {
		WP_Image_Editor_Mock::$save_return = new WP_Error();
		add_filter( 'wp_image_editors', array( $this, 'mock_image_editor' ) );

		$file = wp_crop_image( DIR_TESTDATA . '/images/canola.jpg',
							  0, 0, 100, 100, 100, 100 );
		$this->assertInstanceOf( 'WP_Error', $file );

		remove_filter( 'wp_image_editors', array( $this, 'mock_image_editor' ) );
		WP_Image_Editor_Mock::$save_return = array();
	}

	/**
	 * @ticket 31050
	 */
	public function test_wp_generate_attachment_metadata_pdf() {
		if ( ! wp_image_editor_supports( array( 'mime_type' => 'application/pdf' ) ) ) {
			$this->markTestSkipped( 'Rendering PDFs is not supported on this system.' );
		}

		$orig_file = DIR_TESTDATA . '/images/wordpress-gsoc-flyer.pdf';
		$test_file = '/tmp/wordpress-gsoc-flyer.pdf';
		copy( $orig_file, $test_file );

		$attachment_id = $this->factory->attachment->create_object( $test_file, 0, array(
			'post_mime_type' => 'application/pdf',
		) );

		$this->assertNotEmpty( $attachment_id );

		$expected = array(
			'sizes' => array(
				'thumbnail' => array(
					'file'      => "wordpress-gsoc-flyer-pdf-116x150.jpg",
					'width'     => 116,
					'height'    => 150,
					'mime-type' => "image/jpeg",
				),
				'medium'    => array(
					'file'      => "wordpress-gsoc-flyer-pdf-232x300.jpg",
					'width'     => 232,
					'height'    => 300,
					'mime-type' => "image/jpeg",
				),
				'large'     => array(
					'file'      => "wordpress-gsoc-flyer-pdf-791x1024.jpg",
					'width'     => 791,
					'height'    => 1024,
					'mime-type' => "image/jpeg",
				),
				'full'      => array(
					'file'      => "wordpress-gsoc-flyer-pdf.jpg",
					'width'     => 1088,
					'height'    => 1408,
					'mime-type' => "image/jpeg",
				),
			),
		);

		$metadata = wp_generate_attachment_metadata( $attachment_id, $test_file );
		$this->assertSame( $expected, $metadata );

		unlink( $test_file );
		foreach ( $metadata['sizes'] as $size ) {
			unlink ( '/tmp/' . $size['file'] );
		}
	}

	/**
	 * @ticket 39231
	 */
	public function test_fallback_intermediate_image_sizes() {
		if ( ! wp_image_editor_supports( array( 'mime_type' => 'application/pdf' ) ) ) {
			$this->markTestSkipped( 'Rendering PDFs is not supported on this system.' );
		}

		$orig_file = DIR_TESTDATA . '/images/wordpress-gsoc-flyer.pdf';
		$test_file = '/tmp/wordpress-gsoc-flyer.pdf';
		copy( $orig_file, $test_file );

		$attachment_id = $this->factory->attachment->create_object( $test_file, 0, array(
			'post_mime_type' => 'application/pdf',
		) );

		$this->assertNotEmpty( $attachment_id );

		add_image_size( 'test-size', 100, 100 );
		add_filter( 'fallback_intermediate_image_sizes', array( $this, 'filter_fallback_intermediate_image_sizes' ), 10, 2 );

		$expected = array(
			'file'      => 'wordpress-gsoc-flyer-pdf-77x100.jpg',
			'width'     => 77,
			'height'    => 100,
			'mime-type' => 'image/jpeg',
		);

		$metadata = wp_generate_attachment_metadata( $attachment_id, $test_file );
		$this->assertTrue( isset( $metadata['sizes']['test-size'] ), 'The `test-size` was not added to the metadata.' );
		$this->assertSame( $metadata['sizes']['test-size'], $expected );

		remove_image_size( 'test-size' );
		remove_filter( 'fallback_intermediate_image_sizes', array( $this, 'filter_fallback_intermediate_image_sizes' ), 10 );

		unlink( $test_file );
		foreach ( $metadata['sizes'] as $size ) {
			unlink ( '/tmp/' . $size['file'] );
		}
	}

	function filter_fallback_intermediate_image_sizes( $fallback_sizes, $metadata ) {
		// Add the 'test-size' to the list of fallback sizes.
		$fallback_sizes[] = 'test-size';

		return $fallback_sizes;
	}

	/**
	 * Test PDF preview doesn't overwrite existing JPEG.
	 * @ticket 39875
	 */
	public function test_pdf_preview_doesnt_overwrite_existing_jpeg() {
		if ( ! wp_image_editor_supports( array( 'mime_type' => 'application/pdf' ) ) ) {
			$this->markTestSkipped( 'Rendering PDFs is not supported on this system.' );
		}

		// Dummy JPEGs.
		$jpg1_path = '/tmp/test.jpg'; // Straight.
		file_put_contents( $jpg1_path, 'asdf' );
		$jpg2_path = '/tmp/test-pdf.jpg'; // With PDF marker.
		file_put_contents( $jpg2_path, 'fdsa' );

		// PDF with same name as JPEG.
		$pdf_path = '/tmp/test.pdf';
		copy( DIR_TESTDATA . '/images/wordpress-gsoc-flyer.pdf', $pdf_path );

		$attachment_id = $this->factory->attachment->create_object( $pdf_path, 0, array(
			'post_mime_type' => 'application/pdf',
		) );

		$metadata = wp_generate_attachment_metadata( $attachment_id, $pdf_path );
		$preview_path = '/tmp/' . $metadata['sizes']['full']['file'];

		// PDF preview didn't overwrite PDF.
		$this->assertNotEquals( $pdf_path, $preview_path );
		// PDF preview didn't overwrite JPG with same name.
		$this->assertNotEquals( $jpg1_path, $preview_path );
		$this->assertSame( 'asdf', file_get_contents( $jpg1_path ) );
		// PDF preview didn't overwrite PDF preview with same name.
		$this->assertNotEquals( $jpg2_path, $preview_path );
		$this->assertSame( 'fdsa', file_get_contents( $jpg2_path ) );

		// Cleanup.
		unlink( $jpg1_path );
		unlink( $jpg2_path );
		unlink( $pdf_path );
		foreach ( $metadata['sizes'] as $size ) {
			unlink( '/tmp/' . $size['file'] );
		}
	}
}
