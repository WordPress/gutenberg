<?php
/**
 * Tests selector list helpers in WP_Theme_JSON_Gutenberg.
 *
 * @package gutenberg
 *
 * @covers WP_Theme_JSON_Gutenberg
 */

class WP_Theme_JSON_Gutenberg_Selector_List_Test extends WP_UnitTestCase {
	/**
	 * Invokes a protected static method on WP_Theme_JSON_Gutenberg.
	 *
	 * @param string $method_name Method name.
	 * @param mixed ...$args Method arguments.
	 * @return mixed Method result.
	 */
	private static function invoke_theme_json_method( $method_name, ...$args ) {
		$theme_json = new ReflectionClass( 'WP_Theme_JSON_Gutenberg' );

		$method = $theme_json->getMethod( $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invokeArgs( null, $args );
	}

	/**
	 * @dataProvider data_split_selector_list
	 *
	 * @param string $selector CSS selector list.
	 * @param string[] $expected Expected selectors.
	 */
	public function test_split_selector_list( $selector, $expected ) {
		$this->assertSame(
			$expected,
			self::invoke_theme_json_method( 'split_selector_list', $selector )
		);
	}

	/**
	 * @return array<string, array{selector: string, expected: string[]}>
	 */
	public function data_split_selector_list() {
		return array(
			'simple selector list'                  => array(
				'selector' => 'h1,h2',
				'expected' => array( 'h1', 'h2' ),
			),
			'preserves whitespace around selectors' => array(
				'selector' => '.a ,  .b , .c',
				'expected' => array( '.a ', '  .b ', ' .c' ),
			),
			'selector function list argument'       => array(
				'selector' => ':where(.a, .b),.c',
				'expected' => array( ':where(.a, .b)', '.c' ),
			),
			'nested selector functions'             => array(
				'selector' => ':where(:not(.a, .b), .c),.d',
				'expected' => array( ':where(:not(.a, .b), .c)', '.d' ),
			),
			'attribute string containing comma'     => array(
				'selector' => '[data-label="Save, continue"],.fallback',
				'expected' => array( '[data-label="Save, continue"]', '.fallback' ),
			),
			'escaped comma in identifier'           => array(
				'selector' => '.foo\,bar,.baz',
				'expected' => array( '.foo\,bar', '.baz' ),
			),
			'escaped closing parenthesis in selector function' => array(
				'selector' => ':is(.a\), .b), .c',
				'expected' => array( ':is(.a\), .b)', ' .c' ),
			),
			'quoted function argument before top-level comma' => array(
				'selector' => ':lang(zh, "*-hant"),.foo',
				'expected' => array( ':lang(zh, "*-hant")', '.foo' ),
			),
			'escaped quote and comma inside string' => array(
				'selector' => '[data-x="\",inside"],.b',
				'expected' => array( '[data-x="\",inside"]', '.b' ),
			),
			'comment containing comma'              => array(
				'selector' => '.a/*,*/,.b',
				'expected' => array( '.a/*,*/', '.b' ),
			),
		);
	}

	/**
	 * @dataProvider data_prepend_to_selector_uses_safe_splitting
	 *
	 * @param string $selector CSS selector list.
	 * @param string $expected Expected prepended selector.
	 */
	public function test_prepend_to_selector_uses_safe_splitting( $selector, $expected ) {
		$this->assertSame(
			$expected,
			self::invoke_theme_json_method( 'prepend_to_selector', $selector, '.scope ' )
		);
	}

	/**
	 * @return array<string, array{selector: string, expected: string}>
	 */
	public function data_prepend_to_selector_uses_safe_splitting() {
		return array(
			'fast path for simple selector list' => array(
				'selector' => 'h1,h2',
				'expected' => '.scope h1,.scope h2',
			),
			'escaped comma does not trigger fast-path breakage' => array(
				'selector' => '.foo\,bar,.baz',
				'expected' => '.scope .foo\,bar,.scope .baz',
			),
			'quoted selector function argument is preserved' => array(
				'selector' => ':lang(zh, "*-hant"),.foo',
				'expected' => '.scope :lang(zh, "*-hant"),.scope .foo',
			),
		);
	}
}
