<?php
/**
 * Tests for the `rotate` property in inline styles.
 *
 * @package gutenberg
 */

class Gutenberg_Kses_Rotate_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_kept_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_single_angles_are_kept( $css ) {
		$this->assertSame( $css, safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_kept_declarations() {
		return array(
			'degrees'  => array( 'rotate: -15deg' ),
			'turns'    => array( 'rotate: 0.25turn' ),
			'radians'  => array( 'rotate: 1.5rad' ),
			'gradians' => array( 'rotate: 100grad' ),
			'zero'     => array( 'rotate: 0' ),
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
			'bare number' => array( 'rotate: 45' ),
			'axis'        => array( 'rotate: x 45deg' ),
			'vector'      => array( 'rotate: 1 0 0 45deg' ),
			'calc()'      => array( 'rotate: calc(10deg + 5deg)' ),
			'var()'       => array( 'rotate: var(--angle)' ),
		);
	}
}
