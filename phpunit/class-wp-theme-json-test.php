<?php

/**
 * Test WP_Theme_JSON_Gutenberg class.
 *
 * @package Gutenberg
 *
 * @covers WP_Theme_JSON_Gutenberg
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

	/**
	 * Base Styles.
	 *
	 * @var string
	 */
	private static $base_styles = ':where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.is-layout-flex){gap: 0.5em;}:where(.is-layout-grid){gap: 0.5em;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}';

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
	 * Pretty print CSS in test assertions so that it provides a better diff when a test fails.
	 * Without this: the failing test outputs the entire css string as being different.
	 * With this: the failing test only highlights the specific CSS rule that is different.
	 *
	 * @param string $css A string of raw css with no line breaks.
	 * @return string The css with line breaks.
	 */
	private static function pretty_print_css( $css ) {
		$css = str_replace( '{', " {\n", $css );
		$css = str_replace( '}', "}\n\n", $css );
		$css = str_replace( ';', ";\n", $css );
		return $css;
	}

	/**
	 * Asserts that two CSS strings are equivalent, but outputs
	 * pretty printed test failures along with the raw css.
	 *
	 * - The pretty printed assertions are useful for understanding what actually changed.
	 * - The raw css is included as it's useful for updating the test case's expected CSS.
	 *
	 * Inspired by:
	 * https://stackoverflow.com/questions/6832263/phpunit-assertion-failed-but-i-want-to-continue-testing
	 *
	 * @param string $expected The expected CSS.
	 * @param string $actual   The actual CSS.
	 */
	private function assertSameCSS( $expected, $actual, $message = '' ) {
		$pretty_expected = self::pretty_print_css( $expected );
		$pretty_actual   = self::pretty_print_css( $actual );

		try {
			$this->assertSame( $pretty_expected, $pretty_actual, $message );
		} catch ( PHPUnit_Framework_ExpectationFailedException $e ) {
			// Test failures are thrown as exceptions by PHPUnit.
			// Catch the exception and re-throw it, but with the
			// raw css appended.
			$raw_actual_output =
				"\n\nIf the change is expected, update the test case to this CSS:\n$actual";
			throw new PHPUnit_Framework_ExpectationFailedException(
				"$e$raw_actual_output"
			);
		}
	}

	public function test_get_settings() {
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

	public function test_get_settings_presets_are_keyed_by_origin() {
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

	public function test_get_settings_appearance_true_opts_in() {
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
			'background' => array(
				'backgroundImage' => true,
				'backgroundSize'  => true,
			),
			'border'     => array(
				'width'  => true,
				'style'  => true,
				'radius' => true,
				'color'  => true,
			),
			'color'      => array(
				'link'    => true,
				'heading' => true,
				'button'  => true,
				'caption' => true,
			),
			'dimensions' => array(
				'aspectRatio' => true,
				'minHeight'   => true,
			),
			'position'   => array(
				'sticky' => true,
				'fixed'  => true,
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
					'background' => array(
						'backgroundImage' => true,
						'backgroundSize'  => true,
					),
					'border'     => array(
						'width'  => true,
						'style'  => true,
						'radius' => true,
						'color'  => true,
					),
					'color'      => array(
						'link'    => true,
						'heading' => true,
						'button'  => true,
						'caption' => true,
					),
					'dimensions' => array(
						'aspectRatio' => true,
						'minHeight'   => true,
					),
					'position'   => array(
						'sticky' => true,
						'fixed'  => true,
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

	public function test_get_settings_appearance_false_does_not_opt_in() {
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

	public function test_get_stylesheet() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'      => array(
						'text'      => 'value',
						'palette'   => array(
							array(
								'slug'  => 'grey',
								'color' => 'grey',
							),
						),
						'gradients' => array(
							array(
								'gradient' => 'linear-gradient(135deg,rgba(0,0,0) 0%,rgb(0,0,0) 100%)',
								'name'     => 'Custom gradient',
								'slug'     => 'custom-gradient',
							),
						),
						'duotone'   => array(
							array(
								'colors' => array( '#333333', '#aaaaaa' ),
								'name'   => 'Custom Duotone',
								'slug'   => 'custom-duotone',
							),
						),
					),
					'typography' => array(
						'fontFamilies' => array(
							array(
								'name'       => 'Arial',
								'slug'       => 'arial',
								'fontFamily' => 'Arial, serif',
							),
						),
						'fontSizes'    => array(
							array(
								'slug' => 'small',
								'size' => '14px',
							),
							array(
								'slug' => 'big',
								'size' => '41px',
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
						'link'   => array(
							'color' => array(
								'text'       => '#111',
								'background' => '#333',
							),
						),
						'button' => array(
							'shadow' => '10px 10px 5px 0px rgba(0,0,0,0.66)',
						),
					),
					'blocks'   => array(
						'core/cover'        => array(
							'dimensions' => array(
								'aspectRatio' => '16/9',
							),
						),
						'core/group'        => array(
							'color'      => array(
								'gradient' => 'var:preset|gradient|custom-gradient',
							),
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
						'core/heading'      => array(
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
						'core/media-text'   => array(
							'typography' => array(
								'textAlign' => 'center',
							),
						),
						'core/post-date'    => array(
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
						'core/post-excerpt' => array(
							'typography' => array(
								'textColumns' => 2,
							),
						),
						'core/image'        => array(
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
							'filter'  => array(
								'duotone' => 'var:preset|duotone|custom-duotone',
							),
						),
					),
					'spacing'  => array(
						'blockGap' => '24px',
					),
				),
				'misc'     => 'value',
			)
		);

		$variables = ':root{--wp--preset--color--grey: grey;--wp--preset--gradient--custom-gradient: linear-gradient(135deg,rgba(0,0,0) 0%,rgb(0,0,0) 100%);--wp--preset--font-size--small: 14px;--wp--preset--font-size--big: 41px;--wp--preset--font-family--arial: Arial, serif;}.wp-block-group{--wp--custom--base-font: 16;--wp--custom--line-height--small: 1.2;--wp--custom--line-height--medium: 1.4;--wp--custom--line-height--large: 1.8;}';
		$styles    = static::$base_styles . 'body{color: var(--wp--preset--color--grey);}a:where(:not(.wp-element-button)){background-color: #333;color: #111;}:root :where(.wp-element-button, .wp-block-button__link){box-shadow: 10px 10px 5px 0px rgba(0,0,0,0.66);}:root :where(.wp-block-cover){min-height: unset;aspect-ratio: 16/9;}:root :where(.wp-block-group){background: var(--wp--preset--gradient--custom-gradient);border-radius: 10px;min-height: 50vh;padding: 24px;}:root :where(.wp-block-group a:where(:not(.wp-element-button))){color: #111;}:root :where(.wp-block-heading){color: #123456;}:root :where(.wp-block-heading a:where(:not(.wp-element-button))){background-color: #333;color: #111;font-size: 60px;}:root :where(.wp-block-media-text){text-align: center;}:root :where(.wp-block-post-date){color: #123456;}:root :where(.wp-block-post-date a:where(:not(.wp-element-button))){background-color: #777;color: #555;}:root :where(.wp-block-post-excerpt){column-count: 2;}:root :where(.wp-block-image){margin-bottom: 30px;}:root :where(.wp-block-image img, .wp-block-image .wp-block-image__crop-area, .wp-block-image .components-placeholder){border-top-left-radius: 10px;border-bottom-right-radius: 1em;}:root :where(.wp-block-image img, .wp-block-image .components-placeholder){filter: var(--wp--preset--duotone--custom-duotone);}';
		$presets   = '.has-grey-color{color: var(--wp--preset--color--grey) !important;}.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}.has-custom-gradient-gradient-background{background: var(--wp--preset--gradient--custom-gradient) !important;}.has-small-font-size{font-size: var(--wp--preset--font-size--small) !important;}.has-big-font-size{font-size: var(--wp--preset--font-size--big) !important;}.has-arial-font-family{font-family: var(--wp--preset--font-family--arial) !important;}';
		$all       = $variables . $styles . $presets;

		$this->assertSameCSS( $variables, $theme_json->get_stylesheet( array( 'variables' ) ) );
		$this->assertSameCSS( $styles, $theme_json->get_stylesheet( array( 'styles' ) ) );
		$this->assertSameCSS( $presets, $theme_json->get_stylesheet( array( 'presets' ) ) );
		$this->assertSameCSS( $all, $theme_json->get_stylesheet() );
	}

	public function test_get_styles_for_block_support_for_shorthand_and_longhand_values() {
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

		$group_node = array(
			'name'      => 'core/group',
			'path'      => array( 'styles', 'blocks', 'core/group' ),
			'selector'  => '.wp-block-group',
			'selectors' => array(
				'root' => '.wp-block-group',
			),
		);
		$image_node = array(
			'name'      => 'core/image',
			'path'      => array( 'styles', 'blocks', 'core/image' ),
			'selector'  => '.wp-block-image',
			'selectors' => array(
				'root'   => '.wp-block-image',
				'border' => '.wp-block-image img, .wp-block-image .wp-block-image__crop-area, .wp-block-image .components-placeholder',
			),
		);

		$group_styles = ':root :where(.wp-block-group){border-radius: 10px;margin: 1em;padding: 24px;}';
		$image_styles = ':root :where(.wp-block-image){margin-bottom: 30px;padding-top: 15px;}:root :where(.wp-block-image img, .wp-block-image .wp-block-image__crop-area, .wp-block-image .components-placeholder){border-top-left-radius: 10px;border-bottom-right-radius: 1em;}';
		$this->assertSameCSS( $group_styles, $theme_json->get_styles_for_block( $group_node ) );
		$this->assertSameCSS( $image_styles, $theme_json->get_styles_for_block( $image_node ) );
	}

	public function test_get_stylesheet_skips_disabled_protected_properties() {
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

		$expected = static::$base_styles . ':where(.wp-block-columns.is-layout-flex){gap: 2em;}:where(.wp-block-columns.is-layout-grid){gap: 2em;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet() );
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_renders_enabled_protected_properties() {
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

		$expected = ':where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.wp-site-blocks) > * { margin-block-start: 1em; margin-block-end: 0; }:where(.wp-site-blocks) > :first-child { margin-block-start: 0; }:where(.wp-site-blocks) > :last-child { margin-block-end: 0; }:root { --wp--style--block-gap: 1em; }:root :where(.is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.is-layout-flow) > *{margin-block-start: 1em;margin-block-end: 0;}:root :where(.is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.is-layout-constrained) > *{margin-block-start: 1em;margin-block-end: 0;}:root :where(.is-layout-flex){gap: 1em;}:root :where(.is-layout-grid){gap: 1em;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet() );
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	public function test_get_stylesheet_preset_classes_work_with_compounded_selectors() {
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

		$this->assertSameCSS(
			'.wp-block-heading.has-white-color{color: var(--wp--preset--color--white) !important;}.wp-block-heading.has-white-background-color{background-color: var(--wp--preset--color--white) !important;}.wp-block-heading.has-white-border-color{border-color: var(--wp--preset--color--white) !important;}',
			$theme_json->get_stylesheet( array( 'presets' ) )
		);
	}

	public function test_get_stylesheet_preset_rules_come_after_block_rules() {
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

		$styles    = ':root :where(.wp-block-group){color: red;}';
		$presets   = '.wp-block-group.has-grey-color{color: var(--wp--preset--color--grey) !important;}.wp-block-group.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.wp-block-group.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}';
		$variables = '.wp-block-group{--wp--preset--color--grey: grey;}';

		$all = $variables . $styles . $presets;

		$this->assertSameCSS( $all, $theme_json->get_stylesheet( array( 'styles', 'presets', 'variables' ), null, array( 'skip_root_layout_styles' => true ) ) );
		$this->assertSameCSS( $styles, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
		$this->assertSameCSS( $presets, $theme_json->get_stylesheet( array( 'presets' ) ) );
		$this->assertSameCSS( $variables, $theme_json->get_stylesheet( array( 'variables' ) ) );
	}

	public function test_get_stylesheet_generates_proper_classes_and_css_vars_from_slugs() {
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

		$this->assertSameCSS(
			'.has-grey-color{color: var(--wp--preset--color--grey) !important;}.has-dark-grey-color{color: var(--wp--preset--color--dark-grey) !important;}.has-light-grey-color{color: var(--wp--preset--color--light-grey) !important;}.has-white-2-black-color{color: var(--wp--preset--color--white-2-black) !important;}.has-grey-background-color{background-color: var(--wp--preset--color--grey) !important;}.has-dark-grey-background-color{background-color: var(--wp--preset--color--dark-grey) !important;}.has-light-grey-background-color{background-color: var(--wp--preset--color--light-grey) !important;}.has-white-2-black-background-color{background-color: var(--wp--preset--color--white-2-black) !important;}.has-grey-border-color{border-color: var(--wp--preset--color--grey) !important;}.has-dark-grey-border-color{border-color: var(--wp--preset--color--dark-grey) !important;}.has-light-grey-border-color{border-color: var(--wp--preset--color--light-grey) !important;}.has-white-2-black-border-color{border-color: var(--wp--preset--color--white-2-black) !important;}',
			$theme_json->get_stylesheet( array( 'presets' ) )
		);
		$this->assertSameCSS(
			':root{--wp--preset--color--grey: grey;--wp--preset--color--dark-grey: grey;--wp--preset--color--light-grey: grey;--wp--preset--color--white-2-black: grey;--wp--custom--white-2-black: value;}',
			$theme_json->get_stylesheet( array( 'variables' ) )
		);
	}

	public function test_get_styles_for_block_handles_whitelisted_element_pseudo_selectors() {
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

		$link_node  = array(
			'path'     => array( 'styles', 'elements', 'link' ),
			'selector' => 'a:where(:not(.wp-element-button))',
		);
		$hover_node = array(
			'path'     => array( 'styles', 'elements', 'link' ),
			'selector' => 'a:where(:not(.wp-element-button)):hover',
		);
		$focus_node = array(
			'path'     => array( 'styles', 'elements', 'link' ),
			'selector' => 'a:where(:not(.wp-element-button)):focus',
		);

		$link_style  = 'a:where(:not(.wp-element-button)){background-color: red;color: green;}';
		$hover_style = ':root :where(a:where(:not(.wp-element-button)):hover){background-color: green;color: red;font-size: 10em;text-transform: uppercase;}';
		$focus_style = ':root :where(a:where(:not(.wp-element-button)):focus){background-color: black;color: yellow;}';

		$this->assertSameCSS( $link_style, $theme_json->get_styles_for_block( $link_node ) );
		$this->assertSameCSS( $hover_style, $theme_json->get_styles_for_block( $hover_node ) );
		$this->assertSameCSS( $focus_style, $theme_json->get_styles_for_block( $focus_node ) );
	}

	/**
	 * Tests that if an element has nothing but pseudo selector styles, they are still output by get_stylesheet.
	 */
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

		$expected = ':root :where(a:where(:not(.wp-element-button)):hover){background-color: green;color: red;font-size: 10em;text-transform: uppercase;}:root :where(a:where(:not(.wp-element-button)):focus){background-color: black;color: yellow;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
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

		$expected = 'h4{background-color: red;color: green;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
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

		$expected = 'a:where(:not(.wp-element-button)){background-color: red;color: green;}:root :where(a:where(:not(.wp-element-button)):hover){background-color: green;color: red;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
		$this->assertStringNotContainsString( 'a:levitate{', $theme_json->get_stylesheet( array( 'styles' ) ) );
	}

	/**
	 * Tests that element pseudo selectors are output before block element pseudo selectors, and that whitelisted
	 * block element pseudo selectors are output correctly.
	 */
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

		$expected = ':root :where(.wp-block-group a:where(:not(.wp-element-button))){background-color: red;color: green;}:root :where(.wp-block-group a:where(:not(.wp-element-button)):hover){background-color: green;color: red;font-size: 10em;text-transform: uppercase;}:root :where(.wp-block-group a:where(:not(.wp-element-button)):focus){background-color: black;color: yellow;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	/**
	 * This test checks that feature selectors defined as `__experimentalSelector` inside
	 * the `supports` property are correctly output in the stylesheet.
	 */
	public function test_get_stylesheet_with_deprecated_feature_level_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'      => array(
						'custom'  => false,
						'palette' => array(
							array(
								'slug'  => 'green',
								'color' => 'green',
							),
						),
					),
					'typography' => array(
						'fontSize' => true,
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/calendar' => array(
							'color'      => array(
								'text' => 'green',
							),
							'typography' => array(
								'fontSize' => '3em',
							),
						),
					),
				),
			)
		);

		$base_styles   = ':root{--wp--preset--color--green: green;}';
		$block_styles  = ':root :where(.wp-block-calendar){font-size: 3em;}:root :where(.wp-block-calendar table, .wp-block-calendar th){color: green;}';
		$preset_styles = '.has-green-color{color: var(--wp--preset--color--green) !important;}.has-green-background-color{background-color: var(--wp--preset--color--green) !important;}.has-green-border-color{border-color: var(--wp--preset--color--green) !important;}';
		$expected      = $base_styles . $block_styles . $preset_styles;
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles', 'presets', 'variables' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}


	/**
	 * This test checks that feature selectors defined in the stable `selectors`
	 * property are correctly output in the stylesheet.
	 */
	public function test_get_stylesheet_with_block_json_selectors() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'border' => array(
						'radius' => true,
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/image' => array(
							'border' => array(
								'radius' => '374px',
							),
						),
					),
				),
			)
		);

		$expected = ':root :where(.wp-block-image img, .wp-block-image .wp-block-image__crop-area, .wp-block-image .components-placeholder){border-radius: 374px;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles', 'presets', 'variables' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	public function test_get_stylesheet_generates_layout_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'contentSize' => '640px',
						'wideSize'    => '1200px',
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
		$this->assertSameCSS(
			':root { --wp--style--global--content-size: 640px;--wp--style--global--wide-size: 1200px; }:where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.wp-site-blocks) > * { margin-block-start: 1em; margin-block-end: 0; }:where(.wp-site-blocks) > :first-child { margin-block-start: 0; }:where(.wp-site-blocks) > :last-child { margin-block-end: 0; }:root { --wp--style--block-gap: 1em; }:root :where(.is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.is-layout-flow) > *{margin-block-start: 1em;margin-block-end: 0;}:root :where(.is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.is-layout-constrained) > *{margin-block-start: 1em;margin-block-end: 0;}:root :where(.is-layout-flex){gap: 1em;}:root :where(.is-layout-grid){gap: 1em;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width: var(--wp--style--global--content-size);margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignwide{max-width: var(--wp--style--global--wide-size);}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}',
			$theme_json->get_stylesheet( array( 'styles' ) )
		);
	}

	public function test_get_stylesheet_generates_layout_styles_with_spacing_presets() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'contentSize' => '640px',
						'wideSize'    => '1200px',
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
		$this->assertSameCSS(
			':root { --wp--style--global--content-size: 640px;--wp--style--global--wide-size: 1200px; }:where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.wp-site-blocks) > * { margin-block-start: var(--wp--preset--spacing--60); margin-block-end: 0; }:where(.wp-site-blocks) > :first-child { margin-block-start: 0; }:where(.wp-site-blocks) > :last-child { margin-block-end: 0; }:root { --wp--style--block-gap: var(--wp--preset--spacing--60); }:root :where(.is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.is-layout-flow) > *{margin-block-start: var(--wp--preset--spacing--60);margin-block-end: 0;}:root :where(.is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.is-layout-constrained) > *{margin-block-start: var(--wp--preset--spacing--60);margin-block-end: 0;}:root :where(.is-layout-flex){gap: var(--wp--preset--spacing--60);}:root :where(.is-layout-grid){gap: var(--wp--preset--spacing--60);}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width: var(--wp--style--global--content-size);margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignwide{max-width: var(--wp--style--global--wide-size);}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}',
			$theme_json->get_stylesheet( array( 'styles' ) )
		);
	}

	public function test_get_stylesheet_generates_fallback_gap_layout_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'contentSize' => '640px',
						'wideSize'    => '1200px',
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
		$this->assertSameCSS(
			':root { --wp--style--global--content-size: 640px;--wp--style--global--wide-size: 1200px; }:where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.is-layout-flex){gap: 0.5em;}:where(.is-layout-grid){gap: 0.5em;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width: var(--wp--style--global--content-size);margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignwide{max-width: var(--wp--style--global--wide-size);}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}',
			$stylesheet
		);
	}

	public function test_get_stylesheet_generates_base_fallback_gap_layout_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'spacing' => array(
						'blockGap' => null,
					),
				),
			),
			'default'
		);
		$stylesheet = $theme_json->get_stylesheet( array( 'base-layout-styles' ) );

		// Note the `base-layout-styles` includes a fallback gap for the Columns block for backwards compatibility.
		$this->assertSameCSS(
			':where(.is-layout-flex){gap: 0.5em;}:where(.is-layout-grid){gap: 0.5em;}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}:where(.wp-block-columns.is-layout-flex){gap: 2em;}:where(.wp-block-columns.is-layout-grid){gap: 2em;}:where(.wp-block-post-template.is-layout-flex){gap: 1.25em;}:where(.wp-block-post-template.is-layout-grid){gap: 1.25em;}',
			$stylesheet
		);
	}

	public function test_get_stylesheet_skips_layout_styles() {
		add_theme_support( 'disable-layout-styles' );
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
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
		$this->assertSameCSS(
			'',
			$stylesheet
		);
	}

	public function test_get_stylesheet_generates_valid_block_gap_values_and_skips_null_or_false_values() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout'  => array(
						'contentSize' => '640px',
						'wideSize'    => '1200px',
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

		$this->assertSameCSS(
			':root { --wp--style--global--content-size: 640px;--wp--style--global--wide-size: 1200px; }:where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.wp-site-blocks) > * { margin-block-start: 1rem; margin-block-end: 0; }:where(.wp-site-blocks) > :first-child { margin-block-start: 0; }:where(.wp-site-blocks) > :last-child { margin-block-end: 0; }:root { --wp--style--block-gap: 1rem; }:root :where(.is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.is-layout-flow) > *{margin-block-start: 1rem;margin-block-end: 0;}:root :where(.is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.is-layout-constrained) > *{margin-block-start: 1rem;margin-block-end: 0;}:root :where(.is-layout-flex){gap: 1rem;}:root :where(.is-layout-grid){gap: 1rem;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width: var(--wp--style--global--content-size);margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignwide{max-width: var(--wp--style--global--wide-size);}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}:root :where(.wp-block-post-content){color: gray;}:root :where(.wp-block-social-links-is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.wp-block-social-links-is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.wp-block-social-links-is-layout-flow) > *{margin-block-start: 0;margin-block-end: 0;}:root :where(.wp-block-social-links-is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.wp-block-social-links-is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.wp-block-social-links-is-layout-constrained) > *{margin-block-start: 0;margin-block-end: 0;}:root :where(.wp-block-social-links-is-layout-flex){gap: 0;}:root :where(.wp-block-social-links-is-layout-grid){gap: 0;}:root :where(.wp-block-buttons-is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.wp-block-buttons-is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.wp-block-buttons-is-layout-flow) > *{margin-block-start: 0;margin-block-end: 0;}:root :where(.wp-block-buttons-is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.wp-block-buttons-is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.wp-block-buttons-is-layout-constrained) > *{margin-block-start: 0;margin-block-end: 0;}:root :where(.wp-block-buttons-is-layout-flex){gap: 0;}:root :where(.wp-block-buttons-is-layout-grid){gap: 0;}',
			$theme_json->get_stylesheet()
		);
	}

	public function test_get_stylesheet_returns_outline_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'elements' => array(
						'button' => array(
							'outline' => array(
								'offset' => '3px',
								'width'  => '3px',
								'style'  => 'dashed',
								'color'  => 'red',
							),
							':hover'  => array(
								'outline' => array(
									'offset' => '3px',
									'width'  => '3px',
									'style'  => 'solid',
									'color'  => 'blue',
								),
							),
						),
					),
				),
			)
		);

		$expected = ':root :where(.wp-element-button, .wp-block-button__link){outline-color: red;outline-offset: 3px;outline-style: dashed;outline-width: 3px;}:root :where(.wp-element-button:hover, .wp-block-button__link:hover){outline-color: blue;outline-offset: 3px;outline-style: solid;outline-width: 3px;}';

		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	public function test_get_stylesheet_custom_root_selector() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'color' => array(
						'text' => 'teal',
					),
				),
			),
			'default'
		);

		// Custom root selector is unrelated to root layout styles so they don't need to be output for this test.
		$options = array(
			'root_selector'           => '.custom',
			'skip_root_layout_styles' => true,
		);
		$actual  = $theme_json->get_stylesheet( array( 'styles' ), null, $options );

		$this->assertSameCSS(
			':root :where(.custom){color: teal;}',
			$actual
		);
	}

	public function test_get_stylesheet_generates_fluid_typography_values() {
		register_block_type(
			'test/clamp-me',
			array(
				'api_version' => 3,
			)
		);
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'typography' => array(
						'fluid'     => true,
						'fontSizes' => array(
							array(
								'size' => '16px',
								'slug' => 'pickles',
								'name' => 'Pickles',
							),
							array(
								'size' => '22px',
								'slug' => 'toast',
								'name' => 'Toast',
							),
						),
					),
				),
				'styles'   => array(
					'typography' => array(
						'fontSize' => '1em',
					),
					'elements'   => array(
						'h1' => array(
							'typography' => array(
								'fontSize' => '100px',
							),
						),
					),
					'blocks'     => array(
						'test/clamp-me' => array(
							'typography' => array(
								'fontSize' => '48px',
							),
						),
					),
				),
			),
			'default'
		);

		unregister_block_type( 'test/clamp-me' );

		$this->assertSameCSS(
			':root{--wp--preset--font-size--pickles: clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.156), 16px);--wp--preset--font-size--toast: clamp(14.642px, 0.915rem + ((1vw - 3.2px) * 0.575), 22px);}body{font-size: clamp(0.875em, 0.875rem + ((1vw - 0.2em) * 0.156), 1em);}h1{font-size: clamp(50.171px, 3.136rem + ((1vw - 3.2px) * 3.893), 100px);}:root :where(.wp-block-test-clamp-me){font-size: clamp(27.894px, 1.743rem + ((1vw - 3.2px) * 1.571), 48px);}.has-pickles-font-size{font-size: var(--wp--preset--font-size--pickles) !important;}.has-toast-font-size{font-size: var(--wp--preset--font-size--toast) !important;}',
			$theme_json->get_stylesheet( array( 'styles', 'variables', 'presets' ), null, array( 'skip_root_layout_styles' => true ) )
		);
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
						'theme'   => array(
							array(
								'slug' => 'small',
								'size' => '1.1rem',
								'name' => 'Small',
							),
							array(
								'slug' => 'large',
								'size' => '1.75rem',
								'name' => 'Large',
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
		);
		$defaults->merge( $theme_json );
		$actual = $defaults->get_raw_data();
		$this->assertSameSetsWithIndex( $expected, $actual );
	}

	public function test_merge_incoming_background_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'background' => array(
						'backgroundImage' => array(
							'url' => 'http://example.org/quote.png',
						),
						'backgroundSize'  => 'cover',
					),
					'blocks'     => array(
						'core/group' => array(
							'background' => array(
								'backgroundImage'      => array(
									'ref' => 'styles.blocks.core/verse.background.backgroundImage',
								),
								'backgroundAttachment' => 'fixed',
							),
						),
						'core/quote' => array(
							'background' => array(
								'backgroundImage'      => array(
									'url' => 'http://example.org/quote.png',
								),
								'backgroundAttachment' => array(
									'ref' => 'styles.blocks.core/group.background.backgroundAttachment',
								),
							),
						),
					),
				),
			)
		);

		$update_background_image_styles = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'background' => array(
					'backgroundSize' => 'contain',
				),
				'blocks'     => array(
					'core/group' => array(
						'background' => array(
							'backgroundImage' => array(
								'url' => 'http://example.org/group.png',
							),
						),
					),
					'core/quote' => array(
						'background' => array(
							'backgroundAttachment' => 'fixed',
						),
					),
					'core/verse' => array(
						'background' => array(
							'backgroundImage' => array(
								'ref' => 'styles.blocks.core/group.background.backgroundImage',
							),
						),
					),
				),
			),
		);
		$expected                       = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'background' => array(
					'backgroundImage' => array(
						'url' => 'http://example.org/quote.png',
					),
					'backgroundSize'  => 'contain',
				),
				'blocks'     => array(
					'core/group' => array(
						'background' => array(
							'backgroundImage'      => array(
								'url' => 'http://example.org/group.png',
							),
							'backgroundAttachment' => 'fixed',
						),
					),
					'core/quote' => array(
						'background' => array(
							'backgroundImage'      => array(
								'url' => 'http://example.org/quote.png',
							),
							'backgroundAttachment' => 'fixed',
						),
					),
					'core/verse' => array(
						'background' => array(
							'backgroundImage' => array(
								'ref' => 'styles.blocks.core/group.background.backgroundImage',
							),
						),
					),
				),
			),
		);
		$theme_json->merge( new WP_Theme_JSON_Gutenberg( $update_background_image_styles ) );
		$actual = $theme_json->get_raw_data();

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_remove_insecure_properties_removes_unsafe_styles() {
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
								'duotone' => 'var(--invalid',
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
					'text' => 'var(--wp--preset--color--dark-red)',
				),
				'elements' => array(
					'link' => array(
						'color' => array(
							'text'       => 'var(--wp--preset--color--dark-pink)',
							'background' => 'var(--wp--preset--color--dark-red)',
						),
					),
				),
				'blocks'   => array(
					'core/image' => array(
						'filter' => array(
							'duotone' => 'var(--wp--preset--duotone--blue-red)',
						),
					),
					'core/group' => array(
						'color'    => array(
							'text' => 'var(--wp--preset--color--dark-gray)',
						),
						'elements' => array(
							'link' => array(
								'color' => array(
									'text' => 'var(--wp--preset--color--dark-pink)',
								),
							),
						),
					),
				),
			),
		);
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_remove_insecure_properties_removes_unsafe_styles_sub_properties() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'border'   => array(
						'radius' => array(
							'topLeft'     => '6px',
							'topRight'    => 'var(--invalid',
							'bottomRight' => '6px',
							'bottomLeft'  => '6px',
						),
					),
					'spacing'  => array(
						'padding' => array(
							'top'    => '1px',
							'right'  => '1px',
							'bottom' => 'var(--invalid',
							'left'   => '1px',
						),
					),
					'elements' => array(
						'link' => array(
							'spacing' => array(
								'padding' => array(
									'top'    => '2px',
									'right'  => '2px',
									'bottom' => 'var(--invalid',
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
									'topRight'    => 'var(--invalid',
									'bottomRight' => '5px',
									'bottomLeft'  => '5px',
								),
							),
							'spacing'  => array(
								'padding' => array(
									'top'    => '3px',
									'right'  => '3px',
									'bottom' => 'var(--invalid',
									'left'   => '3px',
								),
							),
							'elements' => array(
								'link' => array(
									'spacing' => array(
										'padding' => array(
											'top'    => '4px',
											'right'  => '4px',
											'bottom' => 'var(--invalid',
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

	public function test_remove_insecure_properties_removes_non_preset_settings() {
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

	public function test_remove_insecure_properties_removes_unsafe_preset_settings() {
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
									'color' => 'var(--invalid',
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
									'fontFamily' => 'var(--invalid',
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
											'color' => 'var(--invalid',
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

	public function test_remove_insecure_properties_applies_safe_styles() {
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

	/**
	 * @covers WP_Theme_JSON_Gutenberg::remove_insecure_properties
	 */
	public function test_remove_insecure_properties_should_allow_indirect_properties() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'   => array(
					'spacing' => array(
						'blockGap' => '3em',
					),
					'blocks'  => array(
						'core/social-links' => array(
							'spacing' => array(
								'blockGap' => array(
									'left' => '2em',
									'top'  => '1em',
								),
							),
						),
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
				'spacing' => array(
					'blockGap' => '3em',
				),
				'blocks'  => array(
					'core/social-links' => array(
						'spacing' => array(
							'blockGap' => array(
								'left' => '2em',
								'top'  => '1em',
							),
						),
					),
				),
			),
			'settings' => array(
				'layout' => array(
					'contentSize' => '800px',
					'wideSize'    => '1000px',
				),
			),
		);

		$this->assertSameSetsWithIndex( $expected, $actual );
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

	public function test_get_custom_templates() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'         => 1,
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

	public function test_get_template_parts() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'       => 1,
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

	public function test_get_from_editor_settings() {
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

	public function test_get_editor_settings_no_theme_support() {
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

	public function test_get_editor_settings_blank() {
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(),
		);
		$actual   = WP_Theme_JSON_Gutenberg::get_from_editor_settings( array() );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_get_editor_settings_custom_units_can_be_disabled() {
		add_theme_support( 'custom-units', array() );
		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( gutenberg_get_classic_theme_supports_block_editor_settings() );
		remove_theme_support( 'custom-units' );

		$expected = array(
			'units'   => array( array() ),
			'padding' => false,
		);

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	public function test_get_editor_settings_custom_units_can_be_enabled() {
		add_theme_support( 'custom-units' );
		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( gutenberg_get_classic_theme_supports_block_editor_settings() );
		remove_theme_support( 'custom-units' );

		$expected = array(
			'units'   => array( 'px', 'em', 'rem', 'vh', 'vw', '%' ),
			'padding' => false,
		);

		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	public function test_get_editor_settings_custom_units_can_be_filtered() {
		add_theme_support( 'custom-units', 'rem', 'em' );
		$actual = WP_Theme_JSON_Gutenberg::get_from_editor_settings( gutenberg_get_classic_theme_supports_block_editor_settings() );
		remove_theme_support( 'custom-units' );

		$expected = array(
			'units'   => array( 'rem', 'em' ),
			'padding' => false,
		);
		$this->assertEqualSetsWithIndex( $expected, $actual['settings']['spacing'] );
	}

	public function test_export_data() {
		$theme = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

	public function test_export_data_deals_with_empty_user_data() {
		$theme = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

	public function test_export_data_deals_with_empty_theme_data() {
		$user = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

	public function test_export_data_deals_with_empty_data() {
		$theme    = new WP_Theme_JSON_Gutenberg(
			array( 'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA ),
			'theme'
		);
		$actual   = $theme->get_data();
		$expected = array( 'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA );
		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_export_data_sets_appearance_tools() {
		$theme = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'appearanceTools' => true,
					'blocks'          => array(
						'core/paragraph' => array(
							'appearanceTools' => true,
						),
					),
				),
			)
		);

		$actual   = $theme->get_data();
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'appearanceTools' => true,
				'blocks'          => array(
					'core/paragraph' => array(
						'appearanceTools' => true,
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_export_data_sets_use_root_padding_aware_alignments() {
		$theme = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'useRootPaddingAwareAlignments' => true,
					'blocks'                        => array(
						'core/paragraph' => array(
							'useRootPaddingAwareAlignments' => true,
						),
					),
				),
			)
		);

		$actual   = $theme->get_data();
		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'useRootPaddingAwareAlignments' => true,
				'blocks'                        => array(
					'core/paragraph' => array(
						'useRootPaddingAwareAlignments' => true,
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function test_remove_invalid_font_family_settings() {
		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'typography' => array(
						'fontFamilies' => array(
							'custom' => array(
								array(
									'name'       => 'Open Sans',
									'slug'       => 'open-sans',
									'fontFamily' => '"Open Sans", sans-serif</style><script>alert("xss")</script>',
								),
								array(
									'name'       => 'Arial',
									'slug'       => 'arial',
									'fontFamily' => 'Arial, serif',
								),
							),
						),
					),
				),
			),
			true
		);

		$expected = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array(
						'custom' => array(
							array(
								'name'       => 'Arial',
								'slug'       => 'arial',
								'fontFamily' => 'Arial, serif',
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

		$this->assertSame( $expected, $actual );
	}

	public function test_get_element_class_name_invalid() {
		$expected = '';
		$actual   = WP_Theme_JSON_Gutenberg::get_element_class_name( 'unknown-element' );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Testing that dynamic properties in theme.json return the value they reference,
	 * e.g. array( 'ref' => 'styles.color.background' ) => "#ffffff".
	 */
	public function test_get_property_value_valid() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

		$expected = 'body{background-color: #ffffff;color: #000000;}:root :where(.wp-element-button, .wp-block-button__link){background-color: #000000;color: #ffffff;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	/**
	 * Tests that get_property_value() static method returns an empty string
	 * if the path is invalid or the value is null.
	 *
	 * Also, tests that PHP 8.1 "passing null to non-nullable" deprecation notice
	 * is not thrown when passing the value to strncmp() in the method.
	 *
	 * The notice that we should not see:
	 * `Deprecated: strncmp(): Passing null to parameter #1 ($string1) of type string is deprecated`.
	 *
	 * @dataProvider data_get_property_value_should_return_string_for_invalid_paths_or_null_values
	 *
	 * @covers WP_Theme_JSON_Gutenberg::get_property_value
	 *
	 * @param array $styles An array with style definitions.
	 * @param array $path   Path to the desired properties.
	 */
	public function test_get_property_value_should_return_string_for_invalid_paths_or_null_values( $styles, $path ) {
		$reflection_class = new ReflectionClass( WP_Theme_JSON_Gutenberg::class );

		$get_property_value_method = $reflection_class->getMethod( 'get_property_value' );
		$get_property_value_method->setAccessible( true );
		$result = $get_property_value_method->invoke( null, $styles, $path );

		$this->assertSame( '', $result );
	}

	/**
	 * Data provider for test_get_property_value_should_return_string_for_invalid_paths_or_null_values().
	 *
	 * @return array
	 */
	public function data_get_property_value_should_return_string_for_invalid_paths_or_null_values() {
		return array(
			'empty string' => array(
				'styles' => array(),
				'path'   => array( 'non_existent_path' ),
			),
			'null'         => array(
				'styles' => array( 'some_null_value' => null ),
				'path'   => array( 'some_null_value' ),
			),
		);
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to other dynamic properties in a loop
	 * should be left untouched.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	public function test_get_property_value_loop() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

		$expected = 'body{background-color: #ffffff;}:root :where(.wp-element-button, .wp-block-button__link){color: #ffffff;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to other dynamic properties
	 * should be left unprocessed.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	public function test_get_property_value_recursion() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

		$expected = 'body{background-color: #ffffff;color: #ffffff;}:root :where(.wp-element-button, .wp-block-button__link){color: #ffffff;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	/**
	 * Testing that dynamic properties in theme.json that
	 * refer to themselves should be left unprocessed.
	 *
	 * @expectedIncorrectUsage get_property_value
	 */
	public function test_get_property_value_self() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'color' => array(
						'background' => '#ffffff',
						'text'       => array( 'ref' => 'styles.color.text' ),
					),
				),
			)
		);

		$expected = 'body{background-color: #ffffff;}';
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	public function test_get_styles_for_block_with_padding_aware_alignments() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
			'path'     => array( 'styles' ),
			'selector' => 'body',
		);

		$expected    = ':where(body) { margin: 0; }.wp-site-blocks { padding-top: var(--wp--style--root--padding-top); padding-bottom: var(--wp--style--root--padding-bottom); }.has-global-padding { padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }.has-global-padding > .alignfull { margin-right: calc(var(--wp--style--root--padding-right) * -1); margin-left: calc(var(--wp--style--root--padding-left) * -1); }.has-global-padding :where(:not(.alignfull.is-layout-flow) > .has-global-padding:not(.wp-block-block, .alignfull)) { padding-right: 0; padding-left: 0; }.has-global-padding :where(:not(.alignfull.is-layout-flow) > .has-global-padding:not(.wp-block-block, .alignfull)) > .alignfull { margin-left: 0; margin-right: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.is-layout-flex){gap: 0.5em;}:where(.is-layout-grid){gap: 0.5em;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}body{--wp--style--root--padding-top: 10px;--wp--style--root--padding-right: 12px;--wp--style--root--padding-bottom: 10px;--wp--style--root--padding-left: 12px;}';
		$root_rules  = $theme_json->get_root_layout_rules( WP_Theme_JSON_Gutenberg::ROOT_BLOCK_SELECTOR, $metadata );
		$style_rules = $theme_json->get_styles_for_block( $metadata );
		$this->assertSameCSS( $expected, $root_rules . $style_rules );
	}

	public function test_get_styles_for_block_without_padding_aware_alignments() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
			'path'     => array( 'styles' ),
			'selector' => 'body',
		);

		$expected    = static::$base_styles . 'body{padding-top: 10px;padding-right: 12px;padding-bottom: 10px;padding-left: 12px;}';
		$root_rules  = $theme_json->get_root_layout_rules( WP_Theme_JSON_Gutenberg::ROOT_BLOCK_SELECTOR, $metadata );
		$style_rules = $theme_json->get_styles_for_block( $metadata );
		$this->assertSameCSS( $expected, $root_rules . $style_rules );
	}

	public function test_get_styles_with_content_width() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'layout' => array(
						'contentSize' => '800px',
						'wideSize'    => '1000px',
					),
				),
			)
		);

		$metadata = array(
			'path'     => array( 'settings' ),
			'selector' => 'body',
		);

		$expected = ':root { --wp--style--global--content-size: 800px;--wp--style--global--wide-size: 1000px; }:where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.is-layout-flex){gap: 0.5em;}:where(.is-layout-grid){gap: 0.5em;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width: var(--wp--style--global--content-size);margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignwide{max-width: var(--wp--style--global--wide-size);}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}';
		$this->assertSameCSS( $expected, $theme_json->get_root_layout_rules( WP_Theme_JSON::ROOT_BLOCK_SELECTOR, $metadata ) );
	}

	public function test_get_styles_with_appearance_tools() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'appearanceTools' => true,
				),
			)
		);

		$metadata = array(
			'path'     => array( 'settings' ),
			'selector' => 'body',
		);

		$expected = ':where(body) { margin: 0; }.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }.wp-site-blocks > .alignright { float: right; margin-left: 2em; }.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }:where(.wp-site-blocks) > * { margin-block-start: ; margin-block-end: 0; }:where(.wp-site-blocks) > :first-child { margin-block-start: 0; }:where(.wp-site-blocks) > :last-child { margin-block-end: 0; }:root { --wp--style--block-gap: ; }:root :where(.is-layout-flow) > :first-child{margin-block-start: 0;}:root :where(.is-layout-flow) > :last-child{margin-block-end: 0;}:root :where(.is-layout-flow) > *{margin-block-start: 1;margin-block-end: 0;}:root :where(.is-layout-constrained) > :first-child{margin-block-start: 0;}:root :where(.is-layout-constrained) > :last-child{margin-block-end: 0;}:root :where(.is-layout-constrained) > *{margin-block-start: 1;margin-block-end: 0;}:root :where(.is-layout-flex){gap: 1;}:root :where(.is-layout-grid){gap: 1;}.is-layout-flow > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-flow > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-flow > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > .alignleft{float: left;margin-inline-start: 0;margin-inline-end: 2em;}.is-layout-constrained > .alignright{float: right;margin-inline-start: 2em;margin-inline-end: 0;}.is-layout-constrained > .aligncenter{margin-left: auto !important;margin-right: auto !important;}.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)){margin-left: auto !important;margin-right: auto !important;}body .is-layout-flex{display: flex;}.is-layout-flex{flex-wrap: wrap;align-items: center;}.is-layout-flex > :is(*, div){margin: 0;}body .is-layout-grid{display: grid;}.is-layout-grid > :is(*, div){margin: 0;}';
		$this->assertSameCSS( $expected, $theme_json->get_root_layout_rules( WP_Theme_JSON_Gutenberg::ROOT_BLOCK_SELECTOR, $metadata ) );
	}

	public function test_sanitization() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'spacing' => array(
						'blockGap' => 'valid value',
					),
					'blocks'  => array(
						'core/group' => array(
							'spacing' => array(
								'margin'  => 'valid value',
								'display' => 'none',
							),
						),
					),
				),
			)
		);

		$actual   = $theme_json->get_raw_data();
		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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

	public function test_sanitize_for_unregistered_style_variations() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/quote' => array(
							'variations' => array(
								'unregisteredVariation' => array(
									'color' => array(
										'background' => 'hotpink',
									),
								),
								'plain'                 => array(
									'color' => array(
										'background' => 'hotpink',
									),
								),
							),
						),
					),
				),
			)
		);

		$sanitized_theme_json = $theme_json->get_raw_data();
		$expected             = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
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
		);
		$this->assertSameSetsWithIndex( $expected, $sanitized_theme_json, 'Sanitized theme.json styles does not match' );
	}

	public function test_unwraps_block_style_variations() {
		gutenberg_register_block_style(
			array( 'core/paragraph', 'core/group' ),
			array(
				'name'  => 'myVariation',
				'label' => 'My variation',
			)
		);

		$input = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'variations' => array(
						'myVariation' => array(
							'color'      => array(
								'background' => 'topLevel',
								'gradient'   => 'topLevel',
							),
							'typography' => array(
								'fontFamily' => 'topLevel',
							),
						),
					),
					'blocks'     => array(
						'core/paragraph' => array(
							'variations' => array(
								'myVariation' => array(
									'color'   => array(
										'background' => 'blockLevel',
										'text'       => 'blockLevel',
									),
									'outline' => array(
										'offset' => 'blockLevel',
									),
								),
							),
						),
					),
				),
			)
		);

		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/paragraph' => array(
						'variations' => array(
							'myVariation' => array(
								'color'      => array(
									'background' => 'blockLevel',
									'gradient'   => 'topLevel',
									'text'       => 'blockLevel',
								),
								'typography' => array(
									'fontFamily' => 'topLevel',
								),
								'outline'    => array(
									'offset' => 'blockLevel',
								),
							),
						),
					),
					'core/group'     => array(
						'variations' => array(
							'myVariation' => array(
								'color'      => array(
									'background' => 'topLevel',
									'gradient'   => 'topLevel',
								),
								'typography' => array(
									'fontFamily' => 'topLevel',
								),
							),
						),
					),
				),
			),
		);
		$this->assertSameSetsWithIndex( $expected, $input->get_raw_data(), 'Unwrapped block style variations do not match' );
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
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
			'1 variation with 1 valid property'     => array(
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
		);
	}

	/**
	 * Tests that invalid properties are removed from the theme.json inside indexed arrays as settings.typography.fontFamilies.
	 */
	public function test_sanitize_indexed_arrays() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'badKey2'  => 'I am Evil!',
				'settings' => array(
					'badKey3'    => 'I am Evil!',
					'typography' => array(
						'badKey4'      => 'I am Evil!',
						'fontFamilies' => array(
							'custom' => array(
								array(
									'badKey4'    => 'I am Evil!',
									'name'       => 'Arial',
									'slug'       => 'arial',
									'fontFamily' => 'Arial, sans-serif',
								),
							),
							'theme'  => array(
								array(
									'badKey5'    => 'I am Evil!',
									'name'       => 'Piazzolla',
									'slug'       => 'piazzolla',
									'fontFamily' => 'Piazzolla',
									'fontFace'   => array(
										array(
											'badKey6'    => 'I am Evil!',
											'fontFamily' => 'Piazzolla',
											'fontStyle'  => 'italic',
											'fontWeight' => '400',
											'src'        => 'https://example.com/font.ttf',
										),
										array(
											'badKey7'    => 'I am Evil!',
											'fontFamily' => 'Piazzolla',
											'fontStyle'  => 'italic',
											'fontWeight' => '400',
											'src'        => 'https://example.com/font.ttf',
										),
									),
								),
								array(
									'badKey8'    => 'I am Evil!',
									'name'       => 'Inter',
									'slug'       => 'Inter',
									'fontFamily' => 'Inter',
									'fontFace'   => array(
										array(
											'badKey9'    => 'I am Evil!',
											'fontFamily' => 'Inter',
											'fontStyle'  => 'italic',
											'fontWeight' => '400',
											'src'        => 'https://example.com/font.ttf',
										),
										array(
											'badKey10'   => 'I am Evil!',
											'fontFamily' => 'Inter',
											'fontStyle'  => 'italic',
											'fontWeight' => '400',
											'src'        => 'https://example.com/font.ttf',
										),
									),
								),
							),
						),
					),
				),
			)
		);

		$expected_sanitized   = array(
			'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array(
						'custom' => array(
							array(
								'name'       => 'Arial',
								'slug'       => 'arial',
								'fontFamily' => 'Arial, sans-serif',
							),
						),
						'theme'  => array(
							array(
								'name'       => 'Piazzolla',
								'slug'       => 'piazzolla',
								'fontFamily' => 'Piazzolla',
								'fontFace'   => array(
									array(
										'fontFamily' => 'Piazzolla',
										'fontStyle'  => 'italic',
										'fontWeight' => '400',
										'src'        => 'https://example.com/font.ttf',
									),
									array(
										'fontFamily' => 'Piazzolla',
										'fontStyle'  => 'italic',
										'fontWeight' => '400',
										'src'        => 'https://example.com/font.ttf',
									),
								),
							),
							array(
								'name'       => 'Inter',
								'slug'       => 'Inter',
								'fontFamily' => 'Inter',
								'fontFace'   => array(
									array(
										'fontFamily' => 'Inter',
										'fontStyle'  => 'italic',
										'fontWeight' => '400',
										'src'        => 'https://example.com/font.ttf',
									),
									array(
										'fontFamily' => 'Inter',
										'fontStyle'  => 'italic',
										'fontWeight' => '400',
										'src'        => 'https://example.com/font.ttf',
									),
								),
							),
						),
					),
				),
			),
		);
		$sanitized_theme_json = $theme_json->get_raw_data();
		$this->assertSameSetsWithIndex( $expected_sanitized, $sanitized_theme_json, 'Sanitized theme.json does not match' );
	}

	/**
	 * @dataProvider data_sanitize_with_invalid_style_variation
	 *
	 * @param array $theme_json_variations The theme.json variations to test.
	 */
	public function test_sanitize_with_invalid_style_variation( $theme_json_variations ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
				'selector' => '.is-style-plain.wp-block-quote',
			),
			'styles'   => ':root :where(.is-style-plain.wp-block-quote){background-color: hotpink;}',
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
		);
	}

	public function test_block_style_variations() {
		wp_set_current_user( static::$administrator_id );

		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/button' => array(
						'color'      => array(
							'background' => 'blue',
						),
						'variations' => array(
							'outline' => array(
								'color' => array(
									'background' => 'purple',
								),
							),
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties( $expected );

		$this->assertSameSetsWithIndex( $expected, $actual );
	}

	public function test_block_style_variations_with_invalid_properties() {
		wp_set_current_user( static::$administrator_id );

		$partially_invalid_variation = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/button' => array(
						'color'      => array(
							'background' => 'blue',
						),
						'variations' => array(
							'outline' => array(
								'color'   => array(
									'background' => 'purple',
								),
								'invalid' => array(
									'value' => 'should be stripped',
								),
							),
						),
					),
				),
			),
		);

		$expected = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/button' => array(
						'color'      => array(
							'background' => 'blue',
						),
						'variations' => array(
							'outline' => array(
								'color' => array(
									'background' => 'purple',
								),
							),
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Gutenberg::remove_insecure_properties( $partially_invalid_variation );

		$this->assertSameSetsWithIndex( $expected, $actual );
	}

	/**
	 * Tests generating the spacing presets array based on the spacing scale provided.
	 *
	 * @dataProvider data_set_spacing_sizes
	 */
	public function test_set_spacing_sizes( $spacing_scale, $expected_output ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'spacing' => array(
						'spacingScale' => $spacing_scale,
					),
				),
			),
			'default'
		);

		$this->assertSame( $expected_output, _wp_array_get( $theme_json->get_raw_data(), array( 'settings', 'spacing', 'spacingSizes', 'default' ) ) );
	}

	/**
	 * Data provider for spacing scale tests.
	 *
	 * @return array
	 */
	public function data_set_spacing_sizes() {
		return array(
			'only one value when single step in spacing scale' => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '4rem',
					),
				),
			),
			'one step above medium when two steps in spacing scale' => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 2,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '4rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '5.5rem',
					),
				),
			),
			'one step above medium and one below when three steps in spacing scale' => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 3,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Small',
						'slug' => '40',
						'size' => '2.5rem',
					),
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '4rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '5.5rem',
					),
				),
			),
			'extra step added above medium when an even number of steps > 2 specified' => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 4,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Small',
						'slug' => '40',
						'size' => '2.5rem',
					),
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '4rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '5.5rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => '70',
						'size' => '7rem',
					),
				),
			),
			'extra steps above medium if bottom end will go below zero' => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 2.5,
					'steps'      => 5,
					'mediumStep' => 5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'Small',
						'slug' => '40',
						'size' => '2.5rem',
					),
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '5rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '7.5rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => '70',
						'size' => '10rem',
					),
					array(
						'name' => '2X-Large',
						'slug' => '80',
						'size' => '12.5rem',
					),
				),
			),
			'multiplier correctly calculated above and below medium' => array(
				'spacing_scale'   => array(
					'operator'   => '*',
					'increment'  => 1.5,
					'steps'      => 5,
					'mediumStep' => 1.5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'X-Small',
						'slug' => '30',
						'size' => '0.67rem',
					),
					array(
						'name' => 'Small',
						'slug' => '40',
						'size' => '1rem',
					),
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '1.5rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '2.25rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => '70',
						'size' => '3.38rem',
					),
				),
			),
			'increment < 1 combined showing * operator acting as divisor above and below medium' => array(
				'spacing_scale'   => array(
					'operator'   => '*',
					'increment'  => 0.25,
					'steps'      => 5,
					'mediumStep' => 1.5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => 'X-Small',
						'slug' => '30',
						'size' => '0.09rem',
					),
					array(
						'name' => 'Small',
						'slug' => '40',
						'size' => '0.38rem',
					),
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '1.5rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '6rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => '70',
						'size' => '24rem',
					),
				),
			),
			't-shirt sizing used if more than 7 steps in scale' => array(
				'spacing_scale'   => array(
					'operator'   => '*',
					'increment'  => 1.5,
					'steps'      => 8,
					'mediumStep' => 1.5,
					'unit'       => 'rem',
				),
				'expected_output' => array(
					array(
						'name' => '2X-Small',
						'slug' => '20',
						'size' => '0.44rem',
					),
					array(
						'name' => 'X-Small',
						'slug' => '30',
						'size' => '0.67rem',
					),
					array(
						'name' => 'Small',
						'slug' => '40',
						'size' => '1rem',
					),
					array(
						'name' => 'Medium',
						'slug' => '50',
						'size' => '1.5rem',
					),
					array(
						'name' => 'Large',
						'slug' => '60',
						'size' => '2.25rem',
					),
					array(
						'name' => 'X-Large',
						'slug' => '70',
						'size' => '3.38rem',
					),
					array(
						'name' => '2X-Large',
						'slug' => '80',
						'size' => '5.06rem',
					),
					array(
						'name' => '3X-Large',
						'slug' => '90',
						'size' => '7.59rem',
					),
				),
			),
		);
	}

	/**
	 * Tests generating the spacing presets array based on the spacing scale provided.
	 *
	 * @dataProvider data_set_spacing_sizes_when_invalid
	 *
	 * @param array $spacing_scale   Example spacing scale definitions from the data provider.
	 * @param array $expected_output Expected output from data provider.
	 */
	public function test_set_spacing_sizes_when_invalid( $spacing_scale, $expected_output ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'spacing' => array(
						'spacingScale' => $spacing_scale,
					),
				),
			),
			'default'
		);

		$this->assertSame( $expected_output, _wp_array_get( $theme_json->get_raw_data(), array( 'settings', 'spacing', 'spacingSizes', 'default' ) ) );
	}

	/**
	 * Data provider for spacing scale tests.
	 *
	 * @return array
	 */
	public function data_set_spacing_sizes_when_invalid() {
		return array(
			'missing operator value'  => array(
				'spacing_scale'   => array(
					'operator'   => '',
					'increment'  => 1.5,
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(),
			),
			'non numeric increment'   => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 'add two to previous value',
					'steps'      => 1,
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(),
			),
			'non numeric steps'       => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 'spiral staircase preferred',
					'mediumStep' => 4,
					'unit'       => 'rem',
				),
				'expected_output' => array(),
			),
			'non numeric medium step' => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 5,
					'mediumStep' => 'That which is just right',
					'unit'       => 'rem',
				),
				'expected_output' => array(),
			),
			'missing unit value'      => array(
				'spacing_scale'   => array(
					'operator'   => '+',
					'increment'  => 1.5,
					'steps'      => 5,
					'mediumStep' => 4,
				),
				'expected_output' => array(),
			),
		);
	}

	/**
	 * Tests the core separator block outbut based on various provided settings.
	 *
	 * @dataProvider data_update_separator_declarations
	 *
	 * @param array $separator_block_settings Example separator block settings from the data provider.
	 * @param array $expected_output          Expected output from data provider.
	 */
	public function test_update_separator_declarations( $separator_block_settings, $expected_output ) {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/separator' => $separator_block_settings,
					),
				),
			),
			'default'
		);

		$separator_node = array(
			'path'     => array( 'styles', 'blocks', 'core/separator' ),
			'selector' => '.wp-block-separator',
		);
		$this->assertSame( $expected_output, $theme_json->get_styles_for_block( $separator_node ) );
	}

	/**
	 * Data provider for separator declaration tests.
	 *
	 * @return array
	 */
	public function data_update_separator_declarations() {
		return array(
			// If only background is defined, test that includes border-color to the style so it is applied on the front end.
			'only background'                      => array(
				array(
					'color' => array(
						'background' => 'blue',
					),
				),
				'expected_output' => ':root :where(.wp-block-separator){background-color: blue;color: blue;}',
			),
			// If background and text are defined, do not include border-color, as text color is enough.
			'background and text, no border-color' => array(
				array(
					'color' => array(
						'background' => 'blue',
						'text'       => 'red',
					),
				),
				'expected_output' => ':root :where(.wp-block-separator){background-color: blue;color: red;}',
			),
			// If only text is defined, do not include border-color, as by itself is enough.
			'only text'                            => array(
				array(
					'color' => array(
						'text' => 'red',
					),
				),
				'expected_output' => ':root :where(.wp-block-separator){color: red;}',
			),
			// If background, text, and border-color are defined, include everything, CSS specificity will decide which to apply.
			'background, text, and border-color'   => array(
				array(
					'color'  => array(
						'background' => 'blue',
						'text'       => 'red',
					),
					'border' => array(
						'color' => 'pink',
					),
				),
				'expected_output' => ':root :where(.wp-block-separator){background-color: blue;border-color: pink;color: red;}',
			),
			// If background and border color are defined, include everything, CSS specificity will decide which to apply.
			'background, and border-color'         => array(
				array(
					'color'  => array(
						'background' => 'blue',
					),
					'border' => array(
						'color' => 'pink',
					),
				),
				'expected_output' => ':root :where(.wp-block-separator){background-color: blue;border-color: pink;}',
			),
		);
	}

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

		$expected_styles = ':root{--wp--preset--shadow--natural: 5px 5px 5px 0 black;--wp--preset--shadow--sharp: 5px 5px black;}';
		$this->assertSameCSS( $expected_styles, $theme_json->get_stylesheet(), 'Styles returned from "::get_stylesheet()" does not match expectations' );
		$this->assertSameCSS( $expected_styles, $theme_json->get_stylesheet( array( 'variables' ) ), 'Styles returned from "::get_stylesheet()" when requiring "variables" type does not match expectations' );
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

		$variable_styles = ':root{--wp--preset--shadow--natural: 5px 5px 0 0 black;}';
		$element_styles  = 'a:where(:not(.wp-element-button)){box-shadow: var(--wp--preset--shadow--natural);}:root :where(.wp-element-button, .wp-block-button__link){box-shadow: var(--wp--preset--shadow--natural);}:root :where(p){box-shadow: var(--wp--preset--shadow--natural);}';
		$expected_styles = $variable_styles . $element_styles;
		$this->assertSameCSS( $expected_styles, $theme_json->get_stylesheet( array( 'styles', 'presets', 'variables' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	public function test_get_top_level_background_image_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'background' => array(
						'backgroundImage'      => array(
							'url' => 'http://example.org/image.png',
						),
						'backgroundRepeat'     => 'no-repeat',
						'backgroundPosition'   => 'center center',
						'backgroundAttachment' => 'fixed',
					),
				),
			)
		);

		$body_node = array(
			'path'     => array( 'styles' ),
			'selector' => 'body',
		);

		$expected_styles = "html{min-height: calc(100% - var(--wp-admin--admin-bar--height, 0px));}body{background-image: url('http://example.org/image.png');background-position: center center;background-repeat: no-repeat;background-attachment: fixed;}";
		$this->assertSameCSS( $expected_styles, $theme_json->get_styles_for_block( $body_node ), 'Styles returned from "::get_styles_for_block()" with top-level background styles do not match expectations' );

		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'background' => array(
						'backgroundImage'      => "url('http://example.org/image.png')",
						'backgroundSize'       => 'contain',
						'backgroundRepeat'     => 'no-repeat',
						'backgroundPosition'   => 'center center',
						'backgroundAttachment' => 'fixed',
					),
				),
			)
		);

		$expected_styles = "html{min-height: calc(100% - var(--wp-admin--admin-bar--height, 0px));}body{background-image: url('http://example.org/image.png');background-position: center center;background-repeat: no-repeat;background-size: contain;background-attachment: fixed;}";
		$this->assertSameCSS( $expected_styles, $theme_json->get_styles_for_block( $body_node ), 'Styles returned from "::get_styles_for_block()" with top-level background image as string type do not match expectations' );
	}

	public function test_get_block_background_image_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/group' => array(
							'background' => array(
								'backgroundImage'      => "url('http://example.org/group.png')",
								'backgroundRepeat'     => 'no-repeat',
								'backgroundPosition'   => 'center center',
								'backgroundAttachment' => 'fixed',
							),
						),
						'core/quote' => array(
							'background' => array(
								'backgroundImage' => array(
									'url' => 'http://example.org/quote.png',
									'id'  => 321,
								),
								'backgroundSize'  => 'contain',
							),
						),
						'core/verse' => array(
							'background' => array(
								'backgroundImage' => array(
									'url' => 'http://example.org/verse.png',
									'id'  => 123,
								),
							),
						),
					),
				),
			)
		);

		$group_node = array(
			'name'      => 'core/group',
			'path'      => array( 'styles', 'blocks', 'core/group' ),
			'selector'  => '.wp-block-group',
			'selectors' => array(
				'root' => '.wp-block-group',
			),
		);

		$group_styles = ":root :where(.wp-block-group){background-image: url('http://example.org/group.png');background-position: center center;background-repeat: no-repeat;background-attachment: fixed;}";
		$this->assertSameCSS( $group_styles, $theme_json->get_styles_for_block( $group_node ), 'Styles returned from "::get_styles_for_block()" with core/group background styles as string type do not match expectations' );

		$quote_node = array(
			'name'      => 'core/quote',
			'path'      => array( 'styles', 'blocks', 'core/quote' ),
			'selector'  => '.wp-block-quote',
			'selectors' => array(
				'root' => '.wp-block-quote',
			),
		);

		$quote_styles = ":root :where(.wp-block-quote){background-image: url('http://example.org/quote.png');background-position: 50% 50%;background-size: contain;}";
		$this->assertSameCSS( $quote_styles, $theme_json->get_styles_for_block( $quote_node ), 'Styles returned from "::get_styles_for_block()" with core/quote default background styles do not match expectations' );

		$verse_node = array(
			'name'      => 'core/verse',
			'path'      => array( 'styles', 'blocks', 'core/verse' ),
			'selector'  => '.wp-block-verse',
			'selectors' => array(
				'root' => '.wp-block-verse',
			),
		);

		$verse_styles = ":root :where(.wp-block-verse){background-image: url('http://example.org/verse.png');background-size: cover;}";
		$this->assertSameCSS( $verse_styles, $theme_json->get_styles_for_block( $verse_node ), 'Styles returned from "::get_styles_for_block()" with default core/verse background styles as string type do not match expectations' );
	}

	/**
	 * Testing background dynamic properties in theme.json.
	 */
	public function test_get_resolved_background_image_styles() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'background' => array(
						'backgroundImage'      => array(
							'url' => 'http://example.org/top.png',
						),
						'backgroundSize'       => 'contain',
						'backgroundRepeat'     => 'repeat',
						'backgroundPosition'   => '10% 20%',
						'backgroundAttachment' => 'scroll',
					),
					'blocks'     => array(
						'core/group'        => array(
							'background' => array(
								'backgroundImage' => array(
									'id'  => 123,
									'url' => 'http://example.org/group.png',
								),
							),
						),
						'core/post-content' => array(
							'background' => array(
								'backgroundImage'      => array(
									'ref' => 'styles.background.backgroundImage',
								),
								'backgroundSize'       => array(
									'ref' => 'styles.background.backgroundSize',
								),
								'backgroundRepeat'     => array(
									'ref' => 'styles.background.backgroundRepeat',
								),
								'backgroundPosition'   => array(
									'ref' => 'styles.background.backgroundPosition',
								),
								'backgroundAttachment' => array(
									'ref' => 'styles.background.backgroundAttachment',
								),
							),
						),
					),
				),
			)
		);

		$expected = "html{min-height: calc(100% - var(--wp-admin--admin-bar--height, 0px));}body{background-image: url('http://example.org/top.png');background-position: 10% 20%;background-repeat: repeat;background-size: contain;background-attachment: scroll;}:root :where(.wp-block-group){background-image: url('http://example.org/group.png');background-size: cover;}:root :where(.wp-block-post-content){background-image: url('http://example.org/top.png');background-position: 10% 20%;background-repeat: repeat;background-size: contain;background-attachment: scroll;}";
		$this->assertSameCSS( $expected, $theme_json->get_stylesheet( array( 'styles' ), null, array( 'skip_root_layout_styles' => true ) ) );
	}

	/**
	 * Tests that base custom CSS is generated correctly.
	 */
	public function test_get_stylesheet_handles_base_custom_css() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'css' => 'body {color:purple;}',
				),
			)
		);

		$custom_css = 'body {color:purple;}';
		$this->assertSame( $custom_css, $theme_json->get_stylesheet( array( 'custom-css' ) ) );
	}

	/**
	 * Tests that block custom CSS is generated correctly.
	 */
	public function test_get_styles_for_block_handles_block_custom_css() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/paragraph' => array(
							'css' => 'color:red;',
						),
					),
				),
			)
		);

		$paragraph_node = array(
			'name'      => 'core/paragraph',
			'path'      => array( 'styles', 'blocks', 'core/paragraph' ),
			'selector'  => 'p',
			'selectors' => array(
				'root' => 'p',
			),
		);

		$custom_css = ':root :where(p){color:red;}';
		$this->assertSame( $custom_css, $theme_json->get_styles_for_block( $paragraph_node ) );
	}

	/**
	 * Tests that custom CSS is kept for users with correct capabilities and removed for others.
	 *
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

		$this->assertSame( $expected, $reflection->invoke( $theme_json, $input['css'], $input['selector'] ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_process_blocks_custom_css() {
		return array(
			// Simple CSS without any nested selectors.
			'empty css'                    => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => '',
				),
				'expected' => '',
			),
			'no nested selectors'          => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => 'color: red; margin: auto;',
				),
				'expected' => ':root :where(.foo){color: red; margin: auto;}',
			),
			'no root styles'               => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => '&::before{color: red;}',
				),
				'expected' => ':root :where(.foo)::before{color: red;}',
			),
			// CSS with nested selectors.
			'with nested selector'         => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => 'color: red; margin: auto; &.one{color: blue;} & .two{color: green;}',
				),
				'expected' => ':root :where(.foo){color: red; margin: auto;}:root :where(.foo.one){color: blue;}:root :where(.foo .two){color: green;}',
			),
			// CSS with pseudo elements.
			'with pseudo elements'         => array(
				'input'    => array(
					'selector' => '.foo',
					'css'      => 'color: red; margin: auto; &::before{color: blue;} & ::before{color: green;}  &.one::before{color: yellow;} & .two::before{color: purple;}',
				),
				'expected' => ':root :where(.foo){color: red; margin: auto;}:root :where(.foo)::before{color: blue;}:root :where(.foo) ::before{color: green;}:root :where(.foo.one)::before{color: yellow;}:root :where(.foo .two)::before{color: purple;}',
			),
			// CSS with multiple root selectors.
			'with multiple root selectors' => array(
				'input'    => array(
					'selector' => '.foo, .bar',
					'css'      => 'color: red; margin: auto; &.one{color: blue;} & .two{color: green;} &::before{color: yellow;} & ::before{color: purple;}  &.three::before{color: orange;} & .four::before{color: skyblue;}',
				),
				'expected' => ':root :where(.foo, .bar){color: red; margin: auto;}:root :where(.foo.one, .bar.one){color: blue;}:root :where(.foo .two, .bar .two){color: green;}:root :where(.foo, .bar)::before{color: yellow;}:root :where(.foo, .bar) ::before{color: purple;}:root :where(.foo.three, .bar.three)::before{color: orange;}:root :where(.foo .four, .bar .four)::before{color: skyblue;}',
			),
		);
	}

	public function test_internal_syntax_is_converted_to_css_variables() {
		$result = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'color'    => array(
						'background' => 'var:preset|color|primary',
						'text'       => 'var(--wp--preset--color--secondary)',
					),
					'elements' => array(
						'link' => array(
							'color' => array(
								'background' => 'var:preset|color|pri',
								'text'       => 'var(--wp--preset--color--sec)',
							),
						),
					),
					'blocks'   => array(
						'core/post-terms' => array(
							'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--small)' ),
							'color'      => array( 'background' => 'var:preset|color|secondary' ),
						),
						'core/navigation' => array(
							'elements' => array(
								'link' => array(
									'color' => array(
										'background' => 'var:preset|color|p',
										'text'       => 'var(--wp--preset--color--s)',
									),
								),
							),
						),
						'core/quote'      => array(
							'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--d)' ),
							'color'      => array( 'background' => 'var:preset|color|d' ),
							'variations' => array(
								'plain' => array(
									'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--s)' ),
									'color'      => array( 'background' => 'var:preset|color|s' ),
								),
							),
						),
					),
				),
			)
		);
		$styles = $result->get_raw_data()['styles'];

		$this->assertEquals( 'var(--wp--preset--color--primary)', $styles['color']['background'], 'Top level: Assert the originally correct values are still correct.' );
		$this->assertEquals( 'var(--wp--preset--color--secondary)', $styles['color']['text'], 'Top level: Assert the originally correct values are still correct.' );

		$this->assertEquals( 'var(--wp--preset--color--pri)', $styles['elements']['link']['color']['background'], 'Element top level: Assert the originally correct values are still correct.' );
		$this->assertEquals( 'var(--wp--preset--color--sec)', $styles['elements']['link']['color']['text'], 'Element top level: Assert the originally correct values are still correct.' );

		$this->assertEquals( 'var(--wp--preset--font-size--small)', $styles['blocks']['core/post-terms']['typography']['fontSize'], 'Top block level: Assert the originally correct values are still correct.' );
		$this->assertEquals( 'var(--wp--preset--color--secondary)', $styles['blocks']['core/post-terms']['color']['background'], 'Top block level: Assert the internal variables are convert to CSS custom variables.' );

		$this->assertEquals( 'var(--wp--preset--color--p)', $styles['blocks']['core/navigation']['elements']['link']['color']['background'], 'Elements block level: Assert the originally correct values are still correct.' );
		$this->assertEquals( 'var(--wp--preset--color--s)', $styles['blocks']['core/navigation']['elements']['link']['color']['text'], 'Elements block level: Assert the originally correct values are still correct.' );

		$this->assertEquals( 'var(--wp--preset--font-size--s)', $styles['blocks']['core/quote']['variations']['plain']['typography']['fontSize'], 'Style variations: Assert the originally correct values are still correct.' );
		$this->assertEquals( 'var(--wp--preset--color--s)', $styles['blocks']['core/quote']['variations']['plain']['color']['background'], 'Style variations: Assert the internal variables are convert to CSS custom variables.' );
	}

	/*
	 * Tests that the theme.json file is correctly parsed and the variables are resolved.
	 *
	 * @ticket 58588
	 *
	 * @covers WP_Theme_JSON_Gutenberg::resolve_variables
	 * @covers WP_Theme_JSON_Gutenberg::convert_variables_to_value
	 */
	public function test_resolve_variables() {
		$primary_color   = '#9DFF20';
		$secondary_color = '#9DFF21';
		$contrast_color  = '#000';
		$raw_color_value = '#efefef';
		$large_font      = '18px';
		$small_font      = '12px';
		$spacing         = 'clamp(1.5rem, 5vw, 2rem)';
		$theme_json      = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'color'      => array(
						'palette' => array(
							'theme' => array(
								array(
									'color' => $primary_color,
									'name'  => 'Primary',
									'slug'  => 'primary',
								),
								array(
									'color' => $secondary_color,
									'name'  => 'Secondary',
									'slug'  => 'secondary',
								),
								array(
									'color' => $contrast_color,
									'name'  => 'Contrast',
									'slug'  => 'contrast',
								),
							),
						),
					),
					'typography' => array(
						'fontSizes' => array(
							array(
								'size' => $small_font,
								'name' => 'Font size small',
								'slug' => 'small',
							),
							array(
								'size' => $large_font,
								'name' => 'Font size large',
								'slug' => 'large',
							),
						),
					),
					'spacing'    => array(
						'spacingSizes' => array(
							array(
								'size' => $spacing,
								'name' => '100',
								'slug' => '100',
							),
						),
					),
				),
				'styles'   => array(
					'color'    => array(
						'background' => 'var(--wp--preset--color--primary)',
						'text'       => $raw_color_value,
					),
					'elements' => array(
						'button' => array(
							'color'      => array(
								'text' => 'var(--wp--preset--color--contrast)',
							),
							'typography' => array(
								'fontSize' => 'var(--wp--preset--font-size--small)',
							),
						),
					),
					'blocks'   => array(
						'core/post-terms'      => array(
							'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--small)' ),
							'color'      => array( 'background' => $raw_color_value ),
						),
						'core/more'            => array(
							'typography' => array( 'fontSize' => 'var(--undefined--font-size--small)' ),
							'color'      => array( 'background' => 'linear-gradient(90deg, var(--wp--preset--color--primary) 0%, var(--wp--preset--color--secondary) 35%, var(--wp--undefined--color--secondary) 100%)' ),
						),
						'core/comment-content' => array(
							'typography' => array( 'fontSize' => 'calc(var(--wp--preset--font-size--small, 12px) + 20px)' ),
							'color'      => array(
								'text'       => 'var(--wp--preset--color--primary, red)',
								'background' => 'var(--wp--preset--color--primary, var(--wp--preset--font-size--secondary))',
								'link'       => 'var(--undefined--color--primary, var(--wp--preset--font-size--secondary))',
							),
						),
						'core/comments'        => array(
							'color' => array(
								'text'       => 'var(--undefined--color--primary, var(--wp--preset--font-size--small))',
								'background' => 'var(--wp--preset--color--primary, var(--undefined--color--primary))',
							),
						),
						'core/navigation'      => array(
							'elements' => array(
								'link' => array(
									'color'      => array(
										'background' => 'var(--wp--preset--color--primary)',
										'text'       => 'var(--wp--preset--color--secondary)',
									),
									'typography' => array(
										'fontSize' => 'var(--wp--preset--font-size--large)',
									),
								),
							),
						),
						'core/quote'           => array(
							'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--large)' ),
							'color'      => array( 'background' => 'var(--wp--preset--color--primary)' ),
							'variations' => array(
								'plain' => array(
									'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--small)' ),
									'color'      => array( 'background' => 'var(--wp--preset--color--secondary)' ),
								),
							),
						),
						'core/post-template'   => array(
							'spacing' => array(
								'blockGap' => null,
							),
						),
						'core/columns'         => array(
							'spacing' => array(
								'blockGap' => 'var(--wp--preset--spacing--100)',
							),
						),
					),
				),
			)
		);

		$styles = $theme_json::resolve_variables( $theme_json )->get_raw_data()['styles'];

		$this->assertEquals( $primary_color, $styles['color']['background'], 'Top level: Assert values are converted' );
		$this->assertEquals( $raw_color_value, $styles['color']['text'], 'Top level: Assert raw values stay intact' );

		$this->assertEquals( $contrast_color, $styles['elements']['button']['color']['text'], 'Elements: color' );
		$this->assertEquals( $small_font, $styles['elements']['button']['typography']['fontSize'], 'Elements: font-size' );

		$this->assertEquals( $large_font, $styles['blocks']['core/quote']['typography']['fontSize'], 'Blocks: font-size' );
		$this->assertEquals( $primary_color, $styles['blocks']['core/quote']['color']['background'], 'Blocks: color' );
		$this->assertEquals( $raw_color_value, $styles['blocks']['core/post-terms']['color']['background'], 'Blocks: Raw color value stays intact' );
		$this->assertEquals( $small_font, $styles['blocks']['core/post-terms']['typography']['fontSize'], 'Block core/post-terms: font-size' );
		$this->assertEquals(
			"linear-gradient(90deg, $primary_color 0%, $secondary_color 35%, var(--wp--undefined--color--secondary) 100%)",
			$styles['blocks']['core/more']['color']['background'],
			'Blocks: multiple colors and undefined color'
		);
		$this->assertEquals( 'var(--undefined--font-size--small)', $styles['blocks']['core/more']['typography']['fontSize'], 'Blocks: undefined font-size ' );
		$this->assertEquals( "calc($small_font + 20px)", $styles['blocks']['core/comment-content']['typography']['fontSize'], 'Blocks: font-size in random place' );
		$this->assertEquals( $primary_color, $styles['blocks']['core/comment-content']['color']['text'], 'Blocks: text color with fallback' );
		$this->assertEquals( $primary_color, $styles['blocks']['core/comment-content']['color']['background'], 'Blocks: background color with var as fallback' );
		$this->assertEquals( $primary_color, $styles['blocks']['core/navigation']['elements']['link']['color']['background'], 'Block element: background color' );
		$this->assertEquals( $secondary_color, $styles['blocks']['core/navigation']['elements']['link']['color']['text'], 'Block element: text color' );
		$this->assertEquals( $large_font, $styles['blocks']['core/navigation']['elements']['link']['typography']['fontSize'], 'Block element: font-size' );

		$this->assertEquals(
			"var(--undefined--color--primary, $small_font)",
			$styles['blocks']['core/comments']['color']['text'],
			'Blocks: text color with undefined var and fallback'
		);
		$this->assertEquals(
			$primary_color,
			$styles['blocks']['core/comments']['color']['background'],
			'Blocks: background color with variable and undefined fallback'
		);

		$this->assertEquals( $small_font, $styles['blocks']['core/quote']['variations']['plain']['typography']['fontSize'], 'Block variations: font-size' );
		$this->assertEquals( $secondary_color, $styles['blocks']['core/quote']['variations']['plain']['color']['background'], 'Block variations: color' );
		/*
		 * WP_Theme_JSON_Gutenberg::resolve_variables may be called with merged data from WP_Theme_JSON_Resolver_Gutenberg::get_merged_data()
		 * WP_Theme_JSON_Resolver_Gutenberg::get_block_data() sets blockGap for supported blocks to `null` if the value is not defined.
		 */
		$this->assertNull( $styles['blocks']['core/post-template']['spacing']['blockGap'], 'core/post-template block: blockGap' );
		$this->assertEquals( $spacing, $styles['blocks']['core/columns']['spacing']['blockGap'], 'core/columns block: blockGap' );
	}

	/**
	 * Tests the correct application of a block style variation's selector to
	 * a block's selector.
	 *
	 * @dataProvider data_get_block_style_variation_selector
	 *
	 * @param string $selector  CSS selector.
	 * @param string $expected  Expected block style variation CSS selector.
	 */
	public function test_get_block_style_variation_selector( $selector, $expected ) {
		$theme_json = new ReflectionClass( 'WP_Theme_JSON_Gutenberg' );

		$func = $theme_json->getMethod( 'get_block_style_variation_selector' );
		$func->setAccessible( true );

		$actual = $func->invoke( null, 'custom', $selector );

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Data provider for generating block style variation selectors.
	 *
	 * @return array[]
	 */
	public function data_get_block_style_variation_selector() {
		return array(
			'empty block selector'     => array(
				'selector' => '',
				'expected' => '.is-style-custom',
			),
			'class selector'           => array(
				'selector' => '.wp-block',
				'expected' => '.wp-block.is-style-custom',
			),
			'id selector'              => array(
				'selector' => '#wp-block',
				'expected' => '#wp-block.is-style-custom',
			),
			'element tag selector'     => array(
				'selector' => 'p',
				'expected' => 'p.is-style-custom',
			),
			'attribute selector'       => array(
				'selector' => '[style*="color"]',
				'expected' => '[style*="color"].is-style-custom',
			),
			'descendant selector'      => array(
				'selector' => '.wp-block .inner',
				'expected' => '.wp-block.is-style-custom .inner',
			),
			'comma separated selector' => array(
				'selector' => '.wp-block .inner, .wp-block .alternative',
				'expected' => '.wp-block.is-style-custom .inner, .wp-block.is-style-custom .alternative',
			),
			'pseudo selector'          => array(
				'selector' => 'div:first-child',
				'expected' => 'div.is-style-custom:first-child',
			),
			':is selector'             => array(
				'selector' => '.wp-block:is(.outer .inner:first-child)',
				'expected' => '.wp-block.is-style-custom:is(.outer .inner:first-child)',
			),
			':not selector'            => array(
				'selector' => '.wp-block:not(.outer .inner:first-child)',
				'expected' => '.wp-block.is-style-custom:not(.outer .inner:first-child)',
			),
			':has selector'            => array(
				'selector' => '.wp-block:has(.outer .inner:first-child)',
				'expected' => '.wp-block.is-style-custom:has(.outer .inner:first-child)',
			),
			':where selector'          => array(
				'selector' => '.wp-block:where(.outer .inner:first-child)',
				'expected' => '.wp-block.is-style-custom:where(.outer .inner:first-child)',
			),
			'wrapping :where selector' => array(
				'selector' => ':where(.outer .inner:first-child)',
				'expected' => ':where(.outer.is-style-custom .inner:first-child)',
			),
			'complex'                  => array(
				'selector' => '.wp:where(.something):is(.test:not(.nothing p)):has(div[style]) .content, .wp:where(.nothing):not(.test:is(.something div)):has(span[style]) .inner',
				'expected' => '.wp.is-style-custom:where(.something):is(.test:not(.nothing p)):has(div[style]) .content, .wp.is-style-custom:where(.nothing):not(.test:is(.something div)):has(span[style]) .inner',
			),
		);
	}

	/**
	 * Tests the correct scoping of selectors for a style node.
	 */
	public function test_scope_style_node_selectors() {
		$theme_json = new ReflectionClass( 'WP_Theme_JSON_Gutenberg' );

		$func = $theme_json->getMethod( 'scope_style_node_selectors' );
		$func->setAccessible( true );

		$node = array(
			'name'      => 'core/image',
			'path'      => array( 'styles', 'blocks', 'core/image' ),
			'selector'  => '.wp-block-image',
			'selectors' => array(
				'root'       => '.wp-block-image',
				'border'     => '.wp-block-image img, .wp-block-image .wp-block-image__crop-area, .wp-block-image .components-placeholder',
				'typography' => array(
					'textDecoration' => '.wp-block-image caption',
				),
				'filter'     => array(
					'duotone' => '.wp-block-image img, .wp-block-image .components-placeholder',
				),
			),
		);

		$actual   = $func->invoke( null, '.custom-scope', $node );
		$expected = array(
			'name'      => 'core/image',
			'path'      => array( 'styles', 'blocks', 'core/image' ),
			'selector'  => '.custom-scope .wp-block-image',
			'selectors' => array(
				'root'       => '.custom-scope .wp-block-image',
				'border'     => '.custom-scope .wp-block-image img, .custom-scope .wp-block-image .wp-block-image__crop-area, .custom-scope .wp-block-image .components-placeholder',
				'typography' => array(
					'textDecoration' => '.custom-scope .wp-block-image caption',
				),
				'filter'     => array(
					'duotone' => '.custom-scope .wp-block-image img, .custom-scope .wp-block-image .components-placeholder',
				),
			),
		);

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Block style variations styles aren't generated by default. This test covers
	 * the `get_block_nodes` does not include variations by default, preventing
	 * the inclusion of their styles.
	 */
	public function test_opt_out_of_block_style_variations_by_default() {
		$theme_json = new ReflectionClass( 'WP_Theme_JSON_Gutenberg' );

		$func = $theme_json->getMethod( 'get_block_nodes' );
		$func->setAccessible( true );

		$theme_json = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/button' => array(
						'variations' => array(
							'outline' => array(
								'color' => array(
									'background' => 'red',
								),
							),
						),
					),
				),
			),
		);
		$selectors  = array();

		$block_nodes       = $func->invoke( null, $theme_json, $selectors );
		$button_variations = $block_nodes[0]['variations'] ?? array();

		$this->assertEquals( array(), $button_variations );
	}

	/**
	 * Block style variations styles aren't generated by default. This test ensures
	 * variations are included by `get_block_nodes` when requested.
	 */
	public function test_opt_in_to_block_style_variations() {
		$theme_json = new ReflectionClass( 'WP_Theme_JSON_Gutenberg' );

		$func = $theme_json->getMethod( 'get_block_nodes' );
		$func->setAccessible( true );

		$theme_json = array(
			'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'styles'  => array(
				'blocks' => array(
					'core/button' => array(
						'variations' => array(
							'outline' => array(
								'color' => array(
									'background' => 'red',
								),
							),
						),
					),
				),
			),
		);
		$selectors  = array();
		$options    = array( 'include_block_style_variations' => true );

		$block_nodes       = $func->invoke( null, $theme_json, $selectors, $options );
		$button_variations = $block_nodes[0]['variations'] ?? array();

		$expected = array(
			array(
				'path'     => array( 'styles', 'blocks', 'core/button', 'variations', 'outline' ),
				'selector' => '.wp-block-button.is-style-outline .wp-block-button__link',
			),
		);

		$this->assertEquals( $expected, $button_variations );
	}
}
