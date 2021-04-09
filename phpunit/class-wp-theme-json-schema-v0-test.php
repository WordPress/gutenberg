<?php

/**
 * Test WP_Theme_JSON class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Schema_V0_Test extends WP_UnitTestCase {

	function test_parse() {
		$theme_json_v0 = array(
			'settings' => array(
				'defaults'       => array(
					'color' => array(
						'palette' => array(
							array(
								'name'  => 'Black',
								'slug'  => 'black',
								'color' => '#00000',
							),
							array(
								'name'  => 'White',
								'slug'  => 'white',
								'color' => '#ffffff',
							),
							array(
								'name'  => 'Pale Pink',
								'slug'  => 'pale-pink',
								'color' => '#f78da7',
							),
							array(
								'name'  => 'Vivid Red',
								'slug'  => 'vivid-red',
								'color' => '#cf2e2',
							),
						),
						'custom'  => false,
						'link'    => false,
					),
				),
				'root'           => array(
					'color'  => array(
						'palette' => array(
							array(
								'name'  => 'Pale Pink',
								'slug'  => 'pale-pink',
								'color' => '#f78da7',
							),
							array(
								'name'  => 'Vivid Red',
								'slug'  => 'vivid-red',
								'color' => '#cf2e2e',
							),
						),
						'link'    => true,
					),
					'border' => array(
						'customRadius' => false,
					),
				),
				'core/paragraph' => array(
					'typography' => array(
						'dropCap' => false,
					),
				),
			),
			'styles'   => array(
				'root'       => array(
					'color' => array(
						'background' => 'purple',
						'link'       => 'red',
					),
				),
				'core/group' => array(
					'color'   => array(
						'background' => 'red',
						'link'       => 'yellow',
					),
					'spacing' => array(
						'padding' => array(
							'top' => '10px',
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Schema_V0::parse( $theme_json_v0 );

		$expected = array(
			'version'  => 1,
			'settings' => array(
				'color'  => array(
					'palette' => array(
						array(
							'name'  => 'Pale Pink',
							'slug'  => 'pale-pink',
							'color' => '#f78da7',
						),
						array(
							'name'  => 'Vivid Red',
							'slug'  => 'vivid-red',
							'color' => '#cf2e2e',
						),
					),
					'custom'  => false,
					'link'    => true,
				),
				'border' => array(
					'customRadius' => false,
				),
				'blocks' => array(
					'core/paragraph' => array(
						'typography' => array(
							'dropCap' => false,
						),
					),
				),
			),
			'styles'   => array(
				'color'    => array(
					'background' => 'purple',
				),
				'blocks'   => array(
					'core/group' => array(
						'color'    => array(
							'background' => 'red',
						),
						'spacing'  => array(
							'padding' => array(
								'top' => '10px',
							),
						),
						'elements' => array(
							'link' => array(
								'color' => array(
									'text' => 'yellow',
								),
							),
						),
					),
				),
				'elements' => array(
					'link' => array(
						'color' => array(
							'text' => 'red',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}
}
