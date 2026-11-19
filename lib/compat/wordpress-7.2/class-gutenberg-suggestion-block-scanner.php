<?php
/**
 * Suggestion mode: block delimiters with byte offsets.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_Suggestion_Block_Scanner' ) ) {
	/**
	 * Lists the blocks of serialized content with the byte spans of their
	 * delimiters.
	 *
	 * The save pass edits post content by byte range so it never re-encodes a
	 * region it does not change, and `parse_blocks()` does not report offsets.
	 * This drives `WP_Block_Parser::next_token()`, the tokenizer `parse_blocks()`
	 * itself uses, so both agree on what a delimiter is.
	 */
	class Gutenberg_Suggestion_Block_Scanner {

		/**
		 * Scans serialized content.
		 *
		 * Each block is an array:
		 *
		 * - `name`: block name, `core/` included.
		 * - `attrs`: decoded attributes, an array.
		 * - `start`: offset of the opener (or of the void delimiter).
		 * - `opener_length`: length of the opener.
		 * - `closer_start`, `closer_length`: the closer's span, null for a void
		 *   block.
		 * - `end`: offset just past the block.
		 * - `parent`: index of the enclosing block, or null at the root.
		 * - `children`: indexes of the inner blocks, in order.
		 *
		 * @param string $content Serialized blocks.
		 * @return array[]|null Blocks in document order (an opener before its
		 *                      inner blocks), or null when a delimiter is left
		 *                      unclosed or closes something it did not open, so
		 *                      callers leave the content alone.
		 */
		public static function scan( $content ) {
			$parser           = new WP_Block_Parser();
			$parser->document = $content;
			$parser->offset   = 0;

			$blocks = array();
			$stack  = array();
			while ( true ) {
				list( $type, $name, $attrs, $start, $length ) = $parser->next_token();
				if ( 'no-more-tokens' === $type ) {
					break;
				}
				$parser->offset = $start + $length;
				$parent         = $stack ? end( $stack ) : null;

				if ( 'block-closer' === $type ) {
					if ( null === $parent || $blocks[ $parent ]['name'] !== $name ) {
						return null;
					}
					array_pop( $stack );
					$blocks[ $parent ]['closer_start']  = $start;
					$blocks[ $parent ]['closer_length'] = $length;
					$blocks[ $parent ]['end']           = $start + $length;
					continue;
				}

				$index    = count( $blocks );
				$blocks[] = array(
					'name'          => $name,
					'attrs'         => is_array( $attrs ) ? $attrs : array(),
					'start'         => $start,
					'opener_length' => $length,
					'closer_start'  => null,
					'closer_length' => null,
					'end'           => 'void-block' === $type ? $start + $length : null,
					'parent'        => $parent,
					'children'      => array(),
				);
				if ( null !== $parent ) {
					$blocks[ $parent ]['children'][] = $index;
				}
				if ( 'block-opener' === $type ) {
					$stack[] = $index;
				}
			}

			return $stack ? null : $blocks;
		}

		/**
		 * The `metadata.suggestion` marker of a scanned block.
		 *
		 * @param array $block Scanned block.
		 * @return array|null Marker, or null when the block has none.
		 */
		public static function marker( $block ) {
			$metadata = isset( $block['attrs']['metadata'] ) && is_array( $block['attrs']['metadata'] ) ? $block['attrs']['metadata'] : array();
			$marker   = isset( $metadata['suggestion'] ) && is_array( $metadata['suggestion'] ) ? $metadata['suggestion'] : null;
			return $marker && isset( $marker['type'] ) && is_string( $marker['type'] ) ? $marker : null;
		}

		/**
		 * The note ids a block's marker may belong to, in priority order: the
		 * marker's own `commentId`, then `metadata.noteId`.
		 *
		 * @param array $block Scanned block.
		 * @return array{0: int|null, 1: int[]} The `commentId` (null when
		 *                                      absent or not an id) and the
		 *                                      `noteId` list.
		 */
		public static function marker_note_ids( $block ) {
			$metadata   = isset( $block['attrs']['metadata'] ) && is_array( $block['attrs']['metadata'] ) ? $block['attrs']['metadata'] : array();
			$marker     = self::marker( $block );
			$comment_id = $marker && isset( $marker['commentId'] ) && is_numeric( $marker['commentId'] ) && (int) $marker['commentId'] > 0 ? (int) $marker['commentId'] : null;
			$note_ids   = array();
			foreach ( isset( $metadata['noteId'] ) ? (array) $metadata['noteId'] : array() as $id ) {
				if ( is_numeric( $id ) && (int) $id > 0 ) {
					$note_ids[] = (int) $id;
				}
			}
			return array( $comment_id, $note_ids );
		}

		/**
		 * Re-encodes a block opener with changed attributes.
		 *
		 * Only the attribute JSON is replaced; the delimiter's name and
		 * whitespace stay as they were. Attributes are encoded by
		 * `serialize_block_attributes()`, so the result parses like any opener
		 * the editor writes.
		 *
		 * @param string $opener Exact opener (or void delimiter).
		 * @param mixed  $attrs  New attributes, an object or array.
		 * @return string|null New opener, or null when it cannot be rewritten.
		 */
		public static function rewrite_opener( $opener, $attrs ) {
			if ( ! preg_match( '/^(<!--\s+wp:[a-z][a-z0-9_\/-]*\s+)(\{.*\})(\s+\/?-->)$/s', $opener, $parts ) ) {
				return null;
			}
			$json = serialize_block_attributes( $attrs );
			if ( ! is_string( $json ) || '' === $json ) {
				return null;
			}
			return $parts[1] . $json . $parts[3];
		}

		/**
		 * Decodes the attribute JSON of an opener, keeping empty objects as
		 * objects so re-encoding writes them back as `{}`.
		 *
		 * @param string $opener Exact opener (or void delimiter).
		 * @return object|null Attributes, or null when there are none.
		 */
		public static function opener_attributes( $opener ) {
			if ( ! preg_match( '/^<!--\s+wp:[a-z][a-z0-9_\/-]*\s+(\{.*\})\s+\/?-->$/s', $opener, $parts ) ) {
				return null;
			}
			$attrs = json_decode( $parts[1] );
			return is_object( $attrs ) ? $attrs : null;
		}
	}
}
