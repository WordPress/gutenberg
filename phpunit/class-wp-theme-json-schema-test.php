<?php

/**
 * Test WP_Theme_JSON_Schema_Gutenberg class.
 *
 * @package Gutenberg
 *
 * @since 5.9.0
 */
class WP_Theme_JSON_Schema_Gutenberg_Test extends WP_UnitTestCase {
	public function test_migrate_v1_to_latest() {
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
					'color'        => false,
					'customRadius' => false,
					'style'        => false,
					'width'        => false,
				),
				'typography' => array(
					'fontSizes'      => array(
						array(
							'name' => 'Small',
							'slug' => 'small',
							'size' => 12,
						),
						array(
							'name' => 'Normal',
							'slug' => 'normal',
							'size' => 16,
						),
					),
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

		$actual = WP_Theme_JSON_Schema_Gutenberg::migrate( $theme_json_v1 );

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
					'defaultFontSizes' => false,
					'fontSizes'        => array(
						array(
							'name' => 'Small',
							'slug' => 'small',
							'size' => 12,
						),
						array(
							'name' => 'Normal',
							'slug' => 'normal',
							'size' => 16,
						),
					),
					'fontStyle'        => false,
					'fontWeight'       => false,
					'letterSpacing'    => false,
					'textDecoration'   => false,
					'textTransform'    => false,
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

	public function test_migrate_v2_to_latest() {
		$theme_json_v2 = array(
			'version'  => 2,
			'settings' => array(
				'typography' => array(
					'fontSizes' => array(
						array(
							'name' => 'Small',
							'slug' => 'small',
							'size' => 12,
						),
						array(
							'name' => 'Normal',
							'slug' => 'normal',
							'size' => 16,
						),
					),
				),
				'spacing'    => array(
					'spacingSizes' => array(
						array(
							'name' => 'Small',
							'slug' => 20,
							'size' => '20px',
						),
						array(
							'name' => 'Large',
							'slug' => 80,
							'size' => '80px',
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Schema_Gutenberg::migrate( $theme_json_v2 );

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'typography' => array(
					'defaultFontSizes' => false,
					'fontSizes'        => array(
						array(
							'name' => 'Small',
							'slug' => 'small',
							'size' => 12,
						),
						array(
							'name' => 'Normal',
							'slug' => 'normal',
							'size' => 16,
						),
					),
				),
				'spacing'    => array(
					'defaultSpacingSizes' => false,
					'spacingSizes'        => array(
						array(
							'name' => 'Small',
							'slug' => 20,
							'size' => '20px',
						),
						array(
							'name' => 'Large',
							'slug' => 80,
							'size' => '80px',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}
}
