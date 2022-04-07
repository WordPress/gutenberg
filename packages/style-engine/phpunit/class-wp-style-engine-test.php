<?php
/**
 * Tests the Style Engine class and associated functionality.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

require __DIR__ . '/../class-wp-style-engine.php';

/**
 * Tests for registering, storing and generating styles.
 */
class WP_Style_Engine_Test extends WP_UnitTestCase {
	/**
	 * Tests generating styles based on various manifestations of the $block_styles argument.
	 *
	 * @dataProvider data_generate_css_fixtures
	 */
	function test_generate_css( $block_styles, $options, $expected_output ) {
		$style_engine     = wp_get_style_engine();
		$generated_styles = $style_engine->generate(
			$block_styles,
			$options
		);
		$this->assertSame( $expected_output, $generated_styles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_generate_css_fixtures() {
		return array(
			'default_return_value'                         => array(
				'block_styles'    => array(),
				'options'         => null,
				'expected_output' => '',
			),

			'inline_invalid_block_styles_empty'            => array(
				'block_styles'    => array(),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => '',
			),

			'inline_invalid_block_styles_unknown_style'    => array(
				'block_styles'    => array(
					'pageBreakAfter' => 'verso',
				),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => '',
			),

			'inline_invalid_block_styles_unknown_definition' => array(
				'block_styles'    => array(
					'pageBreakAfter' => 'verso',
				),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => '',
			),

			'inline_invalid_block_styles_unknown_property' => array(
				'block_styles'    => array(
					'spacing' => array(
						'gap' => '1000vw',
					),
				),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => '',
			),

			'inline_valid_style_string'                    => array(
				'block_styles'    => array(
					'spacing' => array(
						'margin' => '111px',
					),
				),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => 'margin: 111px;',
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
				),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => 'padding-top: 42px; padding-left: 2%; padding-bottom: 44px; padding-right: 5rem; margin-top: 12rem; margin-left: 2vh; margin-bottom: 2px; margin-right: 10em;',
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
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => 'font-family: Roboto,Oxygen-Sans,Ubuntu,sans-serif; font-style: italic; font-weight: 800; line-height: 1.3; text-decoration: underline; text-transform: uppercase; letter-spacing: 2;',
			),
		);
	}

	/**
	 * Tests generating classnames based on various manifestations of the $block_styles argument.
	 *
	 * @dataProvider data_get_classnames_fixtures
	 */
	function test_get_classnames( $block_styles, $options, $expected_output ) {
		$style_engine     = wp_get_style_engine();
		$generated_styles = $style_engine->get_classnames(
			$block_styles,
			$options
		);
		$this->assertSame( $expected_output, $generated_styles );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_classnames_fixtures() {
		return array(
			'default_return_value'        => array(
				'block_styles'    => array(),
				'options'         => null,
				'expected_output' => '',
			),
			'valid_classnames_use_schema' => array(
				'block_styles'    => array(
					'typography' => array(
						'fontSize'   => 'fantastic',
						'fontFamily' => 'totally-awesome',
					),
				),
				'options'         => array(
					'use_schema' => true,
				),
				'expected_output' => 'has-fantastic-font-size has-totally-awesome-font-family',
			),
		);
	}
}
