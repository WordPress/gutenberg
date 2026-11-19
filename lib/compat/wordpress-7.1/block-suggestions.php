<?php
/**
 * Suggestion support for suggest mode.
 *
 * Registers the comment meta that backs a suggested edit. A note-type comment
 * becomes a suggestion when it carries a `_wp_suggestion` payload;
 * `_wp_suggestion_status` tracks its apply/reject lifecycle. The base note
 * infrastructure graduated to WordPress 6.9 core, so only the
 * suggestion-specific additions live here in the 7.1 compat layer.
 *
 * This file also hides un-accepted structural suggestions at render time: a
 * pending block insertion saves into `post_content` so it survives a reload,
 * and `gutenberg_strip_pending_structural_suggestions` drops it from the
 * front end until the suggestion is accepted.
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
 * Maximum byte length of the proposals the save pass stores on one note
 * (`_wp_suggestion_content`). A note whose proposals would not fit keeps them
 * in post content instead, where the render filters still hide them.
 */
if ( ! defined( 'GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES' ) ) {
	define( 'GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES', 1048576 );
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
 * Hooked to `rest_preprocess_comment`, which runs for both creating and
 * updating a comment, so the request is refused with a 400 before anything
 * is stored.
 *
 * @param array|WP_Error  $prepared_comment The prepared comment data.
 * @param WP_REST_Request $request          The REST request.
 * @return array|WP_Error The prepared comment, or an error for an invalid
 *                        post-level operation.
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
	if ( ! is_array( $payload ) || ! isset( $payload['operations'] ) || ! is_array( $payload['operations'] ) ) {
		return $prepared_comment;
	}

	$post_id = isset( $prepared_comment['comment_post_ID'] ) ? (int) $prepared_comment['comment_post_ID'] : 0;
	if ( ! $post_id && isset( $request['id'] ) ) {
		$comment = get_comment( (int) $request['id'] );
		$post_id = $comment ? (int) $comment->comment_post_ID : 0;
	}
	$post = get_post( $post_id );

	$error = new WP_Error(
		'rest_invalid_suggestion',
		__( 'This suggestion changes a post setting that cannot be suggested.', 'gutenberg' ),
		array( 'status' => 400 )
	);

	$sanitized = false;
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
					$sanitized                               = true;
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
			$sanitized                                = true;
		}
	}

	// Store the sanitized values, not the ones sent.
	if ( $sanitized ) {
		$meta['_wp_suggestion'] = wp_json_encode( $payload );
		$request->set_param( 'meta', $meta );
	}

	return $prepared_comment;
}

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
 * - `pending-move`: the block renders (its content is real); it appears at
 *   the proposed position because block order is fixed before render. See
 *   Known Limitations in the suggestions architecture doc.
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
