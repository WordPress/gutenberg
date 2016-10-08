<?php

/**
 * @group image
 * @group media
 * @group upload
 *
 * @requires extension gd
 * @requires extension exif
 */
class Tests_Image_Meta extends WP_UnitTestCase {

	function test_exif_d70() {
		// exif from a Nikon D70
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/2004-07-22-DSC_0008.jpg');

		$this->assertEquals(6.3, $out['aperture']);
		$this->assertEquals('', $out['credit']);
		$this->assertEquals('NIKON D70', $out['camera']);
		$this->assertEquals('', $out['caption']);
		$this->assertEquals(strtotime('2004-07-22 17:14:59'), $out['created_timestamp']);
		$this->assertEquals('', $out['copyright']);
		$this->assertEquals(27, $out['focal_length']);
		$this->assertEquals(400, $out['iso']);
		$this->assertEquals(1/40, $out['shutter_speed']);
		$this->assertEquals('', $out['title']);
	}

	function test_exif_d70_mf() {
		// exif from a Nikon D70 - manual focus lens, so some data is unavailable
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG');

		$this->assertEquals(0, $out['aperture']);
		$this->assertEquals('', $out['credit']);
		$this->assertEquals('NIKON D70', $out['camera']);
		$this->assertEquals('', $out['caption']);
		$this->assertEquals(strtotime('2007-06-17 21:18:00'), $out['created_timestamp']);
		$this->assertEquals('', $out['copyright']);
		$this->assertEquals(0, $out['focal_length']);
		$this->assertEquals(0, $out['iso']); // interesting - a Nikon bug?
		$this->assertEquals(1/500, $out['shutter_speed']);
		$this->assertEquals('', $out['title']);
		#$this->assertEquals(array('Flowers'), $out['keywords']);
	}

	function test_exif_d70_iptc() {
		// exif from a Nikon D70 with IPTC data added later
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/2004-07-22-DSC_0007.jpg');

		$this->assertEquals(6.3, $out['aperture']);
		$this->assertEquals('IPTC Creator', $out['credit']);
		$this->assertEquals('NIKON D70', $out['camera']);
		$this->assertEquals('IPTC Caption', $out['caption']);
		$this->assertEquals(strtotime('2004-07-22 17:14:35'), $out['created_timestamp']);
		$this->assertEquals('IPTC Copyright', $out['copyright']);
		$this->assertEquals(18, $out['focal_length']);
		$this->assertEquals(200, $out['iso']);
		$this->assertEquals(1/25, $out['shutter_speed']);
		$this->assertEquals('IPTC Headline', $out['title']);
	}

	function test_exif_fuji() {
		// exif from a Fuji FinePix S5600 (thanks Mark)
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/a2-small.jpg');

		$this->assertEquals(4.5, $out['aperture']);
		$this->assertEquals('', $out['credit']);
		$this->assertEquals('FinePix S5600', $out['camera']);
		$this->assertEquals('', $out['caption']);
		$this->assertEquals(strtotime('2007-09-03 10:17:03'), $out['created_timestamp']);
		$this->assertEquals('', $out['copyright']);
		$this->assertEquals(6.3, $out['focal_length']);
		$this->assertEquals(64, $out['iso']);
		$this->assertEquals(1/320, $out['shutter_speed']);
		$this->assertEquals('', $out['title']);

	}

	/**
	 * @ticket 6571
	 */
	function test_exif_error() {

		// https://core.trac.wordpress.org/ticket/6571
		// this triggers a warning mesage when reading the exif block
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/waffles.jpg');

		$this->assertEquals(0, $out['aperture']);
		$this->assertEquals('', $out['credit']);
		$this->assertEquals('', $out['camera']);
		$this->assertEquals('', $out['caption']);
		$this->assertEquals(0, $out['created_timestamp']);
		$this->assertEquals('', $out['copyright']);
		$this->assertEquals(0, $out['focal_length']);
		$this->assertEquals(0, $out['iso']);
		$this->assertEquals(0, $out['shutter_speed']);
		$this->assertEquals('', $out['title']);
	}

	function test_exif_no_data() {
		// no exif data in this image (from burningwell.org)
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/canola.jpg');

		$this->assertEquals(0, $out['aperture']);
		$this->assertEquals('', $out['credit']);
		$this->assertEquals('', $out['camera']);
		$this->assertEquals('', $out['caption']);
		$this->assertEquals(0, $out['created_timestamp']);
		$this->assertEquals('', $out['copyright']);
		$this->assertEquals(0, $out['focal_length']);
		$this->assertEquals(0, $out['iso']);
		$this->assertEquals(0, $out['shutter_speed']);
		$this->assertEquals('', $out['title']);
	}

	/**
	 * @ticket 9417
	 */
	function test_utf8_iptc_tags() {

		// trilingual UTF-8 text in the ITPC caption-abstract field
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/test-image-iptc.jpg');

		$this->assertEquals('This is a comment. / Это комментарий. / Βλέπετε ένα σχόλιο.', $out['caption']);
	}

	/**
	 * wp_read_image_metadata() should false if the image file doesn't exist
	 * @return void
	 */
	public function test_missing_image_file() {
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/404_image.png');
		$this->assertFalse($out);
	}


	/**
	 * @ticket 33772
	 */
	public function test_exif_keywords() {
		$out = wp_read_image_metadata(DIR_TESTDATA.'/images/33772.jpg');

		$this->assertEquals( '8', $out['aperture'] );
		$this->assertEquals( 'Photoshop Author', $out['credit'] );
		$this->assertEquals( 'DMC-LX2', $out['camera'] );
		$this->assertEquals( 'Photoshop Description', $out['caption'] );
		$this->assertEquals( 1306315327, $out['created_timestamp'] );
		$this->assertEquals( 'Photoshop Copyrright Notice', $out['copyright'] );
		$this->assertEquals( '6.3', $out['focal_length'] );
		$this->assertEquals( '100', $out['iso'] );
		$this->assertEquals( '0.0025', $out['shutter_speed'] );
		$this->assertEquals( 'Photoshop Document Ttitle', $out['title'] );
		$this->assertEquals( 1, $out['orientation']);
		$this->assertEquals( array( 'beach', 'baywatch', 'LA', 'sunset' ), $out['keywords'] );
	}

}
