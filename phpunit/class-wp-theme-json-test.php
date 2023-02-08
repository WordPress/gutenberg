<?php

/**
 * Test WP_Theme_JSON_Gutenberg class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Gutenberg_Test extends WP_UnitTestCase {
	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	private static $administrator_id;

	/**
	 * User ID.
	 *
	 * @var int
	 */
	private static $user_id;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		static::$administrator_id = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);

		if ( is_multisite() ) {
			grant_super_admin( self::$administrator_id );
		}

		static::$user_id = self::factory()->user->create();
	}

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
			'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }.wp-site-blocks > * + * { margin-block-start: 1em; }body { --wp--style--block-gap: 1em; }body .is-layout-flow > *{margin-block-start: 0;margin-block-end: 0;}body .is-layout-flow > * + *{margin-block-start: 1em;margin-block-end: 0;}body .is-layout-flex{gap: 1em;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}',
			$theme_json->get_stylesheet( array( 'styles' ) )
		);
	}

	/**
	 * @dataProvider data_get_layout_definitions
	 *
	 * @param array $layout_definitions Layout definitions as stored in core theme.json.
	 */
	public function test_get_stylesheet_generates_valid_block_gap_values_and_skips_null_or_false_values( $layout_definitions ) {
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
						'blockGap' => '1rem',
					),
					'blocks'  => array(
						'core/post-content' => array(
							'color' => array(
								'text' => 'gray', // This value should not render block layout styles.
							),
						),
						'core/social-links' => array(
							'spacing' => array(
								'blockGap' => '0', // This value should render block layout gap as zero.
							),
						),
						'core/buttons'      => array(
							'spacing' => array(
								'blockGap' => 0, // This value should render block layout gap as zero.
							),
						),
						'core/columns'      => array(
							'spacing' => array(
								'blockGap' => false, // This value should be ignored. The block will use the global layout value.
							),
						),
					),
				),
			),
			'default'
		);

		$this->assertEquals(
			'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }.wp-site-blocks > * + * { margin-block-start: 1rem; }body { --wp--style--block-gap: 1rem; }body .is-layout-flow > *{margin-block-start: 0;margin-block-end: 0;}body .is-layout-flow > * + *{margin-block-start: 1rem;margin-block-end: 0;}body .is-layout-flex{gap: 1rem;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}.wp-block-post-content{color: gray;}.wp-block-social-links.is-layout-flow > *{margin-block-start: 0;margin-block-end: 0;}.wp-block-social-links.is-layout-flow > * + *{margin-block-start: 0;margin-block-end: 0;}.wp-block-social-links.is-layout-flex{gap: 0;}.wp-block-buttons.is-layout-flow > *{margin-block-start: 0;margin-block-end: 0;}.wp-block-buttons.is-layout-flow > * + *{margin-block-start: 0;margin-block-end: 0;}.wp-block-buttons.is-layout-flex{gap: 0;}',
			$theme_json->get_stylesheet()
		);
	}

	/**
	 * @dataProvider data_get_layout_definitions
	 *
	 * @param array $layout_definitions Layout definitions as stored in core theme.json.
	 */
	public function test_get_stylesheet_generates_layout_styles_with_spacing_presets( $layout_definitions ) {
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
						'blockGap' => 'var:preset|spacing|60',
					),
				),
			),
			'default'
		);

		// Results also include root site blocks styles.
		$this->assertEquals(
			'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }.wp-site-blocks > * + * { margin-block-start: var(--wp--preset--spacing--60); }body { --wp--style--block-gap: var(--wp--preset--spacing--60); }body .is-layout-flow > *{margin-block-start: 0;margin-block-end: 0;}body .is-layout-flow > * + *{margin-block-start: var(--wp--preset--spacing--60);margin-block-end: 0;}body .is-layout-flex{gap: var(--wp--preset--spacing--60);}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}',
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
			'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.is-layout-flex){gap: 0.5em;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}',
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
			':where(.is-layout-flex){gap: 0.5em;}body .is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}body .is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}body .is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}body .is-layout-flex{flex-wrap: wrap;align-items: center;}:where(.wp-block-columns.is-layout-flex){gap: 2em;}',
			$stylesheet
		);
	}

	/**
	 * @dataProvider data_get_layout_definitions
	 *
	 * @param array $layout_definitions Layout definitions as stored in core theme.json.
	 */
	public function test_get_stylesheet_skips_layout_styles( $layout_definitions ) {
		add_theme_support( 'disable-layout-styles' );
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
		remove_theme_support( 'disable-layout-styles' );

		// All Layout styles should be skipped.
		$this->assertEquals(
			'',
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

	public function test_get_stylesheet() {
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
							'border'     => array(
								'radius' => '10px',
							),
							'dimensions' => array(
								'minHeight' => '50vh',
							),
							'elements'   => array(
								'link' => array(
									'color' => array(
										'text' => '#111',
									),
								),
							),
							'spacing'    => array(
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
		$styles    = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{color: var(--wp--preset--color--grey);}a:where(:not(.wp-element-button)){background-color: #333;color: #111;}.wp-block-group{border-radius: 10px;min-height: 50vh;padding: 24px;}.wp-block-group a:where(:not(.wp-element-button)){color: #111;}.wp-block-heading{color: #123456;}.wp-block-heading a:where(:not(.wp-element-button)){background-color: #333;color: #111;font-size: 60px;}.wp-block-post-date{color: #123456;}.wp-block-post-date a:where(:not(.wp-element-button)){background-color: #777;color: #555;}.wp-block-image{margin-bottom: 30px;}.wp-block-image img, .wp-block-image .wp-block-image__crop-area{border-top-left-radius: 10px;border-bottom-right-radius: 1em;}';
		$presets   = '.has-grey-color{color: var(--wp--preset--color--grey) !important;}.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}.has-small-font-family{font-family: var(--wp--preset--font-family--small) !important;}.has-big-font-family{font-family: var(--wp--preset--font-family--big) !important;}';
		$all       = $variables . $styles . $presets;

		$this->assertEquals( $all, $theme_json->get_stylesheet() );
		$this->assertEquals( $styles, $theme_json->get_stylesheet( array( 'styles' ) ) );
		$this->assertEquals( $presets, $theme_json->get_stylesheet( array( 'presets' ) ) );
		$this->assertEquals( $variables, $theme_json->get_stylesheet( array( 'variables' ) ) );
	}

	/**
	 * Tests generating the spacing presets array based on the spacing scale provided.
	 *
	 * @dataProvider data_set_spacing_sizes_when_invalid
	 */
	public function test_shadow_preset_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'shadow' => array(
						'presets' => array(
							array(
								'slug'   => 'natural',
								'shadow' => '5px 5px 5px 0 black',
							),
							array(
								'slug'   => 'sharp',
								'shadow' => '5px 5px black',
							),
						),
					),
				),
			)
		);

		$styles = 'body{--wp--preset--shadow--natural: 5px 5px 5px 0 black;--wp--preset--shadow--sharp: 5px 5px black;}';
		$this->assertEquals( $styles, $theme_json->get_stylesheet() );
		$this->assertEquals( $styles, $theme_json->get_stylesheet( array( 'variables' ) ) );
	}

	public function test_get_shadow_styles_for_blocks() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'shadow' => array(
						'presets' => array(
							array(
								'slug'   => 'natural',
								'shadow' => '5px 5px 0 0 black',
							),
						),
					),
				),
				'styles'   => array(
					'blocks'   => array(
						'core/paragraph' => array(
							'shadow' => 'var(--wp--preset--shadow--natural)',
						),
					),
					'elements' => array(
						'button' => array(
							'shadow' => 'var:preset|shadow|natural',
						),
						'link'   => array(
							'shadow' => array( 'ref' => 'styles.elements.button.shadow' ),
						),
					),
				),
			)
		);

		$global_styles  = 'body{--wp--preset--shadow--natural: 5px 5px 0 0 black;}body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';
		$element_styles = 'a:where(:not(.wp-element-button)){box-shadow: var(--wp--preset--shadow--natural);}.wp-element-button, .wp-block-button__link{box-shadow: var(--wp--preset--shadow--natural);}p{box-shadow: var(--wp--preset--shadow--natural);}';
		$styles         = $global_styles . $element_styles;

		$this->assertEquals( $styles, $theme_json->get_stylesheet() );
	}

	public function test_get_stylesheet_handles_whitelisted_element_pseudo_selectors() {
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

		$base_styles = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:where(:not(.wp-element-button)){background-color: red;color: green;}a:where(:not(.wp-element-button)):hover{background-color: green;color: red;font-size: 10em;text-transform: uppercase;}a:where(:not(.wp-element-button)):focus{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_handles_only_pseudo_selector_rules_for_given_property() {
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

		$base_styles = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:where(:not(.wp-element-button)):hover{background-color: green;color: red;font-size: 10em;text-transform: uppercase;}a:where(:not(.wp-element-button)):focus{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_ignores_pseudo_selectors_on_non_whitelisted_elements() {
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

		$base_styles = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'h4{background-color: red;color: green;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_ignores_non_whitelisted_pseudo_selectors() {
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

		$base_styles = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:where(:not(.wp-element-button)){background-color: red;color: green;}a:where(:not(.wp-element-button)):hover{background-color: green;color: red;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
		$this->assertStringNotContainsString( 'a:levitate{', $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_handles_priority_of_elements_vs_block_elements_pseudo_selectors() {
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

		$base_styles = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = '.wp-block-group a:where(:not(.wp-element-button)){background-color: red;color: green;}.wp-block-group a:where(:not(.wp-element-button)):hover{background-color: green;color: red;font-size: 10em;text-transform: uppercase;}.wp-block-group a:where(:not(.wp-element-button)):focus{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_handles_whitelisted_block_level_element_pseudo_selectors() {
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

		$base_styles = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

		$element_styles = 'a:where(:not(.wp-element-button)){background-color: red;color: green;}a:where(:not(.wp-element-button)):hover{background-color: green;color: red;}.wp-block-group a:where(:not(.wp-element-button)):hover{background-color: black;color: yellow;}';

		$expected = $base_styles . $element_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
		$this->assertEquals( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	/**
	 * This test relies on a block having already been registered prior to
	 * theme.json generating block metadata. Until a core block, such as Image,
	 * opts into feature level selectors, we need to register a test block.
	 * This is achieved via `tests_add_filter()` in Gutenberg's phpunit
	 * bootstrap. After a core block adopts feature level selectors we could
	 * remove that filter and instead use the core block for the following test.
	 */
	public function test_get_stylesheet_with_block_support_feature_level_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'border'     => array(
						'radius' => true,
					),
					'color'      => array(
						'custom'  => false,
						'palette' => array(
							array(
								'slug'  => 'green',
								'color' => 'green',
							),
						),
					),
					'spacing'    => array(
						'padding' => true,
					),
					'typography' => array(
						'fontSize' => true,
					),
				),
				'styles'   => array(
					'blocks' => array(
						'test/test' => array(
							'border'     => array(
								'radius' => '9999px',
							),
							'color'      => array(
								'text' => 'green',
							),
							'spacing'    => array(
								'padding' => '20px',
							),
							'typography' => array(
								'fontSize' => '3em',
							),
						),
					),
				),
			)
		);

		$base_styles   = 'body{--wp--preset--color--green: green;}body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';
		$block_styles  = '.wp-block-test, .wp-block-test__wrapper{color: green;}.wp-block-test .inner, .wp-block-test__wrapper .inner{border-radius: 9999px;padding: 20px;}.wp-block-test .sub-heading, .wp-block-test__wrapper .sub-heading{font-size: 3em;}';
		$preset_styles = '.has-green-color{color: var(--wp--preset--color--green) !important;}.has-green-background-color{background-color: var(--wp--preset--color--green) !important;}.has-green-border-color{border-color: var(--wp--preset--color--green) !important;}';
		$expected      = $base_styles . $block_styles . $preset_styles;

		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	public function test_allow_indirect_properties() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'   => array(
					'blocks'  => array(
						'core/social-links' => array(
							'spacing' => array(
								'blockGap' => array(
									'top'  => '1em',
									'left' => '2em',
								),
							),
						),
					),
					'spacing' => array(
						'blockGap' => '3em',
					),
				),
				'settings' => array(
					'layout' => array(
						'contentSize' => '800px',
						'wideSize'    => '1000px',
					),
				),
			)
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'   => array(
				'blocks'  => array(
					'core/social-links' => array(
						'spacing' => array(
							'blockGap' => array(
								'top'  => '1em',
								'left' => '2em',
							),
						),
					),
				),
				'spacing' => array(
					'blockGap' => '3em',
				),
			),
			'settings' => array(
				'layout' => array(
					'contentSize' => '800px',
					'wideSize'    => '1000px',
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_remove_invalid_element_pseudo_selectors() {
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
							':seen'  => array(
								'color' => array(
									'background' => 'ivory',
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

	public function test_get_element_class_name_button() {
		$expected = 'wp-element-button';
		$actual   = WP_Theme_JSON_Gutenberg::get_element_class_name( 'button' );

		$this->assertEquals( $expected, $actual );
	}

	public function test_get_element_class_name_invalid() {
		$expected = '';
		$actual   = WP_Theme_JSON_Gutenberg::get_element_class_name( 'unknown-element' );

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Testing that dynamic properties in theme.json return the value they reference, e.g.
	 * array( 'ref' => 'styles.color.background' ) => "#ffffff".
	 */
	public function test_get_property_value_valid() {
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

		$expected = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{background-color: #ffffff;color: #000000;}.wp-element-button, .wp-block-button__link{background-color: #000000;color: #ffffff;}';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to other dynamic properties in a loop
	 * then they should be left untouched.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	public function test_get_property_value_loop() {
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

		$expected = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{background-color: #ffffff;}.wp-element-button, .wp-block-button__link{color: #ffffff;}';
		$this->assertSame( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to other dynamic properties then they should be left unprocessed.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	public function test_get_property_value_recursion() {
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

		$expected = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{background-color: #ffffff;color: #ffffff;}.wp-element-button, .wp-block-button__link{color: #ffffff;}';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to themselves then they should be left unprocessed.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	public function test_get_property_value_self() {
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

		$expected = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{background-color: #ffffff;}';
		$this->assertEquals( $expected, $theme_json->get_stylesheet() );
	}

	/**
	 * Tests generating the spacing presets array based on the spacing scale provided.
	 *
	 * @dataProvider data_generate_spacing_scale_fixtures
	 */
	public function test_set_spacing_sizes( $spacing_scale, $expected_output ) {
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
	public function data_generate_spacing_scale_fixtures() {
		return array(
			'one_step_spacing_scale' => array(
				'spacingScale'    => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => '1',
						'slug' => '50',
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
						'name' => '1',
						'slug' => '50',
						'size' => '4rem',
					),
					array(
						'name' => '2',
						'slug' => '60',
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
						'name' => '1',
						'slug' => '40',
						'size' => '2.5rem',
					),
					array(
						'name' => '2',
						'slug' => '50',
						'size' => '4rem',
					),
					array(
						'name' => '3',
						'slug' => '60',
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
						'name' => '1',
						'slug' => '40',
						'size' => '2.5rem',
					),
					array(
						'name' => '2',
						'slug' => '50',
						'size' => '4rem',
					),
					array(
						'name' => '3',
						'slug' => '60',
						'size' => '5.5rem',
					),
					array(
						'name' => '4',
						'slug' => '70',
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
						'name' => '1',
						'slug' => '40',
						'size' => '2.5rem',
					),
					array(
						'name' => '2',
						'slug' => '50',
						'size' => '5rem',
					),
					array(
						'name' => '3',
						'slug' => '60',
						'size' => '7.5rem',
					),
					array(
						'name' => '4',
						'slug' => '70',
						'size' => '10rem',
					),
					array(
						'name' => '5',
						'slug' => '80',
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
						'name' => '1',
						'slug' => '30',
						'size' => '0.67rem',
					),
					array(
						'name' => '2',
						'slug' => '40',
						'size' => '1rem',
					),
					array(
						'name' => '3',
						'slug' => '50',
						'size' => '1.5rem',
					),
					array(
						'name' => '4',
						'slug' => '60',
						'size' => '2.25rem',
					),
					array(
						'name' => '5',
						'slug' => '70',
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
						'name' => '1',
						'slug' => '30',
						'size' => '0.09rem',
					),
					array(
						'name' => '2',
						'slug' => '40',
						'size' => '0.38rem',
					),
					array(
						'name' => '3',
						'slug' => '50',
						'size' => '1.5rem',
					),
					array(
						'name' => '4',
						'slug' => '60',
						'size' => '6rem',
					),
					array(
						'name' => '5',
						'slug' => '70',
						'size' => '24rem',
					),
				),
			),
		);
	}

	/**
	 * Tests generating the spacing presets array based on the spacing scale provided.
	 *
	 * @dataProvider data_set_spacing_sizes_when_invalid
	 */
	public function test_set_spacing_sizes_when_invalid( $spacing_scale, $expected_output ) {
		$this->expectNotice();
		$this->expectNoticeMessage( 'Some of the theme.json settings.spacing.spacingScale values are invalid' );

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
	public function data_set_spacing_sizes_when_invalid() {
		return array(

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
		);
	}

	public function test_get_styles_for_block_with_padding_aware_alignments() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'styles'   => array(
					'spacing' => array(
						'padding' => array(
							'top'    => '10px',
							'right'  => '12px',
							'bottom' => '10px',
							'left'   => '12px',
						),
					),
				),
				'settings' => array(
					'useRootPaddingAwareAlignments' => true,
				),
			)
		);

		$metadata = array(
			'path'     => array(
				'0' => 'styles',
			),
			'selector' => 'body',
		);

		$expected    = 'body { margin: 0;}.wp-site-blocks { padding-top: var(--wp--style--root--padding-top); padding-bottom: var(--wp--style--root--padding-bottom); }.has-global-padding { padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }.has-global-padding :where(.has-global-padding) { padding-right: 0; padding-left: 0; }.has-global-padding > .alignfull { margin-right: calc(var(--wp--style--root--padding-right) * -1); margin-left: calc(var(--wp--style--root--padding-left) * -1); }.has-global-padding :where(.has-global-padding) > .alignfull { margin-right: 0; margin-left: 0; }.has-global-padding > .alignfull:where(:not(.has-global-padding)) > :where([class*="wp-block-"]:not(.alignfull):not([class*="__"]),p,h1,h2,h3,h4,h5,h6,ul,ol) { padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }.has-global-padding :where(.has-global-padding) > .alignfull:where(:not(.has-global-padding)) > :where([class*="wp-block-"]:not(.alignfull):not([class*="__"]),p,h1,h2,h3,h4,h5,h6,ul,ol) { padding-right: 0; padding-left: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{--wp--style--root--padding-top: 10px;--wp--style--root--padding-right: 12px;--wp--style--root--padding-bottom: 10px;--wp--style--root--padding-left: 12px;}';
		$root_rules  = $theme_json->get_root_layout_rules( WP_Theme_JSON::ROOT_BLOCK_SELECTOR, $metadata );
		$style_rules = $theme_json->get_styles_for_block( $metadata );
		$this->assertEquals( $expected, $root_rules . $style_rules );
	}

	public function test_get_styles_for_block_without_padding_aware_alignments() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'spacing' => array(
						'padding' => array(
							'top'    => '10px',
							'right'  => '12px',
							'bottom' => '10px',
							'left'   => '12px',
						),
					),
				),
			)
		);

		$metadata = array(
			'path'     => array(
				'0' => 'styles',
			),
			'selector' => 'body',
		);

		$expected    = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }body{padding-top: 10px;padding-right: 12px;padding-bottom: 10px;padding-left: 12px;}';
		$root_rules  = $theme_json->get_root_layout_rules( WP_Theme_JSON::ROOT_BLOCK_SELECTOR, $metadata );
		$style_rules = $theme_json->get_styles_for_block( $metadata );
		$this->assertEquals( $expected, $root_rules . $style_rules );
	}

	public function test_get_styles_for_block_with_content_width() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 2,
				'settings' => array(
					'layout' => array(
						'contentSize' => '800px',
						'wideSize'    => '1000px',
					),
				),
			)
		);

		$metadata = array(
			'path'     => array(
				'0' => 'settings',
			),
			'selector' => 'body',
		);

		$expected    = 'body { margin: 0;--wp--style--global--content-size: 800px;--wp--style--global--wide-size: 1000px;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';
		$root_rules  = $theme_json->get_root_layout_rules( WP_Theme_JSON::ROOT_BLOCK_SELECTOR, $metadata );
		$style_rules = $theme_json->get_styles_for_block( $metadata );
		$this->assertEquals( $expected, $root_rules . $style_rules );
	}

	/**
	 * @dataProvider data_sanitize_for_block_with_style_variations
	 *
	 * @param array $theme_json_variations Theme.json variations to test.
	 * @param array $expected_sanitized    Expected results after sanitizing.
	 */
	public function test_sanitize_for_block_with_style_variations( $theme_json_variations, $expected_sanitized ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'blocks' => array(
						'core/quote' => $theme_json_variations,
					),
				),
			)
		);

		// Validate structure is sanitized.
		$sanitized_theme_json = $theme_json->get_raw_data();
		$this->assertIsArray( $sanitized_theme_json, 'Sanitized theme.json is not an array data type' );
		$this->assertArrayHasKey( 'styles', $sanitized_theme_json, 'Sanitized theme.json does not have an "styles" key' );
		$this->assertSameSetsWithIndex( $expected_sanitized, $sanitized_theme_json['styles'], 'Sanitized theme.json styles does not match' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_sanitize_for_block_with_style_variations() {
		return array(
			'1 variation with 1 invalid property'   => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color' => array(
								'background' => 'hotpink',
							),
						),
					),
				),
				'expected_sanitized'    => array(
					'blocks' => array(
						'core/quote' => array(
							'variations' => array(
								'plain' => array(
									'color' => array(
										'background' => 'hotpink',
									),
								),
							),
						),
					),
				),
			),
			'1 variation with 2 invalid properties' => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color'            => array(
								'background' => 'hotpink',
							),
							'invalidProperty1' => 'value1',
							'invalidProperty2' => 'value2',
						),
					),
				),
				'expected_sanitized'    => array(
					'blocks' => array(
						'core/quote' => array(
							'variations' => array(
								'plain' => array(
									'color' => array(
										'background' => 'hotpink',
									),
								),
							),
						),
					),
				),
			),
			'2 variations with 1 invalid property'  => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color'            => array(
								'background' => 'hotpink',
							),
							'invalidProperty1' => 'value1',
						),
						'basic' => array(
							'color' => array(
								'background' => '#ffffff',
								'text'       => '#000000',
							),
							'foo'   => 'bar',
						),
					),
				),
				'expected_sanitized'    => array(
					'blocks' => array(
						'core/quote' => array(
							'variations' => array(
								'plain' => array(
									'color' => array(
										'background' => 'hotpink',
									),
								),
								'basic' => array(
									'color' => array(
										'background' => '#ffffff',
										'text'       => '#000000',
									),
								),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_sanitize_with_invalid_style_variation
	 *
	 * @param array $theme_json_variations The theme.json variations to test.
	 */
	public function test_sanitize_with_invalid_style_variation( $theme_json_variations ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'blocks' => array(
						'core/quote' => $theme_json_variations,
					),
				),
			)
		);

		// Validate structure is sanitized.
		$sanitized_theme_json = $theme_json->get_raw_data();
		$this->assertIsArray( $sanitized_theme_json, 'Sanitized theme.json is not an array data type' );
		$this->assertArrayNotHasKey( 'styles', $sanitized_theme_json, 'Sanitized theme.json should not have a "styles" key' );

	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_sanitize_with_invalid_style_variation() {
		return array(
			'empty string variation' => array(
				array(
					'variations' => '',
				),
			),
			'boolean variation'      => array(
				array(
					'variations' => false,
				),
			),
		);
	}

	/**
	 * @dataProvider data_get_styles_for_block_with_style_variations
	 *
	 * @param array  $theme_json_variations Theme.json variations to test.
	 * @param string $metadata_variations   Style variations to test.
	 * @param string $expected              Expected results for styling.
	 */
	public function test_get_styles_for_block_with_style_variations( $theme_json_variations, $metadata_variations, $expected ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => 2,
				'styles'  => array(
					'blocks' => array(
						'core/quote' => $theme_json_variations,
					),
				),
			)
		);

		// Validate styles are generated properly.
		$metadata      = array(
			'path'       => array( 'styles', 'blocks', 'core/quote' ),
			'selector'   => '.wp-block-quote',
			'variations' => $metadata_variations,
		);
		$actual_styles = $theme_json->get_styles_for_block( $metadata );
		$this->assertSame( $expected, $actual_styles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_styles_for_block_with_style_variations() {
		$plain = array(
			'metadata' => array(
				'path'     => array( 'styles', 'blocks', 'core/quote', 'variations', 'plain' ),
				'selector' => '.is-style-plain.is-style-plain.wp-block-quote',
			),
			'styles'   => '.is-style-plain.is-style-plain.wp-block-quote{background-color: hotpink;}',
		);
		$basic = array(
			'metadata' => array(
				'path'     => array( 'styles', 'blocks', 'core/quote', 'variations', 'basic' ),
				'selector' => '.is-style-basic.is-style-basic.wp-block-quote',
			),
			'styles'   => '.is-style-basic.is-style-basic.wp-block-quote{background-color: #ffffff;color: #000000;}',
		);

		return array(
			'1 variation with 1 invalid property'   => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color' => array(
								'background' => 'hotpink',
							),
						),
					),
				),
				'metadata_variation'    => array( $plain['metadata'] ),
				'expected'              => $plain['styles'],
			),
			'1 variation with 2 invalid properties' => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color'            => array(
								'background' => 'hotpink',
							),
							'invalidProperty1' => 'value1',
							'invalidProperty2' => 'value2',
						),
					),
				),
				'metadata_variation'    => array( $plain['metadata'] ),
				'expected'              => $plain['styles'],
			),
			'2 variations with 1 invalid property'  => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color'            => array(
								'background' => 'hotpink',
							),
							'invalidProperty1' => 'value1',
						),
						'basic' => array(
							'color' => array(
								'background' => '#ffffff',
								'text'       => '#000000',
							),
							'foo'   => 'bar',
						),
					),
				),
				'metadata_variation'    => array( $plain['metadata'], $basic['metadata'] ),
				'expected_styles'       => $plain['styles'] . $basic['styles'],
			),
			'2 variations with multiple invalid properties' => array(
				'theme_json_variations' => array(
					'variations' => array(
						'plain' => array(
							'color'            => array(
								'background' => 'hotpink',
							),
							'invalidProperty1' => 'value1',
							'invalidProperty2' => 'value2',
						),
						'basic' => array(
							'foo'   => 'foo',
							'color' => array(
								'background' => '#ffffff',
								'text'       => '#000000',
							),
							'bar'   => 'bar',
							'baz'   => 'baz',
						),
					),
				),
				'metadata_variation'    => array( $plain['metadata'], $basic['metadata'] ),
				'expected_styles'       => $plain['styles'] . $basic['styles'],
			),
		);
	}

	public function test_update_separator_declarations() {
		// If only background is defined, test that includes border-color to the style so it is applied on the front end.
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/separator' => array(
							'color' => array(
								'background' => 'blue',
							),
						),
					),
				),
			),
			'default'
		);
		$expected   = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-block-separator{background-color: blue;color: blue;}';
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );
		$this->assertEquals( $expected, $stylesheet );

		// If background and text are defined, do not include border-color, as text color is enough.
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/separator' => array(
							'color' => array(
								'background' => 'blue',
								'text'       => 'red',
							),
						),
					),
				),
			),
			'default'
		);
		$expected   = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-block-separator{background-color: blue;color: red;}';
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );
		$this->assertEquals( $expected, $stylesheet );

		// If only text is defined, do not include border-color, as by itself is enough.
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/separator' => array(
							'color' => array(
								'text' => 'red',
							),
						),
					),
				),
			),
			'default'
		);
		$expected   = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-block-separator{color: red;}';
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );
		$this->assertEquals( $expected, $stylesheet );

		// If background, text, and border-color are defined, include everything, CSS specifity will decide which to apply.
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/separator' => array(
							'color'  => array(
								'background' => 'blue',
								'text'       => 'red',
							),
							'border' => array(
								'color' => 'pink',
							),
						),
					),
				),
			),
			'default'
		);
		$expected   = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-block-separator{background-color: blue;border-color: pink;color: red;}';
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );
		$this->assertEquals( $expected, $stylesheet );

		// If background and border color are defined, include everything, CSS specifity will decide which to apply.
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/separator' => array(
							'color'  => array(
								'background' => 'blue',
							),
							'border' => array(
								'color' => 'pink',
							),
						),
					),
				),
			),
			'default'
		);
		$expected   = 'body { margin: 0;}.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }.wp-block-separator{background-color: blue;border-color: pink;}';
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );
		$this->assertEquals( $expected, $stylesheet );

	}

	public function test_get_custom_css_handles_global_custom_css() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'css'    => 'body {color:purple;}',
					'blocks' => array(
						'core/paragraph' => array(
							'css' => 'color:red;',
						),
					),
				),
			)
		);

		$custom_css = 'body {color:purple;}p{color:red;}';
		$this->assertEquals( $custom_css, $theme_json->get_custom_css() );
	}

	/**
	 * @dataProvider data_custom_css_for_user_caps
	 *
	 * @param string $user_property The property name for current user.
	 * @param array  $expected      Expected results.
	 */
	public function test_custom_css_for_user_caps( $user_property, array $expected ) {
		wp_set_current_user( static::${$user_property} );

		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'css'    => 'body { color:purple; }',
					'blocks' => array(
						'core/separator' => array(
							'color' => array(
								'background' => 'blue',
							),
						),
					),
				),
			)
		);

		$this->assertSameSetsWithIndex( $expected, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_custom_css_for_user_caps() {
		return array(
			'allows custom css for users with caps'     => array(
				'user_property' => 'administrator_id',
				'expected'      => array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'css'    => 'body { color:purple; }',
						'blocks' => array(
							'core/separator' => array(
								'color' => array(
									'background' => 'blue',
								),
							),
						),
					),
				),
			),
			'removes custom css for users without caps' => array(
				'user_property' => 'user_id',
				'expected'      => array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'blocks' => array(
							'core/separator' => array(
								'color' => array(
									'background' => 'blue',
								),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_process_blocks_custom_css
	 *
	 * @param array  $input    An array containing the selector and css to test.
	 * @param string $expected Expected results.
	 */
	public function test_process_blocks_custom_css( $input, $expected ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(),
			)
		);
		$reflection = new ReflectionMethod( $theme_json, 'process_blocks_custom_css' );
		$reflection->setAccessible( true );

		$this->assertEquals( $expected, $reflection->invoke( $theme_json, $input['css'], $input['selector'] ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_process_blocks_custom_css() {
		return array(
			// Simple CSS without any child selectors.
			'no child selectors'                => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => 'color: red; margin: auto;',
				),
				'expected' => '.foo{color: red; margin: auto;}',
			),
			// CSS with child selectors.
			'with children'                     => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => 'color: red; margin: auto; & .bar{color: blue;}',
				),
				'expected' => '.foo{color: red; margin: auto;}.foo .bar{color: blue;}',
			),
			// CSS with child selectors and pseudo elements.
			'with children and pseudo elements' => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => 'color: red; margin: auto; & .bar{color: blue;} &::before{color: green;}',
				),
				'expected' => '.foo{color: red; margin: auto;}.foo .bar{color: blue;}.foo::before{color: green;}',
			),
		);
	}
}
