<?php

require_once dirname( dirname( __FILE__ ) ) . '/extract.php';

class ExtractTest extends PHPUnit_Framework_TestCase {

	function setUp() {
		$this->extractor = new StringExtractor;
		$this->extractor->rules = array(
			'__' => array('string'),
		);
	}

	function test_with_just_a_string() {
		$expected = new Translation_Entry( array( 'singular' => 'baba', 'references' => array('baba.php:1') ) );
		$result = $this->extractor->extract_from_code('<?php __("baba"); ?>', 'baba.php' );
		$this->assertEquals( $expected, $result->entries['baba'] );
	}

	function test_entry_from_call_simple() {
		$entry = $this->extractor->entry_from_call( array( 'name' => '__', 'args' => array('baba') ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => 'baba' ) ) );
	}

	function test_entry_from_call_nonexisting_function() {
		$entry = $this->extractor->entry_from_call( array( 'name' => 'f', 'args' => array('baba') ), 'baba.php' );
		$this->assertEquals( $entry, null );
	}

	function test_entry_from_call_too_few_args() {
		$entry = $this->extractor->entry_from_call( array( 'name' => '__', 'args' => array() ), 'baba.php' );
		$this->assertEquals( $entry, null );
	}

	function test_entry_from_call_non_expected_null_arg() {
		$this->extractor->rules = array( '_nx' => array( 'singular', 'plural', 'context' ) );
		$entry = $this->extractor->entry_from_call( array( 'name' => '_nx', 'args' => array('%s baba', null, 'noun') ), 'baba.php' );
		$this->assertEquals( $entry, null );
	}

	function test_entry_from_call_more_args_should_be_ok() {
		$this->extractor->rules = array( '__' => array('string') );
		$entry = $this->extractor->entry_from_call( array( 'name' => '__', 'args' => array('baba', 5, 'pijo', null) ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => 'baba' ) ) );
	}


	function test_entry_from_call_context() {
		$this->extractor->rules = array( '_x' => array( 'string', 'context' ) );
		$entry = $this->extractor->entry_from_call( array( 'name' => '_x', 'args' => array('baba', 'noun') ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => 'baba', 'context' => 'noun' ) ) );
	}

	function test_entry_from_call_plural() {
		$this->extractor->rules = array( '_n' => array( 'singular', 'plural' ) );
		$entry = $this->extractor->entry_from_call( array( 'name' => '_n', 'args' => array('%s baba', '%s babas') ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => '%s baba', 'plural' => '%s babas' ) ) );
	}

	function test_entry_from_call_plural_and_context() {
		$this->extractor->rules = array( '_nx' => array( 'singular', 'plural', 'context' ) );
		$entry = $this->extractor->entry_from_call( array( 'name' => '_nx', 'args' => array('%s baba', '%s babas', 'noun') ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => '%s baba', 'plural' => '%s babas', 'context' => 'noun' ) ) );
	}

	function test_entry_from_call_extracted_comment() {
		$entry = $this->extractor->entry_from_call( array( 'name' => '__', 'args' => array('baba'), 'comment' => 'translators: give me back my pants!' ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => 'baba', 'extracted_comments' => "translators: give me back my pants!\n" ) ) );
	}

	function test_entry_from_call_line_number() {
		$entry = $this->extractor->entry_from_call( array( 'name' => '__', 'args' => array('baba'), 'line' => 10 ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => 'baba', 'references' => array('baba.php:10') ) ) );
	}

	function test_entry_from_call_zero() {
		$entry = $this->extractor->entry_from_call( array( 'name' => '__', 'args' => array('0') ), 'baba.php' );
		$this->assertEquals( $entry, new Translation_Entry( array( 'singular' => '0' ) ) );
	}

	function test_entry_from_call_multiple() {
		$this->extractor->rules = array( 'c' => array( 'string', 'singular', 'plural' ) );
		$entries = $this->extractor->entry_from_call( array( 'name' => 'c', 'args' => array('baba', 'dyado', 'dyados') ), 'baba.php' );
		$this->assertEquals( array(
				new Translation_Entry( array( 'singular' => 'baba' ) ), new Translation_Entry( array( 'singular' => 'dyado', 'plural' => 'dyados' ) ) ), $entries );
	}

	function test_entry_from_call_multiple_first_plural_then_two_strings() {
		$this->extractor->rules = array( 'c' => array( 'singular', 'plural', null, 'string', 'string' ) );
		$entries = $this->extractor->entry_from_call( array( 'name' => 'c', 'args' => array('dyado', 'dyados', 'baba', 'foo', 'bar') ), 'baba.php' );
		$this->assertEquals( array(
				new Translation_Entry( array( 'singular' => 'dyado', 'plural' => 'dyados' ) ),
				new Translation_Entry( array( 'singular' => 'foo' ) ),
				new Translation_Entry( array( 'singular' => 'bar' ) ) ), $entries );
	}

	function test_find_function_calls_one_arg_literal() {
		$this->assertEquals( array( array( 'name' => '__', 'args' => array( 'baba' ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('__'), '<?php __("baba"); ?>' ) );
	}

	function test_find_function_calls_one_arg_zero() {
		$this->assertEquals( array( array( 'name' => '__', 'args' => array( '0' ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('__'), '<?php __("0"); ?>' ) );
	}

	function test_find_function_calls_one_arg_non_literal() {
		$this->assertEquals( array( array( 'name' => '__', 'args' => array( null ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('__'), '<?php __("baba" . "dudu"); ?>' ) );
	}

	function test_find_function_calls_shouldnt_be_mistaken_by_a_class() {
		$this->assertEquals( array(), $this->extractor->find_function_calls( array('__'), '<?php class __ { }; ("dyado");' ) );
	}

	function test_find_function_calls_2_args_bad_literal() {
		$this->assertEquals( array( array( 'name' => 'f', 'args' => array( null, "baba" ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('f'), '<?php f(5, "baba" ); ' ) );
	}

	function test_find_function_calls_2_args_bad_literal_bad() {
		$this->assertEquals( array( array( 'name' => 'f', 'args' => array( null, "baba", null ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('f'), '<?php f(5, "baba", 5 ); ' ) );
	}

	function test_find_function_calls_1_arg_bad_concat() {
		$this->assertEquals( array( array( 'name' => 'f', 'args' => array( null ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('f'), '<?php f( "baba" . "baba" ); ' ) );
	}

	function test_find_function_calls_1_arg_bad_function_call() {
		$this->assertEquals( array( array( 'name' => 'f', 'args' => array( null ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('f'), '<?php f( g( "baba" ) ); ' ) );
	}

	function test_find_function_calls_2_arg_literal_bad() {
		$this->assertEquals( array( array( 'name' => 'f', 'args' => array( "baba", null ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('f'), '<?php f( "baba", null ); ' ) );
	}

	function test_find_function_calls_2_arg_bad_with_parens_literal() {
		$this->assertEquals( array( array( 'name' => 'f', 'args' => array( null, "baba" ), 'line' => 1 ) ), $this->extractor->find_function_calls( array('f'), '<?php f( g( "dyado", "chicho", "lelya "), "baba" ); ' ) );
	}

	/**
	 * @group comment
	 */
	function test_find_function_calls_with_comment() {
		$this->assertEquals(
			array( array( 'name' => 'f', 'args' => array( 'baba' ), 'line' => 1, 'comment' => 'translators: let your ears fly!' ) ),
			$this->extractor->find_function_calls( array('f'), '<?php /* translators: let your ears fly! */ f( "baba" ); ' )
		);
	}

	/**
	 * @group comment
	 */
	function test_find_function_calls_with_not_immediate_comment() {
		$this->assertEquals(
			array( array( 'name' => 'f', 'args' => array( 'baba' ), 'line' => 1, 'comment' => 'translators: let your ears fly!' ) ),
			$this->extractor->find_function_calls( array('f'), '<?php /* translators: let your ears fly! */ $foo = g ( f( "baba" ) ); ' )
		);
	}

	/**
	 * @group comment
	 */
	function test_find_function_calls_with_not_immediate_comment_include_only_latest() {
		$this->assertEquals(
			array( array( 'name' => 'f', 'args' => array( 'baba' ), 'line' => 1, 'comment' => 'translators: let your ears fly!' ) ),
			$this->extractor->find_function_calls( array('f'), '<?php /* translators: boo */ /* translators: let your ears fly! */ /* baba */ $foo = g ( f( "baba" ) ); ' )
		);
	}

	/**
	 * @group comment
	 */
	function test_find_function_calls_with_multi_line_comment() {
		$this->assertEquals( array( array(
				'name' => '__', 'args' => array( 'on' ), 'line' => 6,
				'comment' => "Translators: If there are characters in your language that are not supported by Lato, translate this to 'off'. Do not translate into your own language."
			) ),
			$this->extractor->find_function_calls( array( '__' ),
				"<?php
				/*
				 * Translators: If there are characters in your language that are not supported
				 * by Lato, translate this to 'off'. Do not translate into your own language.
				 */
				__( 'on' );"
			)
		);
	}

	/**
	 * @group comment
	 */
	function test_comment_prefix_should_be_case_insensitive() {
		$this->assertEquals(
			array( array( 'name' => 'f', 'args' => array( 'baba' ), 'line' => 1, 'comment' => 'Translators: let your ears fly!' ) ),
			$this->extractor->find_function_calls( array('f'), '<?php /* Translators: let your ears fly! */ f( "baba" ); ' )
		);
	}
}
