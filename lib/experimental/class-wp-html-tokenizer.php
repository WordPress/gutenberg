<?php

class WP_HTML_Tokenizer {

	const STATE_DATA = 'STATE_DATA';
	const STATE_BEFORE_ATTRIBUTE_NAME = 'STATE_BEFORE_ATTRIBUTE_NAME';
	const STATE_BEFORE_ATTRIBUTE_VALUE = 'STATE_BEFORE_ATTRIBUTE_VALUE';
	const STATE_ATTRIBUTE_VALUE_SINGLE_QUOTED = 'STATE_ATTRIBUTE_VALUE_SINGLE_QUOTED';
	const STATE_ATTRIBUTE_VALUE_DOUBLE_QUOTED = 'STATE_ATTRIBUTE_VALUE_DOUBLE_QUOTED';
	const STATE_ATTRIBUTE_VALUE_UNQUOTED = 'STATE_ATTRIBUTE_VALUE_UNQUOTED';
	const STATE_EOF = 'STATE_EOF';

	private $html;

	public function __construct( $html ) {
		$this->html = $html;
	}

	function stream( $start_at = 0 ) {
		$next_state    = self::STATE_DATA;
		$current_index = $start_at;
		$last_token    = null;
		do {
			switch ( $next_state ) {
				case self::STATE_DATA:
					$result = $this->scan_data( $current_index );
					break;
				case self::STATE_BEFORE_ATTRIBUTE_NAME:
					$result = $this->scan_before_attribute_name( $current_index );
					break;
				case self::STATE_BEFORE_ATTRIBUTE_VALUE:
					$result = $this->scan_before_attribute_value( $current_index );
					break;
				case self::STATE_ATTRIBUTE_VALUE_SINGLE_QUOTED:
					$result = $this->scan_attribute_value_quoted( $current_index, "'" );
					break;
				case self::STATE_ATTRIBUTE_VALUE_DOUBLE_QUOTED:
					$result = $this->scan_attribute_value_quoted( $current_index, '"' );
					break;
				case self::STATE_ATTRIBUTE_VALUE_UNQUOTED:
					$result = $this->scan_attribute_value_unquoted( $current_index, '"' );
					break;
				default:
					return;
			}
			if ( ! empty( $result['token'] ) ) {
//				var_dump($result['token']->getType());
				if ( $result['token']->getType() === WP_HTML_Token::ATTRIBUTE_VALUE ) {
					yield new WP_HTML_Attribute( $last_token, $result['token'] );
				} elseif ( $result['token']->getType() !== WP_HTML_Token::ATTRIBUTE_NAME ) {
					yield $result['token'];
				}
				$last_token = $result['token'];
			}
			$next_state = $result['next_state'];
			if ( $next_state === self::STATE_EOF ) {
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
			PREG_OFFSET_CAPTURE,
			$start_at
		);

		if ( 1 !== $result ) {
			return array(
				'token'      => new WP_HTML_Token( WP_HTML_Token::EOF ),
				'next_state' => self::STATE_EOF,
			);
		}

		$full_match = $matches[0][0];

		if ( ! isset( $matches['TAG'] ) ) {
			return array(
				'next_state' => self::STATE_DATA,
				'start_at'   => $start_at + strlen( $full_match ),
			);
		}

		return array(
			'token'      => new WP_HTML_Token( WP_HTML_Token::TAG_OPENER, $matches['TAG'][0], $matches['TAG'][1] ),
			'next_state' => self::STATE_BEFORE_ATTRIBUTE_NAME,
			'start_at'   => $start_at + strlen( $full_match ),
		);
	}

	protected function scan_before_attribute_name( $start_at ) {
		$matches = null;

		$result = preg_match(
			'~[\x{09}\x{0a}\x{0c}\x{0d} ]+(?:(?P<CLOSER>\/?>)|(?P<NAME>(?:=[^=\/>\t\x{09}\x{0C} ]*|[^=\/>\t\x{09}\x{0C} ]+))(?P<IGNORED>=|\/?>)?)~miu',
			$this->html,
			$matches,
			PREG_OFFSET_CAPTURE,
			$start_at
		);

		if ( 1 !== $result ) {
			return array(
				'token'      => new WP_HTML_Token( WP_HTML_Token::EOF ),
				'next_state' => self::STATE_EOF,
			);
		}

		$full_match = $matches[0][0];

		if ( ! empty( $matches['CLOSER'] ) && $matches['CLOSER'][1] !== - 1 ) {
			return array(
				'token'      => new WP_HTML_Token( WP_HTML_Token::TAG_CLOSER, $matches['CLOSER'][0], $matches['CLOSER'][1] ),
				'next_state' => self::STATE_DATA,
				'start_at'   => $start_at + strlen( $full_match ),
			);
		}

		if ( empty( $matches['NAME'] ) || $matches['NAME'][1] === - 1 ) {
			throw new Exception( 'Something went wrong' );
		}

		// This is a keyword attribute followed by another attribute name.
		if ( empty( $matches['IGNORED'] ) || $matches['IGNORED'][1] === - 1 ) {
			return array(
				'token'      => new WP_HTML_Token( WP_HTML_Token::FLAG_ATTRIBUTE, $matches['NAME'][0], $matches['NAME'][1] ),
				'next_state' => self::STATE_BEFORE_ATTRIBUTE_NAME,
				'start_at'   => $start_at + strlen( $full_match ),
			);
		}

		if ( '=' === $matches['IGNORED'][0] ) {
			return array(
				'token'      => new WP_HTML_Token( WP_HTML_Token::ATTRIBUTE_NAME, $matches['NAME'][0], $matches['NAME'][1] ),
				'next_state' => self::STATE_BEFORE_ATTRIBUTE_VALUE,
				'start_at'   => $start_at + strlen( $full_match ) - strlen( $matches['IGNORED'][0] ),
			);
		}

		return array(
			'token'      => new WP_HTML_Token( WP_HTML_Token::TAG_CLOSER, $matches['CLOSER'][0], $matches['CLOSER'][1] ),
			'next_state' => self::STATE_DATA,
			'start_at'   => $start_at + strlen( $full_match ),
		);
	}

	protected function scan_before_attribute_value( $start_at ) {
		$matches = null;
		$result  = preg_match(
			'~[\x{09}\x{0a}\x{0c}\x{0d} ]*=[\x{09}\x{0a}\x{0c}\x{0d} ]*(?:(?P<CLOSER>\/?>)|(?P<FIRST_CHAR>(.)))~miu',
			$this->html,
			$matches,
			PREG_OFFSET_CAPTURE,
			$start_at
		);

		if ( 1 !== $result ) {
			throw new Exception( 'Something went wrong' );
		}

		$full_match = $matches[0][0];

		if ( ! empty( $matches['CLOSER'] ) && $matches['CLOSER'][1] !== - 1 ) {
			return array(
				'token'      => new WP_HTML_Token( WP_HTML_Token::TAG_CLOSER, $matches['CLOSER'][0], $matches['CLOSER'][1] ),
				'next_state' => self::STATE_DATA,
				'start_at'   => $start_at + strlen( $full_match ),
			);
		}

		if ( $matches['FIRST_CHAR'][0] === "'" ) {
			return array(
				'next_state' => self::STATE_ATTRIBUTE_VALUE_SINGLE_QUOTED,
				'start_at'   => $start_at + strlen( $full_match ) - 1,
			);
		}

		if ( $matches['FIRST_CHAR'][0] === '"' ) {
			return array(
				'next_state' => self::STATE_ATTRIBUTE_VALUE_DOUBLE_QUOTED,
				'start_at'   => $start_at + strlen( $full_match ) - 1,
			);
		}

		return array(
			'next_state' => self::STATE_ATTRIBUTE_VALUE_UNQUOTED,
			'start_at'   => $start_at + strlen( $full_match ) - 1,
		);
	}

	protected function scan_attribute_value_quoted( $start_at, $quote_character ) {
		$matches = null;
		$result  = preg_match(
			"~\s*{$quote_character}(?P<VALUE>[^{$quote_character}]*){$quote_character}~miu",
			$this->html,
			$matches,
			PREG_OFFSET_CAPTURE,
			$start_at
		);

		if ( 1 !== $result ) {
			throw new Exception( 'Something went wrong' );
		}

		$full_match = $matches[0][0];

		return array(
			'token'      => new WP_HTML_Token( WP_HTML_Token::ATTRIBUTE_VALUE, $matches['VALUE'][0], $matches['VALUE'][1] ),
			'next_state' => self::STATE_BEFORE_ATTRIBUTE_NAME,
			'start_at'   => $start_at + strlen( $full_match ),
		);
	}

	protected function scan_attribute_value_unquoted( $start_at ) {
		$matches = null;
		$result  = preg_match(
			"~(?P<VALUE>[^=\/>\t\x{09}\x{0C} ]*)~miu",
			$this->html,
			$matches,
			PREG_OFFSET_CAPTURE,
			$start_at
		);

		if ( 1 !== $result ) {
			throw new Exception( 'Something went wrong' );
		}

		$full_match = $matches[0][0];

		return array(
			'token'      => new WP_HTML_Token( WP_HTML_Token::ATTRIBUTE_VALUE, $matches['VALUE'][0], $matches['VALUE'][1] ),
			'next_state' => self::STATE_BEFORE_ATTRIBUTE_NAME,
			'start_at'   => $start_at + strlen( $full_match ) - 1,
		);
	}

}

function tokenizeHTML( $html, $start_at ) {
	$tokenizer = new WP_HTML_Tokenizer( $html );
	yield from $tokenizer->stream( $start_at );
}

class Matcher_Match {
	private $tag;
	private $attribute;
	private $attribute_value;

	/**
	 * @param $tag
	 * @param $attribute
	 */
	public function __construct( $tag, $attribute_name, $attribute_value ) {
		$this->tag             = $tag;
		$this->attribute_name  = $attribute_name;
		$this->attribute_value = $attribute_value;
	}

	/**
	 * @return mixed
	 */
	public function getTag() {
		return $this->tag;
	}

	/**
	 * @return mixed
	 */
	public function getAttributeName() {
		return $this->attribute_name;
	}

	/**
	 * @return mixed
	 */
	public function getAttributeValue() {
		return $this->attribute_value;
	}

}


class WP_HTML_Token {

	const TAG_OPENER = 'TAG_OPENER';
	const TAG_CLOSER = 'TAG_CLOSER';
	const FLAG_ATTRIBUTE = 'FLAG_ATTRIBUTE';
	const ATTRIBUTE = 'ATTRIBUTE';
	const ATTRIBUTE_NAME = 'ATTRIBUTE_NAME';
	const ATTRIBUTE_VALUE = 'ATTRIBUTE_VALUE';
	const EOF = 'EOF';

	private $type;
	private $offset;
	private $value;

	public function __construct( $name, $value = null, $offset = null ) {
		$this->type   = $name;
		$this->offset = $offset;
		if ( $value !== null ) {
			$this->value = $this->comparable( $value );
		}
	}

	public function equals( WP_HTML_Token $token2 ) {
		return $this->getType() === $token2->getType() && $this->getValue() === $token2->getValue();
	}

	private function comparable( $word ) {
		return strtolower( trim( $word ) );
	}

	/**
	 * @return mixed
	 */
	public function getType() {
		return $this->type;
	}

	/**
	 * @return mixed|null
	 */
	public function getValue() {
		return $this->value;
	}

	/**
	 * @return mixed|null
	 */
	public function getStartOffset() {
		return $this->offset;
	}

	/**
	 * @return mixed|null
	 */
	public function getEndOffset() {
		if ( $this->getValue() === null ) {
			return null;
		}

		return $this->offset + strlen( $this->getValue() );
	}

}

class WP_HTML_Attribute extends WP_HTML_Token {
	private $name;
	private $value;

	/**
	 * @param $name
	 * @param $value
	 */
	public function __construct( $name, $value ) {
		$this->name  = $name;
		$this->value = $value;
		parent::__construct( parent::ATTRIBUTE, $name->getValue(), $name->getStartOffset() );
	}

	/**
	 * @return mixed
	 */
	public function getName() {
		return $this->name;
	}

	/**
	 * @return mixed
	 */
	public function getValue() {
		return $this->value;
	}

}


class FluidMamo {
	private $html;
	private $match;
	private $tokenizer;

	public function __construct( $html ) {
		$this->html = $html;
	}

	public function findNext( $match_tag_name, $match_class_name = null, $match_data_attribute = null, $nth_match = 0 ) {
		$n_matched_so_far      = 0;
		$try_match_current_tag = false;
		$match_template        = array();
		if ( $match_tag_name ) {
			$match_template['tag'] = false;
		}
		if ( $match_class_name ) {
			$match_template['class_name'] = false;
		}
		if ( $match_data_attribute ) {
			$match_template['data_attribute'] = false;
		}
		$current_tag       = null;
		$current_match     = $match_template;
		$current_attribute = null;

		$start_at = $this->match ? $this->match->getTag()->getEndOffset() - 1 : 0;
		foreach ( $this->tokenize( $start_at ) as $token ) {
			if ( $token->getType() === WP_HTML_Token::TAG_OPENER ) {
				$current_tag           = $token;
				$try_match_current_tag = ! $match_tag_name || $current_tag->getValue() === $match_tag_name;
				$current_match         = $match_template;
				if ( $match_tag_name ) {
					$current_match['tag'] = $token->getValue() === $match_tag_name;
				}
			} elseif ( $token->getType() === WP_HTML_Token::ATTRIBUTE_NAME ) {
				$current_attribute = $token;
			}

			if ( ! $try_match_current_tag ) {
				continue;
			}

			// Match class name.
			if ( $match_class_name && ! $current_match['class_name'] && $token->getType() === WP_HTML_Token::ATTRIBUTE_VALUE && $current_attribute && $current_attribute->getValue() === 'class' ) {
				$class_names                 = preg_split( '~\s+~', $token->getValue() );
				$has_class                   = in_array( $match_class_name, $class_names, true );
				$current_match['class_name'] = $has_class;
			}

			// Match data attribute name.
			if ( $match_data_attribute && ! $current_match['data_attribute'] ) {
				$expected_name  = $match_data_attribute[0];
				$expected_value = $match_data_attribute[1];
				if ( $token->getType() === WP_HTML_Token::ATTRIBUTE_VALUE && $current_attribute->getValue() === "$expected_name" ) {
					if ( $token->getValue() === $expected_value ) {
						$current_match['data_attribute'] = true;
					}
				} elseif ( $token->getType() === WP_HTML_Token::FLAG_ATTRIBUTE && true === $expected_value ) {
					$current_match['data_attribute'] = true;
				}
			}

			$does_match = count( array_filter( array_values( $current_match ) ) ) === count( $current_match );
			if ( $does_match ) {
				if ( $n_matched_so_far === $nth_match ) {
					$this->match = new Matcher_Match( $current_tag, $current_attribute, $token );
					break;
				}
				++ $n_matched_so_far;
			}

			if ( $token->getType() === WP_HTML_Token::TAG_CLOSER ) {
				$current_tag = null;
			} elseif ( $token->getType() !== WP_HTML_Token::ATTRIBUTE_NAME && $token->getType() !== WP_HTML_Token::ATTRIBUTE_VALUE ) {
				$current_attribute = null;
			}
		}

		return $this;
	}

	private function tokenize( $start_at = 0 ) {
		$tokenizer = new WP_HTML_Tokenizer( $this->html );

		return $tokenizer->stream( $start_at );
	}

	/**
	 * @return mixed
	 */
	public function getHtml() {
		return $this->html;
	}

	function addClass( $new_class ) {
		return $this->updateAttribute( 'class', function ( $old_value ) use ( $new_class ) {
			$current_classes = preg_split( '~\s+~', $old_value );
			$new_value       = $old_value;
			if ( ! in_array( $new_class, $current_classes, true ) ) {
				$new_value .= $new_class;
			}

			return $new_value;
		} );
	}

	function setAttribute( $attr_name, $value ) {
		return $this->updateAttribute( $attr_name, function () use ( $value ) {
			return $value;
		} );
	}

	function updateAttribute( $attr_name, $updater ) {
		foreach ( $this->tokenize( $this->match->getTag()->getStartOffset() - 1 ) as $token ) {
			if ( $token->getType() === WP_HTML_Token::ATTRIBUTE && $token->getName()->getValue() === $attr_name ) {
				$current_value = $token->getValue()->getValue();
				$before_value  = substr(
					$this->html,
					0,
					$token->getValue()->getStartOffset()
				);
				$after_value   = substr(
					$this->html,
					$token->getValue()->getEndOffset()
				);

				$this->html = "$before_value{$updater($current_value)}$after_value";
				break;
			} elseif ( $token->getType() === WP_HTML_Token::FLAG_ATTRIBUTE && $token->getValue() === $attr_name ) {
				$before_value = substr(
					$this->html,
					0,
					$token->getEndOffset()
				);
				$after_value  = substr(
					$this->html,
					$token->getEndOffset()
				);

				$this->html = "$before_value=\"{$updater(true)}\" $after_value";
				break;
			} elseif ( $token->getType() === WP_HTML_Token::TAG_CLOSER ) {
				$before_closer_start = substr(
					$this->html,
					0,
					$token->getStartOffset()
				);
				$after_closer_start  = substr(
					$this->html,
					$token->getStartOffset()
				);

				$this->html = "$before_closer_start $attr_name=\"{$updater('')}\"$after_closer_start";
				break;
			}
		}

		return $this;
	}

	function removeAttribute( $attr_name ) {
		foreach ( $this->tokenize( $this->match->getTag()->getStartOffset() - 1 ) as $token ) {
			if ( $token->getType() === WP_HTML_Token::ATTRIBUTE && $token->getName()->getValue() === $attr_name ) {
				$before_declaration = substr(
					$this->html,
					0,
					$token->getName()->getStartOffset()
				);
				$after_declaration  = substr(
					$this->html,
					$token->getValue()->getEndOffset() + 1
				);

				$this->html = "$before_declaration $after_declaration";
				break;
			} elseif ( $token->getType() === WP_HTML_Token::FLAG_ATTRIBUTE && $token->getValue() === $attr_name ) {
				$before_declaration = substr(
					$this->html,
					0,
					$token->getStartOffset()
				);
				$after_declaration  = substr(
					$this->html,
					$token->getEndOffset() + 1
				);

				$this->html = "$before_declaration $after_declaration";
				break;
			}
		}

		return $this;
	}
}

$html = '<div attr_3=\'3\' attr_1="1" attr_2 attr4=abc class="class names" /><img test123 class="boat" /><img class="boat 2" />';
echo(
	(new FluidMamo( $html ))
		->findNext( 'img' )
		->setAttribute( 'test123', '123' )
		->removeAttribute( 'test123' )
		->findNext( 'img' )
		->setAttribute( 'test124', '123' )
		->getHtml()
);


