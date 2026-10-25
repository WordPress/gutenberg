<?php
/**
 * Block parser that reads HTML outside block delimiters as blocks.
 *
 * @package gutenberg
 */

/**
 * Block parser that reads HTML outside block delimiters as blocks.
 */
class Gutenberg_Undelimited_Block_Parser extends WP_Block_Parser {
	// Elements WordPress treats as blocks when adding paragraphs (`wpautop`).
	const BLOCK_ELEMENTS = array( 'TABLE', 'THEAD', 'TFOOT', 'CAPTION', 'COL', 'COLGROUP', 'TBODY', 'TR', 'TD', 'TH', 'DIV', 'DL', 'DD', 'DT', 'UL', 'OL', 'LI', 'PRE', 'FORM', 'MAP', 'AREA', 'BLOCKQUOTE', 'ADDRESS', 'STYLE', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'FIELDSET', 'LEGEND', 'SECTION', 'ARTICLE', 'ASIDE', 'HGROUP', 'HEADER', 'FOOTER', 'NAV', 'FIGURE', 'FIGCAPTION', 'DETAILS', 'MENU', 'SUMMARY' );

	const VOID_ELEMENTS = array( 'AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'SOURCE', 'TRACK', 'WBR' );

	// Elements whose contents the tokenizer reads as part of the opening tag.
	const RAW_TEXT_ELEMENTS = array( 'SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE', 'IFRAME', 'NOEMBED', 'NOFRAMES', 'XMP' );

	// Blocks for elements, until blocks declare which elements they read.
	const BLOCK_NAMES = array(
		'P'          => 'core/paragraph',
		'H1'         => 'core/heading',
		'H2'         => 'core/heading',
		'H3'         => 'core/heading',
		'H4'         => 'core/heading',
		'H5'         => 'core/heading',
		'H6'         => 'core/heading',
		'UL'         => 'core/list',
		'OL'         => 'core/list',
		'BLOCKQUOTE' => 'core/quote',
		'TABLE'      => 'core/table',
		'PRE'        => 'core/preformatted',
		'HR'         => 'core/separator',
	);

	/**
	 * Parses a document into blocks, reading HTML outside delimiters as
	 * blocks. Whitespace between them is kept as freeform blocks, so the
	 * blocks render to the same HTML.
	 *
	 * @param string $document Input document.
	 * @return array[] Parsed blocks.
	 */
	public function parse( $document ) {
		$blocks = array();
		foreach ( parent::parse( $document ) as $block ) {
			if ( null === $block['blockName'] ) {
				array_push( $blocks, ...self::parse_undelimited( $block['innerHTML'] ) );
			} else {
				$blocks[] = $block;
			}
		}
		return $blocks;
	}

	/**
	 * Returns a parsed block.
	 *
	 * @param string|null $name          Block name, or null for freeform HTML.
	 * @param array       $inner_content HTML, with null where inner blocks are.
	 * @param array[]     $inner_blocks  Inner blocks.
	 * @return array Parsed block.
	 */
	private static function block( $name, $inner_content, $inner_blocks = array() ) {
		return array(
			'blockName'    => $name,
			'attrs'        => array(),
			'innerBlocks'  => $inner_blocks,
			'innerHTML'    => implode( '', array_filter( $inner_content, 'is_string' ) ),
			'innerContent' => $inner_content,
		);
	}

	/**
	 * Reads HTML without delimiters as blocks.
	 *
	 * @param string $html HTML without delimiters.
	 * @return array[] Parsed blocks, with whitespace between them as freeform
	 *                 blocks.
	 */
	public static function parse_undelimited( $html ) {
		$blocks = array();
		$was_at = 0;
		foreach ( self::split_pieces( $html ) as $piece ) {
			if ( $piece['start'] > $was_at ) {
				$blocks[] = self::block( null, array( substr( $html, $was_at, $piece['start'] - $was_at ) ) );
			}
			$was_at = $piece['end'];
			$text   = substr( $html, $piece['start'], $piece['end'] - $piece['start'] );
			if ( $piece['bare'] ) {
				// Paragraphs of text get their `<p>`, as in the editor.
				$blocks[] = self::block( 'core/paragraph', array( trim( wpautop( $text ) ) ) );
				continue;
			}
			$processor = new WP_HTML_Tag_Processor( $text );
			$processor->next_token();
			$name = self::BLOCK_NAMES[ $processor->get_tag() ] ?? null;
			if ( $name ) {
				$blocks[] = self::block( $name, array( $text ) );
				continue;
			}
			// Anything else is an HTML block, with the blocks inside it.
			$inner_content = array();
			$inner_blocks  = array();
			$inner_at      = 0;
			foreach ( self::find_blocks( $text ) as $found ) {
				$inner_content[] = substr( $text, $inner_at, $found['start'] - $inner_at );
				$inner_content[] = null;
				$inner_blocks[]  = self::block( $found['name'], array( substr( $text, $found['start'], $found['end'] - $found['start'] ) ) );
				$inner_at        = $found['end'];
			}
			$inner_content[] = substr( $text, $inner_at );
			$blocks[]        = self::block( 'core/html', $inner_content, $inner_blocks );
		}
		if ( $was_at < strlen( $html ) ) {
			$blocks[] = self::block( null, array( substr( $html, $was_at ) ) );
		}
		return $blocks;
	}

	/**
	 * Splits HTML into top-level pieces: block elements, and paragraphs of
	 * text and inline elements separated by blank lines. Matches
	 * `splitPieces` in `packages/blocks/src/api/undelimited.ts`.
	 *
	 * @param string $html HTML without delimiters.
	 * @return array[] Pieces, with `start`, `end` and `bare`.
	 */
	private static function split_pieces( $html ) {
		$processor     = new Gutenberg_Undelimited_Tag_Processor( $html );
		$pieces        = array();
		$open_elements = array();
		$piece_start   = null;
		$is_bare       = false;
		$last_end      = 0;

		// Ends the piece at `$end`, leaving out whitespace before it.
		$end_piece = function ( $end ) use ( $html, &$pieces, &$piece_start, &$is_bare ) {
			if ( null === $piece_start ) {
				return;
			}
			$pieces[]    = array(
				'start' => $piece_start,
				'end'   => $piece_start + strlen( rtrim( substr( $html, $piece_start, $end - $piece_start ) ) ),
				'bare'  => $is_bare,
			);
			$piece_start = null;
		};

		$start_piece = function ( $start, $bare ) use ( &$piece_start, &$is_bare ) {
			if ( null === $piece_start ) {
				$piece_start = $start;
				$is_bare     = $bare;
			}
		};

		while ( $processor->next_token() ) {
			$span     = $processor->get_span();
			$start    = $span->start;
			$end      = $span->start + $span->length;
			$last_end = $end;
			$type     = $processor->get_token_type();
			$tag      = (string) $processor->get_tag();
			$opener   = '#tag' === $type && ! $processor->is_tag_closer();
			// Void elements, and elements like SCRIPT whose contents are part
			// of the same token, don't stay open.
			$stays_open = $opener &&
				! in_array( $tag, self::VOID_ELEMENTS, true ) &&
				! in_array( $tag, self::RAW_TEXT_ELEMENTS, true );

			if ( $open_elements ) {
				// A block element closes an open paragraph, as in `<p>a<div>`.
				if ( $opener && in_array( $tag, self::BLOCK_ELEMENTS, true ) && 'P' === end( $open_elements ) ) {
					array_pop( $open_elements );
				}
				if ( ! $open_elements ) {
					$end_piece( $start );
				} else {
					if ( '#tag' === $type && $processor->is_tag_closer() ) {
						$at = array_search( $tag, array_reverse( $open_elements, true ), true );
						if ( false !== $at ) {
							$open_elements = array_slice( $open_elements, 0, $at );
						}
					} elseif ( $stays_open ) {
						$open_elements[] = $tag;
					}
					if ( ! $open_elements && ! $is_bare ) {
						$end_piece( $end );
					}
					continue;
				}
			}

			if ( '#text' === $type ) {
				// Text ends a paragraph at each blank line.
				$at = $start;
				foreach ( preg_split( '/(\n[ \t]*\n\s*)/', substr( $html, $start, $end - $start ), -1, PREG_SPLIT_DELIM_CAPTURE ) as $part ) {
					if ( preg_match( '/\n[ \t]*\n/', $part ) ) {
						$end_piece( $at );
					} elseif ( '' !== trim( $part ) ) {
						$start_piece( $at + strlen( $part ) - strlen( ltrim( $part ) ), true );
					}
					$at += strlen( $part );
				}
				continue;
			}

			// Block elements, and comments outside a paragraph, are pieces of
			// their own and end the paragraph before them. Stray closers are
			// inline content.
			if (
				( $opener && ( in_array( $tag, self::BLOCK_ELEMENTS, true ) || in_array( $tag, self::RAW_TEXT_ELEMENTS, true ) ) ) ||
				( '#comment' === $type && null === $piece_start )
			) {
				$end_piece( $start );
				$start_piece( $start, false );
				if ( $stays_open ) {
					$open_elements[] = $tag;
				} else {
					$end_piece( $end );
				}
				continue;
			}

			// Anything else is inline content of a paragraph.
			$start_piece( $start, true );
			if ( $stays_open ) {
				$open_elements[] = $tag;
			}
		}

		// Keep whatever the tokenizer couldn't finish reading.
		if ( $processor->paused_at_incomplete_token() ) {
			$rest = substr( $html, $last_end );
			$start_piece( $last_end + strlen( $rest ) - strlen( ltrim( $rest ) ), false );
		}
		$end_piece( strlen( $html ) );

		return $pieces;
	}

	/**
	 * Finds the outermost elements in HTML that a block reads. Matches
	 * `findBlocks` in `packages/blocks/src/api/undelimited.ts`.
	 *
	 * @param string $html HTML of an element no block reads.
	 * @return array[] Found blocks, with `start`, `end` and `name`.
	 */
	private static function find_blocks( $html ) {
		$processor = new Gutenberg_Undelimited_Tag_Processor( $html );
		$root      = (object) array(
			'tag'      => '',
			'start'    => 0,
			'end'      => null,
			'children' => array(),
		);
		$open      = array( $root );
		while ( $processor->next_token() ) {
			if ( '#tag' !== $processor->get_token_type() ) {
				continue;
			}
			$tag  = $processor->get_tag();
			$span = $processor->get_span();
			if ( $processor->is_tag_closer() ) {
				for ( $at = count( $open ) - 1; $at > 0; $at-- ) {
					if ( $open[ $at ]->tag === $tag ) {
						$open[ $at ]->end = $span->start + $span->length;
						$open             = array_slice( $open, 0, $at );
						break;
					}
				}
				continue;
			}
			// A block element closes an open paragraph, as in `<p>a<div>`.
			if ( in_array( $tag, self::BLOCK_ELEMENTS, true ) && 'P' === end( $open )->tag ) {
				array_pop( $open );
			}
			$element                 = (object) array(
				'tag'      => $tag,
				'start'    => $span->start,
				'end'      => null,
				'children' => array(),
			);
			end( $open )->children[] = $element;
			if ( ! in_array( $tag, self::VOID_ELEMENTS, true ) && ! in_array( $tag, self::RAW_TEXT_ELEMENTS, true ) ) {
				$open[] = $element;
			}
		}

		$found = array();
		$visit = function ( $element ) use ( &$visit, &$found ) {
			foreach ( $element->children as $child ) {
				$name = self::BLOCK_NAMES[ $child->tag ] ?? null;
				if ( null !== $child->end && $name ) {
					$found[] = array(
						'start' => $child->start,
						'end'   => $child->end,
						'name'  => $name,
					);
				} else {
					$visit( $child );
				}
			}
		};
		$visit( $root );
		return $found;
	}
}
