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

require_once __DIR__ . '/class-wp-html-naive-processor.php';

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
					$attributes[ $name ] = self::get_inner_html( $tags );
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

	public static function select( $selector, $html ) {
		$tags = new WP_HTML_Naive_Processor( $html );

		if ( array_is_list( $selector ) ) {
			while ( $tags->next_tag() ) {
				foreach ( $selector as $s ) {
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

		switch ( $selector['type'] ) {
			case 'element':
				$tags->next_tag( [ 'tag_name' => $selector['identifier'] ] );
				return $tags;

			case 'class':
				$tags->next_tag( [ 'class_name' => $selector['identifier'] ] );
				return $tags;

			case 'hash':
				while ( $tags->next_tag() ) {
					if ( $selector['identifier'] === $tags->get_attribute( 'id' ) ) {
						return $tags;
					}
				}
		}

		return null;
	}

	public static function get_inner_html( WP_HTML_Naive_Processor $tags ) {
		$tags->set_bookmark( 'start' );
		$tag_name = $tags->get_tag();
		$depth = 1;

		if ( self::is_void_element( $tag_name ) ) {
			return '';
		}

		while ( $tags->next_tag( [ 'tag_closers' => 'visit' ] ) ) {
			if ( $tags->get_tag() !== $tag_name ) {
				continue;
			}

			if ( $tags->is_tag_closer() && $depth === 1 ) {
				$tags->set_bookmark( 'end' );
				break;
			}

			$depth += $tags->is_tag_closer() ? -1 : 1;
		}

		return $tags->inner_content( 'start', 'end' );
	}

	/**
	 * @see https://html.spec.whatwg.org/#elements-2
	 */
	public static function is_void_element( $tag_name ) {
		switch ( $tag_name ) {
			case 'area':
			case 'base':
			case 'br':
			case 'col':
			case 'embed':
			case 'hr':
			case 'img':
			case 'input':
			case 'link':
			case 'meta':
			case 'source':
			case 'track':
			case 'wbr':
				return true;

			default:
				return false;
		}
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
		$selectors = explode( ',', $s );
		if ( count( $selectors ) > 1 ) {
			$parsed = [];

			foreach ( $selectors as $selector ) {
				$parsed[] = self::parse_selector( $selector, strspn( $selector, " \r\t\f\n" ) );
			}

			return $parsed;
		}

		$type = 'element';

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
				// no support for attribute
				return null;

			case ',':
				// we shouldn't get here because we're exploding at the start
				// of this function; this is a bug if we're here.
				return null;

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

		if ( $at + strlen( $identifier ) < strlen( $s ) ) {
			// no support for anything more complicated than a simple selector
			return null;
		}

		return array( 'type' => $type, 'identifier' => $identifier );
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
