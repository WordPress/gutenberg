<?php
/**
 * Suggestion mode: moving proposals out of post content and back.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_Suggestion_Content' ) ) {
	/**
	 * Extracts what suggestions propose from serialized content, and puts it
	 * back.
	 *
	 * `extract()` turns content the editor saved, with full suggestion markers,
	 * into the public baseline plus content-free anchors, and returns what it
	 * took out as items to store on each suggestion's note. `inflate()` is its
	 * exact inverse: given the anchored content and the stored items it returns
	 * the original bytes. Both edit the input by byte range and never
	 * re-serialize a region they do not change.
	 *
	 * | Proposal                         | Anchor left in content                                      | Item `kind` |
	 * |----------------------------------|-------------------------------------------------------------|-------------|
	 * | Inline addition                  | the same `<mark>` with `data-suggestion-run="k"`, emptied   | `inline`    |
	 * | Suggested block (pending-insert) | `<!-- wp:suggestion-placeholder {"id":N,"type":"pending-insert","run":k} /-->` | `block` |
	 * | Proposed attributes (`after`)    | the block opener with `after` replaced by `"run":k`         | `after`     |
 * | Formatting change                | the same `<mark>` with `data-suggestion-run="k"` around the original run | `inline` |
	 * | Moved block (pending-move)       | its sibling list back in the original order, plus `<!-- wp:suggestion-placeholder {"id":N,"type":"pending-move","run":k} /-->` at the proposed position | `move` |
	 *
	 * `k` numbers the anchors of one note, so every anchor is unique and an
	 * anchor form is told apart from a full marker without a lookup. Each item
	 * keeps the exact anchor it left and the exact original bytes. Inflating an
	 * anchor whose item is missing, or whose bytes changed since, fails closed:
	 * an addition and a suggested block come back as nothing, a formatting
	 * change comes back as the original run, and an attribute proposal is
	 * merged back into the changed opener.
	 *
	 * Order matters, and inflation runs it backwards: block-level extraction
	 * first (a suggested block takes everything inside it, inline markers
	 * included, verbatim), then inline, then moves, whose stored region holds
	 * the anchors the earlier steps left.
	 */
	class Gutenberg_Suggestion_Content {

		/**
		 * Name of the void block that holds a suggested block's place.
		 */
		const PLACEHOLDER = 'core/suggestion-placeholder';

		/**
		 * Version of the stored item format.
		 */
		const VERSION = 1;

		/**
		 * Moves proposals out of content.
		 *
		 * A proposal is only moved out for a suggestion note on the post
		 * (`$notes`). A marker naming any other id proposes nothing anyone can
		 * decide: an addition and a suggested block are dropped with it (which
		 * is what the front end showed of them), and an attribute proposal is
		 * removed from its opener. A structural marker with no id yet (its note
		 * is still being created) is left as it is, as is anything already in
		 * anchor form, any marker the pairing walk sees as unbalanced, and the
		 * markers of `$exclude`d notes.
		 *
		 * @param string             $content Serialized content, as kses left it.
		 * @param array<int, true>   $notes   Suggestion note ids of the post.
		 * A formatting change is only moved out when its note recorded the
		 * original run (`$originals`, the payload's `beforeHTML`), that run has
		 * the same text as the marked one, and no other marker sits inside it.
		 * Otherwise it stays in full form and the render strip swaps in the
		 * original, so a stale original can never publish the wrong text.
		 *
		 * @param string                $content   Serialized content, as kses left it.
		 * @param array<int, true>      $notes     Suggestion note ids of the post.
		 * @param array<int, true>      $exclude   Note ids whose markers to leave in full form.
		 * @param array<int, string>    $originals Original run of each formatting suggestion.
		 * @return array{content: string, items: array<int, array[]>} The
		 *         anchored content and, per note, the extracted items.
		 */
		public static function extract( $content, $notes, $exclude = array(), $originals = array() ) {
			$result = array(
				'content' => $content,
				'items'   => array(),
			);
			if ( ! self::may_carry_proposals( $content ) ) {
				return $result;
			}

			$used     = self::anchor_runs( $content );
			$next_run = static function ( $note_id ) use ( &$used ) {
				$run = 0;
				while ( isset( $used[ $note_id ][ $run ] ) ) {
					++$run;
				}
				$used[ $note_id ][ $run ] = true;
				return $run;
			};

			$content = self::extract_blocks( $content, $notes, $exclude, $next_run, $result['items'] );
			$content = self::extract_inline( $content, $notes, $exclude, $originals, $next_run, $result['items'] );
			$content = self::extract_moves( $content, $notes, $exclude, $next_run, $result['items'] );

			$result['content'] = $content;
			return $result;
		}

		/**
		 * Puts stored proposals back into anchored content.
		 *
		 * @param string             $content Anchored content.
		 * @param array<int, array[]> $items  Items per note id.
		 * @return string The content as the editor saved it.
		 */
		public static function inflate( $content, $items ) {
			if ( ! is_string( $content ) || ! self::may_carry_proposals( $content ) ) {
				return $content;
			}
			$lookup = array();
			foreach ( $items as $note_id => $list ) {
				foreach ( (array) $list as $item ) {
					if ( is_array( $item ) && isset( $item['kind'], $item['run'] ) ) {
						$lookup[ (int) $note_id ][ $item['kind'] . ':' . (int) $item['run'] ] = $item;
					}
				}
			}

			$content = self::inflate_moves( $content, $lookup );
			$content = self::inflate_blocks( $content, $lookup );
			return self::inflate_inline( $content, $lookup );
		}

		/**
		 * Lists the anchors in content.
		 *
		 * @param string $content Content.
		 * @return array<int, array<int|string, true>> Note id => set of runs,
		 *         and of `kind:run` keys.
		 */
		public static function anchor_runs( $content ) {
			$runs = array();
			if ( ! is_string( $content ) || ! self::may_carry_proposals( $content ) ) {
				return $runs;
			}
			$add = static function ( $note_id, $kind, $run ) use ( &$runs ) {
				if ( $note_id > 0 && is_numeric( $run ) ) {
					$runs[ $note_id ][ (int) $run ]               = true;
					$runs[ $note_id ][ $kind . ':' . (int) $run ] = true;
				}
			};

			$blocks = Gutenberg_Suggestion_Block_Scanner::scan( $content );
			foreach ( (array) $blocks as $block ) {
				if ( self::PLACEHOLDER === $block['name'] ) {
					if ( isset( $block['attrs']['id'], $block['attrs']['run'] ) && is_numeric( $block['attrs']['id'] ) ) {
						$kind = isset( $block['attrs']['type'] ) && 'pending-move' === $block['attrs']['type'] ? 'move' : 'block';
						$add( (int) $block['attrs']['id'], $kind, $block['attrs']['run'] );
					}
					continue;
				}
				$marker = Gutenberg_Suggestion_Block_Scanner::marker( $block );
				if ( ! $marker || ! isset( $marker['run'] ) ) {
					continue;
				}
				list( $comment_id, $note_ids ) = Gutenberg_Suggestion_Block_Scanner::marker_note_ids( $block );
				foreach ( null !== $comment_id ? array( $comment_id ) : $note_ids as $note_id ) {
					$add( $note_id, 'after', $marker['run'] );
				}
			}

			if ( false !== strpos( $content, 'data-suggestion-run' ) ) {
				foreach ( (array) gutenberg_pair_inline_suggestion_markers( $content ) as $marker ) {
					if ( null !== $marker['run'] && ! $marker['legacy'] && $marker['balanced'] ) {
						$add( $marker['id'], 'inline', $marker['run'] );
					}
				}
			}

			return $runs;
		}

		/**
		 * Keeps the items whose anchors are in content.
		 *
		 * @param array<int, array[]> $items   Items per note id.
		 * @param string              $content Anchored content.
		 * @return array<int, array[]> Items per note id, notes without any left out.
		 */
		public static function filter_present( $items, $content ) {
			$runs     = self::anchor_runs( $content );
			$filtered = array();
			foreach ( $items as $note_id => $list ) {
				foreach ( (array) $list as $item ) {
					if ( isset( $runs[ $note_id ][ $item['kind'] . ':' . (int) $item['run'] ] ) ) {
						$filtered[ $note_id ][] = $item;
					}
				}
			}
			return $filtered;
		}

		/**
		 * Encodes one note's items for storage.
		 *
		 * @param array[] $items Items.
		 * @return string JSON.
		 */
		public static function encode( $items ) {
			return (string) wp_json_encode(
				array(
					'v'     => self::VERSION,
					'items' => array_values( $items ),
				)
			);
		}

		/**
		 * Decodes stored items.
		 *
		 * @param mixed $json Stored JSON.
		 * @return array[] Items, empty for anything unreadable.
		 */
		public static function decode( $json ) {
			$decoded = is_string( $json ) && '' !== $json ? json_decode( $json, true ) : null;
			if ( ! is_array( $decoded ) || ! isset( $decoded['v'], $decoded['items'] ) || self::VERSION !== $decoded['v'] || ! is_array( $decoded['items'] ) ) {
				return array();
			}
			$items = array();
			foreach ( $decoded['items'] as $item ) {
				if ( is_array( $item ) && isset( $item['kind'], $item['run'], $item['anchor'], $item['original'] ) && is_string( $item['anchor'] ) && is_string( $item['original'] ) ) {
					$items[] = $item;
				}
			}
			return $items;
		}

		/**
		 * Cheap probe for content that may hold markers or anchors.
		 *
		 * @param string $content Content.
		 * @return bool
		 */
		public static function may_carry_proposals( $content ) {
			return false !== strpos( $content, 'wp-suggestion-' )
				|| false !== strpos( $content, '"suggestion":' )
				|| false !== strpos( $content, 'wp:suggestion-placeholder' );
		}

		/**
		 * The void block that holds a suggested block's place.
		 *
		 * @param int    $note_id Note id.
		 * @param string $type    Structural marker type.
		 * @param int    $run     Run.
		 * @return string Serialized placeholder.
		 */
		public static function placeholder( $note_id, $type, $run ) {
			return '<!-- wp:suggestion-placeholder ' . serialize_block_attributes(
				array(
					'id'   => (int) $note_id,
					'type' => $type,
					'run'  => (int) $run,
				)
			) . ' /-->';
		}

		/**
		 * Block-level extraction: suggested blocks and attribute proposals.
		 *
		 * @param string             $content  Content.
		 * @param array<int, true>   $notes    Suggestion note ids of the post.
		 * @param array<int, true>   $exclude  Note ids to leave in full form.
		 * @param callable           $next_run Run allocator.
		 * @param array<int, array[]> $items   Items per note id, added to.
		 * @return string Content.
		 */
		private static function extract_blocks( $content, $notes, $exclude, $next_run, &$items ) {
			if ( false === strpos( $content, '"suggestion":' ) ) {
				return $content;
			}
			$blocks = Gutenberg_Suggestion_Block_Scanner::scan( $content );
			if ( null === $blocks ) {
				return $content;
			}

			$edits   = array();
			$swallow = -1;
			foreach ( $blocks as $block ) {
				if ( $block['start'] < $swallow || self::PLACEHOLDER === $block['name'] ) {
					continue;
				}
				$marker = Gutenberg_Suggestion_Block_Scanner::marker( $block );
				if ( ! $marker ) {
					continue;
				}
				$owner = self::block_owner( $block, $notes );
				if ( 0 === $owner || isset( $exclude[ $owner ] ) ) {
					continue;
				}

				if ( 'pending-insert' === $marker['type'] ) {
					$swallow = $block['end'];
					if ( $owner < 0 ) {
						$edits[] = array( $block['start'], $block['end'], '' );
						continue;
					}
					$run               = $next_run( $owner );
					$anchor            = self::placeholder( $owner, 'pending-insert', $run );
					$edits[]           = array( $block['start'], $block['end'], $anchor );
					$items[ $owner ][] = array(
						'kind'     => 'block',
						'run'      => $run,
						'anchor'   => $anchor,
						'original' => substr( $content, $block['start'], $block['end'] - $block['start'] ),
					);
					continue;
				}

				if ( ! isset( $marker['after'] ) || ! is_array( $marker['after'] ) || empty( $marker['after'] ) ) {
					continue;
				}
				$opener = substr( $content, $block['start'], $block['opener_length'] );
				$attrs  = Gutenberg_Suggestion_Block_Scanner::opener_attributes( $opener );
				if ( ! $attrs || ! isset( $attrs->metadata->suggestion ) || ! is_object( $attrs->metadata->suggestion ) ) {
					continue;
				}
				unset( $attrs->metadata->suggestion->after );
				$run = null;
				if ( $owner > 0 ) {
					$run                              = $next_run( $owner );
					$attrs->metadata->suggestion->run = $run;
				}
				$anchor = Gutenberg_Suggestion_Block_Scanner::rewrite_opener( $opener, $attrs );
				if ( null === $anchor ) {
					continue;
				}
				$edits[] = array( $block['start'], $block['start'] + $block['opener_length'], $anchor );
				if ( null !== $run ) {
					$items[ $owner ][] = array(
						'kind'     => 'after',
						'run'      => $run,
						'anchor'   => $anchor,
						'original' => $opener,
						'after'    => $marker['after'],
					);
				}
			}

			return gutenberg_apply_suggestion_splices( $content, $edits );
		}

		/**
		 * Inline extraction: additions and formatting changes.
		 *
		 * @param string             $content   Content.
		 * @param array<int, true>   $notes     Suggestion note ids of the post.
		 * @param array<int, true>   $exclude   Note ids to leave in full form.
		 * @param array<int, string> $originals Original run of each formatting suggestion.
		 * @param callable           $next_run  Run allocator.
		 * @param array<int, array[]> $items   Items per note id, added to.
		 * @return string Content.
		 */
		private static function extract_inline( $content, $notes, $exclude, $originals, $next_run, &$items ) {
			if ( false === strpos( $content, 'wp-suggestion-' ) ) {
				return $content;
			}
			$markers = gutenberg_pair_inline_suggestion_markers( $content );
			if ( null === $markers ) {
				return $content;
			}

			$edits = array();
			// End of the last run taken whole: markers inside it go with it.
			$covered = -1;
			foreach ( $markers as $marker ) {
				if ( $marker['start'] < $covered ) {
					continue;
				}
				if ( $marker['legacy'] || null !== $marker['run'] || ! $marker['balanced'] || 'del' === $marker['kind'] ) {
					continue;
				}
				$note_id = $marker['id'];
				if ( isset( $exclude[ $note_id ] ) ) {
					continue;
				}
				$inner = '';
				if ( 'format' === $marker['kind'] ) {
					$inner_start = $marker['start'] + $marker['length'];
					if (
						! isset( $notes[ $note_id ], $originals[ $note_id ] ) ||
						! is_string( $originals[ $note_id ] ) ||
						$marker['inner_markers'] > 0 ||
						self::text_of( $originals[ $note_id ] ) !== self::text_of( substr( $content, $inner_start, $marker['closer'][0] - $inner_start ) )
					) {
						continue;
					}
					$inner = $originals[ $note_id ];
				}
				$covered = $marker['end'];
				if ( ! isset( $notes[ $note_id ] ) ) {
					$edits[] = array( $marker['start'], $marker['end'], '' );
					continue;
				}
				$run    = $next_run( $note_id );
				$anchor = self::anchor_opener( substr( $content, $marker['start'], $marker['length'] ), $run )
					. $inner
					. substr( $content, $marker['closer'][0], $marker['closer'][1] );

				$edits[]             = array( $marker['start'], $marker['end'], $anchor );
				$items[ $note_id ][] = array(
					'kind'     => 'inline',
					'run'      => $run,
					'anchor'   => $anchor,
					'original' => substr( $content, $marker['start'], $marker['end'] - $marker['start'] ),
				);
			}

			return gutenberg_apply_suggestion_splices( $content, $edits );
		}

		/**
		 * Move extraction: a pending move goes back to its original position.
		 *
		 * A move is stored as the block at its proposed position with
		 * `metadata.suggestion.fromIndex` recording where it came from. A
		 * sibling list is put back in its original order under the same rules
		 * the front-end restore (`gutenberg_restore_pending_move_block_order()`)
		 * applies: exactly one pending move in the list, no `crossedParents`,
		 * an origin on the same side of the root boundary, a `fromIndex` in
		 * range. It also needs only whitespace between the siblings, so moving
		 * block substrings never moves other markup. Anything else stays in the
		 * proposed order, as before.
		 *
		 * The region between the move's two positions is rewritten with the
		 * same separators in the same places, and a placeholder marks the
		 * proposed position. The item keeps the exact region before and after,
		 * and where the placeholder sits in it.
		 *
		 * @param string             $content  Content.
		 * @param array<int, true>   $notes    Suggestion note ids of the post.
		 * @param array<int, true>   $exclude  Note ids to leave in full form.
		 * @param callable           $next_run Run allocator.
		 * @param array<int, array[]> $items   Items per note id, added to.
		 * @return string Content.
		 */
		private static function extract_moves( $content, $notes, $exclude, $next_run, &$items ) {
			if ( false === strpos( $content, '"pending-move"' ) ) {
				return $content;
			}
			$blocks = Gutenberg_Suggestion_Block_Scanner::scan( $content );
			if ( null === $blocks ) {
				return $content;
			}

			$lists = array( array( true, array() ) );
			foreach ( $blocks as $index => $block ) {
				if ( null === $block['parent'] ) {
					$lists[0][1][] = $index;
				}
				if ( count( $block['children'] ) > 1 ) {
					$lists[] = array( false, $block['children'] );
				}
			}

			$candidates = array();
			foreach ( $lists as $list ) {
				list( $is_root, $siblings ) = $list;
				$count                      = count( $siblings );
				if ( $count < 2 ) {
					continue;
				}
				$moves = array();
				foreach ( $siblings as $offset => $index ) {
					$block = $blocks[ $index ];
					if ( self::PLACEHOLDER === $block['name'] ) {
						if ( isset( $block['attrs']['type'] ) && 'pending-move' === $block['attrs']['type'] ) {
							// Already in anchor form.
							continue 2;
						}
						continue;
					}
					$marker = Gutenberg_Suggestion_Block_Scanner::marker( $block );
					if ( $marker && 'pending-move' === $marker['type'] ) {
						$moves[] = $offset;
					}
				}
				if ( 1 !== count( $moves ) ) {
					continue;
				}
				$current = $moves[0];
				$block   = $blocks[ $siblings[ $current ] ];
				$marker  = Gutenberg_Suggestion_Block_Scanner::marker( $block );
				if ( ! isset( $marker['fromIndex'] ) || ! is_numeric( $marker['fromIndex'] ) || ! empty( $marker['crossedParents'] ) ) {
					continue;
				}
				$from_parent = isset( $marker['fromParentClientId'] ) ? $marker['fromParentClientId'] : null;
				if ( ( null === $from_parent || '' === $from_parent ) !== $is_root ) {
					continue;
				}
				$from = (int) $marker['fromIndex'];
				if ( $from < 0 || $from >= $count || $from === $current ) {
					continue;
				}
				$owner = self::block_owner( $block, $notes );
				if ( $owner <= 0 || isset( $exclude[ $owner ] ) ) {
					continue;
				}

				$gaps = array();
				for ( $offset = 0; $offset < $count - 1; $offset++ ) {
					$gap_start = $blocks[ $siblings[ $offset ] ]['end'];
					$gap       = substr( $content, $gap_start, $blocks[ $siblings[ $offset + 1 ] ]['start'] - $gap_start );
					if ( '' !== trim( $gap ) ) {
						continue 2;
					}
					$gaps[ $offset ] = $gap;
				}

				$low   = min( $current, $from );
				$high  = max( $current, $from );
				$order = range( $low, $high );
				array_splice( $order, $current - $low, 1 );
				array_splice( $order, $from - $low, 0, array( $current ) );
				$baseline = '';
				foreach ( $order as $slot => $offset ) {
					$block     = $blocks[ $siblings[ $offset ] ];
					$baseline .= substr( $content, $block['start'], $block['end'] - $block['start'] );
					if ( $low + $slot < $high ) {
						$baseline .= $gaps[ $low + $slot ];
					}
				}
				$start = $blocks[ $siblings[ $low ] ]['start'];
				$end   = $blocks[ $siblings[ $high ] ]['end'];

				$candidates[] = array( $start, $end, $owner, $baseline, $gaps[ $low ], $current < $from );
			}

			// A move nested inside another move's region goes with that region.
			$edits = array();
			foreach ( $candidates as $candidate ) {
				foreach ( $candidates as $other ) {
					if ( $other !== $candidate && $other[0] <= $candidate[0] && $candidate[1] <= $other[1] ) {
						continue 2;
					}
				}
				list( $start, $end, $owner, $baseline, $separator, $moved_up ) = $candidate;

				$run         = $next_run( $owner );
				$placeholder = self::placeholder( $owner, 'pending-move', $run );
				$anchor      = $moved_up ? $placeholder . $separator . $baseline : $baseline . $separator . $placeholder;

				$edits[]           = array( $start, $end, $anchor );
				$items[ $owner ][] = array(
					'kind'     => 'move',
					'run'      => $run,
					'anchor'   => $anchor,
					'original' => substr( $content, $start, $end - $start ),
					'offset'   => $moved_up ? 0 : strlen( $baseline . $separator ),
				);
			}

			return gutenberg_apply_suggestion_splices( $content, $edits );
		}

		/**
		 * Move inflation: puts a moved block back at its proposed position.
		 *
		 * The region around the placeholder must still be exactly what the
		 * extraction left; otherwise the placeholder is dropped and the blocks
		 * stay in the original order.
		 *
		 * @param string $content Content.
		 * @param array  $lookup  Items by note id and `kind:run`.
		 * @return string Content.
		 */
		private static function inflate_moves( $content, $lookup ) {
			if ( false === strpos( $content, '"type":"pending-move"' ) ) {
				return $content;
			}
			$blocks = Gutenberg_Suggestion_Block_Scanner::scan( $content );
			if ( null === $blocks ) {
				return $content;
			}

			$edits = array();
			foreach ( $blocks as $block ) {
				if ( self::PLACEHOLDER !== $block['name'] || ! isset( $block['attrs']['type'] ) || 'pending-move' !== $block['attrs']['type'] ) {
					continue;
				}
				$note_id = isset( $block['attrs']['id'] ) && is_numeric( $block['attrs']['id'] ) ? (int) $block['attrs']['id'] : 0;
				$run     = isset( $block['attrs']['run'] ) && is_numeric( $block['attrs']['run'] ) ? (int) $block['attrs']['run'] : -1;
				$item    = $lookup[ $note_id ][ 'move:' . $run ] ?? null;
				if ( $item && isset( $item['offset'] ) ) {
					$start = $block['start'] - (int) $item['offset'];
					if ( $start >= 0 && substr( $content, $start, strlen( $item['anchor'] ) ) === $item['anchor'] ) {
						$edits[] = array( $start, $start + strlen( $item['anchor'] ), $item['original'] );
						continue;
					}
				}
				$edits[] = array( $block['start'], $block['end'], '' );
			}

			return gutenberg_apply_suggestion_splices( $content, $edits );
		}

		/**
		 * Block-level inflation.
		 *
		 * @param string $content Content.
		 * @param array  $lookup  Items by note id and `kind:run`.
		 * @return string Content.
		 */
		private static function inflate_blocks( $content, $lookup ) {
			if ( false === strpos( $content, 'wp:suggestion-placeholder' ) && false === strpos( $content, '"run":' ) ) {
				return $content;
			}
			$blocks = Gutenberg_Suggestion_Block_Scanner::scan( $content );
			if ( null === $blocks ) {
				return $content;
			}

			$edits = array();
			foreach ( $blocks as $block ) {
				if ( self::PLACEHOLDER === $block['name'] ) {
					$note_id = isset( $block['attrs']['id'] ) && is_numeric( $block['attrs']['id'] ) ? (int) $block['attrs']['id'] : 0;
					$run     = isset( $block['attrs']['run'] ) && is_numeric( $block['attrs']['run'] ) ? (int) $block['attrs']['run'] : -1;
					$is_move = isset( $block['attrs']['type'] ) && 'pending-move' === $block['attrs']['type'];
					$item    = $is_move ? null : ( $lookup[ $note_id ][ 'block:' . $run ] ?? null );
					// The placeholder carries nothing but its id, type and run,
					// so a re-encoded copy still names the same item. A move's
					// placeholder still here could not be restored, so the
					// blocks stay in the original order.
					$edits[] = array( $block['start'], $block['end'], $item ? $item['original'] : '' );
					continue;
				}

				$marker = Gutenberg_Suggestion_Block_Scanner::marker( $block );
				if ( ! $marker || ! isset( $marker['run'] ) || ! is_numeric( $marker['run'] ) ) {
					continue;
				}
				list( $comment_id, $note_ids ) = Gutenberg_Suggestion_Block_Scanner::marker_note_ids( $block );
				$item                          = null;
				foreach ( null !== $comment_id ? array( $comment_id ) : $note_ids as $note_id ) {
					if ( isset( $lookup[ $note_id ][ 'after:' . (int) $marker['run'] ] ) ) {
						$item = $lookup[ $note_id ][ 'after:' . (int) $marker['run'] ];
						break;
					}
				}
				if ( ! $item ) {
					continue;
				}
				$opener = substr( $content, $block['start'], $block['opener_length'] );
				if ( $opener === $item['anchor'] ) {
					$edits[] = array( $block['start'], $block['start'] + $block['opener_length'], $item['original'] );
					continue;
				}
				// The opener changed since (another writer re-encoded or edited
				// it): put the proposal back into what is there now.
				$attrs = Gutenberg_Suggestion_Block_Scanner::opener_attributes( $opener );
				if ( ! $attrs || ! isset( $attrs->metadata->suggestion ) || ! is_object( $attrs->metadata->suggestion ) || ! isset( $item['after'] ) ) {
					continue;
				}
				unset( $attrs->metadata->suggestion->run );
				$attrs->metadata->suggestion->after = json_decode( wp_json_encode( $item['after'] ) );
				$merged                             = Gutenberg_Suggestion_Block_Scanner::rewrite_opener( $opener, $attrs );
				if ( null !== $merged ) {
					$edits[] = array( $block['start'], $block['start'] + $block['opener_length'], $merged );
				}
			}

			return gutenberg_apply_suggestion_splices( $content, $edits );
		}

		/**
		 * Inline inflation.
		 *
		 * @param string $content Content.
		 * @param array  $lookup  Items by note id and `kind:run`.
		 * @return string Content.
		 */
		private static function inflate_inline( $content, $lookup ) {
			if ( false === strpos( $content, 'data-suggestion-run' ) ) {
				return $content;
			}
			$markers = gutenberg_pair_inline_suggestion_markers( $content );
			if ( null === $markers ) {
				return $content;
			}

			$edits = array();
			foreach ( $markers as $marker ) {
				if ( null === $marker['run'] || $marker['legacy'] || ! $marker['balanced'] || ! is_numeric( $marker['run'] ) ) {
					continue;
				}
				$span = substr( $content, $marker['start'], $marker['end'] - $marker['start'] );
				$item = $lookup[ $marker['id'] ][ 'inline:' . (int) $marker['run'] ] ?? null;
				if ( $item && $span === $item['anchor'] ) {
					$edits[] = array( $marker['start'], $marker['end'], $item['original'] );
					continue;
				}
				if ( 'add' === $marker['kind'] ) {
					// Fail closed: an anchor nobody can vouch for proposes nothing.
					$edits[] = array( $marker['start'], $marker['end'], '' );
				} elseif ( 'format' === $marker['kind'] ) {
					// Fail closed: keep the original run the anchor holds.
					$edits[] = array( $marker['start'], $marker['start'] + $marker['length'], '' );
					$edits[] = array( $marker['closer'][0], $marker['closer'][0] + $marker['closer'][1], '' );
				}
			}

			return gutenberg_apply_suggestion_splices( $content, $edits );
		}

		/**
		 * The note a block's structural marker belongs to.
		 *
		 * @param array            $block Scanned block.
		 * @param array<int, true> $notes Suggestion note ids of the post.
		 * @return int The note id; 0 when the marker names no note yet; -1 when
		 *             its `commentId` is not a suggestion note of the post.
		 */
		private static function block_owner( $block, $notes ) {
			list( $comment_id, $note_ids ) = Gutenberg_Suggestion_Block_Scanner::marker_note_ids( $block );
			if ( null !== $comment_id && $comment_id > 0 ) {
				return isset( $notes[ $comment_id ] ) ? $comment_id : -1;
			}
			foreach ( $note_ids as $note_id ) {
				if ( isset( $notes[ $note_id ] ) ) {
					return $note_id;
				}
			}
			return 0;
		}

		/**
		 * The text of an HTML fragment, entities decoded.
		 *
		 * @param string $html HTML.
		 * @return string Text.
		 */
		private static function text_of( $html ) {
			$processor = new WP_HTML_Tag_Processor( $html );
			$text      = '';
			while ( $processor->next_token() ) {
				if ( '#text' === $processor->get_token_type() ) {
					$text .= $processor->get_modifiable_text();
				}
			}
			return $text;
		}

		/**
		 * Adds the run attribute to an inline marker opener.
		 *
		 * @param string $opener Exact opener.
		 * @param int    $run    Run.
		 * @return string Opener in anchor form.
		 */
		private static function anchor_opener( $opener, $run ) {
			$processor = new WP_HTML_Tag_Processor( $opener );
			$processor->next_tag();
			$processor->set_attribute( 'data-suggestion-run', (string) $run );
			return $processor->get_updated_html();
		}
	}
}
