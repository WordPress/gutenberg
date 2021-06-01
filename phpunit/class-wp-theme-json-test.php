<?php

/**
 * Test WP_Theme_JSON_Gutenberg class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Gutenberg_Test extends WP_UnitTestCase {

	function test_get_settings() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'       => array(
						'custom' => false,
					),
					'invalid/key' => 'value',
					'blocks'      => array(
						'core/group' => array(
							'color'       => array(
								'custom' => false,
							),
							'invalid/key' => 'value',
						),
					),
				),
				'styles'   => array(
					'elements' => array(
						'link' => array(
							'color' => array(
								'text' => '#111',
							),
						),
					),
				),
			)
		);

		$actual = $theme_json->get_settings();

		$expected = array(
			'color'  => array(
				'custom' => false,
			),
			'blocks' => array(
				'core/group' => array(
					'color' => array(
						'custom' => false,
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_stylesheet() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
					'blocks'     => array(
						'core/group' => array(
							'custom' => array(
								'base-font'   => 16,
								'line-height' => array(
									'small'  => 1.2,
									'medium' => 1.4,
									'large'  => 1.8,
								),
							),
						),
					),
				),
				'styles'   => array(
					'color'    => array(
						'text' => 'var:preset|color|grey',
					),
					'misc'     => 'value',
					'elements' => array(
						'link' => array(
							'color' => array(
								'text'       => '#111',
								'background' => '#333',
							),
						),
					),
					'blocks'   => array(
						'core/group'     => array(
							'elements' => array(
								'link' => array(
									'color' => array(
										'text' => '#111',
									),
								),
							),
							'spacing'  => array(
								'padding' => array(
									'top'    => '12px',
									'bottom' => '24px',
								),
							),
						),
						'core/heading'   => array(
							'color'    => array(
								'text' => '#123456',
							),
							'elements' => array(
								'link' => array(
									'color'      => array(
										'text'       => '#111',
										'background' => '#333',
									),
									'typography' => array(
										'fontSize' => '60px',
									),
								),
							),
						),
						'core/post-date' => array(
							'color'    => array(
								'text' => '#123456',
							),
							'elements' => array(
								'link' => array(
									'color' => array(
										'background' => '#777',
										'text'       => '#555',
									),
								),
							),
						),
					),
				),
				'misc'     => 'value',
			)
		);

		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}.wp-block-group{--wp--custom--base-font: 16;--wp--custom--line-height--small: 1.2;--wp--custom--line-height--medium: 1.4;--wp--custom--line-height--large: 1.8;}body{color: var(--wp--preset--color--grey);}a{background-color: #333;color: #111;}.wp-block-group{padding-top: 12px;padding-bottom: 24px;}.wp-block-group a{color: #111;}h1,h2,h3,h4,h5,h6{color: #123456;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{background-color: #333;color: #111;font-size: 60px;}.wp-block-post-date{color: #123456;}.wp-block-post-date a{background-color: #777;color: #555;}.has-grey-color{color: grey !important;}.has-grey-background-color{background-color: grey !important;}.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet()
		);
		$this->assertEquals(
			'body{color: var(--wp--preset--color--grey);}a{background-color: #333;color: #111;}.wp-block-group{padding-top: 12px;padding-bottom: 24px;}.wp-block-group a{color: #111;}h1,h2,h3,h4,h5,h6{color: #123456;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{background-color: #333;color: #111;font-size: 60px;}.wp-block-post-date{color: #123456;}.wp-block-post-date a{background-color: #777;color: #555;}.has-grey-color{color: grey !important;}.has-grey-background-color{background-color: grey !important;}.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet( 'block_styles' )
		);
		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}.wp-block-group{--wp--custom--base-font: 16;--wp--custom--line-height--small: 1.2;--wp--custom--line-height--medium: 1.4;--wp--custom--line-height--large: 1.8;}',
			$theme_json->get_stylesheet( 'css_variables' )
		);
	}

	function test_get_stylesheet_preset_classes_work_with_compounded_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'blocks' => array(
						'core/heading' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'white',
										'color' => '#fff',
									),
								),
							),
						),
					),
				),
			)
		);

		$this->assertEquals(
			'h1.has-white-color,h2.has-white-color,h3.has-white-color,h4.has-white-color,h5.has-white-color,h6.has-white-color{color: #fff !important;}h1.has-white-background-color,h2.has-white-background-color,h3.has-white-background-color,h4.has-white-background-color,h5.has-white-background-color,h6.has-white-background-color{background-color: #fff !important;}h1.has-white-border-color,h2.has-white-border-color,h3.has-white-border-color,h4.has-white-border-color,h5.has-white-border-color,h6.has-white-border-color{border-color: #fff !important;}',
			$theme_json->get_stylesheet( 'block_styles' )
		);
	}

	function test_get_stylesheet_preset_rules_come_after_block_rules() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'blocks' => array(
						'core/group' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'grey',
										'color' => 'grey',
									),
								),
							),
						),
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/group' => array(
							'color' => array(
								'text' => 'red',
							),
						),
					),
				),
			)
		);

		$this->assertEquals(
			'.wp-block-group{--wp--preset--color--grey: grey;}.wp-block-group{color: red;}.wp-block-group.has-grey-color{color: grey !important;}.wp-block-group.has-grey-background-color{background-color: grey !important;}.wp-block-group.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet()
		);
		$this->assertEquals(
			'.wp-block-group{color: red;}.wp-block-group.has-grey-color{color: grey !important;}.wp-block-group.has-grey-background-color{background-color: grey !important;}.wp-block-group.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet( 'block_styles' )
		);
	}

	public function test_get_stylesheet_preset_values_are_marked_as_important() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'slug'  => 'grey',
								'color' => 'grey',
							),
						),
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/paragraph' => array(
							'color'      => array(
								'text'       => 'red',
								'background' => 'blue',
							),
							'typography' => array(
								'fontSize'   => '12px',
								'lineHeight' => '1.3',
							),
						),
					),
				),
			)
		);

		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;}p{background-color: blue;color: red;font-size: 12px;line-height: 1.3;}.has-grey-color{color: grey !important;}.has-grey-background-color{background-color: grey !important;}.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet()
		);
	}

	public function test_merge_incoming_data() {
		$initial = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
					'custom'  => false,
					'palette' => array(
						array(
							'slug'  => 'red',
							'color' => 'red',
						),
						array(
							'slug'  => 'green',
							'color' => 'green',
						),
					),
				),
				'blocks' => array(
					'core/paragraph' => array(
						'color' => array(
							'custom' => false,
						),
					),
				),
			),
			'styles'   => array(
				'typography' => array(
					'fontSize' => '12',
				),
			),
		);

		$add_new_block = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'blocks' => array(
					'core/list' => array(
						'color' => array(
							'custom' => false,
						),
					),
				),
			),
			'styles'   => array(
				'blocks' => array(
					'core/list' => array(
						'typography' => array(
							'fontSize' => '12',
						),
						'color'      => array(
							'background' => 'brown',
						),
					),
				),
			),
		);

		$add_key_in_settings = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color' => array(
					'customGradient' => true,
				),
			),
		);

		$update_key_in_settings = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color' => array(
					'custom' => true,
				),
			),
		);

		$add_styles = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/group' => array(
						'spacing' => array(
							'padding' => array(
								'top' => '12px',
							),
						),
					),
				),
			),
		);

		$add_key_in_styles = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/group' => array(
						'spacing' => array(
							'padding' => array(
								'bottom' => '12px',
							),
						),
					),
				),
			),
		);

		$add_invalid_context = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/para' => array(
						'typography' => array(
							'lineHeight' => '12',
						),
					),
				),
			),
		);

		$update_presets = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'palette'   => array(
						array(
							'slug'  => 'blue',
							'color' => 'blue',
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
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'custom'         => true,
					'customGradient' => true,
					'palette'        => array(
						array(
							'slug'  => 'red',
							'color' => 'red',
						),
						array(
							'slug'  => 'green',
							'color' => 'green',
						),
						array(
							'slug'  => 'blue',
							'color' => 'blue',
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
				'blocks'     => array(
					'core/paragraph' => array(
						'color' => array(
							'custom' => false,
						),
					),
					'core/list'      => array(
						'color' => array(
							'custom' => false,
						),
					),
				),
			),
			'styles'   => array(
				'typography' => array(
					'fontSize' => '12',
				),
				'blocks'     => array(
					'core/group' => array(
						'spacing' => array(
							'padding' => array(
								'top'    => '12px',
								'bottom' => '12px',
							),
						),
					),
					'core/list'  => array(
						'typography' => array(
							'fontSize' => '12',
						),
						'color'      => array(
							'background' => 'brown',
						),
					),
				),
			),
		);

		$theme_json = new WP_Theme_JSON_Gutenberg( $initial );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $add_new_block ) );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $add_key_in_settings ) );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $update_key_in_settings ) );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $add_styles ) );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $add_key_in_styles ) );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $add_invalid_context ) );
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $update_presets ) );
		$actual = $theme_json->get_raw_data();

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_remove_insecure_properties_removes_unsafe_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'color'    => array(
						'gradient' => 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+PHNjcmlwdD5hbGVydCgnb2snKTwvc2NyaXB0PjxsaW5lYXJHcmFkaWVudCBpZD0nZ3JhZGllbnQnPjxzdG9wIG9mZnNldD0nMTAlJyBzdG9wLWNvbG9yPScjRjAwJy8+PHN0b3Agb2Zmc2V0PSc5MCUnIHN0b3AtY29sb3I9JyNmY2MnLz4gPC9saW5lYXJHcmFkaWVudD48cmVjdCBmaWxsPSd1cmwoI2dyYWRpZW50KScgeD0nMCcgeT0nMCcgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScvPjwvc3ZnPg==\')',
						'text'     => 'var:preset|color|dark-red',
					),
					'elements' => array(
						'link' => array(
							'color' => array(
								'gradient'   => 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+PHNjcmlwdD5hbGVydCgnb2snKTwvc2NyaXB0PjxsaW5lYXJHcmFkaWVudCBpZD0nZ3JhZGllbnQnPjxzdG9wIG9mZnNldD0nMTAlJyBzdG9wLWNvbG9yPScjRjAwJy8+PHN0b3Agb2Zmc2V0PSc5MCUnIHN0b3AtY29sb3I9JyNmY2MnLz4gPC9saW5lYXJHcmFkaWVudD48cmVjdCBmaWxsPSd1cmwoI2dyYWRpZW50KScgeD0nMCcgeT0nMCcgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScvPjwvc3ZnPg==\')',
								'text'       => 'var:preset|color|dark-pink',
								'background' => 'var:preset|color|dark-red',
							),
						),
					),
					'blocks'   => array(
						'core/group'  => array(
							'color'    => array(
								'gradient' => 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+PHNjcmlwdD5hbGVydCgnb2snKTwvc2NyaXB0PjxsaW5lYXJHcmFkaWVudCBpZD0nZ3JhZGllbnQnPjxzdG9wIG9mZnNldD0nMTAlJyBzdG9wLWNvbG9yPScjRjAwJy8+PHN0b3Agb2Zmc2V0PSc5MCUnIHN0b3AtY29sb3I9JyNmY2MnLz4gPC9saW5lYXJHcmFkaWVudD48cmVjdCBmaWxsPSd1cmwoI2dyYWRpZW50KScgeD0nMCcgeT0nMCcgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScvPjwvc3ZnPg==\')',
								'text'     => 'var:preset|color|dark-gray',
							),
							'elements' => array(
								'link' => array(
									'color' => array(
										'gradient' => 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+PHNjcmlwdD5hbGVydCgnb2snKTwvc2NyaXB0PjxsaW5lYXJHcmFkaWVudCBpZD0nZ3JhZGllbnQnPjxzdG9wIG9mZnNldD0nMTAlJyBzdG9wLWNvbG9yPScjRjAwJy8+PHN0b3Agb2Zmc2V0PSc5MCUnIHN0b3AtY29sb3I9JyNmY2MnLz4gPC9saW5lYXJHcmFkaWVudD48cmVjdCBmaWxsPSd1cmwoI2dyYWRpZW50KScgeD0nMCcgeT0nMCcgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScvPjwvc3ZnPg==\')',
										'text'     => 'var:preset|color|dark-pink',
									),
								),
							),
						),
						'invalid/key' => array(
							'background' => 'green',
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$actual   = $theme_json->get_raw_data();
		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'color'    => array(
					'text' => 'var:preset|color|dark-red',
				),
				'elements' => array(
					'link' => array(
						'color' => array(
							'text'       => 'var:preset|color|dark-pink',
							'background' => 'var:preset|color|dark-red',
						),
					),
				),
				'blocks'   => array(
					'core/group' => array(
						'color'    => array(
							'text' => 'var:preset|color|dark-gray',
						),
						'elements' => array(
							'link' => array(
								'color' => array(
									'text' => 'var:preset|color|dark-pink',
								),
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_remove_insecure_properties_removes_unsafe_styles_sub_properties() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'spacing'  => array(
						'padding' => array(
							'top'    => '1px',
							'right'  => '1px',
							'bottom' => 'var(--bottom, var(--unsafe-fallback))',
							'left'   => '1px',
						),
					),
					'elements' => array(
						'link' => array(
							'spacing' => array(
								'padding' => array(
									'top'    => '2px',
									'right'  => '2px',
									'bottom' => 'var(--bottom, var(--unsafe-fallback))',
									'left'   => '2px',
								),
							),
						),
					),
					'blocks'   => array(
						'core/group' => array(
							'spacing'  => array(
								'padding' => array(
									'top'    => '3px',
									'right'  => '3px',
									'bottom' => 'var(bottom, var(--unsafe-fallback))',
									'left'   => '3px',
								),
							),
							'elements' => array(
								'link' => array(
									'spacing' => array(
										'padding' => array(
											'top'    => '4px',
											'right'  => '4px',
											'bottom' => 'var(--bottom, var(--unsafe-fallback))',
											'left'   => '4px',
										),
									),
								),
							),
						),
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$actual   = $theme_json->get_raw_data();
		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'spacing'  => array(
					'padding' => array(
						'top'   => '1px',
						'right' => '1px',
						'left'  => '1px',
					),
				),
				'elements' => array(
					'link' => array(
						'spacing' => array(
							'padding' => array(
								'top'   => '2px',
								'right' => '2px',
								'left'  => '2px',
							),
						),
					),
				),
				'blocks'   => array(
					'core/group' => array(
						'spacing'  => array(
							'padding' => array(
								'top'   => '3px',
								'right' => '3px',
								'left'  => '3px',
							),
						),
						'elements' => array(
							'link' => array(
								'spacing' => array(
									'padding' => array(
										'top'   => '4px',
										'right' => '4px',
										'left'  => '4px',
									),
								),
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_remove_insecure_properties_removes_non_preset_settings() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
					'blocks'  => array(
						'core/group' => array(
							'color'   => array(
								'custom'  => true,
								'palette' => array(
									array(
										'name'  => 'Yellow',
										'slug'  => 'yellow',
										'color' => '#ff0000',
									),
									array(
										'name'  => 'Pink',
										'slug'  => 'pink',
										'color' => '#00ff00',
									),
									array(
										'name'  => 'Orange',
										'slug'  => 'orange',
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
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
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
				'blocks' => array(
					'core/group' => array(
						'color' => array(
							'palette' => array(
								array(
									'name'  => 'Yellow',
									'slug'  => 'yellow',
									'color' => '#ff0000',
								),
								array(
									'name'  => 'Pink',
									'slug'  => 'pink',
									'color' => '#00ff00',
								),
								array(
									'name'  => 'Orange',
									'slug'  => 'orange',
									'color' => '#0000ff',
								),
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_removes_unsafe_preset_settings() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
								'color' => 'var(--color, var(--unsafe-fallback))',
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
								'fontFamily' => 'var(--fontFamily, var(--unsafe-fallback))',
							),
						),
					),
					'blocks'     => array(
						'core/group' => array(
							'color' => array(
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
										'color' => 'var(--color, var(--unsafe--falback))',
									),
									array(
										'name'  => 'Pink',
										'slug'  => 'pink',
										'color' => '#FFC0CB',
									),
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
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
				'blocks'     => array(
					'core/group' => array(
						'color' => array(
							'palette' => array(
								array(
									'name'  => 'Pink',
									'slug'  => 'pink',
									'color' => '#FFC0CB',
								),
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_remove_insecure_properties_applies_safe_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'color' => array(
						'text' => '#abcabc ', // Trailing space.
					),
				),
			),
			true
		);
		$theme_json->remove_insecure_properties();
		$result   = $theme_json->get_raw_data();
		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'color' => array(
					'text' => '#abcabc ',
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $result );
	}

	function test_get_custom_templates() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'customTemplates' => array(
					array(
						'name'  => 'page-home',
						'title' => 'Homepage template',
					),
				),
			)
		);

		$page_templates = $theme_json->get_custom_templates();

		$this->assertEqualSetsWithIndex(
			$page_templates,
			array(
				'page-home' => array(
					'title'     => 'Homepage template',
					'postTypes' => array( 'page' ),
				),
			)
		);
	}

	function test_get_template_parts() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'templateParts' => array(
					array(
						'name' => 'small-header',
						'area' => 'header',
					),
				),
			)
		);

		$template_parts = $theme_json->get_template_parts();

		$this->assertEqualSetsWithIndex(
			$template_parts,
			array(
				'small-header' => array(
					'area' => 'header',
				),
			)
		);
	}

	function test_get_from_editor_settings() {
		$input = array(
			'disableCustomColors'    => true,
			'disableCustomGradients' => true,
			'disableCustomFontSizes' => true,
			'enableCustomLineHeight' => true,
			'enableCustomUnits'      => true,
			'colors'                 => array(
				array(
					'slug'  => 'color-slug',
					'name'  => 'Color Name',
					'color' => 'colorvalue',
				),
			),
			'gradients'              => array(
				array(
					'slug'     => 'gradient-slug',
					'name'     => 'Gradient Name',
					'gradient' => 'gradientvalue',
				),
			),
			'fontSizes'              => array(
				array(
					'slug' => 'size-slug',
					'name' => 'Size Name',
					'size' => 'sizevalue',
				),
			),
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'custom'         => false,
					'customGradient' => false,
					'gradients'      => array(
						array(
							'slug'     => 'gradient-slug',
							'name'     => 'Gradient Name',
							'gradient' => 'gradientvalue',
						),
					),
					'palette'        => array(
						array(
							'slug'  => 'color-slug',
							'name'  => 'Color Name',
							'color' => 'colorvalue',
						),
					),
				),
				'spacing'    => array(
					'units' => array( 'px', 'em', 'rem', 'vh', 'vw' ),
				),
				'typography' => array(
					'customFontSize'   => false,
					'customLineHeight' => true,
					'fontSizes'        => array(
						array(
							'slug' => 'size-slug',
							'name' => 'Size Name',
							'size' => 'sizevalue',
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_editor_settings_no_theme_support() {
		$input = array(
			'__unstableEnableFullSiteEditingBlocks' => false,
			'disableCustomColors'                   => false,
			'disableCustomFontSizes'                => false,
			'disableCustomGradients'                => false,
			'enableCustomLineHeight'                => false,
			'enableCustomUnits'                     => false,
			'imageSizes'                            => array(
				array(
					'slug' => 'thumbnail',
					'name' => 'Thumbnail',
				),
				array(
					'slug' => 'medium',
					'name' => 'Medium',
				),
				array(
					'slug' => 'large',
					'name' => 'Large',
				),
				array(
					'slug' => 'full',
					'name' => 'Full Size',
				),
			),
			'isRTL'                                 => false,
			'maxUploadFileSize'                     => 123,
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'custom'         => true,
					'customGradient' => true,
				),
				'spacing'    => array(
					'units' => false,
				),
				'typography' => array(
					'customFontSize'   => true,
					'customLineHeight' => false,
				),
			),
		);

		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_editor_settings_blank() {
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(),
		);
		$actual   = WP_Theme_JSON_Gutenberg::get_from_editor_settings( array() );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_editor_settings_custom_units_can_be_disabled() {
		add_theme_support( 'custom-units', array() );
		$input = gutenberg_get_default_block_editor_settings();

		$expected = array(
			'units'         => array( array() ),
			'customPadding' => false,
		);

		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	function test_get_editor_settings_custom_units_can_be_enabled() {
		add_theme_support( 'custom-units' );
		$input = gutenberg_get_default_block_editor_settings();

		$expected = array(
			'units'         => array( 'px', 'em', 'rem', 'vh', 'vw' ),
			'customPadding' => false,
		);

		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	function test_get_editor_settings_custom_units_can_be_filtered() {
		add_theme_support( 'custom-units', 'rem', 'em' );
		$input = gutenberg_get_default_block_editor_settings();

		$expected = array(
			'units'         => array( 'rem', 'em' ),
			'customPadding' => false,
		);

		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

}
