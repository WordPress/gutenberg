<?php
/**
 * Tests for auto-register blocks functions.
 *
 * @package gutenberg
 */

/**
 * Test the auto-register block support.
 *
 * @group blocks
 */
class Tests_Block_Supports_Auto_Register_Test extends WP_UnitTestCase {

	/**
	 * Tests that attributes are marked when autoRegister is enabled.
	 *
	 * @covers ::gutenberg_mark_auto_generate_control_attributes
	 */
	public function test_marks_attributes_with_auto_register_flag() {
		$settings = array(
			'supports'   => array( 'autoRegister' => true ),
			'attributes' => array(
				'title' => array( 'type' => 'string' ),
				'count' => array( 'type' => 'integer' ),
			),
		);

		$result = gutenberg_mark_auto_generate_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['title']['autoGenerateControl'] );
		$this->assertTrue( $result['attributes']['count']['autoGenerateControl'] );
	}

	/**
	 * Tests that attributes are not marked without autoRegister flag.
	 *
	 * @covers ::gutenberg_mark_auto_generate_control_attributes
	*/
	public function test_does_not_mark_attributes_without_auto_register() {
		$settings = array(
			'attributes' => array(
				'title' => array( 'type' => 'string' ),
			),
		);

		$result = gutenberg_mark_auto_generate_control_attributes( $settings );

		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['title'] );
	}

	/**
	 * Tests that attributes with source are excluded.
	 *
	 * @covers ::gutenberg_mark_auto_generate_control_attributes
	 */
	public function test_excludes_attributes_with_source() {
		$settings = array(
			'supports'   => array( 'autoRegister' => true ),
			'attributes' => array(
				'title'   => array( 'type' => 'string' ),
				'content' => array(
					'type'   => 'string',
					'source' => 'html',
				),
			),
		);

		$result = gutenberg_mark_auto_generate_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['title']['autoGenerateControl'] );
		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['content'] );
	}

	/**
	 * Tests that attributes with role: local are excluded.
	 *
	 * Example: The 'blob' attribute in media blocks (image, video, file, audio)
	 * stores a temporary blob URL during file upload. This is internal state
	 * that shouldn't be shown in the inspector or saved to the database.
	 */
	public function test_excludes_attributes_with_role_local() {
		$settings = array(
			'supports'   => array( 'autoRegister' => true ),
			'attributes' => array(
				'title' => array( 'type' => 'string' ),
				'blob'  => array(
					'type' => 'string',
					'role' => 'local',
				),
			),
		);

		$result = gutenberg_mark_auto_generate_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['title']['autoGenerateControl'] );
		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['blob'] );
	}

	/**
	 * Tests that empty attributes are handled gracefully.
	 */
	public function test_handles_empty_attributes() {
		$settings = array(
			'supports' => array( 'autoRegister' => true ),
		);

		$result = gutenberg_mark_auto_generate_control_attributes( $settings );

		$this->assertSame( $settings, $result );
	}

	/**
	 * Tests that only allowed attributes are marked.
	 */
	public function test_excludes_unsupported_types() {
		$settings = array(
			'supports'   => array( 'autoRegister' => true ),
			'attributes' => array(
				// Supported types
				'text'     => array( 'type' => 'string' ),
				'price'    => array( 'type' => 'number' ),
				'count'    => array( 'type' => 'integer' ),
				'enabled'  => array( 'type' => 'boolean' ),
				// Unsupported types
				'metadata' => array( 'type' => 'object' ),
				'items'    => array( 'type' => 'array' ),
				'config'   => array( 'type' => 'null' ),
				'unknown'  => array( 'type' => 'unknown' ),
			),
		);

		$result = gutenberg_mark_auto_generate_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['text']['autoGenerateControl'] );
		$this->assertTrue( $result['attributes']['price']['autoGenerateControl'] );
		$this->assertTrue( $result['attributes']['count']['autoGenerateControl'] );
		$this->assertTrue( $result['attributes']['enabled']['autoGenerateControl'] );
		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['metadata'] );
		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['items'] );
		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['config'] );
		$this->assertArrayNotHasKey( 'autoGenerateControl', $result['attributes']['unknown'] );
	}
}
