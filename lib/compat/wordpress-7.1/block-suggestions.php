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
 * and `wp-suggestion-format` - so markers of different kinds can nest over the
 * same text, as rich text stores one format per type per character. The class
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
 * tree walk and that is also its lexical closer.
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
 *
 * @param string $html HTML fragment.
 * @return array[]|null Markers in document order, or null when the walk could
 *                      not tell where a token is (callers fail closed).
 */
function gutenberg_pair_inline_suggestion_markers( $html ) {
	$processor = new Gutenberg_Suggestion_Marker_Processor( $html );
	$markers   = array();

	/*
	 * The tree walk keeps a stack of open elements, each `[ tag name, marker
	 * index or null ]`, approximating how a browser (and so the editor's rich
	 * text parse) builds the tree:
	 *
	 * - A closer ends every element opened after its match, the way a `</p>`
	 *   ends a `<mark>` left open inside the paragraph.
	 * - The closer of a special element (`</p>`, `</li>`, `</td>`, `</div>`,
	 *   ...) does not reach past a table cell or the other default scope
	 *   boundaries; any other closer (`</mark>`, `</span>`, `</b>`, ...) does
	 *   not reach past a special element. A closer that finds no match is
	 *   ignored, as a browser ignores it.
	 * - Start tags that implicitly close an open element (a `<div>` inside a
	 *   `<p>`), the reconstruction of formatting elements and foster parenting
	 *   are not modelled. In each of those cases a browser ends the marker
	 *   earlier than this walk does, never later.
	 *
	 * `WP_HTML_Processor` implements those rules fully, but it bails out on
	 * markup it does not support and its implied closers have no byte span to
	 * cut at, so it cannot be the only source of truth for a strip that must
	 * not leak.
	 */
	$special        = array( 'ADDRESS', 'APPLET', 'AREA', 'ARTICLE', 'ASIDE', 'BASE', 'BASEFONT', 'BGSOUND', 'BLOCKQUOTE', 'BODY', 'BR', 'BUTTON', 'CAPTION', 'CENTER', 'COL', 'COLGROUP', 'DD', 'DETAILS', 'DIR', 'DIV', 'DL', 'DT', 'EMBED', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAME', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEAD', 'HEADER', 'HGROUP', 'HR', 'HTML', 'IFRAME', 'IMG', 'INPUT', 'KEYGEN', 'LI', 'LINK', 'LISTING', 'MAIN', 'MARQUEE', 'MENU', 'META', 'NAV', 'NOEMBED', 'NOFRAMES', 'NOSCRIPT', 'OBJECT', 'OL', 'P', 'PARAM', 'PLAINTEXT', 'PRE', 'SCRIPT', 'SEARCH', 'SECTION', 'SELECT', 'SOURCE', 'STYLE', 'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TEMPLATE', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TITLE', 'TR', 'TRACK', 'UL', 'WBR', 'XMP' );
	$scope_boundary = array( 'APPLET', 'CAPTION', 'HTML', 'MARQUEE', 'OBJECT', 'TABLE', 'TD', 'TEMPLATE', 'TH' );
	$void_elements  = array( 'AREA', 'BASE', 'BASEFONT', 'BGSOUND', 'BR', 'COL', 'EMBED', 'FRAME', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR' );
	$open_elements  = array();
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
					$markers[ $index ]['lexical_end']    = $span[0] + $span[1];
					$markers[ $index ]['lexical_closer'] = $span;
				}
			}

			$stop_at = in_array( $tag, $special, true ) ? $scope_boundary : $special;
			$match   = null;
			for ( $i = count( $open_elements ) - 1; $i >= 0; $i-- ) {
				if ( $tag === $open_elements[ $i ][0] ) {
					$match = $i;
					break;
				}
				if ( in_array( $open_elements[ $i ][0], $stop_at, true ) ) {
					break;
				}
			}
			if ( null === $match ) {
				continue;
			}
			while ( count( $open_elements ) > $match ) {
				$element = array_pop( $open_elements );
				if ( null === $element[1] ) {
					continue;
				}
				$is_own                           = count( $open_elements ) === $match;
				$markers[ $element[1] ]['end']    = $is_own ? $span[0] + $span[1] : $span[0];
				$markers[ $element[1] ]['closer'] = $is_own ? $span : null;
			}
			continue;
		}

		if ( in_array( $tag, $void_elements, true ) ) {
			continue;
		}
		$kind   = 'MARK' === $tag ? gutenberg_get_suggestion_marker_kind( $processor ) : null;
		$legacy = false;
		if ( null === $kind && 'MARK' === $tag && $processor->has_class( 'wp-suggestion' ) ) {
			$legacy = true;
			$kind   = 'add' === $processor->get_attribute( 'data-suggestion-type' ) ? 'add' : 'del';
		}
		if ( null === $kind ) {
			$open_elements[] = array( $tag, null );
			if ( 'MARK' === $tag ) {
				$lexical_marks[] = null;
			}
			continue;
		}

		$run             = $processor->get_attribute( 'data-suggestion-run' );
		$markers[]       = array(
			'kind'           => $kind,
			'legacy'         => $legacy,
			'id'             => (int) $processor->get_attribute( 'data-suggestion-id' ),
			'run'            => is_string( $run ) ? $run : null,
			'start'          => $span[0],
			'length'         => $span[1],
			'end'            => null,
			'closer'         => null,
			'lexical_end'    => null,
			'lexical_closer' => null,
		);
		$open_elements[] = array( $tag, count( $markers ) - 1 );
		$lexical_marks[] = count( $markers ) - 1;
	}

	$count = count( $markers );
	foreach ( $markers as $index => $marker ) {
		$markers[ $index ]['balanced'] = null !== $marker['closer'] && $marker['lexical_end'] === $marker['end'];
		$reach                         = max( (int) $marker['end'], (int) $marker['lexical_end'] );
		if ( null === $marker['end'] ) {
			$reach = strlen( $html );
		}
		$inner = 0;
		for ( $next = $index + 1; $next < $count && $markers[ $next ]['start'] < $reach; $next++ ) {
			++$inner;
		}
		$markers[ $index ]['inner_markers'] = $inner;
	}

	return $markers;
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
 *   formatting, so the whole span is replaced with the original run recorded on
 *   the note (see `gutenberg_get_pending_format_suggestion_html()`). The note
 *   is resolved against the post whose content is being rendered (see
 *   `gutenberg_push_suggestion_content_owner()`), never the block's `postId`
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
 * Markers of different kinds nest (a deletion inside someone else's addition).
 * The editor writes them in one order - add outermost, then format, then del -
 * which never splits a format marker. Merged or hand-edited markup can still
 * split one around a deletion; the first fragment of a format id then restores
 * the whole original and later fragments render nothing.
 *
 * Markers are paired by `gutenberg_pair_inline_suggestion_markers()`, and the
 * byte ranges to replace are applied once the walk ends. A marker whose two
 * readings disagree (or that has no closer) is unbalanced. Only a deletion
 * fails open: its marker tags are removed and its text kept. An unbalanced
 * addition or format change fails closed: everything from its opener through
 * the later of its possible ends is removed, so pending content and its
 * metadata never render. When markers nest, the outer replacement wins.
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

	if ( false === strpos( $block_content, 'wp-suggestion' ) ) {
		return $block_content;
	}

	$post_id = $restoring ? 0 : gutenberg_get_suggestion_content_owner();

	$markers = gutenberg_pair_inline_suggestion_markers( $block_content );
	if ( null === $markers ) {
		return '';
	}

	foreach ( $markers as $index => $marker ) {
		$mode = ( 'add' === $marker['kind'] ) ? 'add' : 'del';
		if ( 'format' === $marker['kind'] && null === $marker['run'] ) {
			/*
			 * A format marker whose original cannot be resolved is handled as
			 * an unresolved format change below, never as an addition, so a
			 * marker does not silently drop content it is not sure about.
			 */
			$original = gutenberg_get_pending_format_suggestion_html( $marker['id'], $post_id );
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
	 * Turns each marker into edits. Only a balanced marker has a run a browser
	 * and the walk agree on. Otherwise (no closer, a closer that a browser
	 * ignores or reaches through an enclosing element, an implicit end):
	 *
	 * - A deletion fails open: its text is real content, so only its opener
	 *   and any closer paired with it are removed.
	 * - An addition or format change fails closed: everything from its opener
	 *   through the later of its two ends is removed, so no pending text or
	 *   marker metadata renders whichever way the markup is read, at the cost
	 *   of hiding real text the run wrongly spans. Content still open at the
	 *   end of the block ends with it.
	 *
	 * A balanced format change is replaced with its original; a balanced one
	 * whose original cannot be resolved unwraps like a deletion.
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
		$edits[] = array( $marker['start'], max( $end, (int) $marker['lexical_end'] ), $text );
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
 * Resolves the original run of a pending inline format suggestion.
 *
 * A `format` marker's run carries the proposed formatting; the note records the
 * run as it was in its payload's `beforeHTML`. The original is only returned
 * when all of these hold, so a marker copied into other content cannot pull a
 * post's text onto that page:
 *
 * - the note is on the post whose content is being rendered,
 * - that post's stored content (or, in a preview, the current user's autosave
 *   of it) holds a marker for the note,
 * - the post is not password protected, or its password was given,
 * - the note is not trashed or marked as spam,
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
	if ( $note_id <= 0 || $post_id <= 0 ) {
		return null;
	}
	$note = get_comment( $note_id );
	if ( ! $note || 'note' !== $note->comment_type || (int) $note->comment_post_ID !== $post_id ) {
		return null;
	}
	if ( in_array( $note->comment_approved, array( 'trash', 'spam', 'post-trashed' ), true ) ) {
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
	if ( is_preview() ) {
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
