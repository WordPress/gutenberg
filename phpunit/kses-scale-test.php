<?php
/**
 * Tests for the `scale` property in inline styles.
 *
 * @package gutenberg
 */

class Gutenberg_Kses_Scale_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_kept_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_one_non_negative_number_or_percentage_is_kept( $css ) {
		$this->assertSame( $css, safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_kept_declarations() {
		return array(
			'number'          => array( 'scale: 1.2' ),
			'integer'         => array( 'scale: 2' ),
			'zero'            => array( 'scale: 0' ),
			'leading decimal' => array( 'scale: .5' ),
			'percentage'      => array( 'scale: 120%' ),
		);
	}

	/**
	 * @dataProvider data_dropped_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_other_values_are_dropped( $css ) {
		$this->assertSame( '', safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_dropped_declarations() {
		return array(
			'negative'     => array( 'scale: -1' ),
			'two values'   => array( 'scale: 1.2 1.5' ),
			'three values' => array( 'scale: 1 1 1' ),
			'length'       => array( 'scale: 2px' ),
			'keyword'      => array( 'scale: none' ),
			'calc()'       => array( 'scale: calc(1 + 0.2)' ),
			'var()'        => array( 'scale: var(--scale)' ),
		);
	}
}
