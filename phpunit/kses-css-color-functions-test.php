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
			'non-colour function inside'    => array( 'color: rgb(foo(1) 0 0)' ),
			'wrapped in unknown function'   => array( 'color: foo(rgb(0 0 0))' ),
			'closing brace in contents'     => array( 'color: rgb(0 } 0)' ),
			'comment in contents'           => array( 'color: rgb(0 /* x */ 0)' ),
			'backslash in contents'         => array( 'color: rgb(0 \\30 0)' ),
			'unclosed bracket'              => array( 'color: rgb(0 0 0' ),
			'prefixed name'                 => array( 'color: x-rgb(0 0 0)' ),
			'nesting beyond the pass limit' => array( 'color: ' . str_repeat( 'rgb(', 40 ) . '0' . str_repeat( ')', 40 ) ),
		);
	}

	public function test_style_engine_keeps_box_shadow_with_rgba() {
		$styles = gutenberg_style_engine_get_styles( array( 'shadow' => '1px 1px 1px rgba(0,0,0,0.5)' ) );

		$this->assertSame( 'box-shadow:1px 1px 1px rgba(0,0,0,0.5);', $styles['css'] ?? '' );
	}

	public function test_does_not_override_another_filters_rejection() {
		$reject = static function ( $allow_css, $css_test_string ) {
			return 'display: none' === $css_test_string ? false : $allow_css;
		};
		add_filter( 'safecss_filter_attr_allow_css', $reject, 5, 2 );

		$result = safecss_filter_attr( 'display: none' );

		remove_filter( 'safecss_filter_attr_allow_css', $reject, 5 );

		$this->assertSame( '', $result );
	}
}
