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
}
