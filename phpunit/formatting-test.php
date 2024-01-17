<?php
/**
 * Test formatting functions.
 *
 * @package Gutenberg
 */

class Gutenberg_Formatting_Test extends WP_UnitTestCase {
	/**
	 * Tests CSS number output.
	 *
	 * @covers ::gutenberg_round_css_value
	 *
	 * @dataProvider data_gutenberg_round_css_value
	 *
	 * @param int|string|float $value           A CSS <number> data type.
	 * @param array            $options         {
	 *     Optional. An array of options. Default empty array.
	 * }
	 * @param string           $expected_output Expected value of style property from gutenberg_apply_typography_support().
	 */
	public function test_gutenberg_round_css_value( $value, $options, $expected_output ) {
		$actual = gutenberg_round_css_value( $value, $options );
		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_gutenberg_round_css_value() {
		return array(
			'returns from integer'                       => array(
				'value'           => 50,
				'options'         => array(),
				'expected_output' => '50',
			),
			'returns from (str) integer'                 => array(
				'value'           => '100',
				'options'         => array(),
				'expected_output' => '100',
			),
			'returns from float'                         => array(
				'value'           => 1.222,
				'options'         => array(),
				'expected_output' => '1.222',
			),
			'returns from (str) float'                   => array(
				'value'           => '1.222',
				'options'         => array(),
				'expected_output' => '1.222',
			),
			'rounding does not affect integers'          => array(
				'value'           => 199333,
				'options'         => array(),
				'expected_output' => '199333',
			),
			'rounds float with default decimal places'   => array(
				'value'           => 55.87466666,
				'options'         => array(),
				'expected_output' => '55.875',
			),
			'rounds (str) float with default decimal places' => array(
				'value'           => '55.87466666',
				'options'         => array(),
				'expected_output' => '55.875',
			),
			'returns from exponent'                      => array(
				'value'           => 10e3,
				'options'         => array(),
				'expected_output' => '10000',
			),
			'returns from float with no leading 0'       => array(
				'value'           => .9,
				'options'         => array(),
				'expected_output' => '0.9',
			),
			'returns from (str) float with no leading 0' => array(
				'value'           => '.9',
				'options'         => array(),
				'expected_output' => '0.9',
			),
			'returns negative int'                       => array(
				'value'           => '-234',
				'options'         => array(),
				'expected_output' => '-234',
			),
			'returns negative float'                     => array(
				'value'           => -1100.87688,
				'options'         => array(),
				'expected_output' => '-1100.877',
			),
			'returns from negative exponent'             => array(
				'value'           => -3.4e-2,
				'options'         => array(),
				'expected_output' => '-0.034',
			),
			'returns from negative float < 0'            => array(
				'value'           => -0.5,
				'options'         => array(),
				'expected_output' => '-0.5',
			),
			'returns zero from 0.0'                      => array(
				'value'           => 0.0,
				'options'         => array(),
				'expected_output' => '0',
			),
			'returns zero from +0.0'                     => array(
				'value'           => +0.0,
				'options'         => array(),
				'expected_output' => '0',
			),
			'returns zero from -0.0'                     => array(
				'value'           => -0.0,
				'options'         => array(),
				'expected_output' => '0',
			),
			'returns with resolved negative/positive signs' => array(
				'value'           => +-12.2,
				'options'         => array(),
				'expected_output' => '-12.2',
			),
			'ignores (str) negative/positive signs'      => array(
				'value'           => '+-12.2',
				'options'         => array(),
				'expected_output' => '+-12.2',
			),
			'ignores values with invalid, localized large numbers' => array(
				'value'           => '1.222,22',
				'options'         => array(),
				'expected_output' => '1.222,22',
			),
			'ignores non-numeric array'                  => array(
				'value'           => array(),
				'options'         => array(),
				'expected_output' => array(),
			),
			'ignores non-numeric null'                   => array(
				'value'           => null,
				'options'         => array(),
				'expected_output' => null,
			),
			'ignores values invalid, localized floats'   => array(
				'value'           => '1,99999999',
				'options'         => array(),
				'expected_output' => '1,99999999',
			),
			'ignores values with a-z characters'         => array(
				'value'           => 'abc',
				'options'         => array(),
				'expected_output' => 'abc',
			),
			'ignores CSS values + units'                 => array(
				'value'           => '20.9999999vh',
				'options'         => array(),
				'expected_output' => '20.9999999vh',
			),
			'ignores double dot decimals'                => array(
				'value'           => '12.1.1',
				'options'         => array(),
				'expected_output' => '12.1.1',
			),
			'ignores shorthand CSS values'               => array(
				'value'           => '12px 24px 12px 12px',
				'options'         => array(),
				'expected_output' => '12px 24px 12px 12px',
			),
			'ignores clamp CSS formula'                  => array(
				'value'           => 'clamp(15px, 0.9375rem + ((1vw - 7.68px) * 5.409), 60px)',
				'options'         => array(),
				'expected_output' => 'clamp(15px, 0.9375rem + ((1vw - 7.68px) * 5.409), 60px)',
			),
			'rounds correctly with 0 decimals'           => array(
				'value'           => 100.123456,
				'options'         => array(
					'decimal_places' => 0,
				),
				'expected_output' => '100',
			),
			'rounds correctly with custom decimals'      => array(
				'value'           => 100.987654345,
				'options'         => array(
					'decimal_places' => 7,
				),
				'expected_output' => '100.9876543',
			),
			'rounds negative floats correctly with custom decimals' => array(
				'value'           => -555.5555555555555555,
				'options'         => array(
					'decimal_places' => 9,
				),
				'expected_output' => '-555.555555556',
			),
		);
	}
}
