<?php
/**
 * Unit tests for the experimental `{ transform, crop }` edit path.
 *
 * Covers the pure validation helper plus a small set of integration checks
 * that exercise `gutenberg_source_region_process` end-to-end via the REST
 * dispatcher. Full pipeline coverage is handled by manual testing.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/../../lib/experimental/source-region-edit.php';

/**
 * @covers ::gutenberg_source_region_validate
 * @covers ::gutenberg_source_region_process
 */
class Gutenberg_Source_Region_Edit_Test extends WP_UnitTestCase {
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

	/**
	 * A payload that represents no change (rotation 0, no flips, crop
	 * matching the full canvas, or neither transform nor crop) should
	 * short-circuit with `rest_image_not_edited` instead of writing a
	 * new file and attachment row.
	 */
	public function test_process_rejects_noop_payload() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$test_file  = DIR_TESTDATA . '/images/canola.jpg';
		$attachment = self::factory()->attachment->create_upload_object( $test_file );
		$src        = wp_get_attachment_image_url( $attachment, 'full' );
		$meta       = wp_get_attachment_metadata( $attachment );

		$request = new WP_REST_Request( 'POST', "/wp/v2/media/{$attachment}/edit" );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'src'       => $src,
					'transform' => array(
						'rotation' => 0,
						'flip'     => array(
							'horizontal' => false,
							'vertical'   => false,
						),
					),
					'crop'      => array(
						'x'      => 0,
						'y'      => 0,
						'width'  => $meta['width'],
						'height' => $meta['height'],
					),
				)
			)
		);

		$response = rest_do_request( $request );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_image_not_edited', $response->get_data()['code'] );
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
