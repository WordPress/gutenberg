<?php

/**
 * Test WP_Theme_JSON_Gutenberg class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Gutenberg_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_get_layout_definitions
	 *
	 * @param array $layout_definitions Layout definitions as stored in core theme.json.
	 */
	public function test_get_stylesheet_generates_layout_styles( $layout_definitions ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'definitions' => $layout_definitions,
					),
					'spacing' => array(
						'blockGap' => true,
					),
				),
				'styles'   => array(
					'spacing' => array(
						'blockGap' => '1em',
					),
				),
			),
			'default'
		);

		// Results also include root site blocks styles.
		$this->assertEquals(
			'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }.wp-site-blocks > * + * { margin-block-start: 1em; }body { --wp--style--block-gap: 1em; }body .is-layout-flow > *{margin-block-start: 0;margin-block-end: 0;}body .is-layout-flow > * + *{margin-block-start: 1em;margin-block-end: 0;}body .is-layout-flex{gap: 1em;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}',
			$theme_json->get_stylesheet( array( 'styles' ) )
		);
	}

	/**
	 * @dataProvider data_get_layout_definitions
	 *
	 * @param array $layout_definitions Layout definitions as stored in core theme.json.
	 */
	public function test_get_stylesheet_generates_fallback_gap_layout_styles( $layout_definitions ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'definitions' => $layout_definitions,
					),
					'spacing' => array(
						'blockGap' => null,
					),
				),
				'styles'   => array(
					'spacing' => array(
						'blockGap' => '1em',
					),
				),
			),
			'default'
		);
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );

		// Results also include root site blocks styles.
		$this->assertEquals(
			'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body .is-layout-flex{gap: 0.5em;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}',
			$stylesheet
		);
	}

	/**
	 * @dataProvider data_get_layout_definitions
	 *
	 * @param array $layout_definitions Layout definitions as stored in core theme.json.
	 */
	public function test_get_stylesheet_generates_base_fallback_gap_layout_styles( $layout_definitions ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'definitions' => $layout_definitions,
					),
					'spacing' => array(
						'blockGap' => null,
					),
				),
			),
			'default'
		);
		$stylesheet = $theme_json->get_stylesheet( array( 'base-layout-styles' ) );

		// Note the `base-layout-styles` includes a fallback gap for the Columns block for backwards compatibility.
		$this->assertEquals(
			'body .is-layout-flex{gap: 0.5em;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}.wp-block-columns.is-layout-flex{gap: 2em;}',
			$stylesheet
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_layout_definitions() {
		return array(
			'layout definitions' => array(
				array(
					'default' => array(
						'name'          => 'default',
						'slug'          => 'flow',
						'className'     => 'is-layout-flow',
						'baseStyles'    => array(
							array(
								'selector' => ' > .alignleft',
								'rules'    => array(
									'float'               => 'left',
									'margin-inline-start' => '0',
									'margin-inline-end'   => '2em',
								),
							),
							array(
								'selector' => ' > .alignright',
								'rules'    => array(
									'float'               => 'right',
									'margin-inline-start' => '2em',
									'margin-inline-end'   => '0',
								),
							),
							array(
								'selector' => ' > .aligncenter',
								'rules'    => array(
									'margin-left'  => 'auto !important',
									'margin-right' => 'auto !important',
								),
							),
						),
						'spacingStyles' => array(
							array(
								'selector' => ' > *',
								'rules'    => array(
									'margin-block-start' => '0',
									'margin-block-end'   => '0',
								),
							),
							array(
								'selector' => ' > * + *',
								'rules'    => array(
									'margin-block-start' => null,
									'margin-block-end'   => '0',
								),
							),
						),
					),
					'flex'    => array(
						'name'          => 'flex',
						'slug'          => 'flex',
						'className'     => 'is-layout-flex',
						'displayMode'   => 'flex',
						'baseStyles'    => array(
							array(
								'selector' => '',
								'rules'    => array(
									'flex-wrap'   => 'wrap',
									'align-items' => 'center',
								),
							),
						),
						'spacingStyles' => array(
							array(
								'selector' => '',
								'rules'    => array(
									'gap' => null,
								),
							),
						),
					),
				),
			),
		);
	}
	function test_get_stylesheet_handles_whitelisted_element_pseudo_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'link' => array(
							'color'  => array(
								'text'       => 'green',
								'background' => 'red',
							),
							':hover' => array(
								'color'      => array(
									'text'       => 'red',
									'background' => 'green',
								),
								'typography' => array(
									'textTransform' => 'uppercase',
									'fontSize'      => '10em',
								),
							),
							':focus' => array(
								'color' => array(
									'text'       => 'yellow',
									'background' => 'black',
								),
							),
						),
					),
				),
			)
		);

		$base_styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:not(.wp-element-button){background-color: red;color: green;}a:not(.wp-element-button):hover{background-color: green;color: red;font-size: 10em;text-transform: uppercase;}a:not(.wp-element-button):focus{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_handles_only_psuedo_selector_rules_for_given_property() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'link' => array(
							':hover' => array(
								'color'      => array(
									'text'       => 'red',
									'background' => 'green',
								),
								'typography' => array(
									'textTransform' => 'uppercase',
									'fontSize'      => '10em',
								),
							),
							':focus' => array(
								'color' => array(
									'text'       => 'yellow',
									'background' => 'black',
								),
							),
						),
					),
				),
			)
		);

		$base_styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:not(.wp-element-button):hover{background-color: green;color: red;font-size: 10em;text-transform: uppercase;}a:not(.wp-element-button):focus{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_ignores_pseudo_selectors_on_non_whitelisted_elements() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'h4' => array(
							'color'  => array(
								'text'       => 'green',
								'background' => 'red',
							),
							':hover' => array(
								'color' => array(
									'text'       => 'red',
									'background' => 'green',
								),
							),
							':focus' => array(
								'color' => array(
									'text'       => 'yellow',
									'background' => 'black',
								),
							),
						),
					),
				),
			)
		);

		$base_styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'h4{background-color: red;color: green;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_ignores_non_whitelisted_pseudo_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'link' => array(
							'color'     => array(
								'text'       => 'green',
								'background' => 'red',
							),
							':hover'    => array(
								'color' => array(
									'text'       => 'red',
									'background' => 'green',
								),
							),
							':levitate' => array(
								'color' => array(
									'text'       => 'yellow',
									'background' => 'black',
								),
							),
						),
					),
				),
			)
		);

		$base_styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:not(.wp-element-button){background-color: red;color: green;}a:not(.wp-element-button):hover{background-color: green;color: red;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
		$this->assertStringNotContainsString( 'a:levitate{', $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_handles_priority_of_elements_vs_block_elements_pseudo_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/group' => array(
							'elements' => array(
								'link' => array(
									'color'  => array(
										'text'       => 'green',
										'background' => 'red',
									),
									':hover' => array(
										'color'      => array(
											'text'       => 'red',
											'background' => 'green',
										),
										'typography' => array(
											'textTransform' => 'uppercase',
											'fontSize' => '10em',
										),
									),
									':focus' => array(
										'color' => array(
											'text'       => 'yellow',
											'background' => 'black',
										),
									),
								),
							),
						),
					),
				),
			)
		);

		$base_styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = '.wp-block-group a:not(.wp-element-button){background-color: red;color: green;}.wp-block-group a:not(.wp-element-button):hover{background-color: green;color: red;font-size: 10em;text-transform: uppercase;}.wp-block-group a:not(.wp-element-button):focus{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_get_stylesheet_handles_whitelisted_block_level_element_pseudo_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'link' => array(
							'color'  => array(
								'text'       => 'green',
								'background' => 'red',
							),
							':hover' => array(
								'color' => array(
									'text'       => 'red',
									'background' => 'green',
								),
							),
						),
					),
					'blocks'   => array(
						'core/group' => array(
							'elements' => array(
								'link' => array(
									':hover' => array(
										'color' => array(
											'text'       => 'yellow',
											'background' => 'black',
										),
									),
								),
							),
						),
					),
				),
			)
		);

		$base_styles = 'body { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:not(.wp-element-button){background-color: red;color: green;}a:not(.wp-element-button):hover{background-color: green;color: red;}.wp-block-group a:not(.wp-element-button):hover{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	function test_remove_invalid_element_pseudo_selectors() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'link' => array(
							'color'  => array(
								'text'       => 'hotpink',
								'background' => 'yellow',
							),
							':hover' => array(
								'color' => array(
									'text'       => 'red',
									'background' => 'blue',
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
				'elements' => array(
					'link' => array(
						'color'  => array(
							'text'       => 'hotpink',
							'background' => 'yellow',
						),
						':hover' => array(
							'color' => array(
								'text'       => 'red',
								'background' => 'blue',
							),
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_element_class_name_button() {
		$expected = 'wp-element-button';
		$actual   = WP_Theme_JSON_Gutenberg::get_element_class_name( 'button' );

		$this->assertEquals( $expected, $actual );
	}

	function test_get_element_class_name_invalid() {
		$expected = '';
		$actual   = WP_Theme_JSON_Gutenberg::get_element_class_name( 'unknown-element' );

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Testing that dynamic properties in theme.json return the value they refrence, e.g.
	 * array( 'ref' => 'styles.color.background' ) => "#ffffff".
	 */
	function test_get_property_value_valid() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'color'    => array(
						'background' => '#ffffff',
						'text'       => '#000000',
					),
					'elements' => array(
						'button' => array(
							'color' => array(
								'background' => array( 'ref' => 'styles.color.text' ),
								'text'       => array( 'ref' => 'styles.color.background' ),
							),
						),
					),
				),
			)
		);

		$expected = 'body { margin: 0; }body{background-color: #ffffff;color: #000000;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-element-button, .wp-block-button__link{background-color: #000000;color: #ffffff;}';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to other dynamic properties in a loop
	 * then they should be left untouched.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	function test_get_property_value_loop() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'color'    => array(
						'background' => '#ffffff',
						'text'       => array( 'ref' => 'styles.elements.button.color.background' ),
					),
					'elements' => array(
						'button' => array(
							'color' => array(
								'background' => array( 'ref' => 'styles.color.text' ),
								'text'       => array( 'ref' => 'styles.color.background' ),
							),
						),
					),
				),
			)
		);

		$expected = 'body { margin: 0; }body{background-color: #ffffff;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-element-button, .wp-block-button__link{color: #ffffff;}';
		$this->assertSame( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to other dynamic properties then they should be left unprocessed.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	function test_get_property_value_recursion() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'color'    => array(
						'background' => '#ffffff',
						'text'       => array( 'ref' => 'styles.color.background' ),
					),
					'elements' => array(
						'button' => array(
							'color' => array(
								'background' => array( 'ref' => 'styles.color.text' ),
								'text'       => array( 'ref' => 'styles.color.background' ),
							),
						),
					),
				),
			)
		);

		$expected = 'body { margin: 0; }body{background-color: #ffffff;color: #ffffff;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-element-button, .wp-block-button__link{color: #ffffff;}';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to themselves then they should be left unprocessed.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	function test_get_property_value_self() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'color' => array(
						'background' => '#ffffff',
						'text'       => array( 'ref' => 'styles.color.text' ),
					),
				),
			)
		);

		$expected = 'body { margin: 0; }body{background-color: #ffffff;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Tests generating the spacing presets array based on the spacing scale provided.
	 *
	 * @dataProvider data_generate_spacing_scale_fixtures
	 */
	function test_set_spacing_sizes( $spacing_scale, $expected_output ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'settings' => array(
					'spacing' => array(
						'spacingScale' => $spacing_scale,
					),
				),
			)
		);

		$theme_json->set_spacing_sizes();
		$this->assertSame( $expected_output, _wp_array_get( $theme_json->get_raw_data(), array( 'settings', 'spacing', 'spacingSizes', 'default' ) ) );
	}

	/**
	 * Data provider for spacing scale tests.
	 *
	 * @return array
	 */
	function data_generate_spacing_scale_fixtures() {
		return array(
			'empty_spacing_scale'                       => array(
				'spacing_scale'   => array(),
				'expected_output' => null,
			),

			'invalid_spacing_scale_values_missing_operator' => array(
				'spacingScale'    => array(
					'operator'   => '',
					'increment'  => 1.5,
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => null,
			),

			'invalid_spacing_scale_values_non_numeric_increment' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 'add two to previous value',
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => null,
			),

			'invalid_spacing_scale_values_non_numeric_steps' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 'spiral staircase preferred',
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => null,
			),

			'invalid_spacing_scale_values_non_numeric_medium_step' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 5,
					'mediumStep' => 'That which is just right',
					'unit'       => 'rem',
				),
				'expected_output' => null,
			),

			'invalid_spacing_scale_values_missing_unit' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 5,
					'mediumStep' => 4,
				),
				'expected_output' => null,
			),

			'one_step_spacing_scale'                    => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '4rem',
					),
				),
			),

			'two_step_spacing_scale_should_add_step_above_medium' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 2,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '4rem',
					),
					array(
						'name' => 'Large',
						'slug' => 60,
						'size' => '5.5rem',
					),
				),
			),

			'three_step_spacing_scale_should_add_step_above_and_below_medium' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 3,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Small',
						'slug' => 40,
						'size' => '2.5rem',
					),
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '4rem',
					),
					array(
						'name' => 'Large',
						'slug' => 60,
						'size' => '5.5rem',
					),
				),
			),

			'even_step_spacing_scale_steps_should_add_extra_step_above_medium' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 4,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Small',
						'slug' => 40,
						'size' => '2.5rem',
					),
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '4rem',
					),
					array(
						'name' => 'Large',
						'slug' => 60,
						'size' => '5.5rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => 70,
						'size' => '7rem',
					),
				),
			),

			'if_bottom_end_will_go_below_zero_should_add_extra_steps_above_medium_instead' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 2.5,
					'steps'      => 5,
					'mediumStep' => 5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Small',
						'slug' => 40,
						'size' => '2.5rem',
					),
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '5rem',
					),
					array(
						'name' => 'Large',
						'slug' => 60,
						'size' => '7.5rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => 70,
						'size' => '10rem',
					),
					array(
						'name' => '2X-Large',
						'slug' => 80,
						'size' => '12.5rem',
					),
				),
			),

			'multiplier_should_correctly_calculate_above_and_below_medium' => array(
				'spacingScale'    => array(
					'operator'   => '*',
					'increment'  => 1.5,
					'steps'      => 5,
					'mediumStep' => 1.5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'X-Small',
						'slug' => 30,
						'size' => '0.67rem',
					),
					array(
						'name' => 'Small',
						'slug' => 40,
						'size' => '1rem',
					),
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '1.5rem',
					),
					array(
						'name' => 'Large',
						'slug' => 60,
						'size' => '2.25rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => 70,
						'size' => '3.38rem',
					),
				),
			),

			'increment_<_1_combined_with_*_operator_should_act_as_divisor_to_calculate_above_and_below_medium' => array(
				'spacingScale'    => array(
					'operator'   => '*',
					'increment'  => 0.25,
					'steps'      => 5,
					'mediumStep' => 1.5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'X-Small',
						'slug' => 30,
						'size' => '0.09rem',
					),
					array(
						'name' => 'Small',
						'slug' => 40,
						'size' => '0.38rem',
					),
					array(
						'name' => 'Medium',
						'slug' => 50,
						'size' => '1.5rem',
					),
					array(
						'name' => 'Large',
						'slug' => 60,
						'size' => '6rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => 70,
						'size' => '24rem',
					),
				),
			),
		);
	}
}
