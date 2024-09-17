<?php
/**
 * Tests the typography block supports.
 *
 * @package Gutenberg
 */
class WP_Block_Supports_Typography_Test extends WP_UnitTestCase {
	/**
	 * Stores the current test block name.
	 *
	 * @var string|null
	 */
	private $test_block_name;

	/**
	 * Stores the current test theme root.
	 *
	 * @var string|null
	 */
	private $theme_root;

	/**
	 * Caches the original theme directory global value in order
	 * to restore it in tear down.
	 *
	 * @var string|null
	 */
	private $orig_theme_dir;

	/**
	 * Sets up tests.
	 */
	public function set_up() {
		parent::set_up();

		$this->test_block_name = null;

		// Sets up the `wp-content/themes/` directory to ensure consistency when running tests.
		$this->theme_root                = realpath( __DIR__ . '/../data/themedir1' );
		$this->orig_theme_dir            = $GLOBALS['wp_theme_directories'];
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		$theme_root_callback = function () {
			return $this->theme_root;
		};
		add_filter( 'theme_root', $theme_root_callback );
		add_filter( 'stylesheet_root', $theme_root_callback );
		add_filter( 'template_root', $theme_root_callback );

		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	/**
	 * Tears down tests.
	 */
	public function tear_down() {
		// Restores the original theme directory setup.
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		// Resets test block name.
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;

		parent::tear_down();
	}

	/**
	 * Tests whether slugs with numbers are kebab cased.
	 *
	 * @covers ::wp_apply_typography_support
	 */
	public function test_should_kebab_case_font_size_slug_with_numbers() {
		$this->test_block_name = 'test/font-size-slug-with-numbers';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'fontSize' => array(
						'type' => 'string',
					),
				),
				'supports'    => array(
					'typography' => array(
						'fontSize' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );

		$block_atts = array( 'fontSize' => 'h1' );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-h-1-font-size' );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests legacy inline styles for font family.
	 *
	 * @covers ::wp_apply_typography_support
	 */
	public function test_should_generate_font_family_with_legacy_inline_styles_using_a_value() {
		$this->test_block_name = 'test/font-family-with-inline-styles-using-value';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'fontFamily' => 'serif' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'style' => 'font-family:serif;' );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests skipping serialization.
	 *
	 * @covers ::wp_apply_typography_support
	 */
	public function test_should_skip_serialization_for_typography_block_supports() {
		$this->test_block_name = 'test/typography-with-skipped-serialization-block-supports';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'fontSize'                        => true,
						'lineHeight'                      => true,
						'__experimentalFontFamily'        => true,
						'__experimentalLetterSpacing'     => true,
						'__experimentalSkipSerialization' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'typography' => array(
					'fontSize'      => 'serif',
					'lineHeight'    => 'serif',
					'fontFamily'    => '22px',
					'letterSpacing' => '22px',
				),
			),
		);

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests skipping serialization of individual block supports properties.
	 *
	 * @covers ::wp_apply_typography_support
	 */
	public function test_should_skip_serialization_for_letter_spacing_block_supports() {
		$this->test_block_name = 'test/letter-spacing-with-individual-skipped-serialization-block-supports';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalLetterSpacing'     => true,
						'__experimentalSkipSerialization' => array(
							'letterSpacing',
						),
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'letterSpacing' => '22px' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests legacy css var inline styles for font family.
	 *
	 * @covers ::wp_apply_typography_support
	 */
	public function test_should_generate_css_var_for_font_family_with_legacy_inline_styles() {
		$this->test_block_name = 'test/font-family-with-inline-styles-using-css-var';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'fontFamily' => 'var:preset|font-family|h1' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'style' => 'font-family:var(--wp--preset--font-family--h-1);' );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that a classname is generated for font family.
	 *
	 * @covers ::wp_apply_typography_support
	 */
	public function test_should_generate_classname_for_font_family() {
		$this->test_block_name = 'test/font-family-with-class';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'fontFamily' => 'h1' );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-h-1-font-family' );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests generating font size values, including fluid formulae, from fontSizes preset.
	 *
	 * @covers ::wp_get_typography_font_size_value
	 * @covers ::wp_get_typography_value_and_unit
	 * @covers ::wp_get_computed_fluid_typography_value
	 *
	 * @dataProvider data_generate_font_size_preset_fixtures
	 *
	 * @param array  $font_size                     {
	 *     Required. A font size as represented in the fontSizes preset format as seen in theme.json.
	 *
	 *     @type string $name Name of the font size preset.
	 *     @type string $slug Kebab-case unique identifier for the font size preset.
	 *     @type string $size CSS font-size value, including units where applicable.
	 * }
	 * @param bool   $settings        Theme JSON settings array that overrides any global theme settings.
	 * @param string $expected_output Expected output of gutenberg_get_typography_font_size_value().
	 */
	public function test_gutenberg_get_typography_font_size_value( $font_size, $settings, $expected_output ) {
		$actual = gutenberg_get_typography_font_size_value( $font_size, $settings );

		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider for test_wp_get_typography_font_size_value.
	 *
	 * @return array
	 */
	public function data_generate_font_size_preset_fixtures() {
		return array(
			'returns value when fluid typography is deactivated' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => null,
				'expected_output' => '28px',
			),

			'returns value where font size is 0'         => array(
				'font_size'       => array(
					'size' => 0,
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 0,
			),

			"returns value where font size is '0'"       => array(
				'font_size'       => array(
					'size' => '0',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '0',
			),

			'returns value where `size` is `null`'       => array(
				'font_size'       => array(
					'size' => null,
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => null,
			),

			'returns value when fluid is `false`'        => array(
				'font_size'       => array(
					'size'  => '28px',
					'fluid' => false,
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => false,
					),
				),
				'expected_output' => '28px',
			),

			'returns value when fluid is empty array'    => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => array(),
					),
				),
				'expected_output' => '28px',
			),

			'returns clamp value with minViewportWidth override' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => array(
							'minViewportWidth' => '500px',
						),
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 5px) * 0.918), 28px)',
			),

			'returns clamp value with maxViewportWidth override' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => array(
							'maxViewportWidth' => '500px',
						),
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 5.608), 28px)',
			),

			'returns clamp value with layout.wideSize override' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
					'layout'     => array(
						'wideSize' => '500px',
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 5.608), 28px)',
			),

			'returns already clamped value'              => array(
				'font_size'       => array(
					'size' => 'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
			),

			'returns value with unsupported unit'        => array(
				'font_size'       => array(
					'size' => '1000%',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '1000%',
			),

			'returns clamp value with rem min and max units' => array(
				'font_size'       => array(
					'size' => '1.75rem',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(1.119rem, 1.119rem + ((1vw - 0.2rem) * 0.789), 1.75rem)',
			),

			'returns clamp value with em min and max units' => array(
				'font_size'       => array(
					'size' => '1.75em',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(1.119em, 1.119rem + ((1vw - 0.2em) * 0.789), 1.75em)',
			),

			'returns clamp value for floats'             => array(
				'font_size'       => array(
					'size' => '70.175px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(37.897px, 2.369rem + ((1vw - 3.2px) * 2.522), 70.175px)',
			),

			'coerces integer to `px` and returns clamp value' => array(
				'font_size'       => array(
					'size' => 33,
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(20.515px, 1.282rem + ((1vw - 3.2px) * 0.975), 33px)',
			),

			'coerces float to `px` and returns clamp value' => array(
				'font_size'       => array(
					'size' => 70.175,
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(37.897px, 2.369rem + ((1vw - 3.2px) * 2.522), 70.175px)',
			),

			'returns clamp value when `fluid` is empty array' => array(
				'font_size'       => array(
					'size'  => '28px',
					'fluid' => array(),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)',
			),

			'returns clamp value when `fluid` is `null`' => array(
				'font_size'       => array(
					'size'  => '28px',
					'fluid' => null,
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)',
			),

			'returns clamp value where min and max fluid values defined' => array(
				'font_size'       => array(
					'size'  => '80px',
					'fluid' => array(
						'min' => '70px',
						'max' => '125px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(70px, 4.375rem + ((1vw - 3.2px) * 4.297), 125px)',
			),

			'returns clamp value where max is equal to size' => array(
				'font_size'       => array(
					'size'  => '7.8125rem',
					'fluid' => array(
						'min' => '4.375rem',
						'max' => '7.8125rem',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(4.375rem, 4.375rem + ((1vw - 0.2rem) * 4.298), 7.8125rem)',
			),

			'returns clamp value if min font size is greater than max' => array(
				'font_size'       => array(
					'size'  => '3rem',
					'fluid' => array(
						'min' => '5rem',
						'max' => '32px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(5rem, 5rem + ((1vw - 0.2rem) * -3.75), 32px)',
			),

			'returns value with invalid min/max fluid units' => array(
				'font_size'       => array(
					'size'  => '10em',
					'fluid' => array(
						'min' => '20vw',
						'max' => '50%',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '10em',
			),

			'returns value when size is < lower bounds and no fluid min/max set' => array(
				'font_size'       => array(
					'size' => '3px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '3px',
			),

			'returns value when size is equal to lower bounds and no fluid min/max set' => array(
				'font_size'       => array(
					'size' => '14px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '14px',
			),

			'returns clamp value with different min max units' => array(
				'font_size'       => array(
					'size'  => '28px',
					'fluid' => array(
						'min' => '20px',
						'max' => '50rem',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(20px, 1.25rem + ((1vw - 3.2px) * 60.938), 50rem)',
			),

			'returns clamp value where no fluid max size is set' => array(
				'font_size'       => array(
					'size'  => '50px',
					'fluid' => array(
						'min' => '2.6rem',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(2.6rem, 2.6rem + ((1vw - 0.2rem) * 0.656), 50px)',
			),

			'returns clamp value where no fluid min size is set' => array(
				'font_size'       => array(
					'size'  => '28px',
					'fluid' => array(
						'max' => '80px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 4.851), 80px)',
			),

			'should not apply lower bound test when fluid values are set' => array(
				'font_size'       => array(
					'size'  => '1.5rem',
					'fluid' => array(
						'min' => '0.5rem',
						'max' => '5rem',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(0.5rem, 0.5rem + ((1vw - 0.2rem) * 5.625), 5rem)',
			),

			'should not apply lower bound test when only fluid min is set' => array(
				'font_size'       => array(
					'size'  => '20px',
					'fluid' => array(
						'min' => '12px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(12px, 0.75rem + ((1vw - 3.2px) * 0.625), 20px)',
			),

			'should not apply lower bound test when only fluid max is set' => array(
				'font_size'       => array(
					'size'  => '0.875rem',
					'fluid' => array(
						'max' => '20rem',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(0.875rem, 0.875rem + ((1vw - 0.2rem) * 23.906), 20rem)',
			),

			'returns clamp value when min and max font sizes are equal' => array(
				'font_size'       => array(
					'size'  => '4rem',
					'fluid' => array(
						'min' => '30px',
						'max' => '30px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(30px, 1.875rem + ((1vw - 3.2px) * 1), 30px)',
			),

			'should apply scaled min font size for em values when custom min font size is not set' => array(
				'font_size'       => array(
					'size' => '12rem',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(5.174rem, 5.174rem + ((1vw - 0.2rem) * 8.533), 12rem)',
			),

			'should apply scaled min font size for px values when custom min font size is not set' => array(
				'font_size'       => array(
					'size' => '200px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(85.342px, 5.334rem + ((1vw - 3.2px) * 8.958), 200px)',
			),

			'should not apply scaled min font size for minimum font size when custom min font size is set' => array(
				'font_size'       => array(
					'size'  => '200px',
					'fluid' => array(
						'min' => '100px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => true,
					),
				),
				'expected_output' => 'clamp(100px, 6.25rem + ((1vw - 3.2px) * 7.813), 200px)',
			),

			// Individual preset settings override global settings.
			'should convert individual preset size to fluid if fluid is disabled in global settings' => array(
				'font_size'       => array(
					'size'  => '17px',
					'fluid' => true,
				),
				'settings'        => array(
					'typography' => array(),
				),
				'expected_output' => 'clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.234), 17px)',
			),
			'should use individual preset settings if fluid is disabled in global settings' => array(
				'font_size'       => array(
					'size'  => '17px',
					'fluid' => array(
						'min' => '16px',
						'max' => '26px',
					),
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => false,
					),
				),
				'expected_output' => 'clamp(16px, 1rem + ((1vw - 3.2px) * 0.781), 26px)',
			),
		);
	}

	/**
	 * Tests backwards compatibility for deprecated second argument $should_use_fluid_typography.
	 *
	 * @covers ::wp_get_typography_font_size_value
	 *
	 * @expectedDeprecated gutenberg_get_typography_font_size_value
	 *
	 * @dataProvider data_generate_font_size_preset_should_use_fluid_typography_deprecated_fixtures
	 *
	 * @param array  $font_size                     {
	 *     Required. A font size as represented in the fontSizes preset format as seen in theme.json.
	 *
	 *     @type string $name Name of the font size preset.
	 *     @type string $slug Kebab-case unique identifier for the font size preset.
	 *     @type string $size CSS font-size value, including units where applicable.
	 * }
	 * @param bool   $should_use_fluid_typography An override to switch fluid typography "on". Can be used for unit testing.
	 * @param string $expected_output Expected output of gutenberg_get_typography_font_size_value().
	 */
	public function test_gutenberg_get_typography_font_size_value_should_use_fluid_typography_deprecated( $font_size, $should_use_fluid_typography, $expected_output ) {
		$actual = gutenberg_get_typography_font_size_value( $font_size, $should_use_fluid_typography );

		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider for test_wp_get_typography_font_size_value_should_use_fluid_typography_deprecated.
	 *
	 * @return array
	 */
	public function data_generate_font_size_preset_should_use_fluid_typography_deprecated_fixtures() {
		return array(
			'returns value when fluid typography is deactivated' => array(
				'font_size'                   => array(
					'size' => '28px',
				),
				'should_use_fluid_typography' => false,
				'expected_output'             => '28px',
			),
			'returns clamp value when fluid typography is activated' => array(
				'font_size'                   => array(
					'size' => '28px',
				),
				'should_use_fluid_typography' => true,
				'expected_output'             => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)',
			),
		);
	}

	/**
	 * Tests that theme json settings passed to gutenberg_get_typography_font_size_value
	 * override global theme settings.
	 *
	 * @covers ::gutenberg_get_typography_font_size_value
	 *
	 * @dataProvider data_generate_should_override_theme_settings_fixtures
	 *
	 * @param array  $font_size                     {
	 *     Required. A font size as represented in the fontSizes preset format as seen in theme.json.
	 *
	 *     @type string $name Name of the font size preset.
	 *     @type string $slug Kebab-case unique identifier for the font size preset.
	 *     @type string $size CSS font-size value, including units where applicable.
	 * }
	 * @param bool   $settings        Theme JSON settings array that overrides any global theme settings.
	 * @param string $expected_output Expected output of gutenberg_get_typography_font_size_value().
	 */
	public function test_should_override_theme_settings( $font_size, $settings, $expected_output ) {
		switch_theme( 'block-theme-child-with-fluid-typography' );
		$actual = gutenberg_get_typography_font_size_value( $font_size, $settings );

		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider for test_wp_get_typography_font_size_value_should_use_fluid_typography_deprecated.
	 *
	 * @return array
	 */
	public function data_generate_should_override_theme_settings_fixtures() {
		return array(
			'returns clamp value when theme activates fluid typography' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => null,
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)',
			),
			'returns value when settings argument deactivates fluid typography' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => false,
					),
				),
				'expected_output' => '28px',
			),

			'returns clamp value when settings argument sets a fluid.minViewportWidth value' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => array(
							'minViewportWidth' => '500px',
						),
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 5px) * 0.918), 28px)',
			),

			'returns clamp value when settings argument sets a layout.wideSize value' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'layout' => array(
						'wideSize' => '500px',
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 5.608), 28px)',
			),

			'returns clamp value with maxViewportWidth preferred over fallback layout.wideSize value' => array(
				'font_size'       => array(
					'size' => '28px',
				),
				'settings'        => array(
					'typography' => array(
						'fluid' => array(
							'maxViewportWidth' => '1000px',
						),
					),
					'layout'     => array(
						'wideSize' => '500px',
					),
				),
				'expected_output' => 'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 1.485), 28px)',
			),
		);
	}

	/**
	 * Tests that custom font sizes are converted to fluid values
	 * in inline block supports styles,
	 * when "settings.typography.fluid" is set to `true` or contains configured values.
	 *
	 * @covers ::gutenberg_register_typography_support
	 *
	 * @dataProvider data_generate_block_supports_font_size_fixtures
	 *
	 * @param string $font_size_value The block supports custom font size value.
	 * @param string $theme_slug      A theme slug corresponding to an available test theme.
	 * @param string $expected_output Expected value of style property from gutenberg_apply_typography_support().
	 */
	public function test_should_covert_font_sizes_to_fluid_values( $font_size_value, $theme_slug, $expected_output ) {
		switch_theme( $theme_slug );

		$this->test_block_name = 'test/font-size-fluid-value';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'fontSize' => true,
					),
				),
			)
		);
		$registry         = WP_Block_Type_Registry::get_instance();
		$block_type       = $registry->get_registered( $this->test_block_name );
		$block_attributes = array(
			'style' => array(
				'typography' => array(
					'fontSize' => $font_size_value,
				),
			),
		);

		$actual   = gutenberg_apply_typography_support( $block_type, $block_attributes );
		$expected = array( 'style' => $expected_output );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider for test_should_covert_font_sizes_to_fluid_values.
	 *
	 * @return array
	 */
	public function data_generate_block_supports_font_size_fixtures() {
		return array(
			'returns value when fluid typography is not active' => array(
				'font_size_value' => '15px',
				'theme_slug'      => 'default',
				'expected_output' => 'font-size:15px;',
			),
			'returns clamp value using default config' => array(
				'font_size_value' => '15px',
				'theme_slug'      => 'block-theme-child-with-fluid-typography',
				'expected_output' => 'font-size:clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.078), 15px);',
			),
			'returns value when font size <= default min font size bound' => array(
				'font_size_value' => '13px',
				'theme_slug'      => 'block-theme-child-with-fluid-typography',
				'expected_output' => 'font-size:13px;',
			),
			'returns clamp value using custom fluid config' => array(
				'font_size_value' => '17px',
				'theme_slug'      => 'block-theme-child-with-fluid-typography-config',
				'expected_output' => 'font-size:clamp(16px, 1rem + ((1vw - 6.4px) * 0.179), 17px);',
			),
			'returns value when font size <= custom min font size bound' => array(
				'font_size_value' => '15px',
				'theme_slug'      => 'block-theme-child-with-fluid-typography-config',
				'expected_output' => 'font-size:15px;',
			),
			'returns clamp value using default config if layout is fluid' => array(
				'font_size_value' => '15px',
				'theme_slug'      => 'block-theme-child-with-fluid-layout',
				'expected_output' => 'font-size:clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.078), 15px);',
			),
		);
	}

	/**
	 * Tests that a block element's custom font size in the inline style attribute
	 * is replaced with a fluid value when "settings.typography.fluid" is set to `true`,
	 * and the correct block content is generated.
	 *
	 * @covers ::gutenberg_render_typography_support
	 *
	 * @dataProvider data_generate_replace_inline_font_styles_with_fluid_values_fixtures
	 *
	 * @param string $block_content               HTML block content.
	 * @param string $font_size_value             The block supports custom font size value.
	 * @param bool   $should_use_fluid_typography An override to switch fluid typography "on". Can be used for unit testing.
	 * @param string $expected_output             Expected value of style property from gutenberg_apply_typography_support().
	 */
	public function test_should_replace_inline_font_styles_with_fluid_values( $block_content, $font_size_value, $should_use_fluid_typography, $expected_output ) {
		if ( $should_use_fluid_typography ) {
			switch_theme( 'block-theme-child-with-fluid-typography' );
		} else {
			switch_theme( 'default' );
		}

		$block  = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'style' => array(
					'typography' => array(
						'fontSize' => $font_size_value,
					),
				),
			),
		);
		$actual = gutenberg_render_typography_support( $block_content, $block );

		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider for test_should_replace_inline_font_styles_with_fluid_values.
	 *
	 * @return array
	 */
	public function data_generate_replace_inline_font_styles_with_fluid_values_fixtures() {
		return array(
			'default_return_content'                       => array(
				'block_content'               => '<h2 class="has-vivid-red-background-color has-background has-link-color" style="margin-top:var(--wp--preset--spacing--60);font-size:4rem;font-style:normal;font-weight:600;letter-spacing:29px;text-decoration:underline;text-transform:capitalize">This is a heading</h2>',
				'font_size_value'             => '4rem',
				'should_use_fluid_typography' => false,
				'expected_output'             => '<h2 class="has-vivid-red-background-color has-background has-link-color" style="margin-top:var(--wp--preset--spacing--60);font-size:4rem;font-style:normal;font-weight:600;letter-spacing:29px;text-decoration:underline;text-transform:capitalize">This is a heading</h2>',
			),
			'return_content_with_replaced_fluid_font_size_inline_style' => array(
				'block_content'               => '<h2 class="has-vivid-red-background-color has-background has-link-color" style="margin-top:var(--wp--preset--spacing--60);font-size:4rem;font-style:normal;font-weight:600;letter-spacing:29px;text-decoration:underline;text-transform:capitalize">This is a heading</h2>',
				'font_size_value'             => '4rem',
				'should_use_fluid_typography' => true,
				'expected_output'             => '<h2 class="has-vivid-red-background-color has-background has-link-color" style="margin-top:var(--wp--preset--spacing--60);font-size:clamp(2.2rem, 2.2rem + ((1vw - 0.2rem) * 2.25), 4rem);font-style:normal;font-weight:600;letter-spacing:29px;text-decoration:underline;text-transform:capitalize">This is a heading</h2>',
			),
			'return_content_if_no_inline_font_size_found'  => array(
				'block_content'               => '<p class="has-medium-font-size" style="font-style:normal;font-weight:600;letter-spacing:29px;">A paragraph inside a group</p>',
				'font_size_value'             => '20px',
				'should_use_fluid_typography' => true,
				'expected_output'             => '<p class="has-medium-font-size" style="font-style:normal;font-weight:600;letter-spacing:29px;">A paragraph inside a group</p>',
			),
			'return_content_css_var'                       => array(
				'block_content'               => '<p class="has-medium-font-size" style="font-size:var(--wp--preset--font-size--x-large);">A paragraph inside a group</p>',
				'font_size_value'             => 'var:preset|font-size|x-large',
				'should_use_fluid_typography' => true,
				'expected_output'             => '<p class="has-medium-font-size" style="font-size:var(--wp--preset--font-size--x-large);">A paragraph inside a group</p>',
			),
			'return_content_with_spaces'                   => array(
				'block_content'               => '<p class="has-medium-font-size" style="    font-size:   20px   ;    ">A paragraph inside a group</p>',
				'font_size_value'             => '20px',
				'should_use_fluid_typography' => true,
				'expected_output'             => '<p class="has-medium-font-size" style="    font-size:clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.469), 20px);    ">A paragraph inside a group</p>',
			),
			'return_content_with_first_match_replace_only' => array(
				'block_content'               => "<div class=\"wp-block-group\" style=\"font-size:1.5em\"> \n \n<p style=\"font-size:1.5em\">A paragraph inside a group</p></div>",
				'font_size_value'             => '1.5em',
				'should_use_fluid_typography' => true,
				'expected_output'             => "<div class=\"wp-block-group\" style=\"font-size:clamp(0.984em, 0.984rem + ((1vw - 0.2em) * 0.645), 1.5em);\"> \n \n<p style=\"font-size:1.5em\">A paragraph inside a group</p></div>",
			),
		);
	}

	/**
	 * Tests that valid font size values are parsed.
	 *
	 * @ticket 56467
	 *
	 * @covers ::gutenberg_get_typography_value_and_unit
	 *
	 * @dataProvider data_valid_size_wp_get_typography_value_and_unit
	 *
	 * @param mixed $raw_value Raw size value to test.
	 * @param mixed $expected  An expected return value.
	 */
	public function test_valid_size_wp_get_typography_value_and_unit( $raw_value, $expected ) {
		$this->assertEquals( $expected, gutenberg_get_typography_value_and_unit( $raw_value ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_valid_size_wp_get_typography_value_and_unit() {
		return array(
			'size: 10vh with default units do not match' => array(
				'raw_value' => '10vh',
				'expected'  => null,
			),
			'size: calc() values do not match'           => array(
				'raw_value' => 'calc(2 * 10px)',
				'expected'  => null,
			),
			'size: clamp() values do not match'          => array(
				'raw_value' => 'clamp(15px, 0.9375rem + ((1vw - 7.68px) * 5.409), 60px)',
				'expected'  => null,
			),
			'size: `"10"`'                               => array(
				'raw_value' => '10',
				'expected'  => array(
					'value' => 10,
					'unit'  => 'px',
				),
			),
			'size: `11`'                                 => array(
				'raw_value' => 11,
				'expected'  => array(
					'value' => 11,
					'unit'  => 'px',
				),
			),
			'size: `11.234`'                             => array(
				'raw_value' => '11.234',
				'expected'  => array(
					'value' => 11.234,
					'unit'  => 'px',
				),
			),
			'size: `"12rem"`'                            => array(
				'raw_value' => '12rem',
				'expected'  => array(
					'value' => 12,
					'unit'  => 'rem',
				),
			),
			'size: `"12px"`'                             => array(
				'raw_value' => '12px',
				'expected'  => array(
					'value' => 12,
					'unit'  => 'px',
				),
			),
			'size: `"12em"`'                             => array(
				'raw_value' => '12em',
				'expected'  => array(
					'value' => 12,
					'unit'  => 'em',
				),
			),
			'size: `"12.74em"`'                          => array(
				'raw_value' => '12.74em',
				'expected'  => array(
					'value' => 12.74,
					'unit'  => 'em',
				),
			),
		);
	}

	/**
	 * Tests that invalid font size values are not parsed and trigger incorrect usage.
	 *
	 * @ticket 56467
	 *
	 * @covers ::gutenberg_get_typography_value_and_unit
	 *
	 * @dataProvider data_invalid_size_wp_get_typography_value_and_unit
	 * @expectedIncorrectUsage gutenberg_get_typography_value_and_unit
	 *
	 * @param mixed $raw_value Raw size value to test.
	 */
	public function test_invalid_size_wp_get_typography_value_and_unit( $raw_value ) {
		$this->assertNull( gutenberg_get_typography_value_and_unit( $raw_value ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_size_wp_get_typography_value_and_unit() {
		return array(
			'size: null'  => array( null ),
			'size: false' => array( false ),
			'size: true'  => array( true ),
			'size: array' => array( array( '10' ) ),
		);
	}

	/**
	 * Tests computed font size values.
	 *
	 * @covers ::gutenberg_get_computed_fluid_typography_value
	 *
	 * @dataProvider data_get_computed_fluid_typography_value
	 *
	 * @param array  $args {
	 *      Optional. An associative array of values to calculate a fluid formula for font size. Default is empty array.
	 *
	 *     @type string $maximum_viewport_width Maximum size up to which type will have fluidity.
	 *     @type string $minimum_viewport_width Minimum viewport size from which type will have fluidity.
	 *     @type string $maximum_font_size      Maximum font size for any clamp() calculation.
	 *     @type string $minimum_font_size      Minimum font size for any clamp() calculation.
	 *     @type int    $scale_factor           A scale factor to determine how fast a font scales within boundaries.
	 * }
	 * @param string $expected_output             Expected value of style property from gutenberg_apply_typography_support().
	 */
	public function test_get_computed_fluid_typography_value( $args, $expected_output ) {
		$actual = gutenberg_get_computed_fluid_typography_value( $args );
		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_computed_fluid_typography_value() {
		return array(
			'returns clamped value with valid args' => array(
				'args'            => array(
					'minimum_viewport_width' => '320px',
					'maximum_viewport_width' => '1000px',
					'minimum_font_size'      => '50px',
					'maximum_font_size'      => '100px',
					'scale_factor'           => 1,
				),
				'expected_output' => 'clamp(50px, 3.125rem + ((1vw - 3.2px) * 7.353), 100px)',
			),
			'returns `null` when maximum and minimum viewport width are equal' => array(
				'args'            => array(
					'minimum_viewport_width' => '800px',
					'maximum_viewport_width' => '800px',
					'minimum_font_size'      => '50px',
					'maximum_font_size'      => '100px',
					'scale_factor'           => 1,
				),
				'expected_output' => null,
			),
			'returns `null` when `maximum_viewport_width` is an unsupported unit' => array(
				'args'            => array(
					'minimum_viewport_width' => '320px',
					'maximum_viewport_width' => 'calc(100% - 60px)',
					'minimum_font_size'      => '50px',
					'maximum_font_size'      => '100px',
					'scale_factor'           => 1,
				),
				'expected_output' => null,
			),
			'returns `null` when `minimum_viewport_width` is an unsupported unit' => array(
				'args'            => array(
					'minimum_viewport_width' => 'calc(100% - 60px)',
					'maximum_viewport_width' => '1000px',
					'minimum_font_size'      => '50px',
					'maximum_font_size'      => '100px',
					'scale_factor'           => 1,
				),
				'expected_output' => null,
			),
			'returns `null` when `minimum_font_size` is an unsupported unit' => array(
				'args'            => array(
					'minimum_viewport_width' => '320em',
					'maximum_viewport_width' => '1000em',
					'minimum_font_size'      => '10vw',
					'maximum_font_size'      => '100em',
					'scale_factor'           => 1,
				),
				'expected_output' => null,
			),
			'returns `null` when `maximum_font_size` is an unsupported unit' => array(
				'args'            => array(
					'minimum_viewport_width' => '320em',
					'maximum_viewport_width' => '1000em',
					'minimum_font_size'      => '50px',
					'maximum_font_size'      => '100%',
					'scale_factor'           => 1,
				),
				'expected_output' => null,
			),
		);
	}
}
