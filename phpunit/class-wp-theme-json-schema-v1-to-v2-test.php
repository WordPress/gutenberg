<?php

/**
 * Test WP_Theme_JSON_Schema_V1_to_V2.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Schema_V1_To_V2_Test extends WP_UnitTestCase {

	function test_migrate() {
		$theme_json_v1 = array(
			'version'  => 1,
			'settings' => array(
				'border'     => array(
					'customRadius' => true,
				),
				'spacing'    => array(
					'customMargin'  => true,
					'customPadding' => true,
				),
				'typography' => array(
					'customLineHeight' => true,
				),
				'blocks'     => array(
					'core/group' => array(
						'border'     => array(
							'customRadius' => false,
						),
						'spacing'    => array(
							'customMargin'  => false,
							'customPadding' => false,
						),
						'typography' => array(
							'customLineHeight' => false,
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Schema_V1_to_V2::migrate( $theme_json_v1 );

		$expected = array(
			'version'  => 2,
			'settings' => array(
				'border'     => array(
					'radius' => true,
				),
				'spacing'    => array(
					'margin'  => true,
					'padding' => true,
				),
				'typography' => array(
					'lineHeight' => true,
				),
				'blocks'     => array(
					'core/group' => array(
						'border'     => array(
							'radius' => false,
						),
						'spacing'    => array(
							'margin'  => false,
							'padding' => false,
						),
						'typography' => array(
							'lineHeight' => false,
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}
}
