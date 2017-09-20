<?php

if (!class_exists('Gutenberg_Block_Parser', false)):

class Gutenberg_Block_Parser {
	const BLOCK_COMMENT_OPEN  = '(^<!--[ \t\r\n]+wp:)';
	const BLOCK_COMMENT_CLOSE = '(^[ \t\r\n]+/?-->)';
	const BLOCK_NAME          = '(^[[:alpha:]](?:[[:alnum:]]|/[[:alnum:]])*)i';
	const BLOCK_ATTRIBUTES    = '(^{(?:((?!}[ \t\r\n]+/?-->).)*)})';
	const WS                  = '(^[ \t\r\n])';
	const WSS                 = '(^[ \t\r\n]+)';

	const MAX_RUNTIME         = 1; // give up after one second

	public static function parse($input) {
		$tic = microtime( true );

		$remaining = $input;
		$output = array();
		$block_stack = array();

		// trampoline for stack-safe recursion of the actual parser
		while ( $remaining && ( microtime( true ) - $tic ) < self::MAX_RUNTIME ) {
			list(
				$remaining,
				$output,
				$block_stack,
			) = self::proceed( $remaining, $output, $block_stack );
		}

		return $output;
	}

	public static function proceed( $input, $output, $block_stack ) {
		// open a new block
		$opener = self::block_opening( $input );

		if ( ! empty( $opener ) ) {
			list( list( $block_name, $attrs ), $remaining ) = $opener;

			return array(
				$remaining,
				$output,
				array_merge( $block_stack, array( self::block( $block_name, $attrs, '' ) ) )
			);
		}

		$open_blocks = array_slice( $block_stack, 0 );
		$this_block = array_pop( $open_blocks );

		// close out the block
		$closer = self::block_closing( $input );

		if ( ! empty( $closer ) ) {
			// must be in an open block
			if ( ! $this_block ) {
				return array(
					'',
					array_merge( $output, array( self::freeform( $input ) ) ),
					$block_stack
				);
			}

			list( $block_name, $remaining ) = $closer;

			// we have a block mismatch and can go no further
			if ( $block_name !== $this_block[ 'blockName' ] ) {
				return array(
					'',
					array_merge( $output, array( self::freeform( $input ) ) ),
					$block_stack
				);
			}

			// close the block and update the parent's raw content
			$parent_block = array_pop( $open_blocks );

			// not every block has a parent
			if ( ! isset( $parent_block ) ) {
				return array(
					$remaining,
					array_merge( $output, array( $this_block ) ),
					$open_blocks
				);
			}

			$parent_block[ 'rawContent' ] .= $this_block[ 'rawContent' ];

			return array(
				$remaining,
				$output,
				array_merge( $open_blocks, array( $parent_block ) )
			);
		}

		// eat raw content
		$chunk = self::raw_chunk( $input );

		if ( ! empty( $chunk ) ) {
			list( $raw_content, $remaining ) = $chunk;

			// we can come before a block opens
			if ( ! $this_block ) {
				return array(
					$remaining,
					array_merge( $output, array( self::freeform( $raw_content ) ) ),
					$block_stack
				);
			}

			// or we can add to the inside content of an open block
			$this_block[ 'rawContent' ] .= $raw_content;

			return array(
				$remaining,
				$output,
				array_merge( $open_blocks, array( $this_block ) )
			);
		}
	}

	public static function block_opening( $input ) {
		$result = self::sequence( array(
			array( 'self::ignore', array( 'self::match', array( self::BLOCK_COMMENT_OPEN ) ) ),
			array( 'self::match',  array( self::BLOCK_NAME ) ),
			array( 'self::first_of', array( array(
				array( 'self::ignore',   array( 'self::match', array( self::BLOCK_COMMENT_CLOSE ) ) ),
				array( 'self::sequence', array( array(
					array( 'self::ignore', array( 'self::match', array( self::WSS ) ) ),
					array( 'self::match',  array( self::BLOCK_ATTRIBUTES ) ),
					array( 'self::ignore', array( 'self::match', array( self::BLOCK_COMMENT_CLOSE ) ) )
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

		return array( array( $blockName, $attrs ), $remaining );
	}

	public static function block_closing( $input ) {
		$result = self::sequence( array(
			array( 'self::ignore', array( 'self::match', array( '(^<!--[ \t\r\n]+/wp:)' ) ) ),
			array( 'self::match', array( self::BLOCK_NAME ) ),
			array( 'self::ignore', array( 'self::match', array( self::BLOCK_COMMENT_CLOSE ) ) )
		), $input );

		if ( empty( $result ) ) {
			return array();
		}

		list( list( list( $blockName ) ), $remaining ) = $result;

		return array( $blockName, $remaining );
	}

	public static function raw_chunk( $input ) {
		$result = self::match( '(^((?!<!--[ \t\r\n]+/?wp:).)*)', $input );

		if ( empty( $result ) ) {
			return $result;
		}

		list( list( $chunk ), $remaining ) = $result;

		return array( $chunk, $remaining );
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
		return self::block( 'core/freeform', array(), $rawContent );
	}
}

endif;
