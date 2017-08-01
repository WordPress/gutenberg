<?php
/**
 * Test gutenberg_get_script_polyfill()
 *
 * @package Gutenberg
 */

class Polyfill_Test extends WP_UnitTestCase {

	public function tearDown() {
		wp_deregister_script( 'promise' );
	}

	function test_gutenberg_get_script_polyfill_ignores_missing_handle() {
		$polyfill = gutenberg_get_script_polyfill( array(
			'\'Promise\' in window' => 'promise',
		) );

		$this->assertEquals( '', $polyfill );
	}

	function test_gutenberg_get_script_polyfill_returns_inline_script() {
		wp_register_script( 'promise', 'https://unpkg.com/promise-polyfill/promise.js' );

		$polyfill = gutenberg_get_script_polyfill( array(
			'\'Promise\' in window' => 'promise',
		) );

		$this->assertEquals(
			'( \'Promise\' in window ) || document.write( \'<script src="https://unpkg.com/promise-polyfill/promise.js"></scr\' + \'ipt>\' );',
			$polyfill
		);
	}

}
