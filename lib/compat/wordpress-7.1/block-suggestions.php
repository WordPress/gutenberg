<?php
/**
 * Inline suggestion support for suggest mode.
 *
 * Inline suggestions are anchored in raw block content as
 * `<mark class="wp-suggestion-<kind>" data-suggestion-id="N" data-suggestion-type="<kind>" data-author="A">…</mark>`,
 * one class per kind (`add`, `del`, `format`), so a suggestion survives edits
 * elsewhere in the block (offsets are derived
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
 * Matches an attribute name, or a key nested in an attribute's value, whose
 * string value is a URL. The same names the editor checks on accept.
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_URL_KEY_PATTERN' ) ) {
	define( 'GUTENBERG_SUGGESTION_URL_KEY_PATTERN', '/(url|href|src|link|poster)\\z/i' );
}

/**
 * Maximum byte length of the proposals the save pass stores on one note
 * (`_wp_suggestion_content`). A note whose proposals would not fit keeps them
 * in post content instead, where the render filters still hide them.
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES' ) ) {
	define( 'GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES', 1048576 );
}

/**
 * Maximum length, in characters, of the `excerpt` a structural suggestion
 * operation names its block by. Mirrored on the client
 * (`BLOCK_EXCERPT_MAX_CHARS` in suggestion-mode/operations/block-excerpt.ts).
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_EXCERPT_MAX_CHARS' ) ) {
	define( 'GUTENBERG_SUGGESTION_EXCERPT_MAX_CHARS', 120 );
}

/**
 * Maximum length, in characters, of the text an inline suggestion operation
 * records when it is decided (`decidedText`, `decidedDeletedText`). Mirrored
 * on the client (`DECIDED_TEXT_MAX_CHARS` in
 * suggestion-mode/decision-snapshot.ts).
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_DECIDED_TEXT_MAX_CHARS' ) ) {
	define( 'GUTENBERG_SUGGESTION_DECIDED_TEXT_MAX_CHARS', 1000 );
}

/**
 * Sanitizes the text an inline suggestion operation records when it is
 * decided: what its marker held, for the summary once the marker is gone.
 *
 * The editor shows it as text and never as markup, and it is the text of a
 * rich-text value, where a `<` is a character the author typed. So it is
 * stored as given, leading space included, and only bounded.
 *
 * @param mixed $text Text from the payload.
 * @return string|null The text, cut to the limit, or null when there is none
 *                     to keep.
 */
function gutenberg_sanitize_suggestion_decided_text( $text ): ?string {
	if ( ! is_string( $text ) || '' === $text ) {
		return null;
	}
	return mb_substr( $text, 0, GUTENBERG_SUGGESTION_DECIDED_TEXT_MAX_CHARS );
}

/**
 * Sanitizes the `excerpt` of a structural suggestion operation: the start of
 * the block's text, which the editor shows as text and never as markup.
 *
 * @param mixed $excerpt Excerpt from the payload.
 * @return string|null Plain text on one line, cut to the limit, or null when
 *                     there is none to keep.
 */
function gutenberg_sanitize_suggestion_excerpt( $excerpt ): ?string {
	if ( ! is_string( $excerpt ) ) {
		return null;
	}
	$excerpt = mb_substr( wp_strip_all_tags( $excerpt, true ), 0, GUTENBERG_SUGGESTION_EXCERPT_MAX_CHARS );
	return '' === $excerpt ? null : $excerpt;
}

/**
 * Applies `wp_kses_post()` to the HTML-bearing string fields of a serialized
 * block snapshot carried inside a suggestion operation (`op.block` on
 * `block-remove` / `block-insert-after` ops written before those carried an
 * `excerpt` instead), recursing into `innerBlocks`.
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
 *     `afterHTML`, `beforeHTML`, and the serialized block snapshot in `block`
 *     that older payloads carry. A structural operation's `excerpt` is
 *     reduced to plain text.
 *
 * `before` is intentionally NOT filtered: it is only compared against live
 * content for conflict detection, never applied. Filtering it would produce
 * false staleness warnings whenever the real content contains markup that
 * KSES would strip.
 *
 * KSES removes markup. A value that only becomes markup once a block
 * serializes it (a tag name, a URL, a CSS string) passes this filter. The
 * write is refused for one instead (see
 * `gutenberg_find_suggestion_attribute_operation_problem()`), and the editor
 * checks again when a reviewer accepts.
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
			if ( array_key_exists( 'excerpt', $operation ) ) {
				$excerpt = gutenberg_sanitize_suggestion_excerpt( $operation['excerpt'] );
				if ( null === $excerpt ) {
					unset( $operation['excerpt'] );
				} else {
					$operation['excerpt'] = $excerpt;
				}
			}
			foreach ( array( 'decidedText', 'decidedDeletedText' ) as $key ) {
				if ( ! array_key_exists( $key, $operation ) ) {
					continue;
				}
				$decided_text = gutenberg_sanitize_suggestion_decided_text( $operation[ $key ] );
				if ( null === $decided_text ) {
					unset( $operation[ $key ] );
				} else {
					$operation[ $key ] = $decided_text;
				}
			}
			if ( array_key_exists( 'delta', $operation ) ) {
				$delta = gutenberg_sanitize_suggestion_format_delta( $operation['delta'] );
				if ( null === $delta ) {
					unset( $operation['delta'] );
				} else {
					$operation['delta'] = $delta;
				}
			}
			$decoded['operations'][ $index ] = $operation;
		}
	}

	// Unescaped, like the JSON the editor sends, so filtering does not grow
	// the payload past the size limit.
	$encoded = wp_json_encode( $decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
	return false === $encoded ? '' : $encoded;
}

/**
 * Sanitizes a formatting suggestion's delta.
 *
 * A delta lists runs of a suggestion's characters, `offset` and `length`
 * counting the characters its marker covers, with the rich-text formats the
 * suggestion `added` and `removed` there, each a format `type` (`core/bold`)
 * with optional string `attributes` and `unregisteredAttributes`. Anything
 * else is dropped, as are suggestion marker types, event handler attributes
 * and any attribute whose value names a disallowed protocol; `style` keeps
 * only safe CSS.
 *
 * @param mixed $delta Delta from the payload.
 * @return list<array{offset: int, length: int, added: list<array<string, mixed>>, removed: list<array<string, mixed>>}>|null
 *         The sanitized delta, or null when it is not a list.
 */
function gutenberg_sanitize_suggestion_format_delta( $delta ): ?array {
	if ( ! is_array( $delta ) || array_values( $delta ) !== $delta ) {
		return null;
	}
	$descriptors = static function ( $formats ): array {
		$clean = array();
		foreach ( is_array( $formats ) ? $formats : array() as $format ) {
			if ( ! is_array( $format ) || ! isset( $format['type'] ) || ! is_string( $format['type'] ) || ! preg_match( '~^[a-z0-9-]+/[a-z0-9-]+$~', $format['type'] ) ) {
				continue;
			}
			// Suggestion markers are written by the editor, never by a delta.
			if ( str_starts_with( $format['type'], 'core/suggestion-' ) ) {
				continue;
			}
			$descriptor = array( 'type' => $format['type'] );
			foreach ( array( 'attributes', 'unregisteredAttributes' ) as $key ) {
				if ( ! isset( $format[ $key ] ) || ! is_array( $format[ $key ] ) ) {
					continue;
				}
				$attributes = array();
				foreach ( $format[ $key ] as $name => $value ) {
					if ( ! is_string( $name ) || ! preg_match( '~^[A-Za-z][A-Za-z0-9_:.-]*$~', $name ) || ! is_scalar( $value ) ) {
						continue;
					}
					$lower = strtolower( $name );
					// Event handlers and inline frames run script when a reviewer applies the format.
					if ( str_starts_with( $lower, 'on' ) || in_array( $lower, array( 'srcdoc', 'formaction' ), true ) ) {
						continue;
					}
					$value = wp_strip_all_tags( (string) $value );
					if ( 'style' === $lower ) {
						$value = safecss_filter_attr( $value );
					} elseif ( wp_kses_bad_protocol( $value, wp_allowed_protocols() ) !== $value ) {
						// A format type can map any attribute to `href`, so every value is checked.
						continue;
					}
					$attributes[ $name ] = $value;
				}
				if ( $attributes ) {
					$descriptor[ $key ] = $attributes;
				}
			}
			$clean[] = $descriptor;
		}
		return $clean;
	};
	$runs        = array();
	foreach ( $delta as $run ) {
		if ( ! is_array( $run ) || ! isset( $run['offset'], $run['length'] ) || ! is_int( $run['offset'] ) || ! is_int( $run['length'] ) || $run['offset'] < 0 || $run['length'] < 1 ) {
			continue;
		}
		$runs[] = array(
			'offset'  => $run['offset'],
			'length'  => $run['length'],
			'added'   => $descriptors( $run['added'] ?? array() ),
			'removed' => $descriptors( $run['removed'] ?? array() ),
		);
	}
	return $runs;
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
 *   - `_wp_suggestion_status` — suggestion lifecycle. `pending` while it
 *                               awaits a decision; `applied-unsaved` /
 *                               `rejected-unsaved` once a reviewer decided in
 *                               an editor that has not saved the post yet;
 *                               `applied` / `rejected` once a post save no
 *                               longer carries the suggestion's anchor; and
 *                               `outdated` when someone else's save removed
 *                               the anchor before anyone decided. The final
 *                               values are written only by the server (see
 *                               `lib/compat/wordpress-7.2/suggestion-status.php`).
 *   - `_wp_suggestion_decided_by` / `_wp_suggestion_resolved_by` — read-only
 *                               provenance: who made the provisional decision,
 *                               and whose save finalized or outdated it.
 *   - `_wp_suggestion_content` — private: the proposals the save pass moved
 *                               out of post content (added text, suggested
 *                               blocks, proposed attribute values), JSON. Never
 *                               readable or writable over REST; only the save
 *                               pass writes it.
 *   - `_wp_suggestion_extraction_skipped` — read-only flag: the note's
 *                               proposals were too large to move out of post
 *                               content on the last save, so they stayed there.
 *
 * Revisions and autosaves carry `_wp_suggestion_snapshot` post meta, the same
 * proposals for the anchors in that revision's content, since comment meta is
 * not revisioned.
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
				$raw   = $value;
				$value = gutenberg_sanitize_suggestion_payload( $value );
				// The write guard that runs next judges the payload as sent too.
				gutenberg_suggestion_payload_as_sent( $value, $raw );
				// KSES encodes some characters, so the limit is checked again
				// on what is stored.
				return strlen( $value ) > $max_suggestion_payload_bytes ? '' : $value;
			},
			'auth_callback'     => function ( $allowed, $meta_key, $object_id ) {
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
					'enum' => array( 'pending', 'applied-unsaved', 'rejected-unsaved', 'applied', 'rejected', 'outdated' ),
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

	// Provenance is stamped by the server; no REST client may write it.
	$provenance = array(
		'_wp_suggestion_decided_by'  => __( 'User who made the provisional suggestion decision.', 'gutenberg' ),
		'_wp_suggestion_resolved_by' => __( 'User whose post save finalized or outdated the suggestion.', 'gutenberg' ),
	);
	foreach ( $provenance as $meta_key => $description ) {
		register_meta(
			'comment',
			$meta_key,
			array(
				'type'          => 'integer',
				'description'   => $description,
				'single'        => true,
				'show_in_rest'  => true,
				'auth_callback' => '__return_false',
			)
		);
	}

	register_meta(
		'comment',
		'_wp_suggestion_extraction_skipped',
		array(
			'type'          => 'boolean',
			'description'   => __( 'Whether the suggestion was too large to move out of the post content on the last save.', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => true,
			'auth_callback' => '__return_false',
		)
	);

	// The stored proposals are never exposed or writable over REST: editors
	// get them back inside the post's own `content.raw`.
	$private_json = array(
		'type'              => 'string',
		'single'            => true,
		'show_in_rest'      => false,
		'auth_callback'     => '__return_false',
		'sanitize_callback' => 'gutenberg_sanitize_suggestion_content_meta',
	);
	register_meta(
		'comment',
		'_wp_suggestion_content',
		array_merge( $private_json, array( 'description' => __( 'Proposals moved out of the post content by the save pass (JSON).', 'gutenberg' ) ) )
	);
	register_meta(
		'post',
		'_wp_suggestion_snapshot',
		array_merge( $private_json, array( 'description' => __( 'Suggestion proposals for the anchors in a revision (JSON).', 'gutenberg' ) ) )
	);
}
add_action( 'init', 'gutenberg_register_suggestion_meta' );

/**
 * Validates the JSON the save pass stores for a note or a revision.
 *
 * Only checks shape and size. The content inside was already filtered by kses
 * as part of `post_content` for the user who saved it, and is stored exactly,
 * so a second pass (not idempotent on every input) never changes it.
 *
 * @param mixed $value Meta value.
 * @return string The value, or '' when it is not a valid object within the
 *                size limit.
 */
function gutenberg_sanitize_suggestion_content_meta( $value ) {
	if ( ! is_string( $value ) || strlen( $value ) > GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES ) {
		return '';
	}
	$decoded = json_decode( $value, true );
	return is_array( $decoded ) ? $value : '';
}

/**
 * Note meta only the server writes.
 *
 * @return string[] Meta keys.
 */
function gutenberg_get_server_only_suggestion_meta_keys(): array {
	return array(
		'_wp_suggestion_content',
		'_wp_suggestion_decided_by',
		'_wp_suggestion_resolved_by',
		'_wp_suggestion_extraction_skipped',
	);
}

/**
 * Whether a server write of suggestion meta is in progress, opening or
 * closing one when asked to.
 *
 * @param bool|null $open True to open a write, false to close it, null to
 *                        only ask.
 * @return bool Whether a write is open.
 */
function gutenberg_suggestion_server_write( ?bool $open = null ): bool {
	static $depth = 0;

	$current = is_int( $depth ) ? $depth : 0;
	if ( null !== $open ) {
		$current = max( 0, $current + ( $open ? 1 : -1 ) );
		$depth   = $current;
	}
	return $current > 0;
}

/**
 * Writes suggestion meta as the server.
 *
 * @param int    $note_id    Note ID.
 * @param string $meta_key   Meta key.
 * @param mixed  $meta_value Meta value, slashed like `update_comment_meta()` expects.
 * @return bool Whether the value was written.
 */
function gutenberg_update_suggestion_server_meta( int $note_id, string $meta_key, $meta_value ): bool {
	gutenberg_suggestion_server_write( true );
	try {
		return (bool) update_comment_meta( $note_id, $meta_key, $meta_value );
	} finally {
		gutenberg_suggestion_server_write( false );
	}
}

/**
 * Deletes suggestion meta as the server.
 *
 * @param int    $note_id  Note ID.
 * @param string $meta_key Meta key.
 * @return bool Whether the meta was deleted.
 */
function gutenberg_delete_suggestion_server_meta( int $note_id, string $meta_key ): bool {
	if ( $note_id < 1 ) {
		return false;
	}
	gutenberg_suggestion_server_write( true );
	try {
		return delete_comment_meta( $note_id, $meta_key );
	} finally {
		gutenberg_suggestion_server_write( false );
	}
}

/**
 * Refuses a write of server-only note meta that the server did not make.
 *
 * An `auth_callback` only protects a key over REST. `wp_insert_comment()` and
 * `wp_update_comment()` store any `comment_meta` they are given, and the
 * wp-admin comment edit screen passes its whole form to the latter, so the
 * rule is enforced where the meta is written.
 *
 * @param bool|null $check    Whether to short-circuit the write. Null lets it proceed.
 * @param int       $note_id  Comment ID. Unused.
 * @param string    $meta_key Meta key.
 * @return bool|null False to refuse the write, the incoming value otherwise.
 */
function gutenberg_guard_server_only_suggestion_meta( $check, $note_id, $meta_key ) {
	if ( null !== $check || gutenberg_suggestion_server_write() ) {
		return $check;
	}
	return in_array( $meta_key, gutenberg_get_server_only_suggestion_meta_keys(), true ) ? false : $check;
}
add_filter( 'add_comment_metadata', 'gutenberg_guard_server_only_suggestion_meta', 10, 3 );
add_filter( 'update_comment_metadata', 'gutenberg_guard_server_only_suggestion_meta', 10, 3 );
add_filter( 'delete_comment_metadata', 'gutenberg_guard_server_only_suggestion_meta', 10, 3 );

/**
 * Leaves the stored proposals out of WXR exports.
 *
 * An imported post gets new note ids, so the anchors in its content would not
 * match them anyway, and the export keeps the public baseline.
 *
 * @param bool   $skip     Whether to skip the meta.
 * @param string $meta_key Meta key.
 * @return bool
 */
function gutenberg_skip_suggestion_content_in_export( $skip, $meta_key ) {
	return $skip || in_array( $meta_key, array( '_wp_suggestion_content', '_wp_suggestion_snapshot' ), true );
}
add_filter( 'wxr_export_skip_commentmeta', 'gutenberg_skip_suggestion_content_in_export', 10, 2 );
add_filter( 'wxr_export_skip_postmeta', 'gutenberg_skip_suggestion_content_in_export', 10, 2 );

/**
 * Validates the post-level operations of a suggestion before its note is
 * saved.
 *
 * A `post-attribute-set` operation proposes a change to a field of the post
 * the note belongs to; a reviewer's accept writes it to the post. Only the
 * fields Suggestion mode can propose are accepted: the title, excerpt,
 * featured image and slug, the terms of one of the post type's REST-exposed
 * taxonomies (by `rest_base`), and a post meta key. A meta key must be
 * registered for the post type with `show_in_rest`, and the suggester must be
 * allowed to edit it (`edit_post_meta`), so a suggestion can never carry a
 * key its author could not have written directly. The title, excerpt, slug
 * and featured image values are sanitized the way core sanitizes each field
 * for the suggester (see `gutenberg_sanitize_suggested_post_field()`). The
 * reviewer's save checks the reviewer's own capabilities again, as any post
 * save does.
 *
 * @param array<mixed> $payload Decoded `_wp_suggestion` payload.
 * @param WP_Post|null $post    The post the note belongs to.
 * @return array<mixed>|WP_Error The payload with its values sanitized, or an
 *                               error for an invalid post-level operation.
 */
function gutenberg_sanitize_suggestion_post_operations( array $payload, ?WP_Post $post ) {
	if ( ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
		return $payload;
	}

	$error = new WP_Error(
		'rest_invalid_suggestion',
		__( 'This suggestion changes a post setting that cannot be suggested.', 'gutenberg' ),
		array( 'status' => 400 )
	);

	foreach ( $payload['operations'] as $index => $operation ) {
		if ( ! is_array( $operation ) || ! isset( $operation['type'] ) || 'post-attribute-set' !== $operation['type'] ) {
			continue;
		}
		if ( ! $post || ! isset( $operation['attribute'] ) || ! is_string( $operation['attribute'] ) ) {
			return $error;
		}
		$attribute = $operation['attribute'];
		if ( in_array( $attribute, array( 'title', 'excerpt', 'featured_media', 'slug' ), true ) ) {
			foreach ( array( 'before', 'after' ) as $key ) {
				if ( ! array_key_exists( $key, $operation ) ) {
					continue;
				}
				$value = gutenberg_sanitize_suggested_post_field( $attribute, $operation[ $key ], $post, 'after' === $key );
				if ( is_wp_error( $value ) ) {
					return $error;
				}
				if ( $value !== $operation[ $key ] ) {
					$payload['operations'][ $index ][ $key ] = $value;
				}
			}
			continue;
		}
		if ( 'meta' === $attribute ) {
			$key = isset( $operation['key'] ) && is_string( $operation['key'] ) ? $operation['key'] : '';
			if ( ! gutenberg_can_suggest_post_meta( $post, $key ) ) {
				return $error;
			}
			continue;
		}
		$suggested_taxonomy = null;
		foreach ( get_object_taxonomies( $post->post_type, 'objects' ) as $taxonomy ) {
			if ( ! empty( $taxonomy->show_in_rest ) && ( $taxonomy->rest_base ? $taxonomy->rest_base : $taxonomy->name ) === $attribute ) {
				$suggested_taxonomy = $taxonomy;
				break;
			}
		}
		if ( ! $suggested_taxonomy ) {
			return $error;
		}
		$after = isset( $operation['after'] ) ? $operation['after'] : array();
		$terms = gutenberg_sanitize_suggested_terms( $after, $suggested_taxonomy );
		if ( null === $terms ) {
			return $error;
		}
		if ( $terms !== $after ) {
			$payload['operations'][ $index ]['after'] = $terms;
		}
	}

	return $payload;
}

/**
 * Validates the post-level operations of a suggestion a REST request carries.
 *
 * Hooked to `rest_preprocess_comment`, which runs for both creating and
 * updating a comment, so the request is refused with a 400 before anything
 * is stored.
 *
 * @param array<string, mixed>|WP_Error $prepared_comment The prepared comment data.
 * @param WP_REST_Request                $request          The REST request.
 * @return array<string, mixed>|WP_Error The prepared comment, or an error for
 *                                       an invalid post-level operation.
 */
function gutenberg_validate_suggestion_post_operations( $prepared_comment, $request ) {
	if ( is_wp_error( $prepared_comment ) ) {
		return $prepared_comment;
	}
	$meta = $request['meta'];
	if ( ! is_array( $meta ) || ! isset( $meta['_wp_suggestion'] ) || ! is_string( $meta['_wp_suggestion'] ) ) {
		return $prepared_comment;
	}
	$payload = json_decode( $meta['_wp_suggestion'], true );
	if ( ! is_array( $payload ) ) {
		return $prepared_comment;
	}

	$post_id = isset( $prepared_comment['comment_post_ID'] ) ? absint( $prepared_comment['comment_post_ID'] ) : 0;
	if ( ! $post_id && isset( $request['id'] ) ) {
		$comment = get_comment( absint( $request['id'] ) );
		$post_id = $comment ? (int) $comment->comment_post_ID : 0;
	}

	$sanitized = gutenberg_sanitize_suggestion_post_operations( $payload, get_post( $post_id ) );
	if ( is_wp_error( $sanitized ) ) {
		return $sanitized;
	}

	// Store the sanitized values, not the ones sent.
	if ( $sanitized !== $payload ) {
		$meta['_wp_suggestion'] = wp_json_encode( $sanitized );
		$request->set_param( 'meta', $meta );
	}

	return $prepared_comment;
}

/**
 * Holds a `_wp_suggestion` written outside REST to the post-level operation
 * rules.
 *
 * The meta's `sanitize_callback` is not told which note it sanitizes for, so
 * the rules, which depend on the note's post, are applied where the meta is
 * written: an invalid payload is refused, and one whose values needed
 * sanitizing is stored sanitized.
 *
 * @param bool|null $check      Whether to short-circuit the write. Null lets it proceed.
 * @param int       $note_id    Comment ID.
 * @param string    $meta_key   Meta key.
 * @param mixed     $meta_value Meta value.
 * @return bool|null Whether the write was handled here, or the incoming value.
 */
function gutenberg_guard_suggestion_post_operations_meta( $check, $note_id, $meta_key, $meta_value ) {
	static $is_storing = false;
	if ( null !== $check || '_wp_suggestion' !== $meta_key || $is_storing || ! is_string( $meta_value ) ) {
		return $check;
	}
	$payload = json_decode( $meta_value, true );
	if ( ! is_array( $payload ) ) {
		return $check;
	}
	$note      = get_comment( $note_id );
	$sanitized = gutenberg_sanitize_suggestion_post_operations( $payload, $note ? get_post( (int) $note->comment_post_ID ) : null );
	if ( is_wp_error( $sanitized ) ) {
		return false;
	}
	if ( $sanitized === $payload ) {
		return $check;
	}
	$is_storing = true;
	try {
		return (bool) update_comment_meta( $note_id, $meta_key, wp_slash( (string) wp_json_encode( $sanitized ) ) );
	} finally {
		$is_storing = false;
	}
}
add_filter( 'add_comment_metadata', 'gutenberg_guard_suggestion_post_operations_meta', 10, 4 );
add_filter( 'update_comment_metadata', 'gutenberg_guard_suggestion_post_operations_meta', 10, 4 );

/**
 * Whether a proposed value is of an attribute's declared `type`.
 *
 * Reads the types the way the editor does when a reviewer accepts, which is
 * stricter than REST schema validation: no value is coerced.
 *
 * @param mixed $value Proposed value, decoded with objects kept as objects.
 * @param mixed $type  The attribute's `type`: a name, or a list of names.
 * @return bool Whether the value matches. A type that is not known matches.
 */
function gutenberg_is_suggested_value_of_type( $value, $type ): bool {
	if ( is_array( $type ) ) {
		foreach ( $type as $entry ) {
			if ( gutenberg_is_suggested_value_of_type( $value, $entry ) ) {
				return true;
			}
		}
		return false;
	}
	switch ( is_string( $type ) ? $type : '' ) {
		// A proposal holds rich text as its HTML string.
		case 'rich-text':
		case 'string':
			return is_string( $value );
		case 'boolean':
			return is_bool( $value );
		case 'object':
			// A payload PHP encoded again holds an empty object as an empty list.
			return $value instanceof stdClass || array() === $value;
		case 'array':
			return is_array( $value );
		case 'null':
			return null === $value;
		case 'integer':
			return is_int( $value ) || ( is_float( $value ) && 0.0 === fmod( $value, 1.0 ) );
		case 'number':
			return is_int( $value ) || is_float( $value );
	}
	return true;
}

/**
 * Whether a proposed URL names a protocol outside `wp_allowed_protocols()`.
 * A value with no scheme (a relative URL, a fragment) names none.
 *
 * @param string $value Proposed value.
 * @return bool Whether the value names a disallowed protocol.
 */
function gutenberg_suggested_url_has_disallowed_protocol( string $value ): bool {
	// Browsers ignore control characters and whitespace inside a scheme.
	$value = (string) preg_replace( '/[\x00-\x20\x7f]/', '', $value );
	if ( ! preg_match( '/^([a-z][a-z0-9+.-]*):/i', $value, $scheme ) ) {
		return false;
	}
	return ! in_array( strtolower( $scheme[1] ), wp_allowed_protocols(), true );
}

/**
 * Whether any string under a URL-bearing key of a proposed value names a
 * disallowed protocol.
 *
 * @param mixed $value       Proposed value, or a part of it.
 * @param bool  $is_url      Whether a string found here is a URL.
 * @param bool  $is_filtered Whether the value was filtered for storage, which encodes entities.
 * @return bool Whether one does.
 */
function gutenberg_suggested_value_has_unsafe_url( $value, bool $is_url, bool $is_filtered = false ): bool {
	if ( is_string( $value ) ) {
		return $is_url && gutenberg_suggested_url_has_disallowed_protocol( $is_filtered ? html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : $value );
	}
	if ( is_array( $value ) ) {
		foreach ( $value as $entry ) {
			if ( gutenberg_suggested_value_has_unsafe_url( $entry, $is_url, $is_filtered ) ) {
				return true;
			}
		}
		return false;
	}
	if ( $value instanceof stdClass ) {
		foreach ( get_object_vars( $value ) as $key => $entry ) {
			if ( gutenberg_suggested_value_has_unsafe_url( $entry, (bool) preg_match( GUTENBERG_SUGGESTION_URL_KEY_PATTERN, (string) $key ), $is_filtered ) ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Whether a path of keys into a block's `style` is a place custom CSS sits:
 * the top of the style, or under pseudo-state (`:hover`) and viewport-state
 * (`@mobile`) keys. The places `gutenberg_strip_custom_css_from_style_array()`
 * strips a `css` key from.
 *
 * @param array<int, int|string> $path Keys from the style down to the holder of a `css` key.
 * @return bool Whether it is.
 */
function gutenberg_is_suggestion_custom_css_position( array $path ): bool {
	foreach ( $path as $key ) {
		if ( ! is_string( $key ) || ( ! str_starts_with( $key, ':' ) && ! str_starts_with( $key, '@' ) ) ) {
			return false;
		}
	}
	return true;
}

/**
 * Collects the custom CSS of a post's blocks of one type, as the saved
 * content holds it, by position in the `style`.
 *
 * Custom CSS is stripped from the content a user without `edit_css` saves,
 * so what the post holds in the stripped positions was written by a user
 * allowed to. A `css` key anywhere else in a `style` is not read.
 *
 * @param WP_Post|null $post       The post.
 * @param string       $block_name Block name.
 * @return array<string, list<string>> The `css` values of those blocks, keyed
 *                                     by the JSON of their path of state keys.
 */
function gutenberg_get_suggestion_post_block_custom_css( ?WP_Post $post, string $block_name ): array {
	$css = array();
	if ( ! $post || '' === $block_name || ! has_blocks( $post->post_content ) ) {
		return $css;
	}
	$collect = static function ( array $style, array $path ) use ( &$collect, &$css ): void {
		if ( isset( $style['css'] ) && is_string( $style['css'] ) ) {
			$css[ (string) wp_json_encode( $path ) ][] = $style['css'];
		}
		foreach ( $style as $key => $value ) {
			if ( is_array( $value ) && gutenberg_is_suggestion_custom_css_position( array( $key ) ) ) {
				$collect( $value, array_merge( $path, array( $key ) ) );
			}
		}
	};
	$walk    = static function ( array $blocks ) use ( &$walk, $collect, $block_name ): void {
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}
			if ( isset( $block['blockName'], $block['attrs'] ) && $block_name === $block['blockName'] && is_array( $block['attrs'] ) && isset( $block['attrs']['style'] ) && is_array( $block['attrs']['style'] ) ) {
				$collect( $block['attrs']['style'], array() );
			}
			if ( isset( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$walk( $block['innerBlocks'] );
			}
		}
	};
	$walk( parse_blocks( $post->post_content ) );
	return $css;
}

/**
 * Whether a proposed `style` carries CSS its suggester may not write.
 *
 * Custom CSS (`css`, at any depth) needs `edit_css`: without it a proposal
 * may only carry along custom CSS the block already has, where it has it.
 * Every other string is one declaration's value and may not leave that
 * declaration.
 *
 * @param mixed                            $value       Proposed style, or a part of it.
 * @param string                           $key         The key the value sits under.
 * @param array<string, list<string>>|null $allowed_css The custom CSS the proposal may carry, by position
 *                                                      (see `gutenberg_get_suggestion_post_block_custom_css()`),
 *                                                      or null for any.
 * @param bool                             $is_filtered Whether the value was filtered for storage, which encodes entities.
 * @param array<int, int|string>           $path        Keys from the style down to the holder of `$key`.
 * @return bool Whether it does.
 */
function gutenberg_suggested_style_is_unsafe( $value, string $key, ?array $allowed_css, bool $is_filtered = false, array $path = array() ): bool {
	if ( is_string( $value ) ) {
		if ( 'css' === $key ) {
			return null !== $allowed_css && (
				! gutenberg_is_suggestion_custom_css_position( $path ) ||
				! in_array( $value, $allowed_css[ (string) wp_json_encode( $path ) ] ?? array(), true )
			);
		}
		if ( $is_filtered ) {
			$value = html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		}
		/*
		 * A URL is checked by scheme, as it is under any other attribute. It
		 * is written inside a quoted `url()`, which a quote, an escape or a
		 * control character ends; the rest is what a filter that splits a
		 * style into declarations and rules would cut it at.
		 */
		if ( preg_match( GUTENBERG_SUGGESTION_URL_KEY_PATTERN, $key ) ) {
			return 0 !== preg_match( '/[;{}<>\\\\\'"\x00-\x1f\x7f]/', $value );
		}
		/*
		 * What lets a value leave the declaration it is written into: a
		 * second declaration, a rule, a comment, an escape, or a resource
		 * load. The whitespace class is the one JavaScript's `\s` matches.
		 */
		$space = '[\s\x{00a0}\x{1680}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}\x{feff}]';
		return 0 !== preg_match( '~[;{}<>\\\\]|/\*|url' . $space . '*\(|expression' . $space . '*\(|@import~iu', $value );
	}
	if ( is_array( $value ) ) {
		foreach ( $value as $index => $entry ) {
			// A list is not a place custom CSS sits, which its index in the path records.
			if ( gutenberg_suggested_style_is_unsafe( $entry, $key, $allowed_css, $is_filtered, array_merge( $path, array( (int) $index ) ) ) ) {
				return true;
			}
		}
		return false;
	}
	if ( $value instanceof stdClass ) {
		// The style itself sits under no key.
		$child_path = '' === $key && array() === $path ? $path : array_merge( $path, array( $key ) );
		foreach ( get_object_vars( $value ) as $child_key => $entry ) {
			if ( gutenberg_suggested_style_is_unsafe( $entry, (string) $child_key, $allowed_css, $is_filtered, $child_path ) ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Finds the first reason a payload's `attribute-set` operations cannot be
 * stored.
 *
 * A reviewer's accept writes a proposed value into the block, where a value
 * with no markup can still become markup once the block serializes it: a tag
 * name, a URL, a CSS string. The editor refuses those when a reviewer
 * accepts; these are the same rules, applied when the note is written, as
 * far as the server can judge them:
 *
 *   - A URL (by attribute or key name, or read from a URL-bearing HTML
 *     attribute) must not name a protocol outside `wp_allowed_protocols()`.
 *   - A `style` string, or a URL in one, must stay inside its declaration.
 *     Custom CSS needs `edit_css`; without it a proposal may only carry along
 *     custom CSS the saved post already holds for a block of that type, since
 *     the whole `style` is proposed. The baseline in the payload is the
 *     suggester's own claim and is not read.
 *   - A `metadata` proposal must not name the keys the system owns.
 *   - For an attribute the block type declares on the server: the value must
 *     match the declared `type` and `enum`, and a tag name with no `enum`
 *     must be one of the sectioning and grouping elements.
 *
 * A block type, or an attribute, registered only in the editor has no schema
 * here, so only the first three rules apply to it and the editor's check on
 * accept does the rest. Nothing is dropped or repaired: one invalid
 * operation refuses the payload, so the note never describes a change other
 * than the one that would be applied.
 *
 * Filtering the payload for storage can change a value: removing markup or
 * a null byte can join the two halves of a protocol or of `url(`. So the
 * payload is judged twice, as sent and as stored (`$is_filtered`). The
 * stored one has its entities decoded first, and skips the rules filtering
 * cannot affect or only blurs: the `type` and `enum` (re-encoding loses the
 * difference between an empty object and an empty list) and the custom CSS.
 * Its keys are the ones judged as sent: a payload whose keys filtering
 * changes is refused (`gutenberg_find_suggestion_attribute_write_problem()`).
 *
 * @param string       $payload     The `_wp_suggestion` JSON.
 * @param WP_Post|null $post        The post the note belongs to.
 * @param bool         $is_filtered Whether the payload is the one filtered for storage.
 * @return string|null `unknown-attribute`, `invalid-value` or `unsafe-value`,
 *                     or null when every operation can be stored.
 */
function gutenberg_find_suggestion_attribute_operation_problem( string $payload, ?WP_Post $post = null, bool $is_filtered = false ): ?string {
	// Objects stay objects, so an attribute's `object` and `array` types can be told apart.
	$payload = json_decode( $payload );
	// A property name an object cannot hold: valid JSON the rules cannot read.
	if ( null === $payload && JSON_ERROR_INVALID_PROPERTY_NAME === json_last_error() ) {
		return 'invalid-value';
	}
	$payload = $payload instanceof stdClass ? get_object_vars( $payload ) : array();
	if ( ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
		return null;
	}

	$block_type = isset( $payload['blockName'] ) && is_string( $payload['blockName'] )
		? WP_Block_Type_Registry::get_instance()->get_registered( $payload['blockName'] )
		: null;
	// Includes the attributes block supports register (`style`, `className`, `anchor`...).
	$declared = $block_type ? $block_type->get_attributes() : array();
	// Read from the post only once a proposal carries a `style`.
	$allowed_css  = null;
	$may_send_css = $is_filtered || current_user_can( 'edit_css' );

	/*
	 * Elements a block may be asked to render as when its tag name attribute
	 * declares no `enum`: none runs script, loads a resource or submits a
	 * form. An allowlist, since the unsafe names cannot be listed.
	 */
	$safe_tag_names = array( 'div', 'header', 'main', 'section', 'article', 'aside', 'footer', 'nav', 'figure', 'hgroup', 'address', 'blockquote', 'p', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' );
	// HTML attributes a `source: 'attribute'` block attribute reads a URL from.
	$url_html_attributes = array( 'href', 'src', 'poster', 'action', 'formaction', 'data', 'cite' );

	foreach ( $payload['operations'] as $operation ) {
		if ( ! $operation instanceof stdClass || ! isset( $operation->type ) || 'attribute-set' !== $operation->type ) {
			continue;
		}
		$name = $operation->attribute ?? null;
		if ( ! is_string( $name ) ) {
			return 'unknown-attribute';
		}
		$proposed = $operation->after ?? null;
		// An unset value puts the attribute back to its default.
		if ( null === $proposed ) {
			continue;
		}

		$schema = isset( $declared[ $name ] ) && is_array( $declared[ $name ] ) ? $declared[ $name ] : null;
		if ( null !== $schema && ! $is_filtered ) {
			if ( isset( $schema['type'] ) && ! gutenberg_is_suggested_value_of_type( $proposed, $schema['type'] ) ) {
				return 'invalid-value';
			}
			$enum = isset( $schema['enum'] ) && is_array( $schema['enum'] ) ? $schema['enum'] : null;
			if ( null !== $enum ) {
				// Compared as arrays, the shape the schema declares its values in.
				$comparable = json_decode( (string) wp_json_encode( $proposed ), true );
				$is_number  = is_int( $comparable ) || is_float( $comparable );
				$is_allowed = false;
				foreach ( $enum as $allowed ) {
					// JSON has one number type: `3.0` and `3` are the same value.
					if ( $is_number && ( is_int( $allowed ) || is_float( $allowed ) ) ? (float) $allowed === (float) $comparable : $allowed === $comparable ) {
						$is_allowed = true;
						break;
					}
				}
				if ( ! $is_allowed ) {
					return 'invalid-value';
				}
			} elseif (
				/*
				 * Without an `enum` the attribute is a free string the
				 * block's save writes as an element name; an empty one is
				 * the block's default element.
				 */
				preg_match( '/^tagName\z|TagName\z/', $name ) &&
				'' !== $proposed &&
				! ( is_string( $proposed ) && in_array( $proposed, $safe_tag_names, true ) )
			) {
				return 'unsafe-value';
			}
		}

		// The note and marker linkage is written by the editor, never proposed.
		if ( 'metadata' === $name && $proposed instanceof stdClass && ( property_exists( $proposed, 'noteId' ) || property_exists( $proposed, 'suggestion' ) ) ) {
			return 'invalid-value';
		}

		$is_url = preg_match( GUTENBERG_SUGGESTION_URL_KEY_PATTERN, $name ) ||
			( null !== $schema && isset( $schema['source'], $schema['attribute'] ) && 'attribute' === $schema['source'] && in_array( $schema['attribute'], $url_html_attributes, true ) );
		if ( gutenberg_suggested_value_has_unsafe_url( $proposed, (bool) $is_url, $is_filtered ) ) {
			return 'unsafe-value';
		}

		if ( 'style' === $name ) {
			if ( ! $may_send_css && null === $allowed_css ) {
				$allowed_css = gutenberg_get_suggestion_post_block_custom_css( $post, isset( $payload['blockName'] ) && is_string( $payload['blockName'] ) ? $payload['blockName'] : '' );
			}
			if ( gutenberg_suggested_style_is_unsafe( $proposed, '', $allowed_css, $is_filtered ) ) {
				return 'unsafe-value';
			}
		}
	}

	return null;
}

/**
 * Finds the first reason a payload's `attribute-set` operations cannot be
 * stored, judging it both as sent and as it will be stored.
 *
 * @param string       $sent   The payload as the suggester sent it.
 * @param string       $stored The payload after `gutenberg_sanitize_suggestion_payload()`.
 * @param WP_Post|null $post   The post the note belongs to.
 * @return string|null The problem (see `gutenberg_find_suggestion_attribute_operation_problem()`), or null.
 */
function gutenberg_find_suggestion_attribute_write_problem( string $sent, string $stored, ?WP_Post $post ): ?string {
	$problem = gutenberg_find_suggestion_attribute_operation_problem( $sent, $post );
	if ( null !== $problem || $stored === $sent ) {
		return $problem;
	}
	/*
	 * Filtering filters the keys of a proposed value too. The rules read a
	 * value by its keys (`css`, a URL key), so a key that only reads as one
	 * once stored would have been judged as something else.
	 */
	if ( gutenberg_get_suggestion_attribute_key_paths( $sent ) !== gutenberg_get_suggestion_attribute_key_paths( $stored ) ) {
		return 'unsafe-value';
	}
	return gutenberg_find_suggestion_attribute_operation_problem( $stored, $post, true );
}

/**
 * Lists the key paths of the values a payload's `attribute-set` operations
 * propose.
 *
 * @param string $payload The `_wp_suggestion` JSON.
 * @return list<string> The JSON of each path, from the operation's index down.
 */
function gutenberg_get_suggestion_attribute_key_paths( string $payload ): array {
	$payload = json_decode( $payload, true );
	$paths   = array();
	if ( ! is_array( $payload ) || ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
		return $paths;
	}
	$collect = static function ( $value, array $path ) use ( &$collect, &$paths ): void {
		if ( ! is_array( $value ) ) {
			return;
		}
		foreach ( $value as $key => $entry ) {
			$child   = array_merge( $path, array( $key ) );
			$paths[] = (string) wp_json_encode( $child );
			$collect( $entry, $child );
		}
	};
	foreach ( $payload['operations'] as $index => $operation ) {
		if ( is_array( $operation ) && isset( $operation['type'], $operation['after'] ) && 'attribute-set' === $operation['type'] ) {
			$collect( $operation['after'], array( $index ) );
		}
	}
	sort( $paths );
	return $paths;
}

/**
 * Reads, or records, the payload a stored `_wp_suggestion` was sent as.
 *
 * The write guard is only handed the payload after it was filtered for
 * storage, and the rules need the one sent too. The meta's
 * `sanitize_callback` records it here, keyed by the value it returns, for
 * the guard that runs next.
 *
 * @param string      $stored The payload as it would be stored.
 * @param string|null $sent   The payload before sanitizing, to record it.
 * @return string The payload as sent, or the stored one when none was recorded.
 */
function gutenberg_suggestion_payload_as_sent( string $stored, ?string $sent = null ): string {
	/** @var array<string, string> $sent_by_stored */
	static $sent_by_stored = array();
	$key                   = md5( $stored );
	if ( null !== $sent ) {
		// A payload sanitized twice (the callback can be registered more than once) keeps the first one sent.
		$sent = $sent_by_stored[ md5( $sent ) ] ?? $sent;
		// Only the write in progress needs it.
		$sent_by_stored = array(
			md5( $sent ) => $sent,
			$key         => $sent,
		);
	}
	return $sent_by_stored[ $key ] ?? $stored;
}

/**
 * Validates the attribute operations of a suggestion a REST request carries.
 *
 * Hooked to `rest_preprocess_comment`, which runs for both creating and
 * updating a comment, so the request is refused with a 400 before anything
 * is stored.
 *
 * @param array<string, mixed>|WP_Error $prepared_comment The prepared comment data.
 * @param WP_REST_Request                $request          The REST request.
 * @return array<string, mixed>|WP_Error The prepared comment, or an error for
 *                                       an invalid attribute operation.
 */
function gutenberg_validate_suggestion_attribute_operations( $prepared_comment, $request ) {
	if ( is_wp_error( $prepared_comment ) ) {
		return $prepared_comment;
	}
	$meta = $request['meta'];
	if ( ! is_array( $meta ) || ! isset( $meta['_wp_suggestion'] ) || ! is_string( $meta['_wp_suggestion'] ) ) {
		return $prepared_comment;
	}

	$post_id = isset( $prepared_comment['comment_post_ID'] ) ? absint( $prepared_comment['comment_post_ID'] ) : 0;
	if ( ! $post_id && isset( $request['id'] ) ) {
		$comment = get_comment( absint( $request['id'] ) );
		$post_id = $comment ? (int) $comment->comment_post_ID : 0;
	}

	$problem = gutenberg_find_suggestion_attribute_write_problem(
		$meta['_wp_suggestion'],
		gutenberg_sanitize_suggestion_payload( $meta['_wp_suggestion'] ),
		$post_id ? get_post( $post_id ) : null
	);
	if ( null === $problem ) {
		return $prepared_comment;
	}
	return new WP_Error(
		'rest_invalid_suggestion',
		'unsafe-value' === $problem
			? __( 'This suggestion proposes a value that is not allowed here.', 'gutenberg' )
			: __( 'This suggestion proposes a change this block does not support.', 'gutenberg' ),
		array( 'status' => 400 )
	);
}
add_filter( 'rest_preprocess_comment', 'gutenberg_validate_suggestion_attribute_operations', 10, 2 );

/**
 * Holds a `_wp_suggestion` written outside REST to the attribute operation
 * rules: an invalid payload is refused, and the stored one stays as it was.
 *
 * @param bool|null $check      Whether to short-circuit the write. Null lets it proceed.
 * @param int       $note_id    Comment ID.
 * @param string    $meta_key   Meta key.
 * @param mixed     $meta_value Meta value.
 * @return bool|null False for an invalid payload, or the incoming value.
 */
function gutenberg_guard_suggestion_attribute_operations_meta( $check, $note_id, $meta_key, $meta_value ) {
	if ( null !== $check || '_wp_suggestion' !== $meta_key || ! is_string( $meta_value ) ) {
		return $check;
	}
	$note    = get_comment( $note_id );
	$problem = gutenberg_find_suggestion_attribute_write_problem(
		gutenberg_suggestion_payload_as_sent( $meta_value ),
		$meta_value,
		$note ? get_post( (int) $note->comment_post_ID ) : null
	);
	return null === $problem ? $check : false;
}
add_filter( 'add_comment_metadata', 'gutenberg_guard_suggestion_attribute_operations_meta', 10, 4 );
add_filter( 'update_comment_metadata', 'gutenberg_guard_suggestion_attribute_operations_meta', 10, 4 );

/**
 * Sanitizes a proposed value of the title, excerpt, slug or featured image.
 *
 * A reviewer's accept writes the value to the post under the reviewer's own
 * capabilities, so the value is filtered here, as the suggester, the way core
 * filters that field when the suggester saves it directly: the title and
 * excerpt run through the field's save filters (`title_save_pre`,
 * `excerpt_save_pre`, which apply KSES for a user without `unfiltered_html`),
 * the slug through `sanitize_title()`, and the featured image must be the id
 * of an attachment the suggester can read.
 *
 * `before` is the field's current value, only compared and shown, never
 * written. It is held to the same type, and a featured image id is cast, but
 * the title and excerpt are kept verbatim like any other baseline (see
 * `gutenberg_sanitize_suggestion_payload()`), since filtering them would
 * misreport a field that already holds markup as changed.
 *
 * @param string  $attribute The post field.
 * @param mixed   $value     The proposed or current value.
 * @param WP_Post $post      The post the suggestion belongs to.
 * @param bool    $is_after  Whether the value is the proposed one.
 * @return mixed|WP_Error The sanitized value, or an error for a value of the
 *                        wrong type or an attachment that cannot be used.
 */
function gutenberg_sanitize_suggested_post_field( $attribute, $value, $post, $is_after ) {
	if ( null === $value ) {
		return null;
	}
	$invalid = new WP_Error( 'rest_invalid_suggestion' );

	if ( 'featured_media' === $attribute ) {
		if ( ! is_int( $value ) && ! ( is_string( $value ) && ctype_digit( $value ) ) ) {
			return $invalid;
		}
		$attachment_id = absint( $value );
		if ( $is_after && $attachment_id > 0 ) {
			$attachment = get_post( $attachment_id );
			if ( ! $attachment || 'attachment' !== $attachment->post_type || ! current_user_can( 'read_post', $attachment_id ) ) {
				return $invalid;
			}
		}
		return $attachment_id;
	}

	if ( ! is_string( $value ) ) {
		return $invalid;
	}
	if ( ! $is_after ) {
		return $value;
	}
	if ( 'slug' === $attribute ) {
		return sanitize_title( $value );
	}
	$field = 'title' === $attribute ? 'post_title' : 'post_excerpt';
	return wp_unslash( sanitize_post_field( $field, wp_slash( $value ), $post->ID, 'db' ) );
}

/**
 * Validates and sanitizes the terms a terms suggestion proposes.
 *
 * Each entry is either the id of a term to assign, or a term that does not
 * exist yet, as `{ name, parent? }`: Suggestion mode never writes to a
 * taxonomy, so a new term rides on the suggestion and is only created when a
 * reviewer accepts it, through the normal term permissions. The suggester
 * therefore needs no capability to create terms. A new term's name is
 * sanitized, and a parent is only accepted for a hierarchical taxonomy, as
 * the id of an existing term in it.
 *
 * @param mixed       $terms    The proposed terms.
 * @param WP_Taxonomy $taxonomy The taxonomy they belong to.
 * @return array|null The sanitized terms, or null if an entry is invalid.
 */
function gutenberg_sanitize_suggested_terms( $terms, $taxonomy ) {
	if ( ! wp_is_numeric_array( $terms ) ) {
		return null;
	}
	$sanitized = array();
	foreach ( $terms as $term ) {
		if ( is_int( $term ) && $term > 0 ) {
			$sanitized[] = $term;
			continue;
		}
		if ( ! is_array( $term ) || ! isset( $term['name'] ) || ! is_string( $term['name'] ) ) {
			return null;
		}
		$name = sanitize_text_field( $term['name'] );
		if ( '' === $name ) {
			return null;
		}
		$new_term = array( 'name' => $name );
		if ( isset( $term['parent'] ) ) {
			$parent = $term['parent'];
			if ( ! $taxonomy->hierarchical || ! is_int( $parent ) || $parent < 0 ) {
				return null;
			}
			if ( $parent > 0 ) {
				$parent_term = get_term( $parent, $taxonomy->name );
				if ( ! $parent_term instanceof WP_Term ) {
					return null;
				}
				$new_term['parent'] = $parent;
			}
		}
		$sanitized[] = $new_term;
	}
	return $sanitized;
}
add_filter( 'rest_preprocess_comment', 'gutenberg_validate_suggestion_post_operations', 10, 2 );

/**
 * Whether the current user may suggest a change to a post meta key: the key
 * is registered for the post's type with `show_in_rest`, and the user could
 * edit it directly.
 *
 * @param WP_Post $post The post the suggestion belongs to.
 * @param string  $key  The meta key.
 * @return bool Whether the key can be suggested.
 */
function gutenberg_can_suggest_post_meta( $post, $key ) {
	if ( '' === $key ) {
		return false;
	}
	$registered = array_merge(
		get_registered_meta_keys( 'post' ),
		get_registered_meta_keys( 'post', $post->post_type )
	);
	if ( ! isset( $registered[ $key ] ) || empty( $registered[ $key ]['show_in_rest'] ) ) {
		return false;
	}
	return current_user_can( 'edit_post_meta', $post->ID, $key );
}

/**
 * Records the post whose content `the_content` is expanding.
 *
 * A format marker's original is resolved against the post that owns the
 * content holding the marker, not the block's `postId` context: inside a
 * Query Loop that context names each queried post, while the loop's own
 * blocks still belong to the content that holds the loop. Hooked before
 * `do_blocks()` (priority 9), so every block of the content renders while its
 * post is on top of the stack; a `core/post-content` block nested inside
 * (for a queried post) calls `the_content` again and pushes that post, and
 * `gutenberg_pop_suggestion_content_owner()` restores the outer owner after.
 *
 * @param string $content Post content.
 * @return string Unchanged content.
 */
function gutenberg_push_suggestion_content_owner( $content ) {
	$GLOBALS['gutenberg_suggestion_content_owners'][] = (int) get_the_ID();
	return $content;
}
add_filter( 'the_content', 'gutenberg_push_suggestion_content_owner', 1 );

/**
 * Pops the post recorded by `gutenberg_push_suggestion_content_owner()`.
 *
 * @param string $content Rendered content.
 * @return string Unchanged content.
 */
function gutenberg_pop_suggestion_content_owner( $content ) {
	if ( ! empty( $GLOBALS['gutenberg_suggestion_content_owners'] ) ) {
		array_pop( $GLOBALS['gutenberg_suggestion_content_owners'] );
	}
	return $content;
}
add_filter( 'the_content', 'gutenberg_pop_suggestion_content_owner', PHP_INT_MAX );

/**
 * Records the post whose excerpt is being generated.
 *
 * `wp_trim_excerpt()` renders the post's blocks (`excerpt_remove_blocks()`)
 * before it applies `the_content`, so without this the blocks of a listed
 * post (a Latest Posts or Post Excerpt block) would render while the post
 * holding the list is on top of the stack. Hooked before `wp_trim_excerpt()`
 * (priority 10); `gutenberg_pop_suggestion_content_owner()` pops it after.
 *
 * @param string       $excerpt The post excerpt.
 * @param WP_Post|null $post    The post the excerpt belongs to.
 * @return string Unchanged excerpt.
 */
function gutenberg_push_suggestion_excerpt_owner( $excerpt, $post = null ) {
	$post = get_post( $post );
	$GLOBALS['gutenberg_suggestion_content_owners'][] = $post ? (int) $post->ID : 0;
	return $excerpt;
}
add_filter( 'get_the_excerpt', 'gutenberg_push_suggestion_excerpt_owner', 1, 2 );
add_filter( 'get_the_excerpt', 'gutenberg_pop_suggestion_content_owner', PHP_INT_MAX );

/**
 * Records the post that owns the blocks a block renders from elsewhere.
 *
 * Some blocks render blocks that are not part of the content holding them,
 * outside `the_content`, while the page holding them is still on top of the
 * owner stack. Without a frame of their own, a format marker in those blocks
 * would resolve against the page's notes:
 *
 * - `core/block` renders a synced pattern; its `wp_block` post is the owner.
 *   A `ref` that is not a `wp_block` post records no owner.
 * - `core/template-part` and `core/navigation` render a template part or a
 *   menu post, and `core/latest-posts` can render the full content of each
 *   listed post. None of these resolves an owner, so their markers are not
 *   restored.
 *
 * The frame id stored on the parsed block lets
 * `gutenberg_pop_suggestion_block_owner()` pop exactly this frame.
 *
 * @param array $parsed_block The block being rendered.
 * @return array The block, tagged with its owner frame.
 */
function gutenberg_push_suggestion_block_owner( $parsed_block ) {
	static $frame = 0;
	$name         = isset( $parsed_block['blockName'] ) ? $parsed_block['blockName'] : null;
	if ( 'core/block' === $name ) {
		$ref     = isset( $parsed_block['attrs']['ref'] ) ? (int) $parsed_block['attrs']['ref'] : 0;
		$pattern = $ref > 0 ? get_post( $ref ) : null;
		$owner   = ( $pattern && 'wp_block' === $pattern->post_type ) ? $ref : 0;
	} elseif ( in_array( $name, array( 'core/template-part', 'core/navigation', 'core/latest-posts' ), true ) ) {
		$owner = 0;
	} else {
		return $parsed_block;
	}

	$GLOBALS['gutenberg_suggestion_content_owners'][] = $owner;
	$parsed_block['gutenbergSuggestionOwnerFrame']    = ++$frame;
	$GLOBALS['gutenberg_suggestion_owner_frames'][]   = $frame;
	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_push_suggestion_block_owner', PHP_INT_MAX );

/**
 * Pops the owner recorded by `gutenberg_push_suggestion_block_owner()`.
 *
 * `render_block_core_block()` renders the block a second time from inside its
 * own callback, so `render_block` runs twice for it: first right after the
 * pattern's blocks, then for the outer render. The first one pops; by the
 * second the frame is no longer on top, so nothing else is popped.
 *
 * @param string $block_content Rendered block.
 * @param array  $parsed_block  The block.
 * @return string Unchanged block content.
 */
function gutenberg_pop_suggestion_block_owner( $block_content, $parsed_block ) {
	if (
		isset( $parsed_block['gutenbergSuggestionOwnerFrame'] ) &&
		! empty( $GLOBALS['gutenberg_suggestion_owner_frames'] ) &&
		end( $GLOBALS['gutenberg_suggestion_owner_frames'] ) === $parsed_block['gutenbergSuggestionOwnerFrame']
	) {
		array_pop( $GLOBALS['gutenberg_suggestion_owner_frames'] );
		array_pop( $GLOBALS['gutenberg_suggestion_content_owners'] );
	}
	return $block_content;
}
add_filter( 'render_block', 'gutenberg_pop_suggestion_block_owner', PHP_INT_MAX, 2 );

/**
 * Returns the post whose content is being rendered, if any.
 *
 * @return int Post ID, or 0 outside `the_content`.
 */
function gutenberg_get_suggestion_content_owner() {
	if ( empty( $GLOBALS['gutenberg_suggestion_content_owners'] ) ) {
		return 0;
	}
	return (int) end( $GLOBALS['gutenberg_suggestion_content_owners'] );
}

/**
 * Tells the kind of the inline suggestion marker the processor is on.
 *
 * Each kind has its own class token - `wp-suggestion-add`, `wp-suggestion-del`
 * and `wp-suggestion-format`. Markers stack, one per suggestion, so any of
 * them can nest over the same text, two of one kind included. The class
 * is authoritative: `data-suggestion-type` is written alongside it for styling
 * and is ignored here. `has_class()` matches exact tokens, so an unrelated
 * class such as `wp-suggestion-foo` is never taken for a marker.
 *
 * This is the one place server code tells marker kinds apart; the render strip
 * and the save pass's anchor index both read markers through it.
 *
 * @param WP_HTML_Tag_Processor $processor Processor positioned on a tag.
 * @return string|null `add`, `del` or `format`, or null when the tag is not a
 *                     suggestion marker opener.
 */
function gutenberg_get_suggestion_marker_kind( WP_HTML_Tag_Processor $processor ) {
	if ( 'MARK' !== $processor->get_tag() || $processor->is_tag_closer() ) {
		return null;
	}
	foreach ( array( 'add', 'del', 'format' ) as $kind ) {
		if ( $processor->has_class( 'wp-suggestion-' . $kind ) ) {
			return $kind;
		}
	}
	return null;
}

/**
 * Whether an HTML fragment may hold inline suggestion markers.
 *
 * A cheap test that keeps the pairing walk off content with no markers. The
 * walk reads class names decoded, so a marker class written with a character
 * reference (`wp&#45;suggestion-add`) must not slip past: a fragment holding a
 * `<mark` and any `&` is walked even without the literal class.
 *
 * @param string $html HTML fragment.
 * @return bool False when the fragment holds no marker.
 */
function gutenberg_may_hold_inline_suggestion_markers( string $html ): bool {
	if ( false === stripos( $html, '<mark' ) ) {
		return false;
	}
	return false !== strpos( $html, 'wp-suggestion' ) || false !== strpos( $html, '&' );
}

if ( ! defined( 'GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT' ) ) {
	/**
	 * Most characters a formatting revert may split up at once.
	 *
	 * The character-level revert keeps a record for every character between a
	 * block's first and last formatting marker, and again for the recorded
	 * originals. Past this it is not attempted, and each formatting marker is
	 * handled on its own.
	 */
	define( 'GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT', 10000 );
}

if ( ! defined( 'GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT' ) ) {
	/**
	 * Most inline suggestion markers a fragment may hold to be rendered.
	 *
	 * Each marker costs memory on every view of the block, so a fragment
	 * holding more is not rendered at all. The save pass pairs a whole post
	 * at once and is not limited.
	 */
	define( 'GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT', 5000 );
}

/**
 * Pairs the inline suggestion markers of an HTML fragment with their ends.
 *
 * The single classifier behind every consumer of inline markers: the render
 * strip, and the save pass that moves proposals out of post content and puts
 * them back for editors. Each consumer decides what to do with a marker; they
 * all agree on where it starts and ends.
 *
 * A single read-only Tag Processor walk records, for each marker in document
 * order, its opener span and two ends. Walking tokens rather than matching
 * `<mark>` with a regex means `</mark>`-looking text inside a comment or an
 * attribute value can never be mistaken for a tag.
 *
 * Tag-level pairing is not enough on its own: a browser (and so the editor's
 * rich text parse) ends a `<mark>` left open at the `</p>`, `</li>` or `</td>`
 * of an enclosing element and ignores a `</mark>` it cannot reach, so the
 * lexical `<mark>`...`</mark>` span can differ from the run a reader sees. The
 * walk therefore tracks open elements to approximate the browser's tree as
 * well, and a marker is balanced only when its own `</mark>` ends it in the
 * tree walk, that is also its lexical closer, and every special element
 * opened inside it (a `<div>`, a `<td>`, ...) was closed by its own closer.
 *
 * Each marker is an array:
 *
 * - `kind`: `add`, `del` or `format` (see
 *   `gutenberg_get_suggestion_marker_kind()`), or for a `legacy` marker (the
 *   single `wp-suggestion` class the per-kind classes replaced) `add` when its
 *   type says so and `del` otherwise.
 * - `legacy`: whether it is a legacy marker. Only the render strip acts on
 *   one; the save pass leaves it alone.
 * - `id`: `data-suggestion-id` as an integer, 0 when absent.
 * - `run`: `data-suggestion-run`, or null. Set on the content-free anchors the
 *   save pass leaves in post content (see `Gutenberg_Suggestion_Content`).
 * - `start`, `length`: the opener span.
 * - `end`, `closer`: where the tree walk ends the marker (a browser's view),
 *   and its own closer span when that is what ends it. `end` is null when the
 *   marker is still open at the end of the input.
 * - `lexical_end`, `lexical_closer`: just past the `</mark>` a plain lexical
 *   pairing gives it, and that closer's span, or null when there is none.
 * - `balanced`: whether both readings agree, see above.
 * - `inner_markers`: how many other markers open inside its run.
 * - `enclosing_closers`: for the first unbalanced addition and the first
 *   unbalanced formatting change, the closing tags of the elements around
 *   the marker that the fragment goes on to close, innermost first; null for
 *   every other marker. A caller that removes everything from such a marker
 *   to the end of the fragment writes these back, so the elements around it
 *   stay closed.
 *
 * The walk takes time and memory in proportion to the fragment: a closer finds
 * its match without scanning the open elements. `$limit` bounds the memory the
 * result takes for a caller that renders untrusted content on every view.
 *
 * @param string $html  HTML fragment.
 * @param int    $limit Optional. Most markers the fragment may hold. Default
 *                      no limit.
 * @return list<array{kind: string, legacy: bool, id: int, run: string|null, start: int, length: int, end: int|null, closer: array{int, int}|null, lexical_end: int|null, lexical_closer: array{int, int}|null, balanced: bool, inner_markers: int, enclosing_closers: string|null}>|null
 *         Markers in document order, or null when the walk could not tell
 *         where a token is or the fragment holds more than `$limit` markers
 *         (callers fail closed).
 */
function gutenberg_pair_inline_suggestion_markers( $html, $limit = PHP_INT_MAX ) {
	$processor = new Gutenberg_Suggestion_Marker_Processor( $html );
	$markers   = array();

	/*
	 * The tree walk keeps a stack of open elements, each `[ tag name, marker
	 * index or null, element number ]`, approximating how a browser (and so
	 * the editor's rich text parse) builds the tree:
	 *
	 * - A closer ends every element opened after its match, the way a `</p>`
	 *   ends a `<mark>` left open inside the paragraph.
	 * - The closer of a special element (`</p>`, `</li>`, `</td>`, `</div>`,
	 *   ...) does not reach past a table cell or the other default scope
	 *   boundaries; any other closer (`</mark>`, `</span>`, `</b>`, ...) does
	 *   not reach past a special element. A closer that finds no match is
	 *   ignored, as a browser ignores it.
	 * - Start tags that implicitly close an open element (a `<div>` inside a
	 *   `<p>`), the narrower scopes of `</li>` and `</p>`, table parts outside
	 *   a table, the reconstruction of formatting elements and foster
	 *   parenting are not modelled. A browser can then ignore a closer this
	 *   walk matches (the `</li>` in `<li><ul><mark></li>`, the `</dd>` in
	 *   `<dd><dt><mark></dd>`) and keep the marker open past it, or keep a
	 *   special element open that this walk closed with another element's
	 *   closer, which then keeps a `</mark>` from reaching the marker. So
	 *   only a balanced marker has a reliable end: callers that must not
	 *   leak treat any other as running to the end of the fragment.
	 *
	 * `WP_HTML_Processor` implements those rules fully, but it bails out on
	 * markup it does not support and its implied closers have no byte span to
	 * cut at, so it cannot be the only source of truth for a strip that must
	 * not leak.
	 */
	$special        = array_fill_keys( array( 'ADDRESS', 'APPLET', 'AREA', 'ARTICLE', 'ASIDE', 'BASE', 'BASEFONT', 'BGSOUND', 'BLOCKQUOTE', 'BODY', 'BR', 'BUTTON', 'CAPTION', 'CENTER', 'COL', 'COLGROUP', 'DD', 'DETAILS', 'DIR', 'DIV', 'DL', 'DT', 'EMBED', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAME', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEAD', 'HEADER', 'HGROUP', 'HR', 'HTML', 'IFRAME', 'IMG', 'INPUT', 'KEYGEN', 'LI', 'LINK', 'LISTING', 'MAIN', 'MARQUEE', 'MENU', 'META', 'NAV', 'NOEMBED', 'NOFRAMES', 'NOSCRIPT', 'OBJECT', 'OL', 'P', 'PARAM', 'PLAINTEXT', 'PRE', 'SCRIPT', 'SEARCH', 'SECTION', 'SELECT', 'SOURCE', 'STYLE', 'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TEMPLATE', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TITLE', 'TR', 'TRACK', 'UL', 'WBR', 'XMP' ), true );
	$scope_boundary = array_fill_keys( array( 'APPLET', 'CAPTION', 'HTML', 'MARQUEE', 'OBJECT', 'TABLE', 'TD', 'TEMPLATE', 'TH' ), true );
	$void_elements  = array_fill_keys( array( 'AREA', 'BASE', 'BASEFONT', 'BGSOUND', 'BR', 'COL', 'EMBED', 'FRAME', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR' ), true );
	$open_elements  = array();
	/*
	 * Where to find a closer's match without scanning the stack: the depths
	 * each tag name is open at, and the depths of the open special elements
	 * and scope boundaries, deepest last. A hostile fragment can hold
	 * thousands of closers that match nothing, each of which would otherwise
	 * walk the whole stack.
	 */
	$open_tags       = array();
	$open_special    = array();
	$open_boundaries = array();
	/*
	 * Every element opened, numbered in document order, with its tag name and
	 * the number of the element it opened in (-1 at the top), so the elements
	 * around a marker can be listed once the walk is over.
	 */
	$element_tags    = array();
	$element_parents = array();
	// The element number of each marker.
	$marker_elements = array();
	/*
	 * How many special elements another element's closer has ended so far,
	 * and the count when each marker opened: a marker whose own closer finds
	 * a higher count had such an element inside its run.
	 */
	$forced_ends        = 0;
	$marker_forced_ends = array();
	$disordered         = array();
	// Where the tree walk ends each marker, and its own closer if that ends it.
	$ends    = array();
	$closers = array();
	// The `</mark>` a lexical pairing gives each marker.
	$lexical_closers = array();
	// `<mark>` openers only, each with its marker index or null.
	$lexical_marks = array();
	$query         = array( 'tag_closers' => 'visit' );
	while ( $processor->next_tag( $query ) ) {
		$tag  = $processor->get_tag();
		$span = $processor->get_token_span();
		if ( null === $span ) {
			// Unreachable while paused on a tag; fail closed rather than
			// guess where a marker starts or ends.
			return null;
		}

		if ( $processor->is_tag_closer() ) {
			if ( 'MARK' === $tag && $lexical_marks ) {
				$index = array_pop( $lexical_marks );
				if ( null !== $index ) {
					$lexical_closers[ $index ] = $span;
				}
			}

			/*
			 * The match is the deepest open element of this name, unless an
			 * element the closer cannot reach past sits above it.
			 */
			$match   = empty( $open_tags[ $tag ] ) ? null : end( $open_tags[ $tag ] );
			$blocked = isset( $special[ $tag ] ) ? end( $open_boundaries ) : end( $open_special );
			if ( null === $match || ( false !== $blocked && $blocked > $match ) ) {
				continue;
			}
			while ( count( $open_elements ) > $match ) {
				$element = array_pop( $open_elements );
				$depth   = count( $open_elements );
				array_pop( $open_tags[ $element[0] ] );
				if ( end( $open_special ) === $depth ) {
					array_pop( $open_special );
				}
				if ( end( $open_boundaries ) === $depth ) {
					array_pop( $open_boundaries );
				}
				$is_own = $depth === $match;
				if ( ! $is_own && isset( $special[ $element[0] ] ) ) {
					++$forced_ends;
				}
				if ( null === $element[1] ) {
					continue;
				}
				$ends[ $element[1] ]    = $is_own ? $span[0] + $span[1] : $span[0];
				$closers[ $element[1] ] = $is_own ? $span : null;
				if ( $is_own && $forced_ends > $marker_forced_ends[ $element[1] ] ) {
					$disordered[ $element[1] ] = true;
				}
			}
			continue;
		}

		if ( isset( $void_elements[ $tag ] ) ) {
			continue;
		}
		$kind   = 'MARK' === $tag ? gutenberg_get_suggestion_marker_kind( $processor ) : null;
		$legacy = false;
		if ( null === $kind && 'MARK' === $tag && $processor->has_class( 'wp-suggestion' ) ) {
			$legacy = true;
			$kind   = 'add' === $processor->get_attribute( 'data-suggestion-type' ) ? 'add' : 'del';
		}

		$depth               = count( $open_elements );
		$element             = count( $element_tags );
		$element_tags[]      = (string) $tag;
		$element_parents[]   = $depth > 0 ? $open_elements[ $depth - 1 ][2] : -1;
		$open_tags[ $tag ][] = $depth;
		if ( isset( $special[ $tag ] ) ) {
			$open_special[] = $depth;
		}
		if ( isset( $scope_boundary[ $tag ] ) ) {
			$open_boundaries[] = $depth;
		}

		if ( null === $kind ) {
			$open_elements[] = array( $tag, null, $element );
			if ( 'MARK' === $tag ) {
				$lexical_marks[] = null;
			}
			continue;
		}

		if ( count( $markers ) >= $limit ) {
			return null;
		}
		$run                  = $processor->get_attribute( 'data-suggestion-run' );
		$id                   = $processor->get_attribute( 'data-suggestion-id' );
		$markers[]            = array(
			'kind'   => $kind,
			'legacy' => $legacy,
			'id'     => is_string( $id ) ? (int) $id : 0,
			'run'    => is_string( $run ) ? $run : null,
			'start'  => $span[0],
			'length' => $span[1],
		);
		$open_elements[]      = array( $tag, count( $markers ) - 1, $element );
		$lexical_marks[]      = count( $markers ) - 1;
		$marker_elements[]    = $element;
		$marker_forced_ends[] = $forced_ends;
	}

	$count  = count( $markers );
	$starts = array_column( $markers, 'start' );
	$paired = array();
	foreach ( $markers as $index => $marker ) {
		$end            = $ends[ $index ] ?? null;
		$closer         = $closers[ $index ] ?? null;
		$lexical_closer = $lexical_closers[ $index ] ?? null;
		$lexical_end    = null === $lexical_closer ? null : $lexical_closer[0] + $lexical_closer[1];
		$reach          = null === $end ? strlen( $html ) : max( $end, (int) $lexical_end );
		// Openers are in document order: search for the first one past the run.
		$low  = $index + 1;
		$high = $count;
		while ( $low < $high ) {
			$middle = ( $low + $high ) >> 1;
			if ( $starts[ $middle ] < $reach ) {
				$low = $middle + 1;
			} else {
				$high = $middle;
			}
		}
		$inner    = $low - $index - 1;
		$paired[] = $marker + array(
			'end'               => $end,
			'closer'            => $closer,
			'lexical_end'       => $lexical_end,
			'lexical_closer'    => $lexical_closer,
			'balanced'          => null !== $closer && $lexical_end === $end && ! isset( $disordered[ $index ] ),
			'inner_markers'     => $inner,
			'enclosing_closers' => null,
		);
	}

	/*
	 * The closing tags to write back for the first unbalanced addition and
	 * the first unbalanced formatting change: those of the elements around
	 * the marker that are closed by the end of the fragment.
	 * Other markers around it are left out, since callers take their tags out.
	 */
	$still_open = array_fill_keys( array_column( $open_elements, 2 ), true );
	$is_marker  = array_fill_keys( $marker_elements, true );
	$listed     = array();
	foreach ( $paired as $index => $marker ) {
		$kind = $marker['kind'];
		if ( $marker['balanced'] || 'del' === $kind || isset( $listed[ $kind ] ) || ( 'format' === $kind && null !== $marker['run'] ) ) {
			continue;
		}
		$listed[ $kind ] = true;
		$tags            = '';
		for ( $element = $element_parents[ $marker_elements[ $index ] ]; $element >= 0; $element = $element_parents[ $element ] ) {
			if ( ! isset( $still_open[ $element ] ) && ! isset( $is_marker[ $element ] ) ) {
				$tags .= '</' . strtolower( $element_tags[ $element ] ) . '>';
			}
		}
		$paired[ $index ]['enclosing_closers'] = $tags;
	}

	return $paired;
}

/**
 * Splits inline HTML into characters, each with the elements open around it.
 *
 * Only the inline elements rich text writes are understood (formats, links,
 * marks, spans, line breaks and inline images); anything else, an element
 * left open or a closer that does not match, makes the split fail so callers
 * can fail closed. Text is decoded and split into code points; a line break
 * or image counts as one character.
 *
 * @param string $html  Inline HTML.
 * @param int    $limit Optional. Most characters to split. Default no limit.
 * @return list<array{html: string, stack: list<array{tag: string, opener: string, kind: string|null, id: int, run: bool, note: bool}>}>|null
 *         Characters in order, or null when the HTML is not plain inline
 *         markup or holds more than `$limit` characters.
 */
function gutenberg_get_inline_suggestion_characters( string $html, int $limit = PHP_INT_MAX ): ?array {
	$inline    = array( 'A', 'ABBR', 'B', 'BDI', 'BDO', 'CODE', 'EM', 'I', 'KBD', 'MARK', 'S', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U' );
	$processor = new Gutenberg_Suggestion_Marker_Processor( $html );
	$stack     = array();
	$chars     = array();
	while ( $processor->next_token() ) {
		$type = $processor->get_token_type();
		if ( '#text' === $type ) {
			$text = $processor->get_modifiable_text();
			// A code point takes at most four bytes, so this text alone is
			// over the limit: do not split it to find out.
			if ( strlen( $text ) / 4 > $limit - count( $chars ) ) {
				return null;
			}
			$characters = preg_split( '//u', $text, -1, PREG_SPLIT_NO_EMPTY );
			if ( false === $characters || count( $characters ) > $limit - count( $chars ) ) {
				return null;
			}
			foreach ( $characters as $character ) {
				$chars[] = array(
					'html'  => htmlspecialchars( $character, ENT_NOQUOTES, 'UTF-8' ),
					'stack' => $stack,
				);
			}
			continue;
		}
		$tag  = $processor->get_tag();
		$span = $processor->get_token_span();
		if ( '#tag' !== $type || null === $tag || null === $span ) {
			return null;
		}
		$bytes = substr( $html, $span[0], $span[1] );
		if ( 'BR' === $tag || 'IMG' === $tag ) {
			if ( $processor->is_tag_closer() || count( $chars ) >= $limit ) {
				return null;
			}
			$chars[] = array(
				'html'  => $bytes,
				'stack' => $stack,
			);
			continue;
		}
		if ( ! in_array( $tag, $inline, true ) ) {
			return null;
		}
		if ( $processor->is_tag_closer() ) {
			$top = array_pop( $stack );
			if ( null === $top || $top['tag'] !== $tag ) {
				return null;
			}
			continue;
		}
		$id      = $processor->get_attribute( 'data-suggestion-id' );
		$stack[] = array(
			'tag'    => $tag,
			'opener' => $bytes,
			'kind'   => gutenberg_get_suggestion_marker_kind( $processor ),
			'id'     => is_string( $id ) ? (int) $id : 0,
			'run'    => is_string( $processor->get_attribute( 'data-suggestion-run' ) ),
			'note'   => 'MARK' === $tag && true === $processor->has_class( 'wp-note' ),
		);
	}
	if ( $stack || $processor->paused_at_incomplete_token() ) {
		return null;
	}
	return $chars;
}

/**
 * Serializes characters split by `gutenberg_get_inline_suggestion_characters()`.
 *
 * Adjacent characters share an element when their stacks open it with the
 * same bytes.
 *
 * @param list<array{html: string, stack: list<array{tag: string, opener: string, kind: string|null, id: int, run: bool, note: bool}>}> $chars Characters.
 * @return string HTML.
 */
function gutenberg_serialize_inline_suggestion_characters( array $chars ): string {
	$html = '';
	$open = array();
	foreach ( $chars as $char ) {
		$stack  = $char['stack'];
		$common = 0;
		while ( $common < count( $open ) && $common < count( $stack ) && $open[ $common ]['opener'] === $stack[ $common ]['opener'] ) {
			++$common;
		}
		for ( $i = count( $open ) - 1; $i >= $common; $i-- ) {
			$html .= '</' . strtolower( $open[ $i ]['tag'] ) . '>';
		}
		for ( $i = $common, $count = count( $stack ); $i < $count; $i++ ) {
			$html .= $stack[ $i ]['opener'];
		}
		$open  = $stack;
		$html .= $char['html'];
	}
	for ( $i = count( $open ) - 1; $i >= 0; $i-- ) {
		$html .= '</' . strtolower( $open[ $i ]['tag'] ) . '>';
	}
	return $html;
}

/**
 * Takes formatting suggestions out of inline HTML, character by character.
 *
 * Formatting suggestions stack on the same words and cross the edges of
 * additions, so one cannot be undone by swapping its whole run for its
 * original. Each formatting suggestion's note records, as `beforeHTML`, its
 * characters as they are without it and the newer ones on them, which the
 * editor keeps current as other decisions land. A character carrying
 * formatting suggestions therefore gets the formatting the oldest one not
 * accepted recorded for it, or keeps what it shows when every one is
 * accepted. A change accepted on top of an older one that is not replays on
 * the oldest original what it added and removed: the difference between the
 * original of the next change up (or what the character shows) and its own,
 * in id order, as the editor applies deltas. Every formatting marker is
 * dropped and addition and deletion markers are kept for the strip.
 *
 * The run between the first and last formatting marker is rebuilt from its
 * characters. Null is returned, so the caller can fall back, when that run is
 * not plain inline markup, an original is missing or no longer has the
 * same text, or the run or the originals hold more characters than
 * `GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT`.
 *
 * @param string             $html      HTML fragment.
 * @param array<int, string> $originals Recorded original (`beforeHTML`) of each formatting suggestion.
 * @param int[]              $accepted  Ids of the accepted suggestions.
 * @return string|null The fragment without formatting suggestions, or null.
 */
function gutenberg_revert_inline_format_suggestions( string $html, array $originals, array $accepted = array() ): ?string {
	if ( ! gutenberg_may_hold_inline_suggestion_markers( $html ) ) {
		return $html;
	}
	$markers = gutenberg_pair_inline_suggestion_markers( $html );
	if ( null === $markers ) {
		return null;
	}

	// The smallest run holding every formatting marker and whatever marker
	// it overlaps, so the run is balanced.
	$start = null;
	$end   = null;
	foreach ( $markers as $marker ) {
		if ( 'format' !== $marker['kind'] || null !== $marker['run'] ) {
			continue;
		}
		if ( ! $marker['balanced'] || null === $marker['end'] ) {
			return null;
		}
		$start = null === $start ? $marker['start'] : min( $start, $marker['start'] );
		$end   = null === $end ? $marker['end'] : max( $end, $marker['end'] );
	}
	if ( null === $start || null === $end ) {
		return $html;
	}
	do {
		$grown = false;
		foreach ( $markers as $marker ) {
			$marker_end = $marker['end'] ?? strlen( $html );
			if ( $marker['start'] < $end && $marker_end > $start && ( $marker['start'] < $start || $marker_end > $end ) ) {
				$start = min( $start, $marker['start'] );
				$end   = max( $end, $marker_end );
				$grown = true;
			}
		}
	} while ( $grown );

	$chars = gutenberg_get_inline_suggestion_characters( substr( $html, $start, $end - $start ), GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT );
	if ( null === $chars ) {
		return null;
	}
	// Characters the originals may still take between them.
	$budget = GUTENBERG_SUGGESTION_FORMAT_REVERT_CHARACTER_LIMIT;

	$accepted  = array_fill_keys( array_map( 'intval', $accepted ), true );
	$positions = array();
	$parsed    = array();
	// By reference: a copy of every character would double the memory held.
	foreach ( $chars as &$char ) {
		$ids = array();
		foreach ( $char['stack'] as $element ) {
			if ( 'format' === $element['kind'] && ! $element['run'] ) {
				$ids[] = $element['id'];
			}
		}
		$ids = array_values( array_unique( $ids ) );
		sort( $ids );
		$offsets = array();
		foreach ( $ids as $id ) {
			$offsets[ $id ]   = $positions[ $id ] ?? 0;
			$positions[ $id ] = $offsets[ $id ] + 1;
		}

		$below  = null;
		$replay = false;
		foreach ( $ids as $id ) {
			if ( isset( $accepted[ $id ] ) ) {
				$replay = $replay || null !== $below;
				continue;
			}
			$below ??= $id;
		}

		$kept = array();
		foreach ( $char['stack'] as $element ) {
			if ( null !== $element['kind'] && ! ( 'format' === $element['kind'] && ! $element['run'] ) ) {
				$kept[] = $element;
			} elseif ( null === $element['kind'] && ( null === $below || ( $replay && $element['note'] ) ) ) {
				$kept[] = $element;
			}
		}
		if ( null !== $below ) {
			// The formatting below each change on this character, oldest
			// first, then what the character shows.
			$states = array();
			foreach ( $replay ? $ids : array( $below ) as $id ) {
				if ( ! isset( $parsed[ $id ] ) ) {
					if ( ! isset( $originals[ $id ] ) ) {
						return null;
					}
					$parsed[ $id ] = gutenberg_get_inline_suggestion_characters( $originals[ $id ], $budget );
					if ( null === $parsed[ $id ] ) {
						return null;
					}
					$budget -= count( $parsed[ $id ] );
				}
				$original = $parsed[ $id ][ $offsets[ $id ] ] ?? null;
				// A formatting change never changes text.
				if ( null === $original || $original['html'] !== $char['html'] ) {
					return null;
				}
				$states[] = $original['stack'];
			}
			$states[] = $char['stack'];
			foreach ( $states as $k => $stack ) {
				// Markers and note highlights are not the text's formatting.
				$states[ $k ] = array();
				foreach ( $stack as $element ) {
					if ( null === $element['kind'] && ! $element['note'] ) {
						$states[ $k ][ $element['opener'] ] = $element;
					}
				}
			}

			/*
			 * An accepted change newer than a pending one applies on top of
			 * the oldest original: what it added and removed is the
			 * difference between the formatting below it and above it.
			 */
			$formatting = $states[0];
			if ( $replay ) {
				foreach ( $ids as $k => $id ) {
					if ( ! isset( $accepted[ $id ] ) ) {
						continue;
					}
					$formatting = array_diff_key( $formatting, array_diff_key( $states[ $k ], $states[ $k + 1 ] ) );
					$formatting = $formatting + array_diff_key( $states[ $k + 1 ], $states[ $k ] );
				}
			}
			array_push( $kept, ...array_values( $formatting ) );
		}
		$char['stack'] = $kept;
	}
	unset( $char );
	foreach ( $positions as $id => $count ) {
		if ( isset( $parsed[ $id ] ) && count( (array) $parsed[ $id ] ) !== $count ) {
			return null;
		}
	}

	return substr( $html, 0, $start ) . gutenberg_serialize_inline_suggestion_characters( $chars ) . substr( $html, $end );
}

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
 *   The save pass already leaves an addition's anchor empty in post content;
 *   it goes the same way.
 * - `format` (suggested formatting change): the marked run carries the proposed
 *   formatting, so each character gets back the formatting recorded on the
 *   note (see `gutenberg_revert_inline_format_suggestions()` and
 *   `gutenberg_get_pending_format_suggestion_html()`). Where that cannot be
 *   done, the whole span is replaced with the original run, provided both
 *   still hold the same text: a run edited since unwraps, so readers get the
 *   current text with the proposed formatting, never the old text. The note
 *   is resolved against the post whose content is being rendered (see
 *   `gutenberg_push_suggestion_content_owner()`, and
 *   `gutenberg_push_suggestion_block_owner()` for blocks rendered from
 *   another post, such as a synced pattern), never the block's `postId`
 *   context. When that original cannot be resolved the marker falls back to
 *   deletion handling. The save pass already leaves the original run inside a
 *   format marker's anchor (`data-suggestion-run`), so an anchor is unwrapped.
 * - A legacy marker (the single `wp-suggestion` class from before the per-kind
 *   classes) fails closed the same way: an addition is removed with its text,
 *   anything else is unwrapped, so a pending addition saved before the switch
 *   never renders.
 *
 * Post content keeps the anchors the save pass leaves (and the REST `raw` view
 * re-inflates them for editors) so the editor can re-attach on reload. Only
 * suggestion markers are touched, as told by
 * `gutenberg_get_suggestion_marker_kind()`, which matches class tokens exactly,
 * so an unrelated `<mark>` (a `core/text-color` highlight, a `wp-note`, or a
 * `wp-suggestion-foo` class) survives byte-for-byte.
 *
 * Markers nest, one per suggestion: a deletion inside someone else's addition,
 * an addition inside another addition, two deletions of the same text. The
 * editor writes them in one order - add outermost, then format, then del, and
 * within a kind by id, oldest outermost - which never splits a format marker.
 * A character carrying any addition is removed, whatever else it carries; see
 * `gutenberg_get_inline_suggestion_view()`. Merged or hand-edited markup can still
 * split one around a deletion; the first fragment of a format id then restores
 * the whole original and later fragments render nothing.
 *
 * Markers are paired by `gutenberg_pair_inline_suggestion_markers()`, and the
 * byte ranges to replace are applied once the walk ends. A marker whose two
 * readings disagree (or that has no closer) is unbalanced. Only a deletion
 * fails open: its marker tags are removed and its text kept. An unbalanced
 * addition or format change fails closed: everything from its opener through
 * the end of the block is removed, so pending content and its metadata never
 * render. When markers nest, the outer replacement wins.
 *
 * The block's `postId` context is deliberately not consulted: inside a Query
 * Loop it names each queried post, not the owner of the content being
 * rendered.
 *
 * @param string $block_content Rendered block HTML.
 * @return string Block HTML with suggestion markers stripped (kind-aware).
 */
function gutenberg_strip_inline_suggestion_markers( $block_content ) {
	/*
	 * Set while a restored original run is stripped, so markers inside it are
	 * unwrapped rather than resolved again - a note cannot pull in another
	 * note's original, or its own.
	 */
	static $restoring = false;

	if ( ! gutenberg_may_hold_inline_suggestion_markers( $block_content ) && false === strpos( $block_content, 'data-wp-suggestion-strip' ) ) {
		return $block_content;
	}

	$post_id = $restoring ? 0 : gutenberg_get_suggestion_content_owner();

	$markers = gutenberg_pair_inline_suggestion_markers( $block_content, GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT );
	if ( null === $markers ) {
		return '';
	}

	/*
	 * Each note is read once per block, and only so many of them: a marker
	 * can name any id, and every id that is not a note costs a query. Past
	 * that a format marker counts as one whose original cannot be resolved.
	 */
	$resolved = array();
	$resolve  = static function ( int $note_id ) use ( &$resolved, $post_id ): ?string {
		if ( ! array_key_exists( $note_id, $resolved ) ) {
			$resolved[ $note_id ] = count( $resolved ) < 100 ? gutenberg_get_pending_format_suggestion_html( $note_id, $post_id ) : null;
		}
		return $resolved[ $note_id ];
	};

	/*
	 * Formatting suggestions come out character by character first, so
	 * stacked ones and ones crossing an addition's edge render their
	 * original. When that cannot be done, each format marker is handled
	 * below on its own.
	 */
	if ( ! $restoring && in_array( 'format', array_column( $markers, 'kind' ), true ) ) {
		$originals = array();
		foreach ( $markers as $marker ) {
			if ( 'format' === $marker['kind'] && null === $marker['run'] && ! isset( $originals[ $marker['id'] ] ) ) {
				$original = $resolve( $marker['id'] );
				if ( null === $original ) {
					$originals = null;
					break;
				}
				$originals[ $marker['id'] ] = $original;
			}
		}
		$reverted = null === $originals ? null : gutenberg_revert_inline_format_suggestions( $block_content, $originals );
		if ( null !== $reverted && $reverted !== $block_content ) {
			$block_content = $reverted;
			$markers       = gutenberg_pair_inline_suggestion_markers( $block_content );
			if ( null === $markers ) {
				return '';
			}
		}
	}

	foreach ( $markers as $index => $marker ) {
		$mode = ( 'add' === $marker['kind'] ) ? 'add' : 'del';
		if ( 'format' === $marker['kind'] && null === $marker['run'] ) {
			/*
			 * A format marker whose original cannot be resolved is handled as
			 * an unresolved format change below, never as an addition, so a
			 * marker does not silently drop content it is not sure about.
			 */
			$original = $resolve( $marker['id'] );
			if ( null !== $original ) {
				$mode                          = 'format';
				$markers[ $index ]['original'] = $original;
			} else {
				$mode = 'unresolved-format';
			}
		}
		$markers[ $index ]['mode'] = $mode;
	}

	/*
	 * An original is only swapped in for a run that still reads as it did
	 * when the note recorded it. A run edited since keeps its own text, so
	 * its marker is unwrapped like one whose original cannot be resolved. The
	 * fragments of a split marker are read together.
	 */
	$run_texts = array();
	$run_ends  = array();
	foreach ( $markers as $marker ) {
		if ( 'format' !== $marker['mode'] || ! $marker['balanced'] || null === $marker['closer'] ) {
			continue;
		}
		$id = $marker['id'];
		// A fragment nested inside another of the same id is already read.
		if ( $marker['start'] < ( $run_ends[ $id ] ?? 0 ) ) {
			continue;
		}
		$inner_start      = $marker['start'] + $marker['length'];
		$run_texts[ $id ] = ( $run_texts[ $id ] ?? '' ) . gutenberg_get_inline_suggestion_text( substr( $block_content, $inner_start, $marker['closer'][0] - $inner_start ) );
		$run_ends[ $id ]  = (int) $marker['end'];
	}
	$stale = array();
	foreach ( $markers as $index => $marker ) {
		if ( 'format' !== $marker['mode'] || ! isset( $marker['original'], $run_texts[ $marker['id'] ] ) ) {
			continue;
		}
		$id = $marker['id'];
		if ( ! isset( $stale[ $id ] ) ) {
			$stale[ $id ] = gutenberg_get_inline_suggestion_text( $marker['original'] ) !== $run_texts[ $id ];
		}
		if ( $stale[ $id ] ) {
			$markers[ $index ]['mode'] = 'unresolved-format';
		}
	}

	/*
	 * Turns each marker into edits. Only a balanced marker has a run a browser
	 * and the walk agree on. Otherwise (no closer, a closer that a browser
	 * ignores or reaches through an enclosing element, an implicit end):
	 *
	 * - A deletion fails open: its text is real content, so only its opener
	 *   and any closer paired with it are removed.
	 * - An addition or format change fails closed. A browser may keep it open
	 *   further than the walk can tell, so everything from its opener to the
	 *   end of the block is removed, at the cost of hiding real text, and
	 *   the elements around it that the block closed after it are closed
	 *   again. No pending text or marker metadata renders whichever way the
	 *   markup is read.
	 *
	 * A balanced format change is replaced with its original; a balanced one
	 * whose original cannot be resolved, or no longer has the run's text,
	 * unwraps like a deletion.
	 */
	$length = strlen( $block_content );
	$edits  = array();
	// Format ids whose original has been emitted by an earlier fragment.
	$format_seen = array();
	foreach ( $markers as $marker ) {
		$end      = $marker['end'] ?? $length;
		$balanced = $marker['balanced'];
		$opener   = array( $marker['start'], $marker['start'] + $marker['length'], '' );

		if ( 'del' === $marker['mode'] || ( 'unresolved-format' === $marker['mode'] && $balanced ) ) {
			$edits[] = $opener;
			if ( null !== $marker['closer'] ) {
				$edits[] = array( $marker['closer'][0], $marker['closer'][0] + $marker['closer'][1], '' );
			}
			if ( null !== $marker['lexical_end'] && $marker['lexical_end'] !== $end ) {
				$edits[] = array( $marker['lexical_closer'][0], $marker['lexical_end'], '' );
			}
			continue;
		}

		$text = '';
		if ( 'format' === $marker['mode'] && $balanced && ! isset( $format_seen[ $marker['id'] ] ) ) {
			$format_seen[ $marker['id'] ] = true;
			$restoring                    = true;
			$text                         = gutenberg_strip_inline_suggestion_markers( $marker['original'] );
			$restoring                    = false;
			// The note-marker strip may already have run on this block, so
			// the swapped-in original gets its own pass.
			if ( function_exists( 'gutenberg_strip_inline_note_markers' ) ) {
				$text = gutenberg_strip_inline_note_markers( $text );
			}
		}
		if ( ! $balanced ) {
			$edits[] = array( $marker['start'], $length, (string) $marker['enclosing_closers'] );
			continue;
		}
		$edits[] = array( $marker['start'], $end, $text );
	}

	$html = gutenberg_apply_suggestion_splices( $block_content, $edits );

	/*
	 * `data-wp-suggestion-strip` was the sentinel attribute of an earlier
	 * implementation. Keep removing it so a copy planted by a user (data-*
	 * attributes pass KSES) never reaches public output. Content removed above
	 * takes its copies with it.
	 */
	if ( false !== strpos( $html, 'data-wp-suggestion-strip' ) ) {
		$sentinels = new WP_HTML_Tag_Processor( $html );
		while ( $sentinels->next_tag() ) {
			$sentinels->remove_attribute( 'data-wp-suggestion-strip' );
		}
		$html = $sentinels->get_updated_html();
	}

	return $html;
}

/**
 * Renders inline suggestion markup as published after a set of decisions.
 *
 * Markers stack, one per suggestion, so a character can carry several
 * addition ids and several deletion ids. A character is published when every
 * addition on it is accepted and no deletion on it is accepted; every addition
 * or deletion marker is then unwrapped. Decisions commute, so the result does
 * not depend on the order they were made in. With nothing accepted this is
 * what `gutenberg_strip_inline_suggestion_markers()` renders for additions and
 * deletions.
 *
 * An accepted formatting change is unwrapped, keeping what it proposes. One
 * that is not accepted takes its characters back to their recorded original
 * when `$originals` holds it (see
 * `gutenberg_revert_inline_format_suggestions()`), and is otherwise left as it
 * is. An unbalanced addition is removed through the end of the fragment,
 * accepted or not, and an unbalanced deletion keeps its text, as in the render
 * strip.
 *
 * @param string             $html      HTML fragment.
 * @param int[]              $accepted  Ids of the accepted suggestions.
 * @param array<int, string> $originals Recorded original (`beforeHTML`) of
 *                                      each formatting suggestion.
 * @return string The fragment as published, or '' when its markers cannot
 *                be paired.
 */
function gutenberg_get_inline_suggestion_view( string $html, array $accepted, array $originals = array() ): string {
	if ( ! gutenberg_may_hold_inline_suggestion_markers( $html ) ) {
		return $html;
	}
	$markers = gutenberg_pair_inline_suggestion_markers( $html, GUTENBERG_SUGGESTION_RENDER_MARKER_LIMIT );
	if ( null === $markers ) {
		return '';
	}
	if ( $originals ) {
		$reverted = gutenberg_revert_inline_format_suggestions( $html, $originals, $accepted );
		if ( null !== $reverted && $reverted !== $html ) {
			$html    = $reverted;
			$markers = gutenberg_pair_inline_suggestion_markers( $html );
			if ( null === $markers ) {
				return '';
			}
		}
	}

	$accepted = array_fill_keys( array_map( 'intval', $accepted ), true );
	$length   = strlen( $html );
	$edits    = array();
	foreach ( $markers as $marker ) {
		$is_accepted = isset( $accepted[ $marker['id'] ] );
		$end         = $marker['end'] ?? $length;

		if ( 'format' === $marker['kind'] && ! $is_accepted ) {
			continue;
		}
		if ( 'add' === $marker['kind'] && ! $marker['balanced'] ) {
			$edits[] = array( $marker['start'], $length, (string) $marker['enclosing_closers'] );
			continue;
		}
		if ( 'add' === $marker['kind'] && ! $is_accepted ) {
			$edits[] = array( $marker['start'], $end, '' );
			continue;
		}
		if ( 'del' === $marker['kind'] && $is_accepted && $marker['balanced'] ) {
			$edits[] = array( $marker['start'], $end, '' );
			continue;
		}

		$edits[] = array( $marker['start'], $marker['start'] + $marker['length'], '' );
		if ( null !== $marker['closer'] ) {
			$edits[] = array( $marker['closer'][0], $marker['closer'][0] + $marker['closer'][1], '' );
		}
		if ( null !== $marker['lexical_closer'] && $marker['lexical_end'] !== $end ) {
			$edits[] = array( $marker['lexical_closer'][0], $marker['lexical_end'], '' );
		}
	}

	return gutenberg_apply_suggestion_splices( $html, $edits );
}

/**
 * Returns the text inline suggestion markup publishes, without its markup.
 *
 * Pending additions are left out and deletions kept, as in
 * `gutenberg_get_inline_suggestion_view()`. Character references are decoded,
 * so two runs compare equal whenever a reader sees the same text.
 *
 * @param string $html HTML fragment.
 * @return string Decoded text.
 */
function gutenberg_get_inline_suggestion_text( string $html ): string {
	$processor = new WP_HTML_Tag_Processor( gutenberg_get_inline_suggestion_view( $html, array() ) );
	$text      = '';
	while ( $processor->next_token() ) {
		if ( '#text' === $processor->get_token_type() ) {
			$text .= $processor->get_modifiable_text();
		}
	}
	return $text;
}

/**
 * Applies byte-range replacements to a string.
 *
 * Each edit is `[ start, end, replacement ]` against the original string. The
 * edits are applied in document order. An edit starting inside an earlier one
 * is part of the run being replaced: it is dropped, and when it reaches
 * further the earlier replacement is extended over it, so the outer
 * replacement wins and overlapping removals merge. Bytes outside every edit
 * are copied unchanged.
 *
 * @param string  $input Original string.
 * @param array[] $edits Edits.
 * @return string The edited string.
 */
function gutenberg_apply_suggestion_splices( $input, $edits ) {
	usort(
		$edits,
		static function ( $a, $b ) {
			return $a[0] === $b[0] ? $b[1] - $a[1] : $a[0] - $b[0];
		}
	);
	$merged = array();
	foreach ( $edits as $edit ) {
		$last = count( $merged ) - 1;
		if ( $last >= 0 && $edit[0] < $merged[ $last ][1] ) {
			$merged[ $last ][1] = max( $merged[ $last ][1], $edit[1] );
			continue;
		}
		$merged[] = $edit;
	}
	$output = '';
	$cursor = 0;
	foreach ( $merged as $edit ) {
		$output .= substr( $input, $cursor, $edit[0] - $cursor ) . $edit[2];
		$cursor  = $edit[1];
	}
	return $output . substr( $input, $cursor );
}
add_filter( 'render_block', 'gutenberg_strip_inline_suggestion_markers' );

/**
 * Whether a note's suggestion data may be put into a post's content.
 *
 * The one gate every path that renders or re-inflates note data passes: the
 * note is a `note` on that post, and it is not trashed, marked as spam or
 * trashed with its post. Paths add their own checks on top: the front-end
 * restore of a format original also needs a pending suggestion and a post
 * whose password, if any, was given (see
 * `gutenberg_get_pending_format_suggestion_html()`), while the edit-context
 * re-inflation is already limited to users who can read the post's
 * suggestions.
 *
 * @param int|WP_Comment $note    Note, or its ID.
 * @param int            $post_id Post whose content would carry the data.
 * @return bool Whether the note's data may be used.
 */
function gutenberg_can_render_suggestion_note( $note, $post_id ) {
	$post_id = (int) $post_id;
	$note    = get_comment( $note );
	if ( $post_id <= 0 || ! $note || 'note' !== $note->comment_type || (int) $note->comment_post_ID !== $post_id ) {
		return false;
	}
	return ! in_array( $note->comment_approved, array( 'trash', 'spam', 'post-trashed' ), true );
}

/**
 * Resolves the original run of a pending inline format suggestion.
 *
 * A `format` marker's run carries the proposed formatting; the note records the
 * run as it was in its payload's `beforeHTML`. The original is only returned
 * when all of these hold, so a marker copied into other content cannot pull a
 * post's text onto that page:
 *
 * - the note is on the post whose content is being rendered and is not
 *   trashed or marked as spam (`gutenberg_can_render_suggestion_note()`),
 * - that post's stored content (or, in a preview by a user who can edit the
 *   post, that user's autosave of it) holds a marker for the note,
 * - the post is not password protected, or its password was given,
 * - the suggestion is neither applied nor rejected.
 *
 * `beforeHTML` was filtered at write time to what its author could publish
 * directly (see `gutenberg_sanitize_suggestion_payload()`).
 *
 * @param int $note_id Note comment ID from the marker.
 * @param int $post_id Post whose content is being rendered.
 * @return string|null Original run HTML, or null when it cannot be resolved.
 */
function gutenberg_get_pending_format_suggestion_html( $note_id, $post_id ) {
	if ( $note_id <= 0 || ! gutenberg_can_render_suggestion_note( $note_id, $post_id ) ) {
		return null;
	}
	if ( in_array( get_comment_meta( $note_id, '_wp_suggestion_status', true ), array( 'applied', 'rejected' ), true ) ) {
		return null;
	}
	$post = get_post( $post_id );
	if ( ! $post || post_password_required( $post ) ) {
		return null;
	}
	$needle   = 'data-suggestion-id="' . $note_id . '"';
	$contents = array( $post->post_content );
	// Anyone can add `?preview=true`, and `wp_get_post_autosave()` for user 0
	// returns any user's autosave, so only a user who can edit the post (as
	// a real preview requires) has their autosave consulted.
	if ( is_preview() && current_user_can( 'edit_post', $post_id ) ) {
		$autosave = wp_get_post_autosave( $post_id, get_current_user_id() );
		if ( $autosave ) {
			$contents[] = $autosave->post_content;
		}
	}
	$owned = false;
	foreach ( $contents as $content ) {
		if ( str_contains( $content, $needle ) ) {
			$owned = true;
			break;
		}
	}
	if ( ! $owned ) {
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
 * Keeps a pending insertion from rendering at all.
 *
 * `gutenberg_strip_pending_structural_suggestions()` drops the block's output
 * once it has rendered, by which time its render callback and those of its
 * inner blocks have run and enqueued their assets for a block no reader sees.
 * Short-circuiting the render skips all of that. The `render_block` filter
 * stays for a block rendered without `render_block()`, which this filter does
 * not see.
 *
 * Hooked last: core's own `pre_render_block` callbacks return null whatever
 * they are given, which would undo the short-circuit.
 *
 * @param string|null         $pre_render   Output to use in place of rendering, or null.
 * @param array<string,mixed> $parsed_block The block about to render.
 * @return string|null An empty string for a pending insertion, otherwise the
 *                     value passed in.
 */
function gutenberg_skip_pending_insert_block_render( $pre_render, $parsed_block ) {
	$attrs      = isset( $parsed_block['attrs'] ) && is_array( $parsed_block['attrs'] ) ? $parsed_block['attrs'] : array();
	$metadata   = isset( $attrs['metadata'] ) && is_array( $attrs['metadata'] ) ? $attrs['metadata'] : array();
	$suggestion = isset( $metadata['suggestion'] ) && is_array( $metadata['suggestion'] ) ? $metadata['suggestion'] : array();
	if ( isset( $suggestion['type'] ) && 'pending-insert' === $suggestion['type'] ) {
		return '';
	}
	return $pre_render;
}
add_filter( 'pre_render_block', 'gutenberg_skip_pending_insert_block_render', PHP_INT_MAX, 2 );

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
		$is_separator = ! isset( $block['blockName'] )
			&& '' === trim( isset( $block['innerHTML'] ) ? $block['innerHTML'] : '' );
		if ( ! $is_separator ) {
			$positions[] = $index;
		}
	}

	$siblings = array();
	foreach ( $positions as $index ) {
		/*
		 * The save pass already stored this list in its original order and
		 * marks the proposed position with a placeholder; nothing to restore.
		 */
		if (
			'core/suggestion-placeholder' === $blocks[ $index ]['blockName'] &&
			isset( $blocks[ $index ]['attrs']['type'] ) &&
			'pending-move' === $blocks[ $index ]['attrs']['type']
		) {
			return $blocks;
		}
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
