<?php
/**
 * Tests the Style Engine class and associated functionality.
 *
 * @package    Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for registering, storing and generating styles.
 */
class WP_Style_Engine_Gutenberg_Test extends WP_UnitTestCase {
	/**
	 * Tests various manifestations of the $block_styles argument.
	 *
	 * @dataProvider data_block_styles_fixtures
	 */
	function test_generate_css( $block_styles, $options, $expected_output ) {
		$style_engine     = WP_Style_Engine_Gutenberg::get_instance();
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
	public function data_block_styles_fixtures() {
		return array(
			'default_return_value'                         => array(
				'block_styles'    => array(),
				'options'         => null,
				'expected_output' => '',
			),

			'inline_invalid_block_styles_empty'            => array(
				'block_styles'    => array(),
				'options'         => array(
					'path'   => array( 'spacing', 'padding' ),
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
					'path'   => array( 'pageBreakAfter', 'verso' ),
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
					'path'   => array( 'spacing', 'padding' ),
					'inline' => true,
				),
				'expected_output' => '',
			),

			'inline_invalid_multiple_style_unknown_property' => array(
				'block_styles'    => array(
					'spacing' => array(
						'gavin' => '1000vw',
					),
				),
				'options'         => array(
					'inline' => true,
				),
				'expected_output' => '',
			),

			'inline_valid_single_style_string'             => array(
				'block_styles'    => array(
					'spacing' => array(
						'margin' => '111px',
					),
				),
				'options'         => array(
					'path'   => array( 'spacing', 'margin' ),
					'inline' => true,
				),
				'expected_output' => 'margin:111px;',
			),

			'inline_valid_single_style'                    => array(
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
					'path'   => array( 'spacing', 'padding' ),
					'inline' => true,
				),
				'expected_output' => 'padding-top:42px;padding-left:2%;padding-bottom:44px;padding-right:5rem;',
			),

			'inline_valid_multiple_style'                  => array(
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
				'expected_output' => 'padding-top:42px;padding-left:2%;padding-bottom:44px;padding-right:5rem;margin-top:12rem;margin-left:2vh;margin-bottom:2px;margin-right:10em;',
			),
		);
	}
}
