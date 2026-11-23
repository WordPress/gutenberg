<?php
/**
 * Suggestion data support for suggest mode.
 *
 * Registers the comment meta that backs a suggested edit. A note-type comment
 * becomes a suggestion when it carries a `_wp_suggestion` payload;
 * `_wp_suggestion_status` tracks its apply/reject lifecycle. The base note
 * infrastructure graduated to WordPress 6.9 core, so only the
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
			$decoded['operations'][ $index ] = $operation;
		}
	}

	// Unescaped, like the JSON the editor sends, so filtering does not grow
	// the payload past the size limit.
	$encoded = wp_json_encode( $decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
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
