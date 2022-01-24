<?php

/**
 * Test WP_Theme_JSON_Gutenberg class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Schema_Gutenberg_Test extends WP_UnitTestCase {
	/**
	 * The current theme.json schema version.
	 */
	const LATEST_SCHEMA_VERSION = WP_Theme_JSON_Gutenberg::LATEST_SCHEMA;

	function test_migrate_v0_to_v1() {
		$theme_json_v0 = array(
			'settings' => array(
				'defaults'       => array(
					'color'      => array(
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
					'typography' => array(
						'customFontStyle'       => false,
						'customFontWeight'      => false,
						'customTextDecorations' => false,
						'customTextTransforms'  => false,
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
						'customColor'  => false,
						'customRadius' => false,
						'customStyle'  => false,
						'customWidth'  => false,
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

		$actual = WP_Theme_JSON_Schema_Gutenberg::migrate( $theme_json_v0 );

		$expected = array(
			'version'  => self::LATEST_SCHEMA_VERSION,
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
					'color'  => false,
					'radius' => false,
					'style'  => false,
					'width'  => false,
				),
				'typography' => array(
					'fontStyle'      => false,
					'fontWeight'     => false,
					'textDecoration' => false,
					'textTransform'  => false,
				),
				'blocks'     => array(
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

	function test_migrate_v1_remove_custom_prefixes() {
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

		$actual = WP_Theme_JSON_Schema_Gutenberg::migrate( $theme_json_v1 );

		$expected = array(
			'version'  => self::LATEST_SCHEMA_VERSION,
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
					'color'  => false,
					'radius' => false,
					'style'  => false,
					'width'  => false,
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
							'color'  => true,
							'radius' => true,
							'style'  => true,
							'width'  => true,
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

	function test_migrate_v1_to_v2() {
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

		$actual = WP_Theme_JSON_Schema_Gutenberg::migrate( $theme_json_v1 );

		$expected = array(
			'version'  => self::LATEST_SCHEMA_VERSION,
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
					'color'  => false,
					'radius' => false,
					'style'  => false,
					'width'  => false,
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
							'color'  => true,
							'radius' => true,
							'style'  => true,
							'width'  => true,
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
