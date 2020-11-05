<?php

/**
 * Test WP_Theme_JSON class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Test extends WP_UnitTestCase {

	function test_get_settings() {
		// See schema at WP_Theme_JSON::SCHEMA
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'settings' => array(
						'color'      => array(
							'link' => 'value'
						),
						'custom'     => 'value',
						'typography' => 'value',
						'misc'      => 'value'
					),
					'styles' => array(
						'color' => 'value',
						'misc'  => 'value'
					),
					'misc' => 'value'
				)
			)
		);

		$result = $theme_json->get_settings();

		$this->assertArrayHasKey( 'global', $result );
		$this->assertCount( 1, $result );

		$this->assertArrayHasKey( 'color', $result['global'] );
		$this->assertArrayHasKey( 'custom', $result['global'] );
		$this->assertCount( 2, $result['global'] );
	}

	function test_get_stylesheet() {
		// See schema at WP_Theme_JSON::SCHEMA
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'selector' => '.block-selector',
					'supports' => array(
						'color'
					),
					'settings' => array(
						'color'      => array(
							'text' => 'value',
							'palette' => array(
								array(
									'slug' => 'my-color',
									'color' => 'grey',
								)
							)
						),
						'typography' => 'value',
						'misc'      => 'value'
					),
					'styles' => array(
						'color' => array(
							'link' => '#333',
							'text' => '#333',
						),
						'misc'  => 'value'
					),
					'misc' => 'value'
				)
			)
		);

		$result = $theme_json->get_stylesheet();
		$stylesheet = '.block-selector{color: #333;--wp--preset--color--my-color: grey;}.block-selector.has-my-color-color{color: grey;}.block-selector.has-my-color-background-color{background-color: grey;}';

		$this->assertEquals( $stylesheet, $result );
	}

	public function test_merge_incoming_data() {
		$initial = array(
			'global' => array(
				'selector' => ':root',
				'supports' => array('fontSize', 'color'),
				'settings' => array(
					'color' => array(
						'custom' => 'false'
					),
				),
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
					),
				),
			),
			'core/paragraph' => array(
				'selector' => 'core/paragraph',
				'supports' => array('fontSize', 'color'),
				'settings' => array(
					'color' => array(
						'custom' => 'false'
					),
				),
			),
		);
		$add_new_context = array(
			'core/post-title' => array(
				'selector' => 'core/post-title',
				'supports' => array('fontSize', 'color'),
				'settings' => array(
					'color' => array(
						'custom' => 'false'
					),
				),
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
					),
					'color' => array(
						'link' => 'pink',
						'background' => 'brown',
					),
				),
			),
		);
		$add_key_in_settings = array(
			'global' => array(
				'selector' => 'body',
				'supports' => array('fontSize'),
				'settings' => array(
					'color' => array(
						'customGradient' => 'true'
					),
				),
			)
		);
		$update_key_in_settings = array(
			'global' => array(
				'selector' => 'body',
				'supports' => array('fontSize'),
				'settings' => array(
					'color' => array(
						'custom' => 'true'
					),
				),
			)
		);
		$add_styles = array(
			'core/paragraph' => array(
				'selector' => 'core/paragraph',
				'supports' => array('fontSize', 'color'),
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
					),
					'color' => array(
						'link' => 'pink',
					),
				),
			)
		);
		$add_key_in_styles = array(
			'core/paragraph' => array(
				'selector' => 'core/paragraph',
				'supports' => array('fontSize', 'color'),
				'styles' => array(
					'typography' => array(
						'lineHeight' => '12',
					),
				),
			)
		);
		$expected = array(
			'global' => array(
				'selector' => 'body',
				'supports' => array('fontSize'),
				'settings' => array(
					'color' => array(
						'custom' => 'true',
						'customGradient' => 'true',
					),
				),
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
					),
				),
			),
			'core/paragraph' => array(
				'selector' => 'core/paragraph',
				'supports' => array('fontSize', 'color'),
				'settings' => array(
					'color' => array(
						'custom' => 'false'
					),
				),
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
						'lineHeight' => '12',
					),
					'color' => array(
						'link' => 'pink',
					),
				),
			),
			'core/post-title' => array(
				'selector' => 'core/post-title',
				'supports' => array('fontSize', 'color'),
				'settings' => array(
					'color' => array(
						'custom' => 'false'
					),
				),
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
					),
					'color' => array(
						'link' => 'pink',
						'background' => 'brown',
					),
				),
			),
		);

		$theme_json = new WP_Theme_JSON( $initial );
		$theme_json->merge( new WP_Theme_JSON( $add_new_context ) );
		$theme_json->merge( new WP_Theme_JSON( $add_key_in_settings ) );
		$theme_json->merge( new WP_Theme_JSON( $update_key_in_settings ) );
		$theme_json->merge( new WP_Theme_JSON( $add_styles ) );
		$theme_json->merge( new WP_Theme_JSON( $add_key_in_styles ) );
		$result = $theme_json->get_raw_data();

		$this->assertEqualSetsWithIndex( $expected, $result );
	}
}
