<?php

/**
 * Existing Core Selectors
 *
 *     .blocks-gallery-caption
 *     .blocks-gallery-item
 *     .blocks-gallery-item__caption
 *     .book-author
 *     .message
 *     a
 *     a[download]
 *     audio
 *     blockquote
 *     cite
 *     code
 *     div
 *     figcaption
 *     figure > a
 *     figure a
 *     figure img
 *     figure video,figure img
 *     h1,h2,h3,h4,h5,h6
 *     img
 *     li
 *     ol,ul
 *     p
 *     pre
 *     tbody tr
 *     td,th
 *     tfoot tr
 *     thead tr
 *     video
 */

require_once __DIR__ . '/class-wp-html-processor.php';

/*
 * @see PHP docs for array_is_list: user-contributed polyfill
 */
if ( ! function_exists( 'array_is_list' ) ) {
	function array_is_list( $array ) {
		$i = 0;

		foreach ( $array as $k => $v ) {
			if ( $k !== $i++ ) {
				return false;
			}
		}

		return true;
	}
}


class WP_HTML_Attribute_Sourcer {
	/**
	 * Attributes definitions, typically from `block.json`.
	 *
	 * @see WP_Block_Type_Registry
	 *
	 * @var mixed|null
	 */
	public $attribute_definitions;

	/**
	 * Source HTML containing embedded attributes.
	 *
	 * @var mixed|null
	 */
	private $html;

	public function __construct( $attribute_definitions = null, $html = null ) {
		$this->attribute_definitions = $attribute_definitions;
		$this->html = $html;
	}

	public function source_attributes() {
		$attributes = [];
		$unparsed = [];

		foreach ( $this->attribute_definitions as $name => $definition ) {
			$sourcer = self::parse_definition( $definition );
			switch ( $sourcer ) {
				case null:
				case 'not-sourced':
				case 'unsupported':
					$unparsed[] = $name;
					continue 2;

				case 'inner-html':
					$attributes[ $name ] = $this->html;
					continue 2;
			}

			$tags = self::select( $sourcer['selector'], $this->html );
			if ( null === $tags ) {
				$unparsed[] = $name;
				continue;
			}

			switch ( $sourcer['type'] ) {
				case 'html':
					$attributes[ $name ] = $tags->get_content_inside_balanced_tags();
					continue 2;

				case 'attribute':
					$attributes[ $name ] = $tags->get_attribute( $sourcer['attribute'] );
					continue 2;
			}
		}

		return array(
			'attributes' => $attributes,
			'unparsed' => $unparsed
		);
	}

	public static function select( $selectors, $html ) {
		$tags = new WP_HTML_Processor( $html );

		while ( $tags->next_tag() ) {
			foreach ( $selectors as $s ) {
				if ( ! empty( $s['has_attribute'] ) && null === $tags->get_attribute( $s['has_attribute'] ) ) {
					continue;
				}

				if ( 'element' === $s['type'] && $tags->get_tag() === strtoupper( $s['identifier'] ) ) {
					return $tags;
				}

				// @TODO: $tags->has_class() would be _really_ handy here.
				if ( 'class' === $s['type'] && preg_match( "~\b{$s['identifier']}\b~", $tags->get_attribute( 'class' ) ) ) {
					return $tags;
				}

				if ( 'hash' === $s['type'] && $s['identifier'] === $tags->get_attribute( 'id' ) ) {
					return $tags;
				}
			}
		}

		return null;
	}

	public static function parse_definition( $definition ) {
		if ( empty( $definition['source'] ) ) {
			return 'not-sourced';
		}

		$source = $definition['source'];
		if ( 'html' !== $source && 'attribute' !== $source ) {
			return 'unsupported';
		}

		if ( 'attribute' === $source && empty( $definition['selector'] ) ) {
			return null;
		}

		if ( 'html' === $source && empty( $definition['selector'] ) ) {
			return 'inner-html';
		}

		$selector = self::parse_selector( $definition['selector'] );
		if ( null === $selector ) {
			return 'unsupported';
		}

		if ( 'html' === $source ) {
			return array( 'type' => 'html', 'selector' => $selector );
		}

		$attribute = self::parse_attribute( $definition['attribute'] );
		if ( null === $attribute ) {
			return null;
		}

		return array( 'type' => 'attribute', 'selector' => $selector, 'attribute' => $attribute );
	}

	public static function parse_selector( $s, $at = 0 ) {
		$budget = 1000;
		$selectors = [];

		while ( $at < strlen( $s ) && $budget-- > 0 ) {
			$type = 'element';
			$attribute = null;

			switch ( $s[ $at ] ) {
				case '+':
					// no support for adjacent sibling combinator
					return null;

				case '>':
					// no support for child combinator
					return null;

				case '~':
					// no support for general sibling combinator
					return null;

				case ' ':
					// no support for descendant combinator
					return null;

				case '[':
					/*
					 * Only current support is for checking of presence of attributes
					 * with a very-limited subset of allowable names, not whether the
					 * attribute conforms to a given value or is allowed in HTML.
					 */
					$at++;
					$inside_length = strspn( $s, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-", $at );
					if ( ']' !== $s[ $at + $inside_length ] ) {
						return null;
					}

					$attribute = substr( $s, $at, $inside_length );
					$at += $inside_length + 1;

					$selector = array_pop( $selectors );
					$selector['has_attribute'] = $attribute;
					$selectors[] = $selector;

					continue 2;

				case ',':
					$at++;
					$at += strspn( $s, " \t\f\r\n", $at );
					continue 2;

				case ':':
					// no support for pseudo-selectors
					return null;

				case '#':
					$type = 'hash';
					$at++;
					break;

				case '.':
					$type = 'class';
					$at++;
					break;
			}

			// @TODO: Hashes don't have to start with `nmstart` so this might reject valid hash names.
			$identifier = self::parse_css_identifier( $s, $at );
			if ( null === $identifier ) {
				return null;
			}

			$selector = array( 'type' => $type, 'identifier' => $identifier );
			if ( null !== $attribute ) {
				$selector['has_attribute'] = $selector;
			}

			$selectors[] = $selector;

			$at += strlen( $identifier );
		}

		return $at === strlen( $s )
			? $selectors
			: null;
	}

	/**
	 * Parses CSS identifier; currently limited to ASCII identifiers.
	 *
	 * Example:
	 * ```
	 *     'div' === parse_css_identifier( 'div > img' );
	 * ```
	 *
	 * Grammar:
	 * ```
	 *     ident        -?{nmstart}{nmchar}*
	 *     nmstart      [_a-z]|{nonascii}|{escape}
	 *     nmchar       [_a-z0-9-]|{nonascii}|{escape}
	 *     nonascii     [\240-\377]
	 *     escape       {unicode}|\\[^\r\n\f0-9a-f]
	 *     unicode      \\{h}{1,6}(\r\n|[ \t\r\n\f])?
	 *     h            [0-9a-f]
	 * ```
	 *
	 * @TODO: Add support for the proper syntax
	 *
	 * @see https://www.w3.org/TR/CSS21/grammar.html
	 *
	 * @param $s
	 * @return false|string|null
	 */
	public static function parse_css_identifier( $s, $at = 0 ) {
		$budget = 1000;
		$started_at = $at;

		$starting_chars = strspn( $s, '_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', $at );
		if ( 0 === $starting_chars ) {
			return null;
		}
		$at += $starting_chars;

		while ( $at < strlen( $s ) && $budget-- > 0 ) {
			$chars = strspn( $s, '_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', $at );

			if ( 0 === $chars ) {
				break;
			}

			$at += $chars;
		}

		if ( $budget < 0 ) {
			return null;
		}

		return substr( $s, $started_at, $at - $started_at );
	}

	public static function parse_attribute( $s ) {
		$unallowed_characters_match = preg_match(
			'~[' .
			// Syntax-like characters.
			'"\'>&</ =' .
			// Control characters.
			'\x{00}-\x{1F}' .
			// HTML noncharacters.
			'\x{FDD0}-\x{FDEF}' .
			'\x{FFFE}\x{FFFF}\x{1FFFE}\x{1FFFF}\x{2FFFE}\x{2FFFF}\x{3FFFE}\x{3FFFF}' .
			'\x{4FFFE}\x{4FFFF}\x{5FFFE}\x{5FFFF}\x{6FFFE}\x{6FFFF}\x{7FFFE}\x{7FFFF}' .
			'\x{8FFFE}\x{8FFFF}\x{9FFFE}\x{9FFFF}\x{AFFFE}\x{AFFFF}\x{BFFFE}\x{BFFFF}' .
			'\x{CFFFE}\x{CFFFF}\x{DFFFE}\x{DFFFF}\x{EFFFE}\x{EFFFF}\x{FFFFE}\x{FFFFF}' .
			'\x{10FFFE}\x{10FFFF}' .
			']~Ssu',
			$s
		);

		return $unallowed_characters_match ? null : $s;
	}
}
