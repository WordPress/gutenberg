<?php
/**
 * Inline suggestion support for suggest mode.
 *
 * Inline suggestions are anchored in raw block content as
 * `<mark class="wp-suggestion" data-suggestion-id="N" data-suggestion-type="del|add" data-author="A">…</mark>`
 * so a suggestion survives edits elsewhere in the block (offsets are derived
 * from the marker on read, never stored). This mirrors inline notes
 * (`lib/compat/wordpress-7.1/block-comments.php`) but the render-time strip is
 * type-aware.
 *
 * This file also registers the comment meta that backs a suggested edit. A
 * note-type comment becomes a suggestion when it carries a `_wp_suggestion`
 * payload; `_wp_suggestion_status` tracks its apply/reject lifecycle. The base
 * note infrastructure graduated to WordPress 6.9 core, so only the
 * suggestion-specific additions live here in the 7.1 compat layer.
 *
 * @package gutenberg
 */

/**
 * Maximum byte length of a `_wp_suggestion` payload. Mirrored on the client
 * (`PAYLOAD_MAX_BYTES` in suggestion-mode/provider.js) so the editor refuses
 * to submit anything the server will reject.
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES' ) ) {
	define( 'GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES', 65536 );
}

/**
 * Applies `wp_kses_post()` to the HTML-bearing string fields of a serialized
 * block snapshot carried inside a suggestion operation (`op.block` on
 * `block-remove` / `block-insert-after` ops), recursing into `innerBlocks`.
 *
 * `innerHTML` and `originalContent` are the fields a consumer turns back
 * into markup when the block is re-inserted. `attributes` get the same
 * string-leaf walk core applies to parsed blocks, so no nested value
 * escapes the filter.
 *
 * @param array $block Serialized block snapshot (decoded from JSON).
 * @return array Snapshot with HTML-bearing fields filtered.
 */
function gutenberg_kses_suggestion_block_snapshot( $block ) {
	foreach ( array( 'innerHTML', 'originalContent' ) as $key ) {
		if ( isset( $block[ $key ] ) && is_string( $block[ $key ] ) ) {
			$block[ $key ] = wp_kses_post( $block[ $key ] );
		}
	}
	if ( isset( $block['attributes'] ) && is_array( $block['attributes'] ) ) {
		$block['attributes'] = filter_block_kses_value( $block['attributes'], 'post' );
	}
	if ( isset( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
		foreach ( $block['innerBlocks'] as $index => $inner_block ) {
			if ( is_array( $inner_block ) ) {
				$block['innerBlocks'][ $index ] = gutenberg_kses_suggestion_block_snapshot( $inner_block );
			}
		}
	}
	return $block;
}

/**
 * Sanitizes a `_wp_suggestion` payload to match what the writing user could
 * publish directly in post content.
 *
 * The suggestion payload is applied verbatim to block attributes when a
 * reviewer accepts it. Without write-time filtering, a low-capability
 * suggester could smuggle markup (script tags, event handlers) that a
 * reviewer with `unfiltered_html` would then persist under their own KSES
 * exemption. To close that hole while keeping parity with regular editing:
 *
 *   - Users with `unfiltered_html` store the payload as-is — the same
 *     freedom they already have in post content.
 *   - Everyone else has `wp_kses_post()` applied to every string leaf of
 *     the values that get APPLIED to content on accept/reject: `after`,
 *     `afterHTML`, `beforeHTML`, and the serialized block snapshot in `block`.
 *
 * `before` is intentionally NOT filtered: it is only compared against live
 * content for conflict detection, never applied. Filtering it would produce
 * false staleness warnings whenever the real content contains markup that
 * KSES would strip.
 *
 * Note: apply-time sanitization scope is still under discussion; this
 * write-time capability-matched filter is the baseline.
 *
 * @param string $value Raw JSON payload.
 * @return string Sanitized JSON payload, or '' when the payload is invalid.
 */
function gutenberg_sanitize_suggestion_payload( $value ) {
	if ( current_user_can( 'unfiltered_html' ) ) {
		return $value;
	}

	$decoded = json_decode( $value, true );
	// The REST controller rejects invalid-JSON payloads with a 400 before
	// this callback runs; treat any non-REST garbage the same way the size
	// cap does — reject rather than store something the client can't parse.
	if ( ! is_array( $decoded ) ) {
		return '';
	}

	if ( isset( $decoded['operations'] ) && is_array( $decoded['operations'] ) ) {
		foreach ( $decoded['operations'] as $index => $operation ) {
			if ( ! is_array( $operation ) ) {
				continue;
			}
			// `after` can be structured (a table's `body` rows, a gallery's
			// `images`), so every string leaf is filtered, not only strings.
			foreach ( array( 'after', 'afterHTML', 'beforeHTML' ) as $key ) {
				if ( isset( $operation[ $key ] ) ) {
					$operation[ $key ] = filter_block_kses_value( $operation[ $key ], 'post' );
				}
			}
			if ( isset( $operation['block'] ) && is_array( $operation['block'] ) ) {
				$operation['block'] = gutenberg_kses_suggestion_block_snapshot( $operation['block'] );
			}
			$decoded['operations'][ $index ] = $operation;
		}
	}

	$encoded = wp_json_encode( $decoded );
	return false === $encoded ? '' : $encoded;
}

/**
 * Registers the comment meta used by suggested edits.
 *
 * Notes ship in WordPress 6.9 core, which registers the base note meta
 * (`_wp_note_status`). Suggestions are a Gutenberg 7.1 feature layered on top,
 * so the suggestion-specific meta is registered here:
 *
 *   - `_wp_suggestion`        — proposed edit, JSON payload. Presence of this
 *                               meta is what makes a note a suggestion.
 *   - `_wp_suggestion_status` — suggestion lifecycle (`pending` / `applied`
 *                               / `rejected`). Set on apply or reject so the
 *                               comment thread persists as evidence even after
 *                               the suggestion is resolved.
 *
 * The suggestion is stored as comment meta rather than `comment_content` so a
 * note can carry both a discussion (content) and a proposed edit (meta), and so
 * per-meta `auth_callback`/`sanitize_callback` give strict per-field control
 * independent of comment-text moderation. Size validation is strict: oversized
 * payloads are rejected rather than truncated, since truncating JSON corrupts
 * the payload.
 */
function gutenberg_register_suggestion_meta() {
	$max_suggestion_payload_bytes = GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES;

	register_meta(
		'comment',
		'_wp_suggestion',
		array(
			'type'              => 'string',
			'description'       => __( 'Suggested edit payload (JSON).', 'gutenberg' ),
			'single'            => true,
			'show_in_rest'      => array(
				'schema' => array(
					'type'      => 'string',
					'maxLength' => $max_suggestion_payload_bytes,
				),
			),
			'sanitize_callback' => function ( $value ) use ( $max_suggestion_payload_bytes ) {
				if ( ! is_string( $value ) ) {
					return '';
				}
				// Reject rather than truncate. Truncating mid-string produces
				// invalid JSON; `parseSuggestionPayload` would then return
				// null and the suggestion would silently disappear.
				if ( strlen( $value ) > $max_suggestion_payload_bytes ) {
					return '';
				}
				// Capability-matched KSES filtering; runs as the writing user
				// (the suggester) on create/update.
				return gutenberg_sanitize_suggestion_payload( $value );
			},
			'auth_callback'     => function ( $allowed, $meta_key, $object_id ) {
				// During comment creation the comment does not yet exist, so
				// `object_id` is 0. Defer to the comment controller's own
				// create permission — if the request can create the
				// comment at all, it can set the suggestion meta on it.
				if ( ! $object_id ) {
					return current_user_can( 'edit_posts' );
				}
				$comment = get_comment( $object_id );
				if ( $comment && 'note' === $comment->comment_type ) {
					return current_user_can( 'edit_post', $comment->comment_post_ID );
				}
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);

	register_meta(
		'comment',
		'_wp_suggestion_status',
		array(
			'type'          => 'string',
			'description'   => __( 'Suggestion lifecycle status.', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type' => 'string',
					'enum' => array( 'pending', 'applied', 'rejected' ),
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				$comment = get_comment( $object_id );
				if ( $comment && 'note' === $comment->comment_type ) {
					return current_user_can( 'edit_post', $comment->comment_post_ID );
				}
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_suggestion_meta' );

/**
 * Strip inline suggestion markers from rendered block output.
 *
 * The public HTML must never expose suggestion metadata, and an un-accepted
 * addition must never reach the front end. `render_block` therefore strips the
 * markers, type-aware:
 *
 * - `del` (suggested deletion): the marked text already exists, so the wrapper
 *   is unwrapped but the text is kept. It is only removed when the suggestion
 *   is accepted in the editor.
 * - `add` (suggested addition): the marked text is proposed new content, so the
 *   wrapper *and* the text are removed. It only becomes permanent when accepted.
 * - `format` (suggested formatting change): the marked run carries the proposed
 *   formatting, so the whole span is replaced with the original run recorded on
 *   the note (see `gutenberg_get_pending_format_suggestion_html()`). When that
 *   original cannot be resolved the marker falls back to deletion handling.
 *
 * The raw `post_content` (and the REST `raw` view, revisions, exports) keeps the
 * markers so the editor can re-attach on reload. Only `wp-suggestion` markers
 * are touched: `WP_HTML_Tag_Processor::has_class()` matches the class by exact
 * token, so an unrelated `<mark>` (a `core/text-color` highlight, a `wp-note`,
 * or a `wp-suggestion-foo` class) survives byte-for-byte.
 *
 * A single `WP_HTML_Tag_Processor` walk classifies and strips the markers, the
 * same way `gutenberg_strip_inline_note_markers()` unwraps note markers. The
 * HTML API has no public way to remove a tag (or a tag and everything up to its
 * closer) yet - it is on the roadmap,
 * https://github.com/WordPress/gutenberg/discussions/54583 - so an anonymous
 * subclass enqueues the text replacements directly. Walking tokens rather than
 * matching `<mark>` with a regex means `</mark>`-looking text inside a comment
 * or an attribute value can never be mistaken for a tag. A nesting stack pairs
 * each opener with its own closer; a marker without a closer (malformed or
 * truncated markup) is left in place so its content is never dropped. When
 * markers nest, the outer replacement wins: replacing a span discards every
 * edit already queued inside it.
 *
 * @param string        $block_content Rendered block HTML.
 * @param array         $block         Parsed block. Unused.
 * @param WP_Block|null $instance      Block instance, whose `postId` context
 *                                     names the post being rendered.
 * @return string Block HTML with wp-suggestion markers stripped (type-aware).
 */
function gutenberg_strip_inline_suggestion_markers( $block_content, $block = array(), $instance = null ) {
	/*
	 * Set while a restored original run is stripped, so markers inside it are
	 * unwrapped rather than resolved again - a note cannot pull in another
	 * note's original, or its own.
	 */
	static $restoring = false;

	if ( false === strpos( $block_content, 'wp-suggestion' ) ) {
		return $block_content;
	}

	$post_id = 0;
	if ( ! $restoring ) {
		$post_id = ( $instance instanceof WP_Block && isset( $instance->context['postId'] ) )
			? (int) $instance->context['postId']
			: (int) get_the_ID();
	}

	// Anonymous subclass exposing span replacement, which WP_HTML_Tag_Processor
	// does not provide publicly yet. The redeclaration-guard sniff cannot tell
	// these class methods from global functions, so it is disabled for the
	// class body.
	// phpcs:disable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration
	$processor = new class( $block_content ) extends WP_HTML_Tag_Processor {
		/**
		 * One bookmark per open suggestion marker, so the default limit of 10
		 * would cap how deeply markers may nest.
		 */
		const MAX_BOOKMARKS = 1000;

		/**
		 * Replaces the bytes from the start of a bookmarked opener to the end
		 * of the current token, then releases the bookmark.
		 *
		 * @param string $opener Bookmark set on the opener.
		 * @param string $text   Replacement text.
		 */
		public function replace_through_current_token( string $opener, string $text ): void {
			$this->set_bookmark( 'here' );
			$this->replace_range( $this->bookmarks[ $opener ]->start, $this->bookmarks['here']->start + $this->bookmarks['here']->length, $text );
			$this->release_bookmark( $opener );
		}

		/**
		 * Removes a bookmarked opener and the current token, keeping the text
		 * between them, then releases the bookmark.
		 *
		 * @param string $opener Bookmark set on the opener.
		 */
		public function unwrap_through_current_token( string $opener ): void {
			$this->set_bookmark( 'here' );
			$open = $this->bookmarks[ $opener ];
			$here = $this->bookmarks['here'];
			$this->replace_range( $open->start, $open->start + $open->length, '' );
			$this->replace_range( $here->start, $here->start + $here->length, '' );
			$this->release_bookmark( $opener );
		}

		/**
		 * Enqueues a replacement of the half-open byte range [start, end).
		 *
		 * Markers nest, so every edit already queued at or after `$start` lies
		 * inside the range (the cursor is at its end). Those edits are dropped
		 * first: the processor applies updates in order and would garble the
		 * output if two of them overlapped. Edits already flushed into the
		 * document are accounted for, because bookmarks move with them.
		 *
		 * @param int    $start Range start.
		 * @param int    $end   Range end.
		 * @param string $text  Replacement text.
		 */
		private function replace_range( int $start, int $end, string $text ): void {
			foreach ( $this->lexical_updates as $key => $update ) {
				if ( $update->start >= $start && $update->start < $end ) {
					unset( $this->lexical_updates[ $key ] );
				}
			}
			$this->lexical_updates[] = new WP_HTML_Text_Replacement( $start, $end - $start, $text );
		}
	};
	// phpcs:enable Gutenberg.CodeAnalysis.GuardedFunctionAndClassNames.FunctionNotGuardedAgainstRedeclaration

	/*
	 * Each `<mark>` opener pushes its strip mode (`null` for a mark that is not
	 * a suggestion marker) so each closer pops the mode of its own opener.
	 */
	$mark_stack = array();
	$count      = 0;
	$query      = array( 'tag_closers' => 'visit' );
	while ( $processor->next_tag( $query ) ) {
		$is_mark = 'MARK' === $processor->get_tag();

		if ( $processor->is_tag_closer() ) {
			$open = $is_mark ? array_pop( $mark_stack ) : null;
			if ( null === $open ) {
				continue;
			}
			if ( 'del' === $open['mode'] ) {
				$processor->unwrap_through_current_token( $open['bookmark'] );
				continue;
			}
			$text = '';
			if ( 'format' === $open['mode'] ) {
				$restoring = true;
				$text      = gutenberg_strip_inline_suggestion_markers( $open['original'] );
				$restoring = false;
			}
			$processor->replace_through_current_token( $open['bookmark'], $text );
			continue;
		}

		/*
		 * `data-wp-suggestion-strip` was the sentinel attribute of an earlier
		 * implementation. Keep removing it so a copy planted by a user (data-*
		 * attributes pass KSES) never reaches public output. On a tag that is
		 * later removed, the queued removal is dropped with it.
		 */
		$processor->remove_attribute( 'data-wp-suggestion-strip' );

		if ( ! $is_mark ) {
			continue;
		}
		if ( ! $processor->has_class( 'wp-suggestion' ) ) {
			$mark_stack[] = null;
			continue;
		}

		// An unknown or missing type defaults to deletion (unwrap, keep text)
		// so a malformed marker never silently drops content.
		$type  = $processor->get_attribute( 'data-suggestion-type' );
		$entry = array(
			'mode'     => ( 'add' === $type ) ? 'add' : 'del',
			'bookmark' => 'suggestion-' . ++$count,
		);
		if ( 'format' === $type ) {
			$original = gutenberg_get_pending_format_suggestion_html(
				(int) $processor->get_attribute( 'data-suggestion-id' ),
				$post_id
			);
			if ( null !== $original ) {
				$entry['mode']     = 'format';
				$entry['original'] = $original;
			}
		}
		// Past the bookmark limit the marker is left in place, like an
		// unclosed one, rather than paired without knowing where it starts.
		$mark_stack[] = $processor->set_bookmark( $entry['bookmark'] ) ? $entry : null;
	}

	return $processor->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_strip_inline_suggestion_markers', 10, 3 );

/**
 * Resolves the original run of a pending inline format suggestion.
 *
 * A `format` marker's run carries the proposed formatting; the note records the
 * run as it was in its payload's `beforeHTML`. The original is only returned
 * for a note on the post being rendered, so a marker copied into another post
 * cannot pull that post's text onto this page, and only while the suggestion
 * has not been applied.
 *
 * `beforeHTML` was filtered at write time to what its author could publish
 * directly (see `gutenberg_sanitize_suggestion_payload()`).
 *
 * @param int $note_id Note comment ID from the marker.
 * @param int $post_id Post being rendered.
 * @return string|null Original run HTML, or null when it cannot be resolved.
 */
function gutenberg_get_pending_format_suggestion_html( $note_id, $post_id ) {
	if ( $note_id <= 0 || $post_id <= 0 ) {
		return null;
	}
	$note = get_comment( $note_id );
	if ( ! $note || 'note' !== $note->comment_type || (int) $note->comment_post_ID !== $post_id ) {
		return null;
	}
	if ( 'applied' === get_comment_meta( $note_id, '_wp_suggestion_status', true ) ) {
		return null;
	}
	$payload = json_decode( (string) get_comment_meta( $note_id, '_wp_suggestion', true ), true );
	if ( ! is_array( $payload ) || ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
		return null;
	}
	foreach ( $payload['operations'] as $operation ) {
		if (
			is_array( $operation ) &&
			isset( $operation['suggestionType'], $operation['beforeHTML'] ) &&
			'format' === $operation['suggestionType'] &&
			is_string( $operation['beforeHTML'] )
		) {
			return $operation['beforeHTML'];
		}
	}
	return null;
}

/**
 * Hide un-accepted structural suggestions on the front end.
 *
 * Pending structural suggestion state (the `metadata.suggestion` marker, and
 * for insertions the suggested block itself) saves into `post_content` so a
 * suggestion survives a reload — the structural counterpart of the inline
 * markers above. At render time the strip is type-aware, mirroring the
 * del/add split:
 *
 * - `pending-remove`: the block is real content until its removal is
 *   accepted, so it renders unchanged (`metadata` never reaches front-end
 *   markup).
 * - `pending-insert`: the block is proposed new content, so it must not
 *   render until accepted — the whole subtree is dropped.
 * - `pending-move`: the block renders (its content is real). Restoring its
 *   pre-move position is a sibling-order concern that a per-block filter
 *   cannot express, so it is handled before render by
 *   `gutenberg_restore_pending_move_order()`.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block, including attributes.
 * @return string Block HTML, or an empty string for a pending insertion.
 */
function gutenberg_strip_pending_structural_suggestions( $block_content, $block ) {
	if ( ! isset( $block['attrs']['metadata']['suggestion']['type'] ) ) {
		return $block_content;
	}
	if ( 'pending-insert' === $block['attrs']['metadata']['suggestion']['type'] ) {
		return '';
	}
	return $block_content;
}
add_filter( 'render_block', 'gutenberg_strip_pending_structural_suggestions', 10, 2 );

/**
 * Puts moved blocks back into their original slots and closes the gaps.
 *
 * Split out from `gutenberg_restore_pending_move_block_order()` so the
 * placement rules can be exercised directly: the caller currently declines to
 * restore a list holding more than one pending move (see the gate there), so
 * the multi-move behaviour this function defines is otherwise unreachable.
 *
 * Moved blocks claim their slots lowest `fromIndex` first, which makes two
 * moves resolve deterministically. Every block that did not move keeps its
 * current relative order and flows into whatever slots are left, which is also
 * its original relative order, since only the moved blocks left their place.
 *
 * A `fromIndex` already claimed by another move is unrestorable. That block is
 * put back into the queue of un-moved blocks AT ITS OWN OFFSET rather than
 * appended after them, so failing to restore a block leaves it where it is
 * instead of pushing it to the end of the list.
 *
 * @param array $siblings Blocks at one level, in their current (proposed) order.
 * @param array $moved    Map of current offset => `fromIndex`, for moved blocks only.
 * @return array `$siblings` reordered, same length.
 */
function gutenberg_reorder_pending_move_siblings( $siblings, $moved ) {
	$count = count( $siblings );
	asort( $moved );

	$slots    = array_fill( 0, $count, null );
	$unplaced = array();
	foreach ( $moved as $offset => $from_index ) {
		if ( null === $slots[ $from_index ] ) {
			$slots[ $from_index ] = $siblings[ $offset ];
		} else {
			$unplaced[ $offset ] = true;
		}
	}

	/*
	 * Keyed by offset and then sorted, so an unrestorable move rejoins the
	 * un-moved blocks in its own position among them rather than at the end.
	 */
	$rest = array();
	foreach ( $siblings as $offset => $block ) {
		if ( ! isset( $moved[ $offset ] ) || isset( $unplaced[ $offset ] ) ) {
			$rest[ $offset ] = $block;
		}
	}
	ksort( $rest );
	$rest = array_values( $rest );

	$next = 0;
	foreach ( $slots as $slot => $block ) {
		if ( null === $block ) {
			$slots[ $slot ] = $rest[ $next ];
			++$next;
		}
	}

	return $slots;
}

/**
 * Restores the pre-move sibling order of a list of parsed blocks.
 *
 * A pending move is stored as the block sitting at its PROPOSED position with
 * `metadata.suggestion.fromIndex` recording where it came from, so undoing it
 * for the front end means putting each moved block back at that index and
 * letting its siblings close up behind it.
 *
 * Placement itself lives in `gutenberg_reorder_pending_move_siblings()`; this
 * function decides which markers are safe to act on and hands it the survivors.
 * A `fromIndex` that is out of range is treated as unrestorable, and the block
 * stays where it is.
 *
 * Only a sibling list holding exactly ONE pending move is restored. `fromIndex`
 * is recorded against the order the list was in at the time of the move, so a
 * second move in the same list carries an index the first one already shifted
 * and replaying both would invent an order that never existed. See the gate
 * below for why that case cannot be detected and has to be skipped wholesale.
 * The placement helper stays general so lifting the gate is a one-line change
 * once the marker writer records a baseline-relative index.
 *
 * A move that crossed parents cannot be undone from a single sibling list,
 * because `fromIndex` counts positions in a list the block has left. The
 * marker writer records `crossedParents` for exactly this reason and such
 * markers are skipped. Markers saved before that field existed fall back to
 * the root-boundary check, which catches a root origin now sitting nested (or
 * the reverse) but cannot see a move between two different nested parents.
 *
 * @param array $blocks  Parsed blocks for a single level of the tree.
 * @param bool  $is_root Whether this level is the top level of the document.
 * @param bool  $changed Set to true when any level was reordered.
 * @return array Blocks in their pre-move order.
 */
function gutenberg_restore_pending_move_block_order( $blocks, $is_root, &$changed ) {
	foreach ( $blocks as $index => $block ) {
		if ( ! empty( $block['innerBlocks'] ) ) {
			$blocks[ $index ]['innerBlocks'] = gutenberg_restore_pending_move_block_order( $block['innerBlocks'], false, $changed );
		}
	}

	/*
	 * The whitespace between top-level blocks parses as block-name-less
	 * chunks. They hold no position in the editor's block list — which is what
	 * `fromIndex` counts — so they stay pinned where they are and only the
	 * real blocks around them are reordered.
	 */
	$positions = array();
	foreach ( $blocks as $index => $block ) {
		$is_separator = ( ! isset( $block['blockName'] ) || null === $block['blockName'] )
			&& '' === trim( isset( $block['innerHTML'] ) ? $block['innerHTML'] : '' );
		if ( ! $is_separator ) {
			$positions[] = $index;
		}
	}

	$siblings = array();
	foreach ( $positions as $index ) {
		$siblings[] = $blocks[ $index ];
	}
	$count = count( $siblings );

	// Map each moved block's current offset to the offset it came from.
	$moved         = array();
	$pending_moves = 0;
	foreach ( $siblings as $offset => $block ) {
		$suggestion = isset( $block['attrs']['metadata']['suggestion'] )
			? $block['attrs']['metadata']['suggestion']
			: null;
		if ( ! is_array( $suggestion ) ) {
			continue;
		}
		if ( ! isset( $suggestion['type'] ) || 'pending-move' !== $suggestion['type'] ) {
			continue;
		}
		/*
		 * Counted ahead of the guards below: a marker this function declines
		 * to act on still sits in the list, so it still shifts the indices
		 * every other marker in the list was measured against.
		 */
		++$pending_moves;
		if ( ! isset( $suggestion['fromIndex'] ) || ! is_numeric( $suggestion['fromIndex'] ) ) {
			continue;
		}
		/*
		 * A move that changed parents cannot be undone from a single sibling
		 * list: `fromIndex` counts positions in a list this block is no
		 * longer in. The writer records that outright, since client IDs are
		 * session-local and never reach the server.
		 */
		if ( isset( $suggestion['crossedParents'] ) && $suggestion['crossedParents'] ) {
			continue;
		}
		/*
		 * Fallback for markers saved before `crossedParents` existed. It only
		 * catches a move across the root boundary — a root origin recorded as
		 * a null/empty parent against a block that now sits nested, or the
		 * reverse. Nested-to-nested is invisible to it, which is why the
		 * writer now states the answer instead of leaving it to be inferred.
		 */
		$from_parent = isset( $suggestion['fromParentClientId'] ) ? $suggestion['fromParentClientId'] : null;
		$was_at_root = null === $from_parent || '' === $from_parent;
		if ( $was_at_root !== (bool) $is_root ) {
			continue;
		}
		$from_index = (int) $suggestion['fromIndex'];
		if ( $from_index < 0 || $from_index >= $count ) {
			continue;
		}
		$moved[ $offset ] = $from_index;
	}

	/*
	 * `fromIndex` is measured against the sibling order the list was in when
	 * the move was made, not against the pristine baseline: the marker writer
	 * diffs each tick against the previous one. For a lone pending move those
	 * are the same order and the restore below is exact. For two or more they
	 * are not — the first move already shifted the indices the second marker
	 * was measured against, and replaying both invents a third order that
	 * neither the author nor the suggester ever saw.
	 *
	 * Nothing in the serialized markers separates a skewed pair from an
	 * honest one: the skewed values describe a perfectly self-consistent
	 * baseline, and re-applying the moves to it reproduces the current order.
	 * With no way to tell them apart, a level holding more than one pending
	 * move keeps its proposed order — what readers saw before this restore
	 * existed — rather than risk publishing an order nobody wrote.
	 *
	 * Recording a baseline-relative index is the real fix and belongs with
	 * the marker writer, where it has to be reconciled with Reject: undoing
	 * one move while the rest stay pending wants the tick-relative meaning,
	 * so the two consumers need separate fields.
	 */
	if ( $pending_moves > 1 ) {
		return $blocks;
	}

	if ( empty( $moved ) ) {
		return $blocks;
	}

	$slots = gutenberg_reorder_pending_move_siblings( $siblings, $moved );

	foreach ( $positions as $offset => $index ) {
		if ( $blocks[ $index ] !== $slots[ $offset ] ) {
			$changed = true;
		}
		$blocks[ $index ] = $slots[ $offset ];
	}

	return $blocks;
}

/**
 * Render a pending block move in its original order on the front end.
 *
 * A move is the one structural suggestion with nothing to strip: the block is
 * real content, and the proposal is expressed as the block's POSITION in
 * `post_content` plus a `metadata.suggestion` marker recording where it came
 * from. Order is therefore fixed by the time `render_block` runs on each
 * block, and an un-accepted move would otherwise change what readers see.
 *
 * Restoring it needs the sibling list, so this runs on `the_content` ahead of
 * `do_blocks()` (priority 9): the content is parsed, each level is put back
 * into its pre-move order, and it is re-serialized for the normal render.
 * `post_content` itself is untouched — the editor still loads the proposed
 * order, which is what a reviewer needs to see.
 *
 * The `pending-move` substring check keeps the parse/serialize round trip off
 * every other post, and the content is returned unchanged when no move turns
 * out to be restorable.
 *
 * @param string $content Post content.
 * @return string Post content with pending moves restored to their original order.
 */
function gutenberg_restore_pending_move_order( $content ) {
	if ( ! is_string( $content ) || false === strpos( $content, 'pending-move' ) ) {
		return $content;
	}

	$changed = false;
	$blocks  = gutenberg_restore_pending_move_block_order( parse_blocks( $content ), true, $changed );

	return $changed ? serialize_blocks( $blocks ) : $content;
}
add_filter( 'the_content', 'gutenberg_restore_pending_move_order', 8 );
