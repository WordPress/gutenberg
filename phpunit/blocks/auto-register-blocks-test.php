<?php
/**
 * Tests for auto-register blocks functions.
 *
 * @package gutenberg
 */

/**
 * Tests for gutenberg_mark_auto_inspector_control_attributes().
 *
 * @group blocks
 */
class Tests_Blocks_Auto_Register extends WP_UnitTestCase {

	/**
	 * Tests that attributes are marked when auto_register is enabled.
	 */
	public function test_marks_attributes_with_auto_register_flag() {
		$settings = array(
			'supports'   => array( 'auto_register' => true ),
			'attributes' => array(
				'title' => array( 'type' => 'string' ),
				'count' => array( 'type' => 'integer' ),
			),
		);

		$result = gutenberg_mark_auto_inspector_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['title']['__experimentalAutoInspectorControl'] );
		$this->assertTrue( $result['attributes']['count']['__experimentalAutoInspectorControl'] );
	}

	/**
	 * Tests that attributes are not marked without auto_register flag.
	 */
	public function test_does_not_mark_attributes_without_auto_register() {
		$settings = array(
			'attributes' => array(
				'title' => array( 'type' => 'string' ),
			),
		);

		$result = gutenberg_mark_auto_inspector_control_attributes( $settings );

		$this->assertArrayNotHasKey( '__experimentalAutoInspectorControl', $result['attributes']['title'] );
	}

	/**
	 * Tests that attributes with source are excluded.
	 */
	public function test_excludes_attributes_with_source() {
		$settings = array(
			'supports'   => array( 'auto_register' => true ),
			'attributes' => array(
				'title'   => array( 'type' => 'string' ),
				'content' => array(
					'type'   => 'string',
					'source' => 'html',
				),
			),
		);

		$result = gutenberg_mark_auto_inspector_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['title']['__experimentalAutoInspectorControl'] );
		$this->assertArrayNotHasKey( '__experimentalAutoInspectorControl', $result['attributes']['content'] );
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
			'supports'   => array( 'auto_register' => true ),
			'attributes' => array(
				'title' => array( 'type' => 'string' ),
				'blob'  => array(
					'type' => 'string',
					'role' => 'local',
				),
			),
		);

		$result = gutenberg_mark_auto_inspector_control_attributes( $settings );

		$this->assertTrue( $result['attributes']['title']['__experimentalAutoInspectorControl'] );
		$this->assertArrayNotHasKey( '__experimentalAutoInspectorControl', $result['attributes']['blob'] );
	}

	/**
	 * Tests that empty attributes are handled gracefully.
	 */
	public function test_handles_empty_attributes() {
		$settings = array(
			'supports' => array( 'auto_register' => true ),
		);

		$result = gutenberg_mark_auto_inspector_control_attributes( $settings );

		$this->assertSame( $settings, $result );
	}
}
