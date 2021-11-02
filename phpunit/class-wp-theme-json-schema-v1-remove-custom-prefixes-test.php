<?php

/**
 * Test WP_Theme_JSON_Schema_V1_Remove_Custom_Prefixes class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Schema_V1_Remove_Custom_Prefixes_Test extends WP_UnitTestCase {

	function test_parse() {
		$theme_json_v1 = array(
			'version'  => 1,
			'settings' => array(
				'color'      => array(
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
				'border'     => array(
					'customColor'  => false,
					'customRadius' => false,
					'customStyle'  => false,
					'customWidth'  => false,
				),
				'typography' => array(
					'customFontStyle'       => false,
					'customFontWeight'      => false,
					'customLetterSpacing'   => false,
					'customTextDecorations' => false,
					'customTextTransforms'  => false,
				),
				'blocks'     => array(
					'core/group' => array(
						'border'     => array(
							'customColor'  => true,
							'customRadius' => true,
							'customStyle'  => true,
							'customWidth'  => true,
						),
						'typography' => array(
							'customFontStyle'       => true,
							'customFontWeight'      => true,
							'customLetterSpacing'   => true,
							'customTextDecorations' => true,
							'customTextTransforms'  => true,
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

		$actual = WP_Theme_JSON_Schema_V1_Remove_Custom_Prefixes::migrate( $theme_json_v1 );

		$expected = array(
			'version'  => 1,
			'settings' => array(
				'color'      => array(
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
				'border'     => array(
					'color'        => false,
					'customRadius' => false,
					'style'        => false,
					'width'        => false,
				),
				'typography' => array(
					'fontStyle'      => false,
					'fontWeight'     => false,
					'letterSpacing'  => false,
					'textDecoration' => false,
					'textTransform'  => false,
				),
				'blocks'     => array(
					'core/group' => array(
						'border'     => array(
							'color'        => true,
							'customRadius' => true,
							'style'        => true,
							'width'        => true,
						),
						'typography' => array(
							'fontStyle'      => true,
							'fontWeight'     => true,
							'letterSpacing'  => true,
							'textDecoration' => true,
							'textTransform'  => true,
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
