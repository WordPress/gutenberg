<?php

/**
 * Test WP_Theme_JSON class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Test extends WP_UnitTestCase {

	function test_contexts_not_valid_are_skipped() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global'       => array(
					'settings' => array(
						'color' => array(
							'custom' => 'false',
						),
					),
				),
				'core/invalid' => array(
					'settings' => array(
						'color' => array(
							'custom' => 'false',
						),
					),
				),
			)
		);
		$result     = $theme_json->get_raw_data();

		$expected = array(
			'global' => array(
				'settings' => array(
					'color' => array(
						'custom' => 'false',
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_properties_not_valid_are_skipped() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'invalidKey' => 'invalid value',
					'settings'   => array(
						'color'          => array(
							'custom'     => 'false',
							'invalidKey' => 'invalid value',
						),
						'invalidSection' => array(
							'invalidKey' => 'invalid value',
						),
					),
					'styles'     => array(
						'typography'     => array(
							'fontSize'        => '12',
							'invalidProperty' => 'invalid value',
						),
						'invalidSection' => array(
							'invalidProperty' => 'invalid value',
						),
					),
				),
			)
		);
		$result     = $theme_json->get_raw_data();

		$expected = array(
			'global' => array(
				'settings' => array(
					'color' => array(
						'custom' => 'false',
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize' => '12',
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_get_settings() {
		// See schema at WP_Theme_JSON::SCHEMA.
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'settings' => array(
						'color'      => array(
							'link' => 'value',
						),
						'custom'     => 'value',
						'typography' => 'value',
						'misc'       => 'value',
					),
					'styles'   => array(
						'color' => 'value',
						'misc'  => 'value',
					),
					'misc'     => 'value',
				),
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
		// See schema at WP_Theme_JSON::SCHEMA.
		$theme_json = new WP_Theme_JSON(
			array(
				'global'     => array(
					'settings' => array(
						'color'      => array(
							'text'    => 'value',
							'palette' => array(
								array(
									'slug'  => 'grey',
									'color' => 'grey',
								),
							),
						),
						'typography' => array(
							'fontFamilies' => array(
								array(
									'slug'       => 'small',
									'fontFamily' => '14px',
								),
								array(
									'slug'       => 'big',
									'fontFamily' => '41px',
								),
							),
						),
						'misc'       => 'value',
					),
					'styles'   => array(
						'color' => array(
							'link' => '#111',
							'text' => 'var:preset|color|grey',
						),
						'misc'  => 'value',
					),
					'misc'     => 'value',
				),
				'core/group' => array(
					'styles' => array(
						'spacing' => array(
							'padding' => array(
								'top'    => '12px',
								'bottom' => '24px',
							),
						),
					),
				),
			)
		);

		$this->assertEquals(
			':root{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}:root{--wp--style--color--link: #111;color: var(--wp--preset--color--grey);}.has-grey-color{color: grey;}.has-grey-background-color{background-color: grey;}.wp-block-group{padding-top: 12px;padding-bottom: 24px;}',
			$theme_json->get_stylesheet()
		);
		$this->assertEquals(
			':root{--wp--style--color--link: #111;color: var(--wp--preset--color--grey);}.has-grey-color{color: grey;}.has-grey-background-color{background-color: grey;}.wp-block-group{padding-top: 12px;padding-bottom: 24px;}',
			$theme_json->get_stylesheet( 'block_styles' )
		);
		$this->assertEquals(
			':root{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}',
			$theme_json->get_stylesheet( 'css_variables' )
		);
	}

	public function test_merge_incoming_data() {
		$initial = array(
			'global'         => array(
				'settings' => array(
					'color' => array(
						'custom'  => 'false',
						'palette' => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
							),
							array(
								'slug'  => 'blue',
								'color' => 'blue',
							),
						),
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize' => '12',
					),
				),
			),
			'core/paragraph' => array(
				'settings' => array(
					'color' => array(
						'custom' => 'false',
					),
				),
			),
		);

		$add_new_context = array(
			'core/list' => array(
				'settings' => array(
					'color' => array(
						'custom' => 'false',
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize' => '12',
					),
					'color'      => array(
						'link'       => 'pink',
						'background' => 'brown',
					),
				),
			),
		);

		$add_key_in_settings = array(
			'global' => array(
				'settings' => array(
					'color' => array(
						'customGradient' => 'true',
					),
				),
			),
		);

		$update_key_in_settings = array(
			'global' => array(
				'settings' => array(
					'color' => array(
						'custom' => 'true',
					),
				),
			),
		);

		$add_styles = array(
			'core/paragraph' => array(
				'styles' => array(
					'typography' => array(
						'fontSize' => '12',
					),
					'color'      => array(
						'link' => 'pink',
					),
				),
			),
		);

		$add_key_in_styles = array(
			'core/paragraph' => array(
				'styles' => array(
					'typography' => array(
						'lineHeight' => '12',
					),
				),
			),
		);

		$add_invalid_context = array(
			'core/para' => array(
				'styles' => array(
					'typography' => array(
						'lineHeight' => '12',
					),
				),
			),
		);

		$update_presets = array(
			'global' => array(
				'settings' => array(
					'color'      => array(
						'palette'   => array(
							array(
								'slug'  => 'color',
								'color' => 'color',
							),
						),
						'gradients' => array(
							array(
								'slug'     => 'gradient',
								'gradient' => 'gradient',
							),
						),
					),
					'typography' => array(
						'fontSizes'    => array(
							array(
								'slug' => 'fontSize',
								'size' => 'fontSize',
							),
						),
						'fontFamilies' => array(
							array(
								'slug'       => 'fontFamily',
								'fontFamily' => 'fontFamily',
							),
						),
					),
				),
			),
		);

		$expected = array(
			'global'         => array(
				'settings' => array(
					'color'      => array(
						'custom'         => 'true',
						'customGradient' => 'true',
						'palette'        => array(
							array(
								'slug'  => 'color',
								'color' => 'color',
							),
						),
						'gradients'      => array(
							array(
								'slug'     => 'gradient',
								'gradient' => 'gradient',
							),
						),
					),
					'typography' => array(
						'fontSizes'    => array(
							array(
								'slug' => 'fontSize',
								'size' => 'fontSize',
							),
						),
						'fontFamilies' => array(
							array(
								'slug'       => 'fontFamily',
								'fontFamily' => 'fontFamily',
							),
						),
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize' => '12',
					),
				),
			),
			'core/paragraph' => array(
				'settings' => array(
					'color' => array(
						'custom' => 'false',
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize'   => '12',
						'lineHeight' => '12',
					),
					'color'      => array(
						'link' => 'pink',
					),
				),
			),
			'core/list'      => array(
				'settings' => array(
					'color' => array(
						'custom' => 'false',
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize' => '12',
					),
					'color'      => array(
						'link'       => 'pink',
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
		$theme_json->merge( new WP_Theme_JSON( $add_invalid_context ) );
		$theme_json->merge( new WP_Theme_JSON( $update_presets ) );
		$result = $theme_json->get_raw_data();

		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_invalid_contexts() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global'    => array(
					'styles' => array(
						'color' => array(
							'background' => 'green',
							'text'       => 'var:preset|color|dark-gray',
						),
					),
				),
				'.my-class' => array(
					'styles' => array(
						'color' => array(
							'background' => 'green',
							'text'       => 'var:preset|color|dark-gray',
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'global' => array(
				'styles' => array(
					'color' => array(
						'background' => 'green',
						'text'       => 'var:preset|color|dark-gray',
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_invalid_properties() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'styles'  => array(
						'color' => array(
							'gradient' => 'linear-gradient(55deg,rgba(6,147,227,1) 0%,rgb(84,177,218) 54%,rgb(155,81,224) 100%)',
							'text'     => 'var:preset|color|dark-gray',
						),
					),
					'invalid' => array(
						'background' => 'green',
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'global' => array(
				'styles' => array(
					'color' => array(
						'gradient' => 'linear-gradient(55deg,rgba(6,147,227,1) 0%,rgb(84,177,218) 54%,rgb(155,81,224) 100%)',
						'text'     => 'var:preset|color|dark-gray',
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_unsafe_properties() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'styles'  => array(
						'color' => array(
							'gradient' => 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+PHNjcmlwdD5hbGVydCgnb2snKTwvc2NyaXB0PjxsaW5lYXJHcmFkaWVudCBpZD0nZ3JhZGllbnQnPjxzdG9wIG9mZnNldD0nMTAlJyBzdG9wLWNvbG9yPScjRjAwJy8+PHN0b3Agb2Zmc2V0PSc5MCUnIHN0b3AtY29sb3I9JyNmY2MnLz4gPC9saW5lYXJHcmFkaWVudD48cmVjdCBmaWxsPSd1cmwoI2dyYWRpZW50KScgeD0nMCcgeT0nMCcgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScvPjwvc3ZnPg==\')',
							'text'     => 'var:preset|color|dark-gray',
						),
					),
					'invalid' => array(
						'background' => 'green',
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'global' => array(
				'styles' => array(
					'color' => array(
						'text' => 'var:preset|color|dark-gray',
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_properties_when_not_allowed_in_a_context() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global'     => array(
					'styles'  => array(
						'color'   => array(
							'text' => 'var:preset|color|dark-gray',
						),
						'spacing' => array(
							'padding' => array(
								'top'    => '1px',
								'right'  => '1px',
								'bottom' => '1px',
								'left'   => '1px',
							),
						),
					),
					'invalid' => array(
						'background' => 'green',
					),
				),
				'core/group' => array(
					'styles' => array(
						'spacing' => array(
							'padding' => array(
								'top'    => '1px',
								'right'  => '1px',
								'bottom' => '1px',
								'left'   => '1px',
							),
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'global'     => array(
				'styles' => array(
					'color' => array(
						'text' => 'var:preset|color|dark-gray',
					),
				),
			),
			'core/group' => array(
				'styles' => array(
					'spacing' => array(
						'padding' => array(
							'top'    => '1px',
							'right'  => '1px',
							'bottom' => '1px',
							'left'   => '1px',
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_unsafe_sub_properties() {
		$theme_json = new WP_Theme_JSON(
			array(
				'core/group' => array(
					'styles' => array(
						'spacing' => array(
							'padding' => array(
								'top'    => '1px',
								'right'  => '1px',
								'bottom' => 'var(--unsafe-var-y)',
								'left'   => '1px',
							),
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'core/group' => array(
				'styles' => array(
					'spacing' => array(
						'padding' => array(
							'top'   => '1px',
							'right' => '1px',
							'left'  => '1px',
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_non_preset_settings() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'settings' => array(
						'color'   => array(
							'custom'  => true,
							'palette' => array(
								array(
									'name'  => 'Red',
									'slug'  => 'red',
									'color' => '#ff0000',
								),
								array(
									'name'  => 'Green',
									'slug'  => 'green',
									'color' => '#00ff00',
								),
								array(
									'name'  => 'Blue',
									'slug'  => 'blue',
									'color' => '#0000ff',
								),
							),
						),
						'spacing' => array(
							'customPadding' => false,
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'global' => array(
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'name'  => 'Red',
								'slug'  => 'red',
								'color' => '#ff0000',
							),
							array(
								'name'  => 'Green',
								'slug'  => 'green',
								'color' => '#00ff00',
							),
							array(
								'name'  => 'Blue',
								'slug'  => 'blue',
								'color' => '#0000ff',
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_unsafe_preset_settings() {
		$theme_json = new WP_Theme_JSON(
			array(
				'global' => array(
					'settings' => array(
						'color'      => array(
							'palette' => array(
								array(
									'name'  => 'Red/><b>ok</ok>',
									'slug'  => 'red',
									'color' => '#ff0000',
								),
								array(
									'name'  => 'Green',
									'slug'  => 'a" attr',
									'color' => '#00ff00',
								),
								array(
									'name'  => 'Blue',
									'slug'  => 'blue',
									'color' => 'var(--custom-v1)',
								),
								array(
									'name'  => 'Pink',
									'slug'  => 'pink',
									'color' => '#FFC0CB',
								),
							),
						),
						'typography' => array(
							'fontFamilies' => array(
								array(
									'name'       => 'Helvetica Arial/><b>test</b>',
									'slug'       => 'helvetica-arial',
									'fontFamily' => 'Helvetica Neue, Helvetica, Arial, sans-serif',
								),
								array(
									'name'       => 'Geneva',
									'slug'       => 'geneva#asa',
									'fontFamily' => 'Geneva, Tahoma, Verdana, sans-serif',
								),
								array(
									'name'       => 'Cambria',
									'slug'       => 'cambria',
									'fontFamily' => 'Cambria, Georgia, serif',
								),
								array(
									'name'       => 'Helvetica Arial',
									'slug'       => 'helvetica-arial',
									'fontFamily' => 'var(--custom-var-1)',
								),
							),
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'global' => array(
				'settings' => array(
					'color'      => array(
						'palette' => array(
							array(
								'name'  => 'Pink',
								'slug'  => 'pink',
								'color' => '#FFC0CB',
							),
						),
					),
					'typography' => array(
						'fontFamilies' => array(
							array(
								'name'       => 'Cambria',
								'slug'       => 'cambria',
								'fontFamily' => 'Cambria, Georgia, serif',
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}
}
