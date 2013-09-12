<?php

/**
 * The clean_pre() removes pararaph and line break
 * tags within `<pre>` elements as part of wpautop().
 *
 * @group formatting
 */
class Tests_Formatting_CleanPre extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		add_action( 'deprecated_function_run', array( $this, 'deprecated_function_run_check' ) );
	}

	function tearDown() {
		parent::tearDown();
		remove_action( 'deprecated_function_run', array( $this, 'deprecated_function_run_check' ) );
	}

	function deprecated_function_run_check( $function ) {
		if ( in_array( $function, array( 'clean_pre' ) ) )
			add_filter( 'deprecated_function_trigger_error', array( $this, 'deprecated_function_trigger_error' ) );
	}

	function deprecated_function_trigger_error() {
		remove_filter( 'deprecated_function_trigger_error', array( $this, 'deprecated_function_trigger_error' ) );
		return false;
	}

	function test_removes_self_closing_br_with_space() {
		$source = 'a b c\n<br />sldfj<br />';
		$res = 'a b c\nsldfj';

		$this->assertEquals($res, clean_pre($source));
	}

	function test_removes_self_closing_br_without_space() {
		$source = 'a b c\n<br/>sldfj<br/>';
		$res = 'a b c\nsldfj';
		$this->assertEquals($res, clean_pre($source));
	}

	// I don't think this can ever happen in production;
	// <br> is changed to <br /> elsewhere. Left in because
	// that replacement shouldn't happen (what if you want
	// HTML 4 output?).
	function test_removes_html_br() {
		$source = 'a b c\n<br>sldfj<br>';
		$res = 'a b c\nsldfj';
		$this->assertEquals($res, clean_pre($source));
	}

	function test_removes_p() {
		$source = "<p>isn't this exciting!</p><p>oh indeed!</p>";
		$res = "\nisn't this exciting!\noh indeed!";
		$this->assertEquals($res, clean_pre($source));
	}
}
