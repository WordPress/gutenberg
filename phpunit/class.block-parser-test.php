<?php

use PHPUnit\Framework\TestCase;

require_once dirname( dirname( __FILE__ ) ) . '/lib/block-parser.php';

class Block_Parser_Test extends TestCase {
	private $parser;

	function parse( $input ) {
		return $this->parser->parse( $input );
	}

	function setUp() {
		$this->parser = new Gutenberg_Block_Parser();
	}

	function test_combinator_succeed() {
		$this->assertEquals(
			[ [ 'test', 'bork' ] ],
			Gutenberg_Block_Parser::succeed( 'test', 'bork' )
		);
	}

	function test_combinator_fail() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::fail( 'bork' )
		);
	}

	function test_combinator_literal_success() {
		$this->assertEquals(
			[ 'test', ' string' ],
			Gutenberg_Block_Parser::literal( 'test', 'test string' )
		);
	}

	function test_combinator_literal_fail() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::literal( 'test', 'no match' )
		);
	}

	function test_combinator_ignore() {
		$this->assertEquals(
			[ [], 'abc' ],
			Gutenberg_Block_Parser::ignore(
				[ 'Gutenberg_Block_Parser', 'literal' ],
				[ '123' ],
				'123abc'
			)
		);
	}

	function test_combinator_ignore_fail() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::ignore(
				[ 'Gutenberg_Block_Parser', 'literal' ],
				[ 'abc' ],
				'123abc'
			)
		);
	}

	function test_combinator_match_success() {
		$this->assertEquals(
			[ [ 'test_val' ], ' = 5' ],
			Gutenberg_Block_Parser::match( '(^[a-z_]+)', 'test_val = 5' )
		);
	}

	function test_combinator_match_groups_success() {
		$this->assertEquals(
			[ [ 'test_val = 5', 'test_val', '5' ], ';' ],
			Gutenberg_Block_Parser::match( '(^([a-z_]+) = (\d+))', 'test_val = 5;' )
		);
	}

	function test_combinator_match_fail() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::match( '(^[a-z_]+)', ';test_val = 5' )
		);
	}

	function test_combinator_zero_or_more() {
		$this->assertEquals(
			[ [ 'a', 'a', 'a' ], 'xyz' ],
			Gutenberg_Block_Parser::zero_or_more(
				[ 'Gutenberg_Block_Parser', 'literal' ],
				[ 'a' ],
				'aaaxyz'
			)
		);
	}

	function test_combinator_zero_or_more_failure() {
		$this->assertEquals(
			[ [], 'bbb' ],
			Gutenberg_Block_Parser::zero_or_more(
				[ 'Gutenberg_Block_Parser', 'literal' ],
				[ 'a' ],
				'bbb'
			)
		);
	}

	function test_combinator_one_or_more() {
		$this->assertEquals(
			[ [ 'a', 'a' ], 'bb' ],
			Gutenberg_Block_Parser::one_or_more(
				[ 'Gutenberg_Block_Parser', 'literal' ],
				[ 'a' ],
				'aabb'
			)
		);
	}

	function test_combinator_one_or_more_failure() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::one_or_more(
				[ 'Gutenberg_Block_Parser', 'literal' ],
				[ 'a' ],
				'bbb'
			)
		);
	}

	function test_combinator_sequence() {
		$this->assertEquals(
			[ [ 'a', 'b' ], 'cd' ],
			Gutenberg_Block_Parser::sequence( [
				[ [ 'Gutenberg_Block_Parser', 'literal' ], [ 'a' ] ],
				[ [ 'Gutenberg_Block_Parser', 'literal' ], [ 'b' ] ],
			], 'abcd' )
		);
	}

	function test_combinator_sequence_failure() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::sequence( [
				[ [ 'Gutenberg_Block_Parser', 'literal' ], [ 'a' ] ],
				[ [ 'Gutenberg_Block_Parser', 'literal' ], [ 'b' ] ],
			], 'acd' )
		);
	}

	function test_block_void_no_attrs() {
		$this->assertEquals(
			[ [ 'blockName' => 'core/void', 'attrs' => [], 'rawContent' => '' ], '' ],
			Gutenberg_Block_Parser::block_void(
				'<!-- wp:core/void /-->'
			)
		);
	}

	function test_block_void_with_empty_attrs() {
		$this->assertEquals(
			[ [ 'blockName' => 'core/void', 'attrs' => [], 'rawContent' => '' ], '' ],
			Gutenberg_Block_Parser::block_void(
				'<!-- wp:core/void {} /-->'
			)
		);
	}

	function test_block_void_with_non_empty_attrs() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/void',
				'attrs' => [
					'val' => 1337
				],
				'rawContent' => ''
			], '' ],
			Gutenberg_Block_Parser::block_void(
				'<!-- wp:core/void { "val": 1337 } /-->'
			)
		);
	}
}
