<?php

/**
 * @group image
 * @group media
 * @group upload
 */
class Tests_Image_Size extends WP_UnitTestCase {

	function test_constrain_dims_zero() {
		if (!is_callable('wp_constrain_dimensions'))
			$this->markTestSkipped('wp_constrain_dimensions() is not callable.');

		// no constraint - should have no effect
		$out = wp_constrain_dimensions(640, 480, 0, 0);
		$this->assertSame( array( 640, 480 ), $out );

		$out = wp_constrain_dimensions(640, 480);
		$this->assertSame( array( 640, 480 ), $out );

		$out = wp_constrain_dimensions(0, 0, 0, 0);
		$this->assertSame( array( 0, 0 ), $out );

		$out = wp_constrain_dimensions(465, 700, 177, 177);
		$this->assertSame( array( 118, 177 ), $out );
	}

	function test_constrain_dims_smaller() {
		if (!is_callable('wp_constrain_dimensions'))
			$this->markTestSkipped('wp_constrain_dimensions() is not callable.');

		// image size is smaller than the constraint - no effect
		$out = wp_constrain_dimensions(500, 600, 1024, 768);
		$this->assertSame( array( 500, 600 ), $out );

		$out = wp_constrain_dimensions(500, 600, 0, 768);
		$this->assertSame( array( 500, 600 ), $out );

		$out = wp_constrain_dimensions(500, 600, 1024, 0);
		$this->assertSame( array( 500, 600 ), $out );
	}

	function test_constrain_dims_equal() {
		if (!is_callable('wp_constrain_dimensions'))
			$this->markTestSkipped('wp_constrain_dimensions() is not callable.');

		// image size is equal to the constraint - no effect
		$out = wp_constrain_dimensions(1024, 768, 1024, 768);
		$this->assertSame( array( 1024, 768 ), $out );

		$out = wp_constrain_dimensions(1024, 768, 0, 768);
		$this->assertSame( array( 1024, 768 ), $out );

		$out = wp_constrain_dimensions(1024, 768, 1024, 0);
		$this->assertSame( array( 1024, 768 ), $out );
	}

	function test_constrain_dims_larger() {
		if (!is_callable('wp_constrain_dimensions'))
			$this->markTestSkipped('wp_constrain_dimensions() is not callable.');

		// image size is larger than the constraint - result should be constrained
		$out = wp_constrain_dimensions(1024, 768, 500, 600);
		$this->assertSame( array( 500, 375 ), $out );

		$out = wp_constrain_dimensions(1024, 768, 0, 600);
		$this->assertSame( array( 800, 600 ), $out );

		$out = wp_constrain_dimensions(1024, 768, 500, 0);
		$this->assertSame( array( 500, 375 ), $out );

		// also try a portrait oriented image
		$out = wp_constrain_dimensions(300, 800, 500, 600);
		$this->assertSame( array( 225, 600 ), $out );

		$out = wp_constrain_dimensions(300, 800, 0, 600);
		$this->assertSame( array( 225, 600 ), $out );

		$out = wp_constrain_dimensions(300, 800, 200, 0);
		$this->assertSame( array( 200, 533 ), $out );
	}

	function test_constrain_dims_boundary() {
		if (!is_callable('wp_constrain_dimensions'))
			$this->markTestSkipped('wp_constrain_dimensions() is not callable.');

		// one dimension is larger than the constraint, one smaller - result should be constrained
		$out = wp_constrain_dimensions(1024, 768, 500, 800);
		$this->assertSame( array( 500, 375 ), $out );

		$out = wp_constrain_dimensions(1024, 768, 2000, 700);
		$this->assertSame( array( 933, 700 ), $out );

		// portrait
		$out = wp_constrain_dimensions(768, 1024, 800, 500);
		$this->assertSame( array( 375, 500 ), $out );

		$out = wp_constrain_dimensions(768, 1024, 2000, 700);
		$this->assertSame( array( 525, 700 ), $out );
	}

	/**
	 * @expectedDeprecated wp_shrink_dimensions
	 */
	function test_shrink_dimensions_default() {
		$out = wp_shrink_dimensions(640, 480);
		$this->assertSame( array( 128, 96 ), $out );

		$out = wp_shrink_dimensions(480, 640);
		$this->assertSame( array( 72, 96 ), $out );
	}

	/**
	 * @expectedDeprecated wp_shrink_dimensions
	 */
	function test_shrink_dimensions_smaller() {
		// image size is smaller than the constraint - no effect
		$out = wp_shrink_dimensions(500, 600, 1024, 768);
		$this->assertSame( array( 500, 600 ), $out );

		$out = wp_shrink_dimensions(600, 500, 1024, 768);
		$this->assertSame( array( 600, 500 ), $out );
	}

	/**
	 * @expectedDeprecated wp_shrink_dimensions
	 */
	function test_shrink_dimensions_equal() {
		// image size is equal to the constraint - no effect
		$out = wp_shrink_dimensions(500, 600, 500, 600);
		$this->assertSame( array( 500, 600 ), $out );

		$out = wp_shrink_dimensions(600, 500, 600, 500);
		$this->assertSame( array( 600, 500 ), $out );
	}

	/**
	 * @expectedDeprecated wp_shrink_dimensions
	 */
	function test_shrink_dimensions_larger() {
		// image size is larger than the constraint - result should be constrained
		$out = wp_shrink_dimensions(1024, 768, 500, 600);
		$this->assertSame( array( 500, 375 ), $out );

		$out = wp_shrink_dimensions(300, 800, 500, 600);
		$this->assertSame( array( 225, 600 ), $out );
	}

	/**
	 * @expectedDeprecated wp_shrink_dimensions
	 */
	function test_shrink_dimensions_boundary() {
		// one dimension is larger than the constraint, one smaller - result should be constrained
		$out = wp_shrink_dimensions(1024, 768, 500, 800);
		$this->assertSame( array( 500, 375 ), $out );

		$out = wp_shrink_dimensions(1024, 768, 2000, 700);
		$this->assertSame( array( 933, 700 ), $out );

		// portrait
		$out = wp_shrink_dimensions(768, 1024, 800, 500);
		$this->assertSame( array( 375, 500 ), $out );

		$out = wp_shrink_dimensions(768, 1024, 2000, 700);
		$this->assertSame( array( 525, 700 ), $out );
	}

	function test_constrain_size_for_editor_thumb() {
		$out = image_constrain_size_for_editor(600, 400, 'thumb');
		$this->assertSame( array( 150, 100 ), $out );

		$out = image_constrain_size_for_editor(64, 64, 'thumb');
		$this->assertSame( array( 64, 64 ), $out );
	}

	function test_constrain_size_for_editor_medium() {
		// default max width is 500, no constraint on height
		global $content_width;

		$_content_width = $content_width;

		$content_width = 0;
		update_option('medium_size_w', 500);
		update_option('medium_size_h', 0);

		$out = image_constrain_size_for_editor(600, 400, 'medium');
		$this->assertSame( array( 500, 333 ), $out );

		$out = image_constrain_size_for_editor(400, 600, 'medium');
		$this->assertSame( array( 400, 600 ), $out );

		$out = image_constrain_size_for_editor(64, 64, 'medium');
		$this->assertSame( array( 64, 64 ), $out );

		// content_width should be ignored
		$content_width = 350;
		$out = image_constrain_size_for_editor(600, 400, 'medium');
		$this->assertSame( array( 500, 333 ), $out );

		$content_width = $_content_width;
	}

	function test_constrain_size_for_editor_full() {
		global $content_width;

		$_content_width = $content_width;

		$content_width = 400;
		$out = image_constrain_size_for_editor(600, 400, 'full');
		$this->assertSame( array( 600, 400 ), $out );

		$out = image_constrain_size_for_editor(64, 64, 'full');
		$this->assertSame( array( 64, 64 ), $out );

		// content_width default is 500
		$content_width = 0;

		$out = image_constrain_size_for_editor(600, 400, 'full');
		$this->assertSame( array( 600, 400 ), $out );

		$out = image_constrain_size_for_editor(64, 64, 'full');
		$this->assertSame( array( 64, 64 ), $out );

		$content_width = $_content_width;
	}

}
