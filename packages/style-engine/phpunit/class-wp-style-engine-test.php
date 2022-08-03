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
			'default_return_value'                         => array(
				'block_styles'    => array(),
				'options'         => null,
				'expected_output' => array(),
			),

			'inline_invalid_block_styles_empty'            => array(
				'block_styles'    => 'hello world!',
				'options'         => null,
				'expected_output' => array(),
			),

			'inline_invalid_block_styles_unknown_style'    => array(
				'block_styles'    => array(
					'pageBreakAfter' => 'verso',
				),
				'options'         => null,
				'expected_output' => array(),
			),

			'inline_invalid_block_styles_unknown_definition' => array(
				'block_styles'    => array(
					'pageBreakAfter' => 'verso',
				),
				'options'         => null,
				'expected_output' => array(),
			),

			'inline_invalid_block_styles_unknown_property' => array(
				'block_styles'    => array(
					'spacing' => array(
						'gap' => '1000vw',
					),
				),
				'options'         => null,
				'expected_output' => array(),
			),

			'valid_inline_css_and_classnames_as_default_context' => array(
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

			'valid_inline_css_and_classnames_with_context' => array(
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

			'invalid_context'                              => array(
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

			'inline_valid_box_model_style'                 => array(
				'block_styles'    => array(
					'spacing' => array(
						'padding' => array(
							'top'    => '42px',
							'left'   => '2%',
							'bottom' => '44px',
							'right'  => '5rem',
						),
						'margin'  => array(
							'top'    => '12rem',
							'left'   => '2vh',
							'bottom' => '2px',
							'right'  => '10em',
						),
					),
					'border'  => array(
						'radius' => array(
							'topLeft'     => '99px',
							'topRight'    => '98px',
							'bottomLeft'  => '97px',
							'bottomRight' => '96px',
						),
					),
				),
				'options'         => null,
				'expected_output' => array(
					'css'          => 'border-top-left-radius: 99px; border-top-right-radius: 98px; border-bottom-left-radius: 97px; border-bottom-right-radius: 96px; padding-top: 42px; padding-left: 2%; padding-bottom: 44px; padding-right: 5rem; margin-top: 12rem; margin-left: 2vh; margin-bottom: 2px; margin-right: 10em;',
					'declarations' => array(
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
				),
			),

			'inline_valid_typography_style'                => array(
				'block_styles'    => array(
					'typography' => array(
						'fontSize'       => 'clamp(2em, 2vw, 4em)',
						'fontFamily'     => 'Roboto,Oxygen-Sans,Ubuntu,sans-serif',
						'fontStyle'      => 'italic',
						'fontWeight'     => '800',
						'lineHeight'     => '1.3',
						'textDecoration' => 'underline',
						'textTransform'  => 'uppercase',
						'letterSpacing'  => '2',
					),
				),
				'options'         => null,
				'expected_output' => array(
					'css'          => 'font-family: Roboto,Oxygen-Sans,Ubuntu,sans-serif; font-style: italic; font-weight: 800; line-height: 1.3; text-decoration: underline; text-transform: uppercase; letter-spacing: 2;',
					'declarations' => array(
						'font-size'       => 'clamp(2em, 2vw, 4em)',
						'font-family'     => 'Roboto,Oxygen-Sans,Ubuntu,sans-serif',
						'font-style'      => 'italic',
						'font-weight'     => '800',
						'line-height'     => '1.3',
						'text-decoration' => 'underline',
						'text-transform'  => 'uppercase',
						'letter-spacing'  => '2',
					),
				),
			),

			'style_block_with_selector'                    => array(
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

			'elements_with_css_var_value'                  => array(
				'block_styles'    => array(
					'color' => array(
						'text' => 'var:preset|color|my-little-pony',
					),
				),
				'options'         => array(
					'selector' => '.wp-selector',
				),
				'expected_output' => array(
					'css'          => '.wp-selector {color: var(--wp--preset--color--my-little-pony);}',
					'declarations' => array(
						'color' => 'var(--wp--preset--color--my-little-pony)',
					),
					'classnames'   => 'has-text-color has-my-little-pony-color',
				),
			),

			'elements_with_invalid_preset_style_property'  => array(
				'block_styles'    => array(
					'color' => array(
						'text' => 'var:preset|invalid_property|my-little-pony',
					),
				),
				'options'         => array( 'selector' => '.wp-selector' ),
				'expected_output' => array(
					'classnames' => 'has-text-color',
				),
			),

			'valid_classnames_deduped'                     => array(
				'block_styles'    => array(
					'color'      => array(
						'text'       => 'var:preset|color|copper-socks',
						'background' => 'var:preset|color|splendid-carrot',
						'gradient'   => 'var:preset|gradient|like-wow-dude',
					),
					'typography' => array(
						'fontSize'   => 'var:preset|font-size|fantastic',
						'fontFamily' => 'var:preset|font-family|totally-awesome',
					),
				),
				'options'         => array( 'convert_vars_to_classnames' => true ),
				'expected_output' => array(
					'classnames' => 'has-text-color has-copper-socks-color has-background has-splendid-carrot-background-color has-like-wow-dude-gradient-background has-fantastic-font-size has-totally-awesome-font-family',
				),
			),

			'valid_classnames_and_css_vars'                => array(
				'block_styles'    => array(
					'color' => array(
						'text' => 'var:preset|color|teal-independents',
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'color: var(--wp--preset--color--teal-independents);',
					'declarations' => array(
						'color' => 'var(--wp--preset--color--teal-independents)',
					),
					'classnames'   => 'has-text-color has-teal-independents-color',
				),
			),

			'valid_classnames_with_null_style_values'      => array(
				'block_styles'    => array(
					'color' => array(
						'text'       => '#fff',
						'background' => null,
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'color: #fff;',
					'declarations' => array(
						'color' => '#fff',
					),
					'classnames'   => 'has-text-color',
				),
			),

			'invalid_classnames_preset_value'              => array(
				'block_styles'    => array(
					'color'   => array(
						'text'       => 'var:cheese|color|fantastic',
						'background' => 'var:preset|fromage|fantastic',
					),
					'spacing' => array(
						'margin'  => 'var:cheese|spacing|margin',
						'padding' => 'var:preset|spacing|padding',
					),
				),
				'options'         => array( 'convert_vars_to_classnames' => true ),
				'expected_output' => array(
					'classnames' => 'has-text-color has-background',
				),
			),

			'valid_spacing_single_preset_values'           => array(
				'block_styles'    => array(
					'spacing' => array(
						'margin'  => 'var:preset|spacing|10',
						'padding' => 'var:preset|spacing|20',
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'padding: var(--wp--preset--spacing--20); margin: var(--wp--preset--spacing--10);',
					'declarations' => array(
						'padding' => 'var(--wp--preset--spacing--20)',
						'margin'  => 'var(--wp--preset--spacing--10)',
					),
				),
			),

			'valid_spacing_multi_preset_values'            => array(
				'block_styles'    => array(
					'spacing' => array(
						'margin'  => array(
							'left'   => 'var:preset|spacing|10',
							'right'  => 'var:preset|spacing|20',
							'top'    => '1rem',
							'bottom' => '1rem',
						),
						'padding' => array(
							'left'   => 'var:preset|spacing|30',
							'right'  => 'var:preset|spacing|40',
							'top'    => '14px',
							'bottom' => '14px',
						),
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'padding-left: var(--wp--preset--spacing--30); padding-right: var(--wp--preset--spacing--40); padding-top: 14px; padding-bottom: 14px; margin-left: var(--wp--preset--spacing--10); margin-right: var(--wp--preset--spacing--20); margin-top: 1rem; margin-bottom: 1rem;',
					'declarations' => array(
						'padding-left'   => 'var(--wp--preset--spacing--30)',
						'padding-right'  => 'var(--wp--preset--spacing--40)',
						'padding-top'    => '14px',
						'padding-bottom' => '14px',
						'margin-left'    => 'var(--wp--preset--spacing--10)',
						'margin-right'   => 'var(--wp--preset--spacing--20)',
						'margin-top'     => '1rem',
						'margin-bottom'  => '1rem',
					),
				),
			),

			'invalid_spacing_multi_preset_values'          => array(
				'block_styles'    => array(
					'spacing' => array(
						'margin' => array(
							'left'   => 'var:preset|spaceman|10',
							'right'  => 'var:preset|spaceman|20',
							'top'    => '1rem',
							'bottom' => '0',
						),
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'margin-top: 1rem; margin-bottom: 0;',
					'declarations' => array(
						'margin-top'    => '1rem',
						'margin-bottom' => '0',
					),
				),
			),

			'invalid_classnames_options'                   => array(
				'block_styles'    => array(
					'typography' => array(
						'fontSize'   => array(
							'tomodachi' => 'friends',
						),
						'fontFamily' => array(
							'oishii' => 'tasty',
						),
					),
				),
				'options'         => array(),
				'expected_output' => array(),
			),

			'inline_valid_box_model_style_with_sides'      => array(
				'block_styles'    => array(
					'border' => array(
						'top'    => array(
							'color' => '#fe1',
							'width' => '1.5rem',
							'style' => 'dashed',
						),
						'right'  => array(
							'color' => '#fe2',
							'width' => '1.4rem',
							'style' => 'solid',
						),
						'bottom' => array(
							'color' => '#fe3',
							'width' => '1.3rem',
						),
						'left'   => array(
							'color' => 'var:preset|color|swampy-yellow',
							'width' => '0.5rem',
							'style' => 'dotted',
						),
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'border-top-color: #fe1; border-top-width: 1.5rem; border-top-style: dashed; border-right-color: #fe2; border-right-width: 1.4rem; border-right-style: solid; border-bottom-color: #fe3; border-bottom-width: 1.3rem; border-left-color: var(--wp--preset--color--swampy-yellow); border-left-width: 0.5rem; border-left-style: dotted;',
					'declarations' => array(
						'border-top-color'    => '#fe1',
						'border-top-width'    => '1.5rem',
						'border-top-style'    => 'dashed',
						'border-right-color'  => '#fe2',
						'border-right-width'  => '1.4rem',
						'border-right-style'  => 'solid',
						'border-bottom-color' => '#fe3',
						'border-bottom-width' => '1.3rem',
						'border-left-color'   => 'var(--wp--preset--color--swampy-yellow)',
						'border-left-width'   => '0.5rem',
						'border-left-style'   => 'dotted',
					),
				),
			),

			'inline_invalid_box_model_style_with_sides'    => array(
				'block_styles'    => array(
					'border' => array(
						'top'    => array(
							'top'    => '#fe1',
							'right'  => '1.5rem',
							'cheese' => 'dashed',
						),
						'right'  => array(
							'right' => '#fe2',
							'top'   => '1.4rem',
							'bacon' => 'solid',
						),
						'bottom' => array(
							'color'  => 'var:preset|color|terrible-lizard',
							'bottom' => '1.3rem',
						),
						'left'   => array(
							'left'  => null,
							'width' => null,
							'top'   => 'dotted',
						),
					),
				),
				'options'         => array(),
				'expected_output' => array(
					'css'          => 'border-bottom-color: var(--wp--preset--color--terrible-lizard);',
					'declarations' => array(
						'border-bottom-color' => 'var(--wp--preset--color--terrible-lizard)',
					),
				),
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
		$css_rules           = array(
			array(
				'selector'     => '.frodo',
				'declarations' => array(
					'color'        => 'brown',
					'height'       => '10px',
					'width'        => '30px',
					'border-style' => 'dotted',
				),
			),
			array(
				'selector'     => '.samwise',
				'declarations' => array(
					'color'        => 'brown',
					'height'       => '20px',
					'width'        => '50px',
					'border-style' => 'solid',
				),
			),
		);
		$compiled_stylesheet = wp_style_engine_get_stylesheet_from_css_rules(
			$css_rules,
			array(
				'context' => 'test-store',
				'enqueue' => true,
			)
		);

		// Check that the style engine knows about the store.
		$style_engine = WP_Style_Engine::get_instance();
		$stored_store = $style_engine::get_store( 'test-store' );
		$this->assertInstanceOf( 'WP_Style_Engine_CSS_Rules_Store', $stored_store );
		$this->assertSame( $compiled_stylesheet, $style_engine::compile_stylesheet_from_css_rules( $stored_store->get_all_rules() ) );
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
