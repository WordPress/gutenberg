<?php
/**
 * Tests for CSS color functions in inline styles.
 *
 * @package gutenberg
 */

class Gutenberg_Kses_CSS_Color_Functions_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_kept_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_color_functions_are_kept( $css ) {
		$this->assertSame( $css, safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_kept_declarations() {
		return array(
			'rgba() in box-shadow'        => array( 'box-shadow: 1px 1px 1px rgba(0,0,0,0.5)' ),
			'multi-layer box-shadow'      => array( 'box-shadow: 6px 6px 9px rgb(0 0 0 / 20%), 0 0 0 1px hsl(0 0% 0%)' ),
			'nested color-mix()'          => array( 'color: color-mix(in srgb, rgb(0 0 0) 50%, hsl(0 0% 100%))' ),
			'relative colour with var()'  => array( 'color: rgb(from var(--brand) r g b / 50%)' ),
			'calc() inside rgb()'         => array( 'color: rgb(calc(255 * 0.5) 0 0)' ),
			'uppercase name'              => array( 'color: RGB(0,0,0)' ),
			'oklch()'                     => array( 'color: oklch(70% 0.1 200)' ),
			'hex in color-mix()'          => array( 'color: color-mix(in srgb, #fff 50%, #000)' ),
			'hex in light-dark()'         => array( 'color: light-dark(#fff, #000)' ),
			'color() with a colour space' => array( 'color: color(display-p3 1 0 0)' ),
			'four levels of nesting'      => array( 'color: light-dark(color-mix(in srgb, rgb(from hsl(200 50% 40%) r g b) 50%, #fff), #000)' ),
		);
	}

	/**
	 * @dataProvider data_dropped_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_invalid_color_functions_are_dropped( $css ) {
		$this->assertSame( '', safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_dropped_declarations() {
		return array(
			'non-colour function inside'   => array( 'color: rgb(foo(1) 0 0)' ),
			'wrapped in unknown function'  => array( 'color: foo(rgb(0 0 0))' ),
			'closing brace in contents'    => array( 'color: rgb(0 } 0)' ),
			'comment in contents'          => array( 'color: rgb(0 /* x */ 0)' ),
			'backslash in contents'        => array( 'color: rgb(0 \\30 0)' ),
			'unclosed bracket'             => array( 'color: rgb(0 0 0' ),
			'prefixed name'                => array( 'color: x-rgb(0 0 0)' ),
			'comment after function'       => array( 'color: rgb(0 0 0) /* x */' ),
			'backslash after function'     => array( 'color: rgb(0 0 0) \\30' ),
			'bracket after function'       => array( 'color: rgb(0 0 0) (' ),
			'ampersand after function'     => array( 'color: rgb(0 0 0) &' ),
			'equals after function'        => array( 'color: rgb(0 0 0) =' ),
			'closing brace after function' => array( 'color: rgb(0 0 0) }' ),
		);
	}

	public function test_nesting_up_to_the_pass_limit_is_kept() {
		$css = 'color: ' . str_repeat( 'rgb(', 4 ) . '0' . str_repeat( ')', 4 );

		$this->assertSame( $css, safecss_filter_attr( $css ) );
	}

	public function test_nesting_beyond_the_pass_limit_is_dropped() {
		$removed = remove_filter( 'safecss_filter_attr_allow_css', 'gutenberg_allow_css_color_functions', PHP_INT_MIN );
		$in_core = '' !== safecss_filter_attr( 'color: rgb(0 0 0)' );
		if ( $removed ) {
			add_filter( 'safecss_filter_attr_allow_css', 'gutenberg_allow_css_color_functions', PHP_INT_MIN, 2 );
		}
		if ( $in_core ) {
			// Core applies its own limit first, and then the shim gets the remainder. Core tests the limit itself.
			$this->markTestSkipped( 'Core already allows color functions.' );
		}

		$this->assertSame( '', safecss_filter_attr( 'color: ' . str_repeat( 'rgb(', 5 ) . '0' . str_repeat( ')', 5 ) ) );
	}

	public function test_style_engine_keeps_box_shadow_with_rgba() {
		$styles = gutenberg_style_engine_get_styles( array( 'shadow' => '1px 1px 1px rgba(0,0,0,0.5)' ) );

		$this->assertSame( 'box-shadow:1px 1px 1px rgba(0,0,0,0.5);', $styles['css'] ?? '' );
	}

	/**
	 * @dataProvider data_rejecting_filter_priorities
	 *
	 * @param int $priority Priority of the rejecting filter.
	 */
	public function test_does_not_override_another_filters_rejection( $priority ) {
		// Core passes the filter the test string with color functions already replaced, so match on nothing in it.
		add_filter( 'safecss_filter_attr_allow_css', '__return_false', $priority );

		$result = safecss_filter_attr( 'color: rgb(0 0 0)' );

		remove_filter( 'safecss_filter_attr_allow_css', '__return_false', $priority );

		$this->assertSame( '', $result );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_rejecting_filter_priorities() {
		return array(
			'priority 5'  => array( 5 ),
			'priority 10' => array( 10 ),
		);
	}

	public function test_keeps_an_allowed_result() {
		$this->assertTrue( gutenberg_allow_css_color_functions( true, 'color: rgb(0 0 0) /* x */' ) );
	}
}
