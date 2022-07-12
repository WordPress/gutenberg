<?php

class WP_HTML_Tokenizer {

	private $html;

	public function __construct( $html ) {
		$this->html = $html;
	}

	function stream() {
		$next_state    = 'data';
		$current_index = 0;
		do {
			switch ( $next_state ) {
				case 'data':
					$result = $this->scan_data( $current_index );
					break;
				case 'before-attribute-name':
					$result = $this->scan_before_attribute_name( $current_index );
					break;
				case 'before-attribute-value':
					$result = $this->scan_before_attribute_value( $current_index );
					break;
				default:
					return;
					break 2;
			}
			if ( $result['token'] !== 'ignore' ) {
				yield $result['token'];
			}
			$next_state = $result['next_state'];
			if ( $next_state === 'eof' ) {
				break;
			}
			$current_index = $result['start_at'];
		} while ( $next_state );
	}

	protected function scan_data( $start_at ) {
		$matches = null;
		$result  = preg_match(
			'~<!--(?>.*?-->)|<!\[CDATA\[(?>.*?>)|<\?(?>.*?)>|<(?P<TAG>[a-z][^\t\x{0A}\x{0C} \/>]*)~mui',
			$this->html,
			$matches,
			0,
			$start_at
		);

		if ( 1 !== $result ) {
			return [
				'token'      => array( 'type' => 'eof' ),
				'next_state' => 'eof',
			];
		}

		$full_match = $matches[0];

		if ( ! isset( $matches['TAG'] ) ) {
			return [
				'token'      => array( 'type' => 'ignore' ),
				'next_state' => 'data',
				'start_at'   => $start_at + strlen( $full_match ),
			];
		}

		return [
			'token'      => array( 'type' => 'tag-opener', 'value' => self::comparable( $matches['TAG'] ) ),
			'next_state' => 'before-attribute-name',
			'start_at'   => $start_at + strlen( $full_match ),
		];
	}


	protected function scan_before_attribute_name( $start_at ) {
		$matches = null;
		$result  = preg_match(
			'~[\x{09}\x{0a}\x{0c}\x{0d} ]+(?:(?P<CLOSER>\/?>)|(?P<NAME>(?:=[^=\/>\t\x{09}\x{0C} ]*|[^=\/>\t\x{09}\x{0C} ]+))(?P<IGNORED>=|\/?>)?)~miu',
			$this->html,
			$matches,
			0,
			$start_at
		);

		if ( 1 !== $result ) {
			return [
				'token'      => array( 'type' => 'eof' ),
				'next_state' => 'eof',
			];
		}

		$full_match = $matches[0];

		if ( ! empty( $matches['CLOSER'] ) ) {
			return [
				'token'      => [ 'type' => 'tag-closer' ],
				'next_state' => 'data',
				'start_at'   => $start_at + strlen( $full_match ),
			];
		}

		if ( ! isset( $matches['NAME'] ) ) {
			throw new Exception( 'Something went wrong' );
		}

		$name = $matches['NAME'];

		// This is a keyword attribute followed by another attribute name.
		if ( empty( $matches['IGNORED'] ) ) {
			return [
				'token'      => [ 'type' => 'single-attribute', 'value' => $name ],
				'next_state' => 'before-attribute-name',
				'start_at'   => $start_at + strlen( $full_match ),
			];
		}

		$ignored = $matches['IGNORED'];

		if ( '=' === $ignored ) {
			return [
				'token'      => [ 'type' => 'attribute-name', 'value' => $this->comparable( $name ) ],
				'next_state' => 'before-attribute-value',
				'start_at'   => $start_at + strlen( $full_match ) - strlen( $ignored ),
			];
		}

		return [
			'token'      => [ 'type' => 'tag-closer' ],
			'next_state' => 'data',
			'start_at'   => $start_at + strlen( $full_match ),
		];
	}

	protected function scan_before_attribute_value( $start_at ) {
		$matches = null;
		$result  = preg_match(
			'~[\x{09}\x{0a}\x{0c}\x{0d} ]*=[\x{09}\x{0a}\x{0c}\x{0d} ]*(?:(?P<CLOSER>\/?>)|(?P<FIRST_CHAR>(.)))~miu',
			$this->html,
			$matches,
			0,
			$start_at
		);

		if ( 1 !== $result ) {
			throw new Exception( 'Something went wrong' );
		}


		if ( ! empty( $matches['CLOSER'] ) ) {
			return [
				'token'      => [ 'type' => 'tag-closer' ],
				'next_state' => 'data',
				'start_at'   => $start_at + strlen( $full_match ),
			];
		}

		if ( $matches['FIRST_CHAR'] === "'" ) {
			return [
				'token'      => [ 'type' => 'ignore' ],
				'next_state' => 'attribute-value-single-quoted',
				'start_at'   => $start_at + strlen( $full_match ) - 1,
			];
		}

		if ( $matches['FIRST_CHAR'] === '"' ) {
			return [
				'token'      => [ 'type' => 'ignore' ],
				'next_state' => 'attribute-value-double-quoted',
				'start_at'   => $start_at + strlen( $full_match ) - 1,
			];
		}

		return [
			'token'      => [ 'type' => 'ignore' ],
			'next_state' => 'attribute-value-double-unquoted',
			'start_at'   => $start_at + strlen( $full_match ) - 1,
		];
	}

	private function comparable( $word ) {
		return strtolower( trim( $word ) );
	}

}

$inst = new WP_HTML_Tokenizer( '<div attr_1="1" attr_2 />' );
foreach ( $inst->stream() as $item ) {
//	var_dump( $item );
}
//var_dump( 'done' );
