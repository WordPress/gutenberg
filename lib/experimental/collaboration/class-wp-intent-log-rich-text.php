<?php
/**
 * WP_Intent_Log_Rich_Text class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Intent_Log_Rich_Text' ) ) {

	/**
	 * Rich-text codec: inline HTML ↔ array( 'text', 'formats' ) fields — the
	 * PHP twin of `packages/sync/src/engines/intent-log/rich-text.js`.
	 *
	 * The plain-text side of a field is THE text coordinate space (UTF-16
	 * code units), so this class must match the JS implementation
	 * byte-for-byte; `test-vectors/rich-text.json` freezes the contract.
	 * Regenerate vectors only alongside a deliberate codec change, in both
	 * languages together.
	 *
	 * Serializer constraint (both twins): span boundaries never split a
	 * surrogate pair — the parser only produces code-point-aligned spans,
	 * and format derivation diffs codec-produced spans.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Intent_Log_Rich_Text {
		const OBJECT_CHAR = "\u{FFFC}";

		const FORMAT_TAGS = array( 'a', 'abbr', 'b', 'bdo', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'i', 'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var' );

		const VOID_TAGS = array( 'area', 'base', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr' );

		const NAMED_ENTITIES = array(
			'amp'  => '&',
			'lt'   => '<',
			'gt'   => '>',
			'quot' => '"',
			'apos' => "'",
			'nbsp' => "\u{00A0}",
		);

		const TAG_RE  = '/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s"\'>]+))?)*)\s*(\/?)>/';
		const ATTR_RE = '/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s"\'>]+))?/';

		/**
		 * Parses inline HTML into a field. Never throws: unsupported or
		 * malformed input degrades to a whole-field object (round-trip
		 * exact, opaque to text merging).
		 *
		 * @since 7.2.0
		 *
		 * @param string $html Inline HTML.
		 * @return array array( 'text' => string, 'formats' => array ).
		 */
		public static function html_to_field( string $html ): array {
			try {
				return self::parse_strict( $html );
			} catch ( WP_Intent_Log_Unsupported_Html $e ) {
				if ( '' === $html ) {
					return array(
						'text'    => '',
						'formats' => array(),
					);
				}
				return array(
					'text'    => self::OBJECT_CHAR,
					'formats' => array(
						array(
							'start'  => 0,
							'end'    => 1,
							'format' => 'obj|' . self::json( array( 'html' => $html ) ),
						),
					),
				);
			}
		}

		/**
		 * The canonical span format id for a tag + attributes.
		 *
		 * @since 7.2.0
		 *
		 * @param string $tag   Lowercase tag name.
		 * @param array  $attrs Attribute map.
		 * @return string Format id.
		 */
		public static function encode_format( string $tag, array $attrs ): string {
			if ( array() === $attrs ) {
				return $tag;
			}
			ksort( $attrs, SORT_STRING );
			return $tag . '|' . self::json( $attrs );
		}

		/**
		 * Decodes a span format id. Returns null for the object format.
		 *
		 * @since 7.2.0
		 *
		 * @param string $format Format id.
		 * @return array|null array( 'tag', 'attrs' ), or null.
		 */
		public static function decode_format( string $format ): ?array {
			$pipe = strpos( $format, '|' );
			if ( false === $pipe ) {
				return array(
					'tag'   => $format,
					'attrs' => array(),
				);
			}
			$tag = substr( $format, 0, $pipe );
			if ( 'obj' === $tag ) {
				return null;
			}
			return array(
				'tag'   => $tag,
				'attrs' => json_decode( substr( $format, $pipe + 1 ), true ),
			);
		}

		/**
		 * JSON with JS-compatible escaping (JSON.stringify parity: slashes
		 * and unicode unescaped).
		 *
		 * @since 7.2.0
		 *
		 * @param array $value Value.
		 * @return string JSON.
		 */
		private static function json( array $value ): string {
			return wp_json_encode( $value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		}

		/**
		 * Decodes the supported entity subset; throws on anything else.
		 *
		 * @since 7.2.0
		 *
		 * @param string $raw Raw text content.
		 * @return string Decoded text.
		 * @throws WP_Intent_Log_Unsupported_Html On unsupported entities.
		 */
		private static function decode_entities( string $raw ): string {
			return preg_replace_callback(
				'/&([a-zA-Z]+|#x?[0-9a-fA-F]+);?/',
				static function ( $match ) {
					if ( ';' !== substr( $match[0], -1 ) ) {
						return $match[0];
					}
					$body = $match[1];
					if ( '#' === $body[0] ) {
						$code = ( 'x' === $body[1] || 'X' === $body[1] )
							? intval( substr( $body, 2 ), 16 )
							: intval( substr( $body, 1 ), 10 );
						if ( $code <= 0 || $code > 0x10FFFF || ( $code >= 0xD800 && $code <= 0xDFFF ) ) {
							throw new WP_Intent_Log_Unsupported_Html( 'bad numeric entity' );
						}
						return mb_chr( $code, 'UTF-8' );
					}
					$named = self::NAMED_ENTITIES[ strtolower( $body ) ] ?? null;
					if ( null === $named ) {
						throw new WP_Intent_Log_Unsupported_Html( 'unsupported entity' );
					}
					return $named;
				},
				$raw
			);
		}

		/**
		 * Encodes text for HTML output.
		 *
		 * @since 7.2.0
		 *
		 * @param string $text Plain text.
		 * @return string HTML-safe text.
		 */
		private static function encode_text( string $text ): string {
			return str_replace(
				array( '&', '<', '>', "\u{00A0}" ),
				array( '&amp;', '&lt;', '&gt;', '&nbsp;' ),
				$text
			);
		}

		/**
		 * Encodes an attribute value.
		 *
		 * @since 7.2.0
		 *
		 * @param string $value Attribute value.
		 * @return string HTML-safe attribute value.
		 */
		private static function encode_attribute( string $value ): string {
			return str_replace( '"', '&quot;', self::encode_text( $value ) );
		}

		/**
		 * Parses a tag's attribute string.
		 *
		 * @since 7.2.0
		 *
		 * @param string $raw Raw attribute source.
		 * @return array Attribute map (values entity-decoded).
		 */
		private static function parse_attributes( string $raw ): array {
			$attrs = array();
			if ( ! preg_match_all( self::ATTR_RE, $raw, $matches, PREG_SET_ORDER ) ) {
				return $attrs;
			}
			foreach ( $matches as $match ) {
				$name  = strtolower( $match[1] );
				$value = $match[2] ?? '';
				$first = substr( $value, 0, 1 );
				if ( ( '"' === $first && '"' === substr( $value, -1 ) ) || ( "'" === $first && "'" === substr( $value, -1 ) ) ) {
					$value = substr( $value, 1, -1 );
				}
				$attrs[ $name ] = self::decode_entities( $value );
			}
			return $attrs;
		}

		/**
		 * Captures a balanced opaque element starting at $index.
		 *
		 * @since 7.2.0
		 *
		 * @param string $html        Full input.
		 * @param int    $index       Byte index of the opening '<'.
		 * @param string $tag         Lowercase tag name.
		 * @param int    $after       Byte index after the opening tag.
		 * @param bool   $self_closed Whether the opening tag self-closed.
		 * @return array array( 'source', 'next' ).
		 * @throws WP_Intent_Log_Unsupported_Html On unbalanced markup.
		 */
		private static function capture_opaque( string $html, int $index, string $tag, int $after, bool $self_closed ): array {
			if ( $self_closed || in_array( $tag, self::VOID_TAGS, true ) ) {
				return array(
					'source' => substr( $html, $index, $after - $index ),
					'next'   => $after,
				);
			}
			$depth  = 1;
			$cursor = $after;
			while ( $depth > 0 ) {
				$next_tag = strpos( $html, '<', $cursor );
				if ( false === $next_tag ) {
					throw new WP_Intent_Log_Unsupported_Html( 'unclosed opaque element' );
				}
				if ( ! preg_match( self::TAG_RE, substr( $html, $next_tag ), $match ) ) {
					$cursor = $next_tag + 1;
					continue;
				}
				$cursor = $next_tag + strlen( $match[0] );
				if ( strtolower( $match[2] ) !== $tag ) {
					continue;
				}
				if ( '' !== $match[1] ) {
					--$depth;
				} elseif ( '' === $match[4] && ! in_array( $tag, self::VOID_TAGS, true ) ) {
					++$depth;
				}
			}
			return array(
				'source' => substr( $html, $index, $cursor - $index ),
				'next'   => $cursor,
			);
		}

		/**
		 * Strict parser body (mirrors parseStrict in the JS twin).
		 *
		 * @since 7.2.0
		 *
		 * @param string $html Inline HTML.
		 * @return array Field.
		 * @throws WP_Intent_Log_Unsupported_Html On unsupported input.
		 */
		private static function parse_strict( string $html ): array {
			$text    = '';
			$length  = 0; // Code units, tracked incrementally.
			$formats = array();
			$stack   = array();
			$index   = 0;
			$total   = strlen( $html );

			$append = static function ( string $chunk ) use ( &$text, &$length ) {
				$text   .= $chunk;
				$length += WP_Intent_Log_Document::text_length( $chunk );
			};

			while ( $index < $total ) {
				$lt = strpos( $html, '<', $index );
				if ( false === $lt ) {
					$append( self::decode_entities( substr( $html, $index ) ) );
					break;
				}
				if ( $lt > $index ) {
					$append( self::decode_entities( substr( $html, $index, $lt - $index ) ) );
				}
				if ( '<!--' === substr( $html, $lt, 4 ) ) {
					$end = strpos( $html, '-->', $lt );
					if ( false === $end ) {
						throw new WP_Intent_Log_Unsupported_Html( 'unclosed comment' );
					}
					$source    = substr( $html, $lt, $end + 3 - $lt );
					$formats[] = array(
						'start'  => $length,
						'end'    => $length + 1,
						'format' => 'obj|' . self::json( array( 'html' => $source ) ),
					);
					$append( self::OBJECT_CHAR );
					$index = $end + 3;
					continue;
				}
				if ( ! preg_match( self::TAG_RE, substr( $html, $lt ), $match ) ) {
					throw new WP_Intent_Log_Unsupported_Html( 'stray <' );
				}
				$closing    = '' !== $match[1];
				$tag        = strtolower( $match[2] );
				$raw_attrs  = $match[3];
				$self_close = '' !== $match[4];
				$after_tag  = $lt + strlen( $match[0] );

				if ( $closing ) {
					$top = array_pop( $stack );
					if ( null === $top || $top['tag'] !== $tag ) {
						throw new WP_Intent_Log_Unsupported_Html( 'mismatched close tag' );
					}
					if ( $top['start'] < $length ) {
						$formats[] = array(
							'start'  => $top['start'],
							'end'    => $length,
							'format' => self::encode_format( $tag, $top['attrs'] ),
						);
					}
					$index = $after_tag;
					continue;
				}

				if ( 'br' === $tag ) {
					$append( "\n" );
					$index = $after_tag;
					continue;
				}

				if ( in_array( $tag, self::FORMAT_TAGS, true ) && ! $self_close ) {
					$stack[] = array(
						'tag'   => $tag,
						'attrs' => self::parse_attributes( $raw_attrs ),
						'start' => $length,
					);
					$index   = $after_tag;
					continue;
				}

				$captured  = self::capture_opaque( $html, $lt, $tag, $after_tag, $self_close );
				$formats[] = array(
					'start'  => $length,
					'end'    => $length + 1,
					'format' => 'obj|' . self::json( array( 'html' => $captured['source'] ) ),
				);
				$append( self::OBJECT_CHAR );
				$index = $captured['next'];
			}

			if ( count( $stack ) > 0 ) {
				throw new WP_Intent_Log_Unsupported_Html( 'unclosed format tag' );
			}

			usort(
				$formats,
				static function ( $a, $b ) {
					return ( $a['start'] <=> $b['start'] )
						?: ( $a['end'] <=> $b['end'] )
						?: strcmp( $a['format'], $b['format'] );
				}
			);

			return array(
				'text'    => $text,
				'formats' => $formats,
			);
		}

		/**
		 * Serializes a field back to inline HTML (mirrors fieldToHtml).
		 *
		 * @since 7.2.0
		 *
		 * @param array $field array( 'text', 'formats' ).
		 * @return string Inline HTML.
		 */
		public static function field_to_html( array $field ): string {
			$text  = $field['text'] ?? '';
			$spans = $field['formats'] ?? array();

			$object_at    = array();
			$format_spans = array();
			foreach ( $spans as $span ) {
				if ( 0 === strpos( $span['format'], 'obj|' ) ) {
					$object_at[ $span['start'] ] = $span;
				} elseif ( $span['end'] > $span['start'] ) {
					$format_spans[] = $span;
				}
			}
			usort(
				$format_spans,
				static function ( $a, $b ) {
					return ( $a['start'] <=> $b['start'] )
						?: ( $b['end'] <=> $a['end'] )
						?: strcmp( $a['format'], $b['format'] );
				}
			);

			// Code points with their code-unit positions (span boundaries are
			// code-point aligned by construction).
			$code_points = preg_split( '//u', $text, -1, PREG_SPLIT_NO_EMPTY );
			if ( false === $code_points ) {
				$code_points = array();
			}

			$html  = '';
			$stack = array();

			$open_tag  = static function ( array $span ) use ( &$html, &$stack ) {
				$decoded = self::decode_format( $span['format'] );
				if ( null === $decoded ) {
					return;
				}
				$attrs = $decoded['attrs'];
				ksort( $attrs, SORT_STRING );
				$attr_text = '';
				foreach ( $attrs as $key => $value ) {
					$attr_text .= ' ' . $key . '="' . self::encode_attribute( (string) $value ) . '"';
				}
				$html   .= '<' . $decoded['tag'] . $attr_text . '>';
				$stack[] = $span;
			};
			$close_tag = static function ( array $span ) use ( &$html ) {
				$decoded = self::decode_format( $span['format'] );
				if ( null !== $decoded ) {
					$html .= '</' . $decoded['tag'] . '>';
				}
			};

			$position    = 0;
			$point_index = 0;
			$total       = count( $code_points );
			$text_length = 0;
			foreach ( $code_points as $point ) {
				$text_length += WP_Intent_Log_Document::text_length( $point );
			}

			while ( true ) {
				// Close spans ending here (with close/reopen stack repair).
				$reopen = array();
				while ( count( $stack ) > 0 ) {
					$has_ender = false;
					foreach ( $stack as $span ) {
						if ( $span['end'] === $position ) {
							$has_ender = true;
							break;
						}
					}
					if ( ! $has_ender ) {
						break;
					}
					$span = array_pop( $stack );
					$close_tag( $span );
					if ( $span['end'] !== $position ) {
						$reopen[] = $span;
					}
				}
				for ( $i = count( $reopen ) - 1; $i >= 0; $i-- ) {
					$open_tag( $reopen[ $i ] );
				}
				if ( $position >= $text_length || $point_index >= $total ) {
					break;
				}
				foreach ( $format_spans as $span ) {
					if ( $span['start'] === $position ) {
						$open_tag( $span );
					}
				}
				$point = $code_points[ $point_index ];
				$units = WP_Intent_Log_Document::text_length( $point );
				if ( self::OBJECT_CHAR === $point && isset( $object_at[ $position ] ) ) {
					$payload = json_decode( substr( $object_at[ $position ]['format'], 4 ), true );
					$html   .= $payload['html'] ?? '';
				} elseif ( "\n" === $point ) {
					$html .= '<br>';
				} else {
					$html .= self::encode_text( $point );
				}
				$position += $units;
				++$point_index;
			}
			return $html;
		}
	}

	/**
	 * Internal signal: input outside the codec's supported subset.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Intent_Log_Unsupported_Html extends Exception {}
}
