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

	function test_block_opening_no_attrs() {
		$this->assertEquals(
			[ [ 'core/void', [] ], '' ],
			Gutenberg_Block_Parser::block_opening( '<!-- wp:core/void /-->' )
		);
	}

	function test_block_opening_with_empty_attrs() {
		$this->assertEquals(
			[ [ 'core/void', [] ], '' ],
			Gutenberg_Block_Parser::block_opening( '<!-- wp:core/void {} /-->' )
		);
	}

	function test_block_opening_with_non_empty_attrs() {
		$this->assertEquals(
			[ [ 'core/void', [ 'val' => 1337 ] ], '' ],
			Gutenberg_Block_Parser::block_opening( '<!-- wp:core/void { "val": 1337 } /-->' )
		);
	}

	function test_block_opening_with_extra_space() {
		$this->assertEquals(
			[ [ 'core/void', [ 'weird' => true ] ], '' ],
			Gutenberg_Block_Parser::block_opening(
				"<!-- \t \n\r \nwp:core/void\n{    \"weird\":true }\n\t  \t \r/-->"
			)
		);
	}

	function test_block_opening_leaves_remaining() {
		list( /* result */, $remaining ) = Gutenberg_Block_Parser::block_opening(
			'<!-- wp:core/void /-->just some text'
		);

		$this->assertEquals( 'just some text', $remaining );
	}

	function test_block_opening_fails_text() {
		$this->assertEquals( [], Gutenberg_Block_Parser::block_opening( 'just a test' ) );
	}

	function test_block_opening_fails_closer() {
		$this->assertEquals( [], Gutenberg_Block_Parser::block_opening( '<!-- /wp:closer -->' )  );
	}

	function test_block_opening_fails_html_comment() {
		$this->assertEquals( [], Gutenberg_Block_Parser::block_opening( '<!-- just a comment -->' ) );
	}

	function test_block_closing() {
		$this->assertEquals(
			[ 'core/void', '' ],
			Gutenberg_Block_Parser::block_closing( '<!-- /wp:core/void -->' )
		);
	}

	function test_block_closing_fails_with_opening() {
		$this->assertEquals( [], Gutenberg_Block_Parser::block_closing( '<!-- wp:core/void /-->' ) );
	}

	function test_raw_chunk_text() {
		$this->assertEquals(
			[ 'test', '' ],
			Gutenberg_Block_Parser::raw_chunk('test' )
		);
	}

	function test_raw_chunk_with_opening() {
		$this->assertEquals(
			[ 'test', '<!-- wp:core/void /-->' ],
			Gutenberg_Block_Parser::raw_chunk( 'test<!-- wp:core/void /-->' )
		);
	}

	function test_raw_chunk_with_closing() {
		$this->assertEquals(
			[ 'test', '<!-- /wp:core/void /-->' ],
			Gutenberg_Block_Parser::raw_chunk( 'test<!-- /wp:core/void /-->' )
		);
	}

	function test_raw_chunk_eats_html_comments() {
		$this->assertEquals(
			[ 'test<!-- just a comment -->text', '' ],
			Gutenberg_Block_Parser::raw_chunk( 'test<!-- just a comment -->text' )
		);
	}

	function test_parse_empty_document() {
		$this->assertEquals(
			[],
			Gutenberg_Block_Parser::parse( '' )
		);
	}

	function test_parse_simple_block() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/void',
				'attrs' => [],
				'rawContent' => ''
			] ],
			Gutenberg_Block_Parser::parse( '<!-- wp:core/void --><!-- /wp:core/void -->' )
		);
	}

	function test_parse_simple_block_with_attrs() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/void',
				'attrs' => [ 'method' => 'GET' ],
				'rawContent' => ''
			] ],
			Gutenberg_Block_Parser::parse( '<!-- wp:core/void { "method": "GET" } --><!-- /wp:core/void -->' )
		);
	}

	function test_parse_two_simple_blocks() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/one',
				'attrs' => [],
				'rawContent' => ''
			], [
				'blockName' => 'core/two',
				'attrs' => [],
				'rawContent' => ''
			]  ],
			Gutenberg_Block_Parser::parse( '<!-- wp:core/one --><!-- /wp:core/one --><!-- wp:core/two --><!-- /wp:core/two -->' )
		);
	}

	function test_parse_freeform() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/freeform',
				'attrs' => [],
				'rawContent' => 'test'
			] ],
			Gutenberg_Block_Parser::parse( 'test' )
		);
	}

	function test_parse_raw_chunk_prefix() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/freeform',
				'attrs' => [],
				'rawContent' => '<p>HTML</p>'
			], [
				'blockName' => 'core/void',
				'attrs' => [],
				'rawContent' => ''
			] ],
			Gutenberg_Block_Parser::parse( '<p>HTML</p><!-- wp:core/void --><!-- /wp:core/void -->' )
		);
	}

	// currently we don't allow nesting
	function test_parse_nested_block() {
		$this->assertEquals(
			[ [
				'blockName' => 'core/outer',
				'attrs' => [],
				'rawContent' => 'beforeinsideafter'
			] ],
			Gutenberg_Block_Parser::parse(
				'<!-- wp:core/outer -->before<!-- wp:core/inner -->inside<!-- /wp:core/inner -->after<!-- /wp:core/outer -->'
			)
		);
	}
}
