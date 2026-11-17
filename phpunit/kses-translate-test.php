<?php
/**
 * Tests for the `translate` property in inline styles.
 *
 * @package gutenberg
 */

class Gutenberg_Kses_Translate_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_kept_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_one_or_two_lengths_are_kept( $css ) {
		$this->assertSame( $css, safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_kept_declarations() {
		return array(
			'two axes'   => array( 'translate: 10px -50%' ),
			'one axis'   => array( 'translate: 1.5rem' ),
			'zero'       => array( 'translate: 0 0' ),
			'viewport'   => array( 'translate: 10dvw 5svh' ),
			'container'  => array( 'translate: 2cqi 0' ),
			'font-based' => array( 'translate: -1em 2ch' ),
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
			'z axis'      => array( 'translate: 1px 2px 3px' ),
			'bare number' => array( 'translate: 10 20' ),
			'angle'       => array( 'translate: 5deg' ),
			'keyword'     => array( 'translate: none' ),
			'calc()'      => array( 'translate: calc(1px + 2px)' ),
			'var()'       => array( 'translate: var(--offset)' ),
		);
	}
}
