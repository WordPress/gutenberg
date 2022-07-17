<?php
/**
 * Tests the Style Engine class and associated functionality.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

require __DIR__ . '/../class-wp-style-engine-css-declarations.php';
require __DIR__ . '/../class-wp-style-engine.php';

/**
 * Tests for registering, storing and generating styles.
 */
class WP_Style_Engine_Test extends WP_UnitTestCase {
	/**
	 * Tests generating block styles and classnames based on various manifestations of the $block_styles argument.
	 *
	 * @dataProvider data_generate_block_supports_styles_fixtures
	 *
	 * @param array  $block_styles    The incoming block styles object.
	 * @param array  $options         Style engine options.
	 * @param string $expected_output The expected output.
	 */
	public function test_generate_block_supports_styles( $block_styles, $options, $expected_output ) {
		$generated_styles = wp_style_engine_get_block_supports_styles( $block_styles, $options );
		$this->assertSame( $expected_output, $generated_styles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_generate_block_supports_styles_fixtures() {
		return array(
			'default_return_value'                         => array(
				'block_styles'    => array(),
				'options'         => null,
				'expected_output' => null,
			),

			'inline_invalid_block_styles_empty'            => array(
				'block_styles'    => 'hello world!',
				'options'         => null,
				'expected_output' => null,
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

			'valid_inline_css_and_classnames'              => array(
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
					'css'          => '.wp-selector > p { padding-top: 42px; padding-left: 2%; padding-bottom: 44px; padding-right: 5rem; }',
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
					'css'          => '.wp-selector { color: var(--wp--preset--color--my-little-pony); }',
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
}
