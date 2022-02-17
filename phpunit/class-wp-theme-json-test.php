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
					'layout'      => array(
						'contentSize' => 'value',
						'invalid/key' => 'value',
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
			'layout' => array(
				'contentSize' => 'value',
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

	function test_get_settings_presets_are_keyed_by_origin() {
		$default_origin = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'       => array(
						'palette' => array(
							array(
								'slug'  => 'white',
								'color' => 'white',
							),
						),
					),
					'invalid/key' => 'value',
					'blocks'      => array(
						'core/group' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'white',
										'color' => 'white',
									),
								),
							),
						),
					),
				),
			),
			'default'
		);
		$no_origin      = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'       => array(
						'palette' => array(
							array(
								'slug'  => 'black',
								'color' => 'black',
							),
						),
					),
					'invalid/key' => 'value',
					'blocks'      => array(
						'core/group' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'black',
										'color' => 'black',
									),
								),
							),
						),
					),
				),
			)
		);

		$actual_default   = $default_origin->get_raw_data();
		$actual_no_origin = $no_origin->get_raw_data();

		$expected_default   = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
					'palette' => array(
						'default' => array(
							array(
								'slug'  => 'white',
								'color' => 'white',
							),
						),
					),
				),
				'blocks' => array(
					'core/group' => array(
						'color' => array(
							'palette' => array(
								'default' => array(
									array(
										'slug'  => 'white',
										'color' => 'white',
									),
								),
							),
						),
					),
				),
			),
		);
		$expected_no_origin = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
					'palette' => array(
						'theme' => array(
							array(
								'slug'  => 'black',
								'color' => 'black',
							),
						),
					),
				),
				'blocks' => array(
					'core/group' => array(
						'color' => array(
							'palette' => array(
								'theme' => array(
									array(
										'slug'  => 'black',
										'color' => 'black',
									),
								),
							),
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected_default, $actual_default );
		$this->assertEqualSetsWithIndex( $expected_no_origin, $actual_no_origin );
	}

	function test_get_settings_appearance_true_opts_in() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'appearanceTools' => true,
					'spacing'         => array(
						'blockGap' => false, // This should override appearanceTools.
					),
					'blocks'          => array(
						'core/paragraph' => array(
							'typography' => array(
								'lineHeight' => false,
							),
						),
						'core/group'     => array(
							'appearanceTools' => true,
							'typography'      => array(
								'lineHeight' => false, // This should override appearanceTools.
							),
							'spacing'         => array(
								'blockGap' => null,
							),
						),
					),
				),
			)
		);

		$actual   = $theme_json->get_settings();
		$expected = array(
			'border'     => array(
				'width'  => true,
				'style'  => true,
				'radius' => true,
				'color'  => true,
			),
			'color'      => array(
				'link' => true,
			),
			'spacing'    => array(
				'blockGap' => false,
				'margin'   => true,
				'padding'  => true,
			),
			'typography' => array(
				'lineHeight' => true,
			),
			'blocks'     => array(
				'core/paragraph' => array(
					'typography' => array(
						'lineHeight' => false,
					),
				),
				'core/group'     => array(
					'border'     => array(
						'width'  => true,
						'style'  => true,
						'radius' => true,
						'color'  => true,
					),
					'color'      => array(
						'link' => true,
					),
					'spacing'    => array(
						'blockGap' => false,
						'margin'   => true,
						'padding'  => true,
					),
					'typography' => array(
						'lineHeight' => false,
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_settings_appearance_false_does_not_opt_in() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'appearanceTools' => false,
					'border'          => array(
						'width' => true,
					),
					'blocks'          => array(
						'core/paragraph' => array(
							'typography' => array(
								'lineHeight' => false,
							),
						),
						'core/group'     => array(
							'typography' => array(
								'lineHeight' => false,
							),
						),
					),
				),
			)
		);

		$actual   = $theme_json->get_settings();
		$expected = array(
			'appearanceTools' => false,
			'border'          => array(
				'width' => true,
			),
			'blocks'          => array(
				'core/paragraph' => array(
					'typography' => array(
						'lineHeight' => false,
					),
				),
				'core/group'     => array(
					'typography' => array(
						'lineHeight' => false,
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_stylesheet_support_for_shorthand_and_longhand_values() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/group' => array(
							'border'  => array(
								'radius' => '10px',
							),
							'spacing' => array(
								'padding' => '24px',
								'margin'  => '1em',
							),
						),
						'core/image' => array(
							'border'  => array(
								'radius' => array(
									'topLeft'     => '10px',
									'bottomRight' => '1em',
								),
							),
							'spacing' => array(
								'padding' => array(
									'top' => '15px',
								),
								'margin'  => array(
									'bottom' => '30px',
								),
							),
						),
					),
				),
			)
		);

		$styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-inline-end: 2em; }.wp-site-blocks > .alignright { float: right; margin-inline-start: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-inline-start: auto; margin-inline-end: auto; }.wp-block-group{border-radius: 10px;margin: 1em;padding: 24px;}.wp-block-image{border-top-left-radius: 10px;border-bottom-right-radius: 1em;margin-bottom: 30px;padding-top: 15px;}';
		$this->assertEquals( $styles, $theme_json->get_stylesheet() );
		$this->assertEquals( $styles, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_skips_disabled_protected_properties() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'spacing' => array(
						'blockGap' => null,
					),
				),
				'styles'   => array(
					'spacing' => array(
						'blockGap' => '1em',
					),
					'blocks'  => array(
						'core/columns' => array(
							'spacing' => array(
								'blockGap' => '24px',
							),
						),
					),
				),
			)
		);

		$expected = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-inline-end: 2em; }.wp-site-blocks > .alignright { float: right; margin-inline-start: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-inline-start: auto; margin-inline-end: auto; }';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_renders_enabled_protected_properties() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'spacing' => array(
						'blockGap' => true,
					),
				),
				'styles'   => array(
					'spacing' => array(
						'blockGap' => '1em',
					),
				),
			)
		);

		$expected = 'body { margin: 0; }body{--wp--style--block-gap: 1em;}.wp-site-blocks > .alignleft { float: left; margin-inline-end: 2em; }.wp-site-blocks > .alignright { float: right; margin-inline-start: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-inline-start: auto; margin-inline-end: auto; }.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }.wp-site-blocks > * + * { margin-block-start: var( --wp--style--block-gap ); }';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
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
					'spacing'    => array(
						'blockGap' => false,
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
							'border'   => array(
								'radius' => '10px',
							),
							'elements' => array(
								'link' => array(
									'color' => array(
										'text' => '#111',
									),
								),
							),
							'spacing'  => array(
								'padding' => '24px',
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
						'core/image'     => array(
							'border'  => array(
								'radius' => array(
									'topLeft'     => '10px',
									'bottomRight' => '1em',
								),
							),
							'spacing' => array(
								'margin' => array(
									'bottom' => '30px',
								),
							),
						),
					),
				),
				'misc'     => 'value',
			)
		);

		$variables = 'body{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}.wp-block-group{--wp--custom--base-font: 16;--wp--custom--line-height--small: 1.2;--wp--custom--line-height--medium: 1.4;--wp--custom--line-height--large: 1.8;}';
		$styles    = 'body { margin: 0; }body{color: var(--wp--preset--color--grey);}.wp-site-blocks > .alignleft { float: left; margin-inline-end: 2em; }.wp-site-blocks > .alignright { float: right; margin-inline-start: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-inline-start: auto; margin-inline-end: auto; }.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }.wp-site-blocks > * + * { margin-block-start: var( --wp--style--block-gap ); }a{background-color: #333;color: #111;}.wp-block-group{border-radius: 10px;padding: 24px;}.wp-block-group a{color: #111;}h1,h2,h3,h4,h5,h6{color: #123456;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{background-color: #333;color: #111;font-size: 60px;}.wp-block-post-date{color: #123456;}.wp-block-post-date a{background-color: #777;color: #555;}.wp-block-image{border-top-left-radius: 10px;border-bottom-right-radius: 1em;margin-bottom: 30px;}';
		$presets   = '.has-grey-color{color: var(--wp--preset--color--grey) !important;}.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}.has-small-font-family{font-family: var(--wp--preset--font-family--small) !important;}.has-big-font-family{font-family: var(--wp--preset--font-family--big) !important;}';
		$all       = $variables . $styles . $presets;
		$this->assertEquals( $all, $theme_json->get_stylesheet() );
		$this->assertEquals( $styles, $theme_json->get_stylesheet( array( 'styles' ) ) );
		$this->assertEquals( $presets, $theme_json->get_stylesheet( array( 'presets' ) ) );
		$this->assertEquals( $variables, $theme_json->get_stylesheet( array( 'variables' ) ) );
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
			'h1.has-white-color,h2.has-white-color,h3.has-white-color,h4.has-white-color,h5.has-white-color,h6.has-white-color{color: var(--wp--preset--color--white) !important;}h1.has-white-background-color,h2.has-white-background-color,h3.has-white-background-color,h4.has-white-background-color,h5.has-white-background-color,h6.has-white-background-color{background-color: var(--wp--preset--color--white) !important;}h1.has-white-border-color,h2.has-white-border-color,h3.has-white-border-color,h4.has-white-border-color,h5.has-white-border-color,h6.has-white-border-color{border-color: var(--wp--preset--color--white) !important;}',
			$theme_json->get_stylesheet( array( 'presets' ) )
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

		$styles    = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-inline-end: 2em; }.wp-site-blocks > .alignright { float: right; margin-inline-start: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-inline-start: auto; margin-inline-end: auto; }.wp-block-group{color: red;}';
		$presets   = '.wp-block-group.has-grey-color{color: var(--wp--preset--color--grey) !important;}.wp-block-group.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.wp-block-group.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}';
		$variables = '.wp-block-group{--wp--preset--color--grey: grey;}';
		$all       = $variables . $styles . $presets;
		$this->assertEquals( $all, $theme_json->get_stylesheet() );
		$this->assertEquals( $styles, $theme_json->get_stylesheet( array( 'styles' ) ) );
		$this->assertEquals( $presets, $theme_json->get_stylesheet( array( 'presets' ) ) );
		$this->assertEquals( $variables, $theme_json->get_stylesheet( array( 'variables' ) ) );
	}

	function test_get_stylesheet_generates_proper_classes_and_css_vars_from_slugs() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'  => array(
						'palette' => array(
							array(
								'slug'  => 'grey',
								'color' => 'grey',
							),
							array(
								'slug'  => 'dark grey',
								'color' => 'grey',
							),
							array(
								'slug'  => 'light-grey',
								'color' => 'grey',
							),
							array(
								'slug'  => 'white2black',
								'color' => 'grey',
							),
						),
					),
					'custom' => array(
						'white2black' => 'value',
					),
				),
			)
		);

		$this->assertEquals(
			'.has-grey-color{color: var(--wp--preset--color--grey) !important;}.has-dark-grey-color{color: var(--wp--preset--color--dark-grey) !important;}.has-light-grey-color{color: var(--wp--preset--color--light-grey) !important;}.has-white-2-black-color{color: var(--wp--preset--color--white-2-black) !important;}.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.has-dark-grey-background-color{background-color: var(--wp--preset--color--dark-grey) !important;}.has-light-grey-background-color{background-color: var(--wp--preset--color--light-grey) !important;}.has-white-2-black-background-color{background-color: var(--wp--preset--color--white-2-black) !important;}.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}.has-dark-grey-border-color{border-color: var(--wp--preset--color--dark-grey) !important;}.has-light-grey-border-color{border-color: var(--wp--preset--color--light-grey) !important;}.has-white-2-black-border-color{border-color: var(--wp--preset--color--white-2-black) !important;}',
			$theme_json->get_stylesheet( array( 'presets' ) )
		);
		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;--wp--preset--color--dark-grey: grey;--wp--preset--color--light-grey: grey;--wp--preset--color--white-2-black: grey;--wp--custom--white-2-black: value;}',
			$theme_json->get_stylesheet( array( 'variables' ) )
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
			),
			'default'
		);

		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;}body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-inline-end: 2em; }.wp-site-blocks > .alignright { float: right; margin-inline-start: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-inline-start: auto; margin-inline-end: auto; }p{background-color: blue;color: red;font-size: 12px;line-height: 1.3;}.has-grey-color{color: var(--wp--preset--color--grey) !important;}.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}',
			$theme_json->get_stylesheet()
		);
	}

	public function test_merge_incoming_data() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
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
			)
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
						'theme' => array(
							array(
								'slug'  => 'blue',
								'color' => 'blue',
							),
						),
					),
					'gradients'      => array(
						'theme' => array(
							array(
								'slug'     => 'gradient',
								'gradient' => 'gradient',
							),
						),
					),
				),
				'typography' => array(
					'fontSizes'    => array(
						'theme' => array(
							array(
								'slug' => 'fontSize',
								'size' => 'fontSize',
							),
						),
					),
					'fontFamilies' => array(
						'theme' => array(
							array(
								'slug'       => 'fontFamily',
								'fontFamily' => 'fontFamily',
							),
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

	public function test_merge_incoming_data_empty_presets() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'      => array(
						'duotone'   => array(
							array(
								'slug'   => 'value',
								'colors' => array( 'red', 'green' ),
							),
						),
						'gradients' => array(
							array(
								'slug'     => 'gradient',
								'gradient' => 'gradient',
							),
						),
						'palette'   => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
							),
						),
					),
					'spacing'    => array(
						'units' => array( 'px', 'em' ),
					),
					'typography' => array(
						'fontSizes' => array(
							array(
								'slug'  => 'size',
								'value' => 'size',
							),
						),
					),
				),
			)
		);

		$theme_json->merge(
			new WP_Theme_JSON_Gutenberg(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array(
						'color'      => array(
							'duotone'   => array(),
							'gradients' => array(),
							'palette'   => array(),
						),
						'spacing'    => array(
							'units' => array(),
						),
						'typography' => array(
							'fontSizes' => array(),
						),
					),
				)
			)
		);

		$actual   = $theme_json->get_raw_data();
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'duotone'   => array(
						'theme' => array(),
					),
					'gradients' => array(
						'theme' => array(),
					),
					'palette'   => array(
						'theme' => array(),
					),
				),
				'spacing'    => array(
					'units' => array(),
				),
				'typography' => array(
					'fontSizes' => array(
						'theme' => array(),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_merge_incoming_data_null_presets() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'      => array(
						'duotone'   => array(
							array(
								'slug'   => 'value',
								'colors' => array( 'red', 'green' ),
							),
						),
						'gradients' => array(
							array(
								'slug'     => 'gradient',
								'gradient' => 'gradient',
							),
						),
						'palette'   => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
							),
						),
					),
					'spacing'    => array(
						'units' => array( 'px', 'em' ),
					),
					'typography' => array(
						'fontSizes' => array(
							array(
								'slug'  => 'size',
								'value' => 'size',
							),
						),
					),
				),
			)
		);

		$theme_json->merge(
			new WP_Theme_JSON_Gutenberg(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array(
						'color'      => array(
							'custom' => false,
						),
						'spacing'    => array(
							'margin' => false,
						),
						'typography' => array(
							'lineHeight' => false,
						),
					),
				)
			)
		);

		$actual   = $theme_json->get_raw_data();
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'custom'    => false,
					'duotone'   => array(
						'theme' => array(
							array(
								'slug'   => 'value',
								'colors' => array( 'red', 'green' ),
							),
						),
					),
					'gradients' => array(
						'theme' => array(
							array(
								'slug'     => 'gradient',
								'gradient' => 'gradient',
							),
						),
					),
					'palette'   => array(
						'theme' => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
							),
						),
					),
				),
				'spacing'    => array(
					'margin' => false,
					'units'  => array( 'px', 'em' ),
				),
				'typography' => array(
					'lineHeight' => false,
					'fontSizes'  => array(
						'theme' => array(
							array(
								'slug'  => 'size',
								'value' => 'size',
							),
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_merge_incoming_data_color_presets_with_same_slugs_as_default_are_removed() {
		$defaults = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'  => array(
						'defaultPalette' => true,
						'palette'        => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
								'name'  => 'Red',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Green',
							),
						),
					),
					'blocks' => array(
						'core/paragraph' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Blue',
									),
								),
							),
						),
					),
				),
			),
			'default'
		);
		$theme    = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'  => array(
						'palette' => array(
							array(
								'slug'  => 'pink',
								'color' => 'pink',
								'name'  => 'Pink',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Greenish',
							),
						),
					),
					'blocks' => array(
						'core/paragraph' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Bluish',
									),
									array(
										'slug'  => 'yellow',
										'color' => 'yellow',
										'name'  => 'Yellow',
									),
									array(
										'slug'  => 'green',
										'color' => 'green',
										'name'  => 'Block Green',
									),
								),
							),
						),
					),
				),
			)
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
					'palette'        => array(
						'default' => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
								'name'  => 'Red',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Green',
							),
						),
						'theme'   => array(
							array(
								'slug'  => 'pink',
								'color' => 'pink',
								'name'  => 'Pink',
							),
						),
					),
					'defaultPalette' => true,
				),
				'blocks' => array(
					'core/paragraph' => array(
						'color' => array(
							'palette' => array(
								'default' => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Blue',
									),
								),
								'theme'   => array(
									array(
										'slug'  => 'yellow',
										'color' => 'yellow',
										'name'  => 'Yellow',
									),
								),
							),
						),
					),
				),
			),
		);

		$defaults->merge( $theme );
		$actual = $defaults->get_raw_data();

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_merge_incoming_data_color_presets_with_same_slugs_as_default_are_not_removed_if_defaults_are_disabled() {
		$defaults = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'  => array(
						'defaultPalette' => true, // Emulate the defaults from core theme.json.
						'palette'        => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
								'name'  => 'Red',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Green',
							),
						),
					),
					'blocks' => array(
						'core/paragraph' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Blue',
									),
								),
							),
						),
					),
				),
			),
			'default'
		);
		$theme    = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'  => array(
						'defaultPalette' => false,
						'palette'        => array(
							array(
								'slug'  => 'pink',
								'color' => 'pink',
								'name'  => 'Pink',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Greenish',
							),
						),
					),
					'blocks' => array(
						'core/paragraph' => array(
							'color' => array(
								'palette' => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Bluish',
									),
									array(
										'slug'  => 'yellow',
										'color' => 'yellow',
										'name'  => 'Yellow',
									),
									array(
										'slug'  => 'green',
										'color' => 'green',
										'name'  => 'Block Green',
									),
								),
							),
						),
					),
				),
			)
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
					'defaultPalette' => false,
					'palette'        => array(
						'default' => array(
							array(
								'slug'  => 'red',
								'color' => 'red',
								'name'  => 'Red',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Green',
							),
						),
						'theme'   => array(
							array(
								'slug'  => 'pink',
								'color' => 'pink',
								'name'  => 'Pink',
							),
							array(
								'slug'  => 'green',
								'color' => 'green',
								'name'  => 'Greenish',
							),
						),
					),
				),
				'blocks' => array(
					'core/paragraph' => array(
						'color' => array(
							'palette' => array(
								'default' => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Blue',
									),
								),
								'theme'   => array(
									array(
										'slug'  => 'blue',
										'color' => 'blue',
										'name'  => 'Bluish',
									),
									array(
										'slug'  => 'yellow',
										'color' => 'yellow',
										'name'  => 'Yellow',
									),
									array(
										'slug'  => 'green',
										'color' => 'green',
										'name'  => 'Block Green',
									),
								),
							),
						),
					),
				),
			),
		);

		$defaults->merge( $theme );
		$actual = $defaults->get_raw_data();

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_merge_incoming_data_presets_use_default_names() {
		$defaults   = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'typography' => array(
						'fontSizes' => array(
							array(
								'name' => 'Small',
								'slug' => 'small',
								'size' => '12px',
							),
							array(
								'name' => 'Large',
								'slug' => 'large',
								'size' => '20px',
							),
						),
					),
				),
			),
			'default'
		);
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'typography' => array(
						'fontSizes' => array(
							array(
								'slug' => 'small',
								'size' => '1.1rem',
							),
							array(
								'slug' => 'large',
								'size' => '1.75rem',
							),
							array(
								'name' => 'Huge',
								'slug' => 'huge',
								'size' => '3rem',
							),
						),
					),
				),
			),
			'theme'
		);
		$expected   = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'typography' => array(
					'fontSizes' => array(
						'theme'   => array(
							array(
								'name' => 'Small',
								'slug' => 'small',
								'size' => '1.1rem',
							),
							array(
								'name' => 'Large',
								'slug' => 'large',
								'size' => '1.75rem',
							),
							array(
								'name' => 'Huge',
								'slug' => 'huge',
								'size' => '3rem',
							),
						),
						'default' => array(
							array(
								'name' => 'Small',
								'slug' => 'small',
								'size' => '12px',
							),
							array(
								'name' => 'Large',
								'slug' => 'large',
								'size' => '20px',
							),
						),
					),
				),
			),
		);
		$defaults->merge( $theme_json );
		$actual = $defaults->get_raw_data();
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_remove_insecure_properties_removes_unsafe_styles() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
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
						'core/image'  => array(
							'filter' => array(
								'duotone' => 'var:preset|duotone|blue-red',
							),
						),
						'core/cover'  => array(
							'filter' => array(
								'duotone' => 'var(--wp--preset--duotone--blue-red, var(--fallback-unsafe))',
							),
						),
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
			)
		);

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
					'core/image' => array(
						'filter' => array(
							'duotone' => 'var:preset|duotone|blue-red',
						),
					),
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
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'border'   => array(
						'radius' => array(
							'topLeft'     => '6px',
							'topRight'    => 'var(--top-right, var(--unsafe-fallback))',
							'bottomRight' => '6px',
							'bottomLeft'  => '6px',
						),
					),
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
							'border'   => array(
								'radius' => array(
									'topLeft'     => '5px',
									'topRight'    => 'var(--top-right, var(--unsafe-fallback))',
									'bottomRight' => '5px',
									'bottomLeft'  => '5px',
								),
							),
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

		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'border'   => array(
					'radius' => array(
						'topLeft'     => '6px',
						'bottomRight' => '6px',
						'bottomLeft'  => '6px',
					),
				),
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
						'border'   => array(
							'radius' => array(
								'topLeft'     => '5px',
								'bottomRight' => '5px',
								'bottomLeft'  => '5px',
							),
						),
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
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'   => array(
						'custom'  => true,
						'palette' => array(
							'custom' => array(
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
					'spacing' => array(
						'padding' => false,
					),
					'blocks'  => array(
						'core/group' => array(
							'color'   => array(
								'custom'  => true,
								'palette' => array(
									'custom' => array(
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
							'spacing' => array(
								'padding' => false,
							),
						),
					),
				),
			)
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'  => array(
					'palette' => array(
						'custom' => array(
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
				'blocks' => array(
					'core/group' => array(
						'color' => array(
							'palette' => array(
								'custom' => array(
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
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_remove_insecure_properties_removes_unsafe_preset_settings() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'      => array(
						'palette' => array(
							'custom' => array(
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
					),
					'typography' => array(
						'fontFamilies' => array(
							'custom' => array(
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
					),
					'blocks'     => array(
						'core/group' => array(
							'color' => array(
								'palette' => array(
									'custom' => array(
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
											'color' => 'var(--color, var(--unsafe--fallback))',
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
			)
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'color'      => array(
					'palette' => array(
						'custom' => array(
							array(
								'name'  => 'Pink',
								'slug'  => 'pink',
								'color' => '#FFC0CB',
							),
						),
					),
				),
				'typography' => array(
					'fontFamilies' => array(
						'custom' => array(
							array(
								'name'       => 'Cambria',
								'slug'       => 'cambria',
								'fontFamily' => 'Cambria, Georgia, serif',
							),
						),
					),
				),
				'blocks'     => array(
					'core/group' => array(
						'color' => array(
							'palette' => array(
								'custom' => array(
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
		);
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_remove_insecure_properties_applies_safe_styles() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
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

		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'color' => array(
					'text' => '#abcabc ',
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $actual );
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
						'name'  => 'small-header',
						'title' => 'Small Header',
						'area'  => 'header',
					),
				),
			)
		);

		$template_parts = $theme_json->get_template_parts();

		$this->assertEqualSetsWithIndex(
			$template_parts,
			array(
				'small-header' => array(
					'title' => 'Small Header',
					'area'  => 'header',
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
					'units' => array( 'px', 'em', 'rem', 'vh', 'vw', '%' ),
				),
				'typography' => array(
					'customFontSize' => false,
					'lineHeight'     => true,
					'fontSizes'      => array(
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
					'customFontSize' => true,
					'lineHeight'     => false,
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
		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( get_default_block_editor_settings() );
		remove_theme_support( 'custom-units' );

		$expected = array(
			'units'   => array( array() ),
			'padding' => false,
		);

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	function test_get_editor_settings_custom_units_can_be_enabled() {
		add_theme_support( 'custom-units' );
		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( get_default_block_editor_settings() );
		remove_theme_support( 'custom-units' );

		$expected = array(
			'units'   => array( 'px', 'em', 'rem', 'vh', 'vw', '%' ),
			'padding' => false,
		);

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	function test_get_editor_settings_custom_units_can_be_filtered() {
		add_theme_support( 'custom-units', 'rem', 'em' );
		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( get_default_block_editor_settings() );
		remove_theme_support( 'custom-units' );

		$expected = array(
			'units'   => array( 'rem', 'em' ),
			'padding' => false,
		);

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	function test_sanitization() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'spacing' => array(
						'blockGap' => 'valid value',
					),
					'blocks'  => array(
						'core/group' => array(
							'spacing' => array(
								'margin'   => 'valid value',
								'blockGap' => 'invalid value',
							),
						),
					),
				),
			)
		);

		$actual   = $theme_json->get_raw_data();
		$expected = array(
			'version' => 2,
			'styles'  => array(
				'spacing' => array(
					'blockGap' => 'valid value',
				),
				'blocks'  => array(
					'core/group' => array(
						'spacing' => array(
							'margin' => 'valid value',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_export_data() {
		$theme = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'slug'  => 'white',
								'color' => 'white',
								'label' => 'White',
							),
							array(
								'slug'  => 'black',
								'color' => 'black',
								'label' => 'Black',
							),
						),
					),
				),
			)
		);
		$user  = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'slug'  => 'white',
								'color' => '#fff',
								'label' => 'User White',
							),
							array(
								'slug'  => 'hotpink',
								'color' => 'hotpink',
								'label' => 'hotpink',
							),
						),
					),
				),
			),
			'custom'
		);

		$theme->merge( $user );
		$actual   = $theme->get_data();
		$expected = array(
			'version'  => 2,
			'settings' => array(
				'color' => array(
					'palette' => array(
						array(
							'slug'  => 'white',
							'color' => '#fff',
							'label' => 'User White',
						),
						array(
							'slug'  => 'black',
							'color' => 'black',
							'label' => 'Black',
						),
						array(
							'slug'  => 'hotpink',
							'color' => 'hotpink',
							'label' => 'hotpink',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_export_data_deals_with_empty_user_data() {
		$theme = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'slug'  => 'white',
								'color' => 'white',
								'label' => 'White',
							),
							array(
								'slug'  => 'black',
								'color' => 'black',
								'label' => 'Black',
							),
						),
					),
				),
			)
		);

		$actual   = $theme->get_data();
		$expected = array(
			'version'  => 2,
			'settings' => array(
				'color' => array(
					'palette' => array(
						array(
							'slug'  => 'white',
							'color' => 'white',
							'label' => 'White',
						),
						array(
							'slug'  => 'black',
							'color' => 'black',
							'label' => 'Black',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_export_data_deals_with_empty_theme_data() {
		$user = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'slug'  => 'white',
								'color' => '#fff',
								'label' => 'User White',
							),
							array(
								'slug'  => 'hotpink',
								'color' => 'hotpink',
								'label' => 'hotpink',
							),
						),
					),
				),
			),
			'custom'
		);

		$actual   = $user->get_data();
		$expected = array(
			'version'  => 2,
			'settings' => array(
				'color' => array(
					'palette' => array(
						array(
							'slug'  => 'white',
							'color' => '#fff',
							'label' => 'User White',
						),
						array(
							'slug'  => 'hotpink',
							'color' => 'hotpink',
							'label' => 'hotpink',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

}
