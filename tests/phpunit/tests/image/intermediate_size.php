<?php
/**
 * @group image
 * @group media
 * @group upload
 */
class Tests_Image_Intermediate_Size extends WP_UnitTestCase {
	function tearDown() {
		$this->remove_added_uploads();

		remove_image_size( 'test-size' );
		remove_image_size( 'false-height' );
		remove_image_size( 'false-width' );
		remove_image_size( 'off-by-one' );
		parent::tearDown();
	}

	public function _make_attachment( $file, $parent_post_id = 0 ) {
		$contents = file_get_contents( $file );
		$upload = wp_upload_bits( basename( $file ), null, $contents );

		return parent::_make_attachment( $upload, $parent_post_id );
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

		// cleanup
		remove_image_size( 'test-size' );

		// test for the expected string because the array will by definition
		// return with the correct height and width attributes
		$this->assertTrue( strpos( $image['file'], '330x220' ) > 0 );
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
		$this->assertTrue( strpos( $image['file'], '330x220' ) > 0 );
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
		$this->assertTrue( strpos( $image['file'], '450x300' ) > 0 );
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
		$this->assertTrue( strpos( $image['file'], $image_w . 'x' . $image_h ) > 0 );
	}

	/**
	 * @ticket 17626
	 * @ticket 34087
	 */
	function test_get_intermediate_sizes_by_array_zero_width() {
		// 202 is the smallest height that will trigger a miss for 'false-height'.
		$height = 202;

		// Only one dimention match shouldn't return false positive (see: 17626)
		add_image_size( 'test-size', 0, $height, false );
		add_image_size( 'false-height', 300, $height, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		$original = wp_get_attachment_metadata( $id );
		$image_h = $height;
		$image_w = round( ( $image_h / $original['height'] ) * $original['width'] );

		// look for a size by array that exists
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( 0, $height ) );

		// test for the expected string because the array will by definition
		// return with the correct height and width attributes
		$this->assertTrue( strpos( $image['file'], $image_w . 'x' . $image_h ) > 0 );
	}

	/**
	 * @ticket 17626
	 * @ticket 34087
	 */
	public function test_get_intermediate_sizes_should_match_size_with_off_by_one_aspect_ratio() {
		// Original is 600x400. 300x201 is close enough to match.
		$width  = 300;
		$height = 201;
		add_image_size( 'off-by-one', $width, $height, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		$original = wp_get_attachment_metadata( $id );
		$image_h = $height;
		$image_w = round( ( $image_h / $original['height'] ) * $original['width'] );

		// look for a size by array that exists
		// note: staying larger than 300px to miss default medium crop
		$image = image_get_intermediate_size( $id, array( 0, $height ) );

		$this->assertTrue( strpos( $image['file'], $width . 'x' . $height ) > 0 );
	}

	/**
	 * @ticket 34384
	 */
	public function test_get_intermediate_size_with_small_size_array() {
		// Add a hard cropped size that matches the aspect ratio we're going to test.
		add_image_size( 'test-size', 200, 100, true );

		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		// Request a size by array that doesn't exist and is smaller than the 'thumbnail'
		$image = image_get_intermediate_size( $id, array( 50, 25 ) );

		// We should get the 'test-size' file and not the thumbnail.
		$this->assertTrue( strpos( $image['file'], '200x100' ) > 0 );
	}

	/**
	 * @ticket 34384
	 */
	public function test_get_intermediate_size_with_small_size_array_fallback() {
		$file = DIR_TESTDATA . '/images/waffles.jpg';
		$id = $this->_make_attachment( $file, 0 );

		$original = wp_get_attachment_metadata( $id );
		$thumbnail_file = $original['sizes']['thumbnail']['file'];

		// Request a size by array that doesn't exist and is smaller than the 'thumbnail'
		$image = image_get_intermediate_size( $id, array( 50, 25 ) );

		// We should get the 'thumbnail' file as a fallback.
		$this->assertSame( $image['file'], $thumbnail_file );
	}
}
