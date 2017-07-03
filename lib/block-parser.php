<?php

if (!class_exists('Gutenberg_Block_Parser_State', false)):

class Gutenberg_Block_Parser_State {
	public $block_stack;
}

endif;

if (!class_exists('Gutenberg_Block_Parser', false)):

class Gutenberg_Block_Parser {
	const BLOCK_COMMENT_OPEN  = '(^<!--)';
	const BLOCK_COMMENT_CLOSE = '(^/?-->)';
	const BLOCK_NAME          = '(^[[:alpha:]](?:[[:alnum:]]|/[[:alnum:]])*)i';
	const BLOCK_ATTRIBUTES    = '(^{(?:((?!}[ \t\r\n]+/?-->).)*)})';
	const WS                  = '(^[ \t\r\n])';
	const WSS                 = '(^[ \t\r\n]+)';

	const MAX_RUNTIME         = 1; // give up after one second

	public function parse($input) {
		$tic = microtime( true );

		// trampoline for stack-safe recursion of the actual parser
		while ( $this->input && ( microtime( true ) - $tic ) < self::MAX_RUNTIME ) {
			return $this->proceed( $input );
		}
	}

	public function proceed( $input ) {
		return succeed( 'test', $input );
	}

	public static function block_void( $input ) {
		$result = self::sequence( array(
			array( 'self::ignore', array( 'self::match', array( '(^<!--[ \t\r\n]+wp:)' ) ) ),
			array( 'self::match',  array( self::BLOCK_NAME ) ),
			array( 'self::first_of', array( array(
				array( 'self::ignore',   array( 'self::match', array( '(^[ \t\r\n]+/-->)' ) ) ),
				array( 'self::sequence', array( array(
					array( 'self::ignore', array( 'self::match', array( self::WSS ) ) ),
					array( 'self::match',  array( self::BLOCK_ATTRIBUTES ) ),
					array( 'self::ignore', array( 'self::match', array( '(^[ \t\r\n]+/-->)' ) ) )
				) ) )
			) ) )
		), $input );

		if ( empty( $result ) ) {
			return array();
		}

		list( list( list( $blockName ), list( list( $raw_attrs ) ) ), $remaining ) = $result;
		$attrs = $raw_attrs
			? json_decode( $raw_attrs, true )
			: array();

		return array( self::block( $blockName, $attrs, '' ), $remaining );
	}

	//-----------------------------------------
	// Parser a :: String -> [ ( a, String ) ]
	//
	// A parser is a function which takes a string
	// and returns a list of things and strings
	//
	// An empty list is a failed parse
	//
	// The polymorphic "a" will eventually be a block
	//-----------------------------------------
	public static function succeed( $value, $input ) {
		return array( array( $value, $input ) );
	}

	public static function fail( $input ) {
		return array();
	}

	public static function ignore( $parser, $parser_args, $input ) {
		$result = call_user_func_array( $parser, array_merge( $parser_args, array( $input ) ) );

		if ( empty( $result ) ) {
			return array();
		}

		list( /* production */, $remaining ) = $result;

		return array( array(), $remaining );
	}

	public static function literal( $value, $input ) {
		return strpos( $input, $value ) === 0
			? array( $value, substr( $input, strlen( $value ) ) )
			: array();
	}

	public static function match( $pattern, $input ) {
		$matches = array();

		$is_match = preg_match( $pattern, $input, $matches );

		return $is_match
			? array( $matches, substr( $input, strlen( $matches[ 0 ] ) ) )
			: array();
	}

	public static function map( $f, $parser, $parser_args, $input ) {
		$result = call_user_func_array(
			$f,
			call_user_func_array(
				$parser,
				array_merge( $parser_args, array( $input ) )
			)
		);

		return ! empty( $result )
			? array( $result[ 0 ], $input )
			: array();
	}

	public static function sequence( $parsers_and_args, $input ) {
		$output = array();
		$remaining = $input;

		foreach ( $parsers_and_args as $parser_and_args ) {
			list( $parser, $parser_args ) = $parser_and_args;

			$result = call_user_func_array( $parser, array_merge( $parser_args, array( $remaining ) ) );

			if ( empty( $result ) ) {
				return array();
			}

			list( $next, $remaining ) = $result;
			$output[] = $next;
		}

		return array( array_values( array_filter( $output, 'self::is_not_empty' ) ), $remaining );
	}

	public static function is_not_empty( $value ) {
		return ! empty( $value );
	}

	public static function first_of( $parsers_and_args, $input ) {
		foreach ( $parsers_and_args as $parser_and_args ) {
			list( $parser, $parser_args ) = $parser_and_args;

			$result = call_user_func_array( $parser, array_merge( $parser_args, array( $input ) ) );

			if ( ! empty( $result ) ) {
				return $result;
			}
		}

		return array();
	}

	public static function zero_or_more( $parser, $parser_args, $input ) {
		$output = array();
		$remaining = $input;

		while ( true ) {
			$result = call_user_func_array( $parser, array_merge( $parser_args, array( $remaining ) ) );
			if ( empty( $result ) ) {
				return array( $output, $remaining );
			}

			list( $next, $remaining ) = $result;
			$output[] = $next;
		}
	}

	public static function one_or_more( $parser, $parser_args, $input ) {
		$output = array();
		$remaining = $input;

		while ( true ) {
			$result = call_user_func_array( $parser, array_merge( $parser_args, array( $remaining ) ) );
			if ( empty( $result ) ) {
				return empty( $output )
					? array()
					: array( $output, $remaining );
			}

			list( $next, $remaining ) = $result;
			$output[] = $next;
		}
	}

	public static function block( $blockName, $attrs, $rawContent ) {
		return array(
			'blockName'  => $blockName,
			'attrs'      => $attrs,
			'rawContent' => $rawContent
		);
	}

	public static function freeform( $rawContent ) {
		return self::block( 'freeform', array(), $rawContent );
	}
}

endif;
