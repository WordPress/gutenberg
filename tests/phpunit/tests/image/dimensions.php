<?php

/**
 * @group image
 * @group media
 * @group upload
 */
class Tests_Image_Dimensions extends WP_UnitTestCase {
	function test_400x400_no_crop() {
		// landscape: resize 640x480 to fit 400x400: 400x300
		$out = image_resize_dimensions(640, 480, 400, 400, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 300, 640, 480), $out );

		// portrait: resize 480x640 to fit 400x400: 300x400
		$out = image_resize_dimensions(480, 640, 400, 400, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 300, 400, 480, 640), $out );
	}

	function test_400x0_no_crop() {
		// landscape: resize 640x480 to fit 400w: 400x300
		$out = image_resize_dimensions(640, 480, 400, 0, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 300, 640, 480), $out );

		// portrait: resize 480x640 to fit 400w: 400x533
		$out = image_resize_dimensions(480, 640, 400, 0, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 533, 480, 640), $out );
	}

	function test_0x400_no_crop() {
		// landscape: resize 640x480 to fit 400h: 533x400
		$out = image_resize_dimensions(640, 480, 0, 400, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 533, 400, 640, 480), $out );

		// portrait: resize 480x640 to fit 400h: 300x400
		$out = image_resize_dimensions(480, 640, 0, 400, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 300, 400, 480, 640), $out );
	}

	function test_800x800_no_crop() {
		// landscape: resize 640x480 to fit 800x800
		$out = image_resize_dimensions(640, 480, 800, 800, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( false, $out );

		// portrait: resize 480x640 to fit 800x800
		$out = image_resize_dimensions(480, 640, 800, 800, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( false, $out );
	}

	function test_800x0_no_crop() {
		// landscape: resize 640x480 to fit 800w
		$out = image_resize_dimensions(640, 480, 800, 0, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( false, $out );

		// portrait: resize 480x640 to fit 800w
		$out = image_resize_dimensions(480, 640, 800, 0, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( false, $out );
	}

	function test_0x800_no_crop() {
		// landscape: resize 640x480 to fit 800h
		$out = image_resize_dimensions(640, 480, 0, 800, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( false, $out );

		// portrait: resize 480x640 to fit 800h
		$out = image_resize_dimensions(480, 640, 0, 800, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( false, $out );
	}

	// cropped versions

	function test_400x400_crop() {
		// landscape: crop 640x480 to fit 400x400: 400x400 taken from a 480x480 crop at (80. 0)
		$out = image_resize_dimensions(640, 480, 400, 400, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 80, 0, 400, 400, 480, 480), $out );

		// portrait: resize 480x640 to fit 400x400: 400x400 taken from a 480x480 crop at (0. 80)
		$out = image_resize_dimensions(480, 640, 400, 400, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 80, 400, 400, 480, 480), $out );
	}

	function test_400x0_crop() {
		// landscape: resize 640x480 to fit 400w: 400x300
		$out = image_resize_dimensions(640, 480, 400, 0, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 300, 640, 480), $out );

		// portrait: resize 480x640 to fit 400w: 400x533
		$out = image_resize_dimensions(480, 640, 400, 0, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 533, 480, 640), $out );
	}

	function test_0x400_crop() {
		// landscape: resize 640x480 to fit 400h: 533x400
		$out = image_resize_dimensions(640, 480, 0, 400, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 533, 400, 640, 480), $out );

		// portrait: resize 480x640 to fit 400h: 300x400
		$out = image_resize_dimensions(480, 640, 0, 400, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 300, 400, 480, 640), $out );
	}

	function test_400x500_crop() {
		// landscape: crop 640x480 to fit 400x500: 400x400 taken from a 480x480 crop at (80. 0)
		$out = image_resize_dimensions(640, 480, 400, 500, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 120, 0, 400, 480, 400, 480), $out );

		// portrait: resize 480x640 to fit 400x400: 400x400 taken from a 480x480 crop at (0. 80)
		$out = image_resize_dimensions(480, 640, 400, 500, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 20, 400, 500, 480, 600), $out );
	}

	function test_640x480() {
		// crop 640x480 to fit 640x480 (no change)
		$out = image_resize_dimensions(640, 480, 640, 480, true);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 640, 480, 640, 480), $out );

		// resize 640x480 to fit 640x480 (no change)
		$out = image_resize_dimensions(640, 480, 640, 480, false);
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 640, 480, 640, 480), $out );
	}

	/**
	 * @ticket 19393
	 */
	function test_crop_anchors() {
		// landscape: crop 640x480 to fit 400x500: 400x400 taken from a 480x480 crop
		// src_x = 0 (left), src_y = 0 (top)
		$out = image_resize_dimensions(640, 480, 400, 500, array( 'left', 'top' ) );
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 480, 400, 480), $out );

		// portrait: resize 480x640 to fit 400x400: 400x400 taken from a 480x480 crop
		// src_x = 0 (left), src_y = 0 (top)
		$out = image_resize_dimensions(480, 640, 400, 500, array( 'left', 'top' ) );
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 0, 400, 500, 480, 600), $out );

		// landscape: crop 640x480 to fit 400x500: 400x400 taken from a 480x480 crop
		// src_x = 240 (left), src_y = 0 (due to landscape crop)
		$out = image_resize_dimensions(640, 480, 400, 500, array( 'right', 'bottom' ) );
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 240, 0, 400, 480, 400, 480), $out );

		// portrait: resize 480x640 to fit 400x400: 400x400 taken from a 480x480 crop
		// src_x = 0 (due to portrait crop), src_y = 40 (bottom)
		$out = image_resize_dimensions(480, 640, 400, 500, array( 'right', 'bottom' ) );
		// dst_x, dst_y, src_x, src_y, dst_w, dst_h, src_w, src_h
		$this->assertEquals( array(0, 0, 0, 40, 400, 500, 480, 600), $out );
	}

}
