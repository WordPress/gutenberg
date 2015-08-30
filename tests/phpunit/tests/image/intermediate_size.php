<?php
/**
 * @group image
 * @group media
 * @group upload
 */
class Tests_Image_Intermediate_Size extends WP_UnitTestCase {
	function tearDown() {
		$this->remove_added_uploads();
		parent::tearDown();
	}

	/**
	 * Upload files and create attachements for testing
	 */
	private function _make_attachment( $file, $parent_post_id = 0 ) {
		$contents = file_get_contents( $file );
		$upload = wp_upload_bits( basename( $file ), null, $contents );

		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title' => basename( $upload['file'] ),
			'post_content' => '',
			'post_type' => 'attachment',
			'post_parent' => $parent_post_id,
			'post_mime_type' => $type,
			'guid' => $upload['url'],
		);

		// Save the data
		$id = wp_insert_attachment( $attachment, $upload[ 'file' ], $parent_post_id );
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		$this->ids[] = $id;
		return $id;
	}

	function test_make_intermediate_size_no_size() {
		$image = image_make_intermediate_size( DIR_TESTDATA . '/images/a2-small.jpg', 0, 0, false );

		$this->assertFalse( $image );
	}

	function test_make_intermediate_size_width() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		$image = image_make_intermediate_size( DIR_TESTDATA . '/images/a2-small.jpg', 100, 0, false );

		$this->assertInternalType( 'array', $image );
	}

	function test_make_intermediate_size_height() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		$image = image_make_intermediate_size( DIR_TESTDATA . '/images/a2-small.jpg', 0, 75, false );

		$this->assertInternalType( 'array', $image );
	}

	function test_make_intermediate_size_successful() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		$image = image_make_intermediate_size( DIR_TESTDATA . '/images/a2-small.jpg', 100, 75, true );

		$this->assertInternalType( 'array', $image );
		$this->assertEquals( 100, $image['width'] );
		$this->assertEquals( 75, $image['height'] );
		$this->assertEquals( 'image/jpeg', $image['mime-type'] );

		$this->assertFalse( isset( $image['path'] ) );

		unlink( DIR_TESTDATA . '/images/a2-small-100x75.jpg' );
	}

	/**
	* @ticket 17626
	*/
	function test_get_intermediate_sizes_by_name() {
		add_image_size( 'test-size', 330, 220, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		// look for a size by name
		$image = image_get_intermediate_size( $id, 'test-size' );

		// test for the expected string because the array will by definition
		// return with the correct height and width attributes
		$this->assertNotFalse( strpos( $image['file'], '330x220' ) );

		// cleanup
		remove_image_size( 'test-size' );
	}

	/**
	* @ticket 17626
	*/
	function test_get_intermediate_sizes_by_array_exact() {
		// Only one dimention match shouldn't return false positive (see: 17626)
		add_image_size( 'test-size', 330, 220, true );
		add_image_size( 'false-height', 330, 400, true );
		add_image_size( 'false-width', 600, 220, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		// look for a size by array that exists
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( 330, 220 ) );

		// test for the expected string because the array will by definition
		// return with the correct height and width attributes
		$this->assertNotFalse( strpos( $image['file'], '330x220' ) );

		// cleanup
		remove_image_size( 'test-size' );
		remove_image_size( 'false-height' );
		remove_image_size( 'false-width' );
	}

	/**
	* @ticket 17626
	*/
	function test_get_intermediate_sizes_by_array_nearest() {
		// If an exact size is not found, it should be returned
		// If not, find nearest size that is larger (see: 17626)
		add_image_size( 'test-size', 450, 300, true );
		add_image_size( 'false-height', 330, 100, true );
		add_image_size( 'false-width', 150, 220, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		// look for a size by array that doesn't exist
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( 330, 220 ) );

		// you have to test for the string because the image will by definition
		// return with the correct height and width attributes
		$this->assertNotFalse( strpos( $image['file'], '450x300' ) );

		// cleanup
		remove_image_size( 'test-size' );
		remove_image_size( 'false-height' );
		remove_image_size( 'false-width' );
	}

	/**
	* @ticket 17626
	*/
	function test_get_intermediate_sizes_by_array_nearest_false() {
		// If an exact size is not found, it should be returned
		// If not, find nearest size that is larger, otherwise return false (see: 17626)
		add_image_size( 'false-height', 330, 100, true );
		add_image_size( 'false-width', 150, 220, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		// look for a size by array that doesn't exist
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( 330, 220 ) );

		// you have to test for the string because the image will by definition
		// return with the correct height and width attributes
		$this->assertFalse( $image );

		// cleanup
		remove_image_size( 'false-height' );
		remove_image_size( 'false-width' );
	}

	/**
	* @ticket 17626
	*/
	function test_get_intermediate_sizes_by_array_zero_height() {
		// Generate random width
		$random_w = rand( 300, 400 );

		// Only one dimention match shouldn't return false positive (see: 17626)
		add_image_size( 'test-size', $random_w, 0, false );
		add_image_size( 'false-height', $random_w, 100, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		$original = wp_get_attachment_metadata( $id );
		$image_w = $random_w;
		$image_h = round( ( $image_w / $original['width'] ) * $original['height'] );

		// look for a size by array that exists
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( $random_w, 0 ) );

		// test for the expected string because the array will by definition
		// return with the correct height and width attributes
		$this->assertNotFalse( strpos( $image['file'], $image_w . 'x' . $image_h ) );

		// cleanup
		remove_image_size( 'test-size' );
		remove_image_size( 'false-height' );
	}

	/**
	* @ticket 17626
	*/
	function test_get_intermediate_sizes_by_array_zero_width() {
		// Generate random height
		$random_h = rand( 200, 300 );

		// Only one dimention match shouldn't return false positive (see: 17626)
		add_image_size( 'test-size', 0, $random_h, false );
		add_image_size( 'false-height', 300, $random_h, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		$original = wp_get_attachment_metadata( $id );
		$image_h = $random_h;
		$image_w = round( ( $image_h / $original['height'] ) * $original['width'] );

		// look for a size by array that exists
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( 0, $random_h ) );

		// test for the expected string because the array will by definition
		// return with the correct height and width attributes
		$this->assertNotFalse( strpos( $image['file'], $image_w . 'x' . $image_h ) );

		// cleanup
		remove_image_size( 'test-size' );
		remove_image_size( 'false-height' );
	}
}
