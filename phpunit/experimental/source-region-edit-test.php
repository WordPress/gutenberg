<?php
/**
 * Unit tests for the experimental `{ transform, crop }` edit path.
 *
 * Focuses on the pure validation + normalization helpers; the full REST
 * pipeline is exercised by manual testing and future integration tests.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/../../lib/experimental/source-region-edit.php';

/**
 * @covers ::gutenberg_source_region_validate
 * @covers ::gutenberg_source_region_normalize_transform
 * @covers ::gutenberg_source_region_normalize_crop
 */
class Gutenberg_Source_Region_Edit_Test extends WP_UnitTestCase {
	public function test_normalize_transform_defaults() {
		$t = gutenberg_source_region_normalize_transform( null );

		$this->assertSame( 0.0, $t['rotation'] );
		$this->assertFalse( $t['flip']['horizontal'] );
		$this->assertFalse( $t['flip']['vertical'] );
	}

	public function test_normalize_transform_coerces_strings() {
		$t = gutenberg_source_region_normalize_transform(
			array(
				'rotation' => '90',
				'flip'     => array( 'horizontal' => 1 ),
			)
		);

		$this->assertSame( 90.0, $t['rotation'] );
		$this->assertTrue( $t['flip']['horizontal'] );
		$this->assertFalse( $t['flip']['vertical'] );
	}

	public function test_normalize_crop_rounds_to_pixels() {
		$crop = gutenberg_source_region_normalize_crop(
			array(
				'x'      => 10.4,
				'y'      => -9.8,
				'width'  => 576.0,
				'height' => 594.36,
			)
		);

		$this->assertSame( 10, $crop['x'] );
		$this->assertSame( -10, $crop['y'] );
		$this->assertSame( 576, $crop['width'] );
		$this->assertSame( 594, $crop['height'] );
	}

	public function test_normalize_crop_null_passes_through() {
		$this->assertNull( gutenberg_source_region_normalize_crop( null ) );
	}

	public function test_validate_accepts_transform_only() {
		$result = gutenberg_source_region_validate(
			array(
				'transform' => array( 'rotation' => 90 ),
			)
		);

		$this->assertTrue( $result );
	}

	public function test_validate_accepts_crop_only() {
		$result = gutenberg_source_region_validate(
			array(
				'crop' => array(
					'x'      => 0,
					'y'      => 0,
					'width'  => 100,
					'height' => 100,
				),
			)
		);

		$this->assertTrue( $result );
	}

	public function test_validate_accepts_transform_and_crop() {
		$result = gutenberg_source_region_validate(
			array(
				'transform' => array(
					'rotation' => 90,
					'flip'     => array( 'horizontal' => true ),
				),
				'crop'      => array(
					'x'      => 0,
					'y'      => 0,
					'width'  => 576,
					'height' => 1024,
				),
			)
		);

		$this->assertTrue( $result );
	}

	public function test_validate_accepts_negative_crop_offsets() {
		// Pan/zoom can place the stencil past the image edge; the server
		// relies on WP_Image_Editor::crop to clamp rather than rejecting.
		$result = gutenberg_source_region_validate(
			array(
				'crop' => array(
					'x'      => -50,
					'y'      => -50,
					'width'  => 100,
					'height' => 100,
				),
			)
		);

		$this->assertTrue( $result );
	}

	public function test_validate_rejects_non_object_transform() {
		$result = gutenberg_source_region_validate(
			array( 'transform' => 'not-an-object' )
		);

		$this->assertWPError( $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
	}

	public function test_validate_rejects_non_numeric_rotation() {
		$result = gutenberg_source_region_validate(
			array(
				'transform' => array( 'rotation' => 'sideways' ),
			)
		);

		$this->assertWPError( $result );
	}

	public function test_validate_rejects_non_object_crop() {
		$result = gutenberg_source_region_validate(
			array( 'crop' => 'nope' )
		);

		$this->assertWPError( $result );
	}

	public function test_validate_rejects_missing_crop_fields() {
		$result = gutenberg_source_region_validate(
			array(
				'crop' => array(
					'x'     => 0,
					'width' => 100,
				),
			)
		);

		$this->assertWPError( $result );
	}

	public function test_validate_rejects_zero_size_crop() {
		$result = gutenberg_source_region_validate(
			array(
				'crop' => array(
					'x'      => 0,
					'y'      => 0,
					'width'  => 0,
					'height' => 100,
				),
			)
		);

		$this->assertWPError( $result );
	}

	public function test_validate_rejects_bad_output() {
		$result = gutenberg_source_region_validate(
			array(
				'crop'   => array(
					'x'      => 0,
					'y'      => 0,
					'width'  => 100,
					'height' => 100,
				),
				'output' => array(
					'width'  => 0,
					'height' => 100,
				),
			)
		);

		$this->assertWPError( $result );
	}
}
