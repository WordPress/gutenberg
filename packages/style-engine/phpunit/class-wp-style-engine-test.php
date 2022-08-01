<?php
/**
 * Tests the Style Engine class and associated functionality.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

require __DIR__ . '/../class-wp-style-engine-processor.php';
require __DIR__ . '/../class-wp-style-engine-css-declarations.php';
require __DIR__ . '/../class-wp-style-engine-css-rule.php';
require __DIR__ . '/../class-wp-style-engine-css-rules-store.php';
require __DIR__ . '/../class-wp-style-engine-parser.php';
require __DIR__ . '/../class-wp-style-engine.php';

/**
 * Tests for registering, storing and generating styles.
 */
class WP_Style_Engine_Test extends WP_UnitTestCase {
	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		WP_Style_Engine_CSS_Rules_Store::remove_all_stores();
	}

	/**
	 * Tests generating block styles and classnames based on various manifestations of the $block_styles argument.
	 *
	 * @dataProvider data_get_styles_fixtures
	 *
	 * @param array  $block_styles The incoming block styles object.
	 * @param array  $options Style engine options.
	 * @param string $expected_output The expected output.
	 */
	public function test_generate_get_styles( $block_styles, $options, $expected_output ) {
		$generated_styles = wp_style_engine_get_styles( $block_styles, $options );
		$this->assertSame( $expected_output, $generated_styles );
	}

	/**
	 * Data provider for test_generate_get_styles().
	 *
	 * @return array
	 */
	public function data_get_styles_fixtures() {
		return array(
			'default_return_value'                     => array(
				'block_styles'    => array(),
				'options'         => null,
				'expected_output' => array(),
			),

			'block_supports_styles_as_default_context' => array(
				'block_styles'    => array(
					'color'   => array(
						'text' => 'var:preset|color|texas-flood',
					),
					'spacing' => array(
						'margin'  => '111px',
						'padding' => '0',
					),
					'border'  => array(
						'color' => 'var:preset|color|cool-caramel',
						'width' => '2rem',
						'style' => 'dotted',
					),
				),
				'options'         => array( 'convert_vars_to_classnames' => true ),
				'expected_output' => array(
					'css'          => 'border-style: dotted; border-width: 2rem; padding: 0; margin: 111px;',
					'declarations' => array(
						'border-style' => 'dotted',
						'border-width' => '2rem',
						'padding'      => '0',
						'margin'       => '111px',
					),
					'classnames'   => 'has-text-color has-texas-flood-color has-border-color has-cool-caramel-border-color',
				),
			),

			'block_supports_styles_as_with_context'    => array(
				'block_styles'    => array(
					'color'   => array(
						'text' => 'var:preset|color|little-lamb',
					),
					'spacing' => array(
						'margin' => '20px',
					),
				),
				'options'         => array(
					'convert_vars_to_classnames' => true,
					'context'                    => 'block-supports',
				),
				'expected_output' => array(
					'css'          => 'margin: 20px;',
					'declarations' => array(
						'margin' => '20px',
					),
					'classnames'   => 'has-text-color has-little-lamb-color',
				),
			),

			'invalid_context'                          => array(
				'block_styles'    => array(
					'color'   => array(
						'text' => 'var:preset|color|sugar',
					),
					'spacing' => array(
						'padding' => '20000px',
					),
				),
				'options'         => array(
					'convert_vars_to_classnames' => true,
					'context'                    => 'i-love-doughnuts',
				),
				'expected_output' => array(),
			),

			'only_returns_classnames_array'            => array(
				'block_styles'    => array(
					'color' => array(
						'text' => 'var:preset|color|my-little-pony',
					),
				),
				'options'         => array( 'convert_vars_to_classnames' => true ),
				'expected_output' => array(
					'classnames' => 'has-text-color has-my-little-pony-color',
				),
			),

			'only_returns_css_and_declarations_arrays' => array(
				'block_styles'    => array(
					'spacing' => array(
						'padding' => array(
							'top'    => '42px',
							'left'   => '2%',
							'bottom' => '44px',
							'right'  => '5rem',
						),
					),
				),
				'options'         => array( 'selector' => '.wp-selector > p' ),
				'expected_output' => array(
					'css'          => '.wp-selector > p {padding-top: 42px; padding-left: 2%; padding-bottom: 44px; padding-right: 5rem;}',
					'declarations' => array(
						'padding-top'    => '42px',
						'padding-left'   => '2%',
						'padding-bottom' => '44px',
						'padding-right'  => '5rem',
					),
				),
			),
		);
	}

	/**
	 * Tests returning compiled CSS from css_declarations.
	 *
	 * @dataProvider data_compile_css_fixtures
	 *
	 * @param array  $css_declarations An array of parsed CSS property => CSS value pairs.
	 * @param string $css_selector     When a selector is passed, the function will return a full CSS rule `$selector { ...rules }`, otherwise a concatenated string of properties and values.
	 * @param string $expected_output  The expected output.
	 */
	public function test_compile_css( $css_declarations, $css_selector, $expected_output ) {
		$compiled_css = WP_Style_Engine::compile_css( $css_declarations, $css_selector );
		$this->assertSame( $expected_output, $compiled_css );
	}

	/**
	 * Data provider for test_generate_get_styles().
	 *
	 * @return array
	 */
	public function data_compile_css_fixtures() {
		return array(
			'default_return_value'                        => array(
				'css_declarations' => array(),
				'css_selector'     => '',
				'expected_output'  => '',
			),
			'inline_valid_box_model_style'                => array(
				'css_declarations' => array(
					'border-top-left-radius'     => '99px',
					'border-top-right-radius'    => '98px',
					'border-bottom-left-radius'  => '97px',
					'border-bottom-right-radius' => '96px',
					'padding-top'                => '42px',
					'padding-left'               => '2%',
					'padding-bottom'             => '44px',
					'padding-right'              => '5rem',
					'margin-top'                 => '12rem',
					'margin-left'                => '2vh',
					'margin-bottom'              => '2px',
					'margin-right'               => '10em',
				),
				'css_selector'     => null,
				'expected_output'  => 'border-top-left-radius: 99px; border-top-right-radius: 98px; border-bottom-left-radius: 97px; border-bottom-right-radius: 96px; padding-top: 42px; padding-left: 2%; padding-bottom: 44px; padding-right: 5rem; margin-top: 12rem; margin-left: 2vh; margin-bottom: 2px; margin-right: 10em;',
			),
			'inline_valid_typography_style'               => array(
				'css_declarations' => array(
					'font-size'       => 'clamp(2em, 2vw, 4em)',
					'font-family'     => 'Roboto,Oxygen-Sans,Ubuntu,sans-serif',
					'font-style'      => 'italic',
					'font-weight'     => '800',
					'line-height'     => '1.3',
					'text-decoration' => 'underline',
					'text-transform'  => 'uppercase',
					'letter-spacing'  => '2',
				),
				'css_selector'     => null,
				'expected_output'  => 'font-family: Roboto,Oxygen-Sans,Ubuntu,sans-serif; font-style: italic; font-weight: 800; line-height: 1.3; text-decoration: underline; text-transform: uppercase; letter-spacing: 2;',
			),
			'style_block_with_selector'                   => array(
				'css_declarations' => array(
					'padding-top'    => '42px',
					'padding-left'   => '2%',
					'padding-bottom' => '44px',
					'padding-right'  => '5rem',
				),
				'css_selector'     => '.wp-selector > p',
				'expected_output'  => '.wp-selector > p {padding-top: 42px; padding-left: 2%; padding-bottom: 44px; padding-right: 5rem;}',
			),
			'elements_with_css_var_value'                 => array(
				'css_declarations' => array(
					'color' => 'var(--wp--preset--color--my-little-pony)',
				),
				'css_selector'     => '.wp-selector',
				'expected_output'  => '.wp-selector {color: var(--wp--preset--color--my-little-pony);}',
			),
			'elements_with_invalid_preset_style_property' => array(
				'css_declarations' => array(
					'color' => 'var(--wp--preset--color--my-little-pony)',
				),
				'css_selector'     => '.wp-selector',
				'expected_output'  => '.wp-selector {color: var(--wp--preset--color--my-little-pony);}',
			),
		);
	}

	/**
	 * Tests adding rules to a store and retrieving a generated stylesheet.
	 */
	public function test_enqueue_block_styles_store() {
		$block_styles = array(
			'spacing' => array(
				'padding' => array(
					'top'    => '42px',
					'left'   => '2%',
					'bottom' => '44px',
					'right'  => '5rem',
				),
			),
		);

		$generated_styles = wp_style_engine_get_styles(
			$block_styles,
			array(
				'enqueue'  => true,
				'context'  => 'block-supports',
				'selector' => 'article',
			)
		);
		$store            = WP_Style_Engine::get_instance()::get_store( 'block-supports' );
		$rule             = $store->get_all_rules()['article'];
		$this->assertSame( $generated_styles['css'], $rule->get_css() );
	}

	/**
	 * Tests adding rules to a store and retrieving a generated stylesheet.
	 */
	public function test_add_to_store() {
		$store = wp_style_engine_add_to_store( 'test-store', array() );

		// wp_style_engine_add_to_store returns a store object.
		$this->assertInstanceOf( 'WP_Style_Engine_CSS_Rules_Store', $store );

		// Check that the style engine knows about the store.
		$stored_store = WP_Style_Engine::get_instance()::get_store( 'test-store' );
		$this->assertInstanceOf( 'WP_Style_Engine_CSS_Rules_Store', $stored_store );
	}

	/**
	 * Tests retrieving a generated stylesheet from any rules.
	 */
	public function test_get_stylesheet_from_css_rules() {
		$css_rules = array(
			array(
				'selector'     => '.saruman',
				'declarations' => array(
					'color'        => 'white',
					'height'       => '100px',
					'border-style' => 'solid',
					'align-self'   => 'unset',
				),
			),
			array(
				'selector'     => '.gandalf',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
					'align-self'   => 'safe center',
				),
			),
			array(
				'selector'     => '.radagast',
				'declarations' => array(
					'color'        => 'brown',
					'height'       => '60px',
					'border-style' => 'dashed',
					'align-self'   => 'stretch',
				),
			),
		);

		$compiled_stylesheet = wp_style_engine_get_stylesheet_from_css_rules( $css_rules );
		$this->assertSame( '.saruman {color: white; height: 100px; border-style: solid; align-self: unset;}.gandalf {color: grey; height: 90px; border-style: dotted; align-self: safe center;}.radagast {color: brown; height: 60px; border-style: dashed; align-self: stretch;}', $compiled_stylesheet );
	}

	/**
	 * Tests that incoming styles are deduped and merged.
	 */
	public function test_get_deduped_and_merged_stylesheet() {
		$css_rules = array(
			array(
				'selector'     => '.gandalf',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
				),
			),
			array(
				'selector'     => '.gandalf',
				'declarations' => array(
					'color'         => 'white',
					'height'        => '190px',
					'padding'       => '10px',
					'margin-bottom' => '100px',
				),
			),
			array(
				'selector'     => '.dumbledore',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
				),
			),
			array(
				'selector'     => '.rincewind',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
				),
			),
		);

		$compiled_stylesheet = wp_style_engine_get_stylesheet_from_css_rules( $css_rules );
		$this->assertSame( '.gandalf {color: white; height: 190px; border-style: dotted; padding: 10px; margin-bottom: 100px;}.dumbledore,.rincewind {color: grey; height: 90px; border-style: dotted;}', $compiled_stylesheet );
	}
}
