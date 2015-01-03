<?php

/**
 * Test the WP_Image_Editor_Imagick class
 * @group image
 * @group media
 * @group wp-image-editor-imagick
 */
require_once( dirname( __FILE__ ) . '/base.php' );

class Tests_Image_Editor_Imagick extends WP_Image_UnitTestCase {

	public $editor_engine = 'WP_Image_Editor_Imagick';

	public function setUp() {
		require_once( ABSPATH . WPINC . '/class-wp-image-editor.php' );
		require_once( ABSPATH . WPINC . '/class-wp-image-editor-imagick.php' );

		parent::setUp();
	}

	public function tearDown() {
		$folder = DIR_TESTDATA . '/images/waffles-*.jpg';

		foreach ( glob( $folder ) as $file ) {
			unlink( $file );
		}

		$this->remove_added_uploads();

		parent::tearDown();
	}

	/**
	 * Check support for ImageMagick compatible mime types.
	 */
	public function test_supports_mime_type() {
		$imagick_image_editor = new WP_Image_Editor_Imagick( null );

		$this->assertTrue( $imagick_image_editor->supports_mime_type( 'image/jpeg' ), 'Does not support image/jpeg' );
		$this->assertTrue( $imagick_image_editor->supports_mime_type( 'image/png' ), 'Does not support image/png' );
		$this->assertTrue( $imagick_image_editor->supports_mime_type( 'image/gif' ), 'Does not support image/gif' );
	}

	/**
	 * Test resizing an image, not using crop
	 */
	public function test_resize() {
		$file = DIR_TESTDATA . '/images/waffles.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$imagick_image_editor->resize( 100, 50 );

		$this->assertEquals(
			array(
				'width'  => 75,
				'height' => 50,
			),
			$imagick_image_editor->get_size()
		);
	}

	/**
	 * Test multi_resize with single image resize and no crop
	 */
	public function test_single_multi_resize() {
		$file = DIR_TESTDATA . '/images/waffles.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$sizes_array =	array(
			array(
				'width'  => 50,
				'height' => 50,
			),
		);

		$resized = $imagick_image_editor->multi_resize( $sizes_array );

		# First, check to see if returned array is as expected
		$expected_array = array(
			array(
				'file'      => 'waffles-50x33.jpg',
				'width'     => 50,
				'height'    => 33,
				'mime-type' => 'image/jpeg',
			),
		);

		$this->assertEquals( $expected_array, $resized );

		// Now, verify real dimensions are as expected
		$image_path = DIR_TESTDATA . '/images/'. $resized[0]['file'];
		$this->assertImageDimensions(
			$image_path,
			$expected_array[0]['width'],
			$expected_array[0]['height']
		);
	}

	/**
	 * Ensure multi_resize doesn't create an image when
	 * both height and weight are missing, null, or 0.
	 *
	 * ticket 26823
	 */
	public function test_multi_resize_does_not_create() {
		$file = DIR_TESTDATA . '/images/waffles.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$sizes_array = array(
			array(
				'width'  => 0,
				'height' => 0,
			),
			array(
				'width'  => 0,
				'height' => 0,
				'crop'   => true,
			),
			array(
				'width'  => null,
				'height' => null,
			),
			array(
				'width'  => null,
				'height' => null,
				'crop'   => true,
			),
			array(
				'width'  => '',
				'height' => '',
			),
			array(
				'width'  => '',
				'height' => '',
				'crop'   => true,
			),
			array(
				'width'  => 0,
			),
			array(
				'width'  => 0,
				'crop'   => true,
			),
			array(
				'width'  => null,
			),
			array(
				'width'  => null,
				'crop'   => true,
			),
			array(
				'width'  => '',
			),
			array(
				'width'  => '',
				'crop'   => true,
			),
		);

		$resized = $imagick_image_editor->multi_resize( $sizes_array );

		// If no images are generated, the returned array is empty.
		$this->assertEmpty( $resized );
	}

	/**
	 * Test multi_resize with multiple sizes
	 *
	 * ticket 26823
	 */
	public function test_multi_resize() {
		$file = DIR_TESTDATA . '/images/waffles.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$sizes_array = array(

			/**
			 * #0 - 10x10 resize, no cropping.
			 * By aspect, should be 10x6 output.
			 */
			array(
				'width'  => 10,
				'height' => 10,
				'crop'   => false,
			),

			/**
			 * #1 - 75x50 resize, with cropping.
			 * Output dimensions should be 75x50
			 */
			array(
				'width'  => 75,
				'height' => 50,
				'crop'   => true,
			),

			/**
			 * #2 - 20 pixel max height, no cropping.
			 * By aspect, should be 30x20 output.
			 */
			array(
				'width'  => 9999, # Arbitrary High Value
				'height' => 20,
				'crop'   => false,
			),

			/**
			 * #3 - 45 pixel max height, with cropping.
			 * By aspect, should be 45x400 output.
			 */
			array(
				'width'  => 45,
				'height' => 9999, # Arbitrary High Value
				'crop'   => true,
			),

			/**
			 * #4 - 50 pixel max width, no cropping.
			 * By aspect, should be 50x33 output.
			 */
			array(
				'width' => 50,
			),

			/**
			 * #5 - 55 pixel max width, no cropping, null height
			 * By aspect, should be 55x36 output.
			 */
			array(
				'width'  => 55,
				'height' => null,
			),

			/**
			 * #6 - 55 pixel max height, no cropping, no width specified.
			 * By aspect, should be 82x55 output.
			 */
			array(
				'height' => 55,
			),

			/**
			 * #7 - 60 pixel max height, no cropping, null width.
			 * By aspect, should be 90x60 output.
			 */
			array(
				'width'  => null,
				'height' => 60,
			),

			/**
			 * #8 - 70 pixel max height, no cropping, negative width.
			 * By aspect, should be 105x70 output.
			 */
			array(
				'width'  => -9999, # Arbitrary Negative Value
				'height' => 70,
			),

			/**
			 * #9 - 200 pixel max width, no cropping, negative height.
			 * By aspect, should be 200x133 output.
			 */
			array(
				'width'  => 200,
				'height' => -9999, # Arbitrary Negative Value
			),
		);

		$resized = $imagick_image_editor->multi_resize( $sizes_array );

		$expected_array = array(

			// #0
			array(
				'file'      => 'waffles-10x7.jpg',
				'width'     => 10,
				'height'    => 7,
				'mime-type' => 'image/jpeg',
			),

			// #1
			array(
				'file'      => 'waffles-75x50.jpg',
				'width'     => 75,
				'height'    => 50,
				'mime-type' => 'image/jpeg',
			),

			// #2
			array(
				'file'      => 'waffles-30x20.jpg',
				'width'     => 30,
				'height'    => 20,
				'mime-type' => 'image/jpeg',
			),

			// #3
			array(
				'file'      => 'waffles-45x400.jpg',
				'width'     => 45,
				'height'    => 400,
				'mime-type' => 'image/jpeg',
			),

			// #4
			array(
				'file'      => 'waffles-50x33.jpg',
				'width'     => 50,
				'height'    => 33,
				'mime-type' => 'image/jpeg',
			),

			// #5
			array(
				'file'      => 'waffles-55x37.jpg',
				'width'     => 55,
				'height'    => 37,
				'mime-type' => 'image/jpeg',
			),

			// #6
			array(
				'file'      => 'waffles-83x55.jpg',
				'width'     => 83,
				'height'    => 55,
				'mime-type' => 'image/jpeg',
			),

			// #7
			array(
				'file'      => 'waffles-90x60.jpg',
				'width'     => 90,
				'height'    => 60,
				'mime-type' => 'image/jpeg',
			),

			// #8
			array(
				'file'      => 'waffles-105x70.jpg',
				'width'     => 105,
				'height'    => 70,
				'mime-type' => 'image/jpeg',
			),

			// #9
			array(
				'file'      => 'waffles-200x133.jpg',
				'width'     => 200,
				'height'    => 133,
				'mime-type' => 'image/jpeg',
			),
		);

		$this->assertNotNull( $resized );
		$this->assertEquals( $expected_array, $resized );

		foreach( $resized as $key => $image_data ){
			$image_path = DIR_TESTDATA . '/images/' . $image_data['file'];

			// Now, verify real dimensions are as expected
			$this->assertImageDimensions(
				$image_path,
				$expected_array[$key]['width'],
				$expected_array[$key]['height']
			);
		}
	}

	/**
	 * Test resizing an image with cropping
	 */
	public function test_resize_and_crop() {
		$file = DIR_TESTDATA . '/images/waffles.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$imagick_image_editor->resize( 100, 50, true );

		$this->assertEquals(
			array(
				'width'  => 100,
				'height' => 50,
			),
			$imagick_image_editor->get_size()
		);
	}

	/**
	 * Test cropping an image
	 */
	public function test_crop() {
		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$imagick_image_editor->crop( 0, 0, 50, 50 );

		$this->assertEquals(
			array(
				'width' => 50,
				'height' => 50,
			),
			$imagick_image_editor->get_size()
		);
	}

	/**
	 * Test rotating an image 180 deg
	 */
	public function test_rotate() {
		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$property = new ReflectionProperty( $imagick_image_editor, 'image' );
		$property->setAccessible( true );

		$color_top_left = $property->getValue( $imagick_image_editor )->getImagePixelColor( 1, 1 )->getColor();

		$imagick_image_editor->rotate( 180 );

		$this->assertEquals( $color_top_left, $property->getValue( $imagick_image_editor )->getImagePixelColor( 99, 99 )->getColor() );
	}

	/**
	 * Test flipping an image
	 */
	public function test_flip() {
		$file = DIR_TESTDATA . '/images/gradient-square.jpg';

		$imagick_image_editor = new WP_Image_Editor_Imagick( $file );
		$imagick_image_editor->load();

		$property = new ReflectionProperty( $imagick_image_editor, 'image' );
		$property->setAccessible( true );

		$color_top_left = $property->getValue( $imagick_image_editor )->getImagePixelColor( 1, 1 )->getColor();

		$imagick_image_editor->flip( true, false );

		$this->assertEquals( $color_top_left, $property->getValue( $imagick_image_editor )->getImagePixelColor( 0, 99 )->getColor() );
	}

	/**
	 * Test the image created with WP_Image_Editor_Imagick preserves alpha when resizing
	 *
	 * @ticket 24871
	 */
	public function test_image_preserves_alpha_on_resize() {
		$file = DIR_TESTDATA . '/images/transparent.png';

		$editor = new WP_Image_Editor_Imagick( $file );

		$this->assertNotInstanceOf( 'WP_Error', $editor );
		
		$editor->load();
		$editor->resize( 5, 5 );
		$save_to_file = tempnam( get_temp_dir(), '' ) . '.png';

		$editor->save( $save_to_file );

		$im = new Imagick( $save_to_file );
		$pixel = $im->getImagePixelColor( 0, 0 );
		$expected = $pixel->getColorValue( imagick::COLOR_ALPHA );

		$this->assertImageAlphaAtPointImagick( $save_to_file, array( 0,0 ), $expected );

		unlink( $save_to_file );
	}

	/**
	 * Test the image created with WP_Image_Editor_Imagick preserves alpha with no resizing etc
	 *
	 * @ticket 24871
	 */
	public function test_image_preserves_alpha() {
		$file = DIR_TESTDATA . '/images/transparent.png';

		$editor = new WP_Image_Editor_Imagick( $file );

		$this->assertNotInstanceOf( 'WP_Error', $editor );

		$editor->load();

		$save_to_file = tempnam( get_temp_dir(), '' ) . '.png';

		$editor->save( $save_to_file );

		$im = new Imagick( $save_to_file );
		$pixel = $im->getImagePixelColor( 0, 0 );
		$expected = $pixel->getColorValue( imagick::COLOR_ALPHA );

		$this->assertImageAlphaAtPointImagick( $save_to_file, array( 0,0 ), $expected );

		unlink( $save_to_file );
	}

	/**
	 *
	 * @ticket 30596
	 */
	public function test_image_peserves_alpha_on_rotate() {
		$file = DIR_TESTDATA . '/images/transparent.png';

		$pre_rotate_editor = new Imagick( $file );
		$pre_rotate_pixel = $pre_rotate_editor->getImagePixelColor( 0, 0 );
		$pre_rotate_alpha = $pre_rotate_pixel->getColorValue( imagick::COLOR_ALPHA );
		$save_to_file = tempnam( get_temp_dir(),'' ) . '.png';
		$pre_rotate_editor->writeImage( $save_to_file );
		$pre_rotate_editor->destroy();

		$image_editor = new WP_Image_Editor_Imagick( $save_to_file );
		$image_editor->load();
		$this->assertNotInstanceOf( 'WP_Error', $image_editor );
		$image_editor->rotate( 180 );
		$image_editor->save( $save_to_file );

		$this->assertImageAlphaAtPointImagick( $save_to_file, array( 0, 0 ), $pre_rotate_alpha );
		unlink( $save_to_file );
	}
}
