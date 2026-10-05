<?php
/**
 * Records and exposes the edit root for attachments edited via
 * `/wp/v2/media/{id}/edit`.
 *
 * Each call to core's `edit_media_item` creates a new child attachment.
 * On that path, we record the id of the edit root (the attachment at
 * the top of the edit chain) in a dedicated postmeta key
 * (`_wp_attachment_edit_root_id`) so the Media Editor modal can offer
 * a "Restore original" action without walking the chain on every
 * read, and so cleanup on edit root delete can use an indexed query.
 *
 * This applies to every edit that goes through `/edit` — including
 * the image block's crop tools in the post editor — on any site
 * running the plugin. The media editor modal is the first consumer
 * of the read side. No backfill: edits made before this code lands
 * are intentionally untracked.
 *
 * @package gutenberg
 */

/**
 * Postmeta key for the edit root id.
 *
 * Underscore-prefixed so it's treated as private/internal and not
 * exposed by the default postmeta REST surface.
 */
const GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY = '_wp_attachment_edit_root_id';

/**
 * Get the edit root attachment id for an attachment.
 *
 * Returns the id recorded in `_wp_attachment_edit_root_id` when the
 * attachment was created by editing another one, or the attachment's
 * own id when it has no edit lineage. Callers that want to tell
 * "has an edit root" apart from "is its own edit root" should compare
 * the result against the id they passed in.
 *
 * In core this would be `wp_get_edit_root_attachment_id()`.
 *
 * @param int $attachment_id Attachment id to resolve.
 * @return int The edit root attachment id, or `$attachment_id` when there is no lineage.
 */
function gutenberg_get_edit_root_attachment_id( $attachment_id ) {
	$edit_root_id = (int) get_post_meta(
		$attachment_id,
		GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
		true
	);

	return $edit_root_id > 0 ? $edit_root_id : (int) $attachment_id;
}

/**
 * Persist the edit root attachment id when /edit creates a new edited
 * attachment.
 *
 * Hooks `wp_edited_image_metadata` (fired by core inside
 * `WP_REST_Attachments_Controller::edit_media_item`, after the new
 * attachment id has been inserted but before its image metadata is
 * stored). The new child's edit root is its parent's edit root if the
 * parent has one, otherwise the parent itself.
 *
 * @param array $new_image_meta    Metadata for the new edited attachment (unused).
 * @param int   $new_attachment_id The new attachment id.
 * @param int   $attachment_id     The parent (source) attachment id.
 * @return array Filtered metadata (unchanged).
 */
function gutenberg_record_edit_root_attachment_id( $new_image_meta, $new_attachment_id, $attachment_id ) {
	// The new child's edit root is its parent's edit root, or the
	// parent itself when the parent has no lineage of its own.
	$edit_root_id = gutenberg_get_edit_root_attachment_id( $attachment_id );

	update_post_meta(
		$new_attachment_id,
		GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
		$edit_root_id
	);

	return $new_image_meta;
}

/**
 * Registers `edit_root` as a REST field on the attachment schema.
 *
 * The value is the id of the edit root the attachment was edited
 * from, or `0` when it has no edit lineage — mirroring
 * `featured_media`, where `0` means "none". Registering the field
 * (rather than injecting it in a response filter) exposes it in the
 * `OPTIONS /wp/v2/media` schema, integrates with `_fields` filtering,
 * and lets core strip it outside the `edit` context automatically:
 * lineage is an editor concern, and scoping it to `edit` avoids
 * disclosing chain relationships to unauthenticated readers and
 * embed consumers.
 *
 * The `/edit` route registers no `context` argument, so the 201
 * response from `edit_media_item` itself resolves to the default
 * `view` context and never carries this field. Clients must refetch
 * the new attachment with `?context=edit`.
 */
function gutenberg_register_edit_root_field() {
	register_rest_field(
		'attachment',
		'edit_root',
		array(
			'get_callback' => 'gutenberg_get_edit_root_field',
			'schema'       => array(
				'description' => __( 'The ID of the edit root attachment this attachment was edited from, or 0 when it was not created by editing another attachment.', 'gutenberg' ),
				'type'        => 'integer',
				'context'     => array( 'edit' ),
				'readonly'    => true,
			),
		)
	);
}

/**
 * Resolves the `edit_root` field value for a REST response.
 *
 * Trusts the stored meta rather than verifying the edit root still
 * exists: the `delete_attachment` cleanup below keeps it accurate,
 * and a consumer fetching a dangling id (e.g. an edit root sitting in
 * the trash) simply gets no record.
 *
 * @param array $attachment Prepared attachment response data.
 * @return int The edit root id, or 0 when there is no lineage.
 */
function gutenberg_get_edit_root_field( $attachment ) {
	$attachment_id = isset( $attachment['id'] ) ? (int) $attachment['id'] : 0;
	if ( $attachment_id <= 0 ) {
		return 0;
	}

	$edit_root_id = gutenberg_get_edit_root_attachment_id( $attachment_id );

	return $edit_root_id === $attachment_id ? 0 : $edit_root_id;
}

/**
 * Filter `rest_prepare_attachment` to add the `wp:edit-root` link for
 * attachments with an edit lineage.
 *
 * `register_rest_field` has no mechanism for links, so the link rides
 * a response filter while the field itself is registered above. Only
 * added in the `edit` context, matching the field's schema context.
 *
 * @param WP_REST_Response $response REST response.
 * @param WP_Post          $post     Attachment post.
 * @param WP_REST_Request  $request  REST request.
 * @return WP_REST_Response
 */
function gutenberg_add_edit_root_link( $response, $post, $request ) {
	if ( 'edit' !== $request['context'] ) {
		return $response;
	}

	// Requests that limit the response with `_fields` get the link only
	// when they ask for it: core itself skips building its links unless
	// `_links` or `_embedded` is included, so adding ours would hand a
	// field-limited response a `_links` member core intended to omit.
	$fields = wp_parse_list( $request['_fields'] ?? '' );
	if ( ! empty( $fields ) ) {
		if ( $request->has_param( '_embed' ) ) {
			$fields[] = '_embedded';
		}
		if (
			! rest_is_field_included( '_links', $fields ) &&
			! rest_is_field_included( '_embedded', $fields )
		) {
			return $response;
		}
	}

	$edit_root_id = gutenberg_get_edit_root_attachment_id( $post->ID );
	if ( $edit_root_id === (int) $post->ID ) {
		return $response;
	}

	// Only advertise a link the requester could actually follow: skip
	// when the edit root no longer exists or the requester cannot read
	// it, matching core's guard on the `featured_media` link. The
	// `edit_root` field itself still carries the stored id — the link
	// is a promise that `?_embed` can hydrate it, the field is not.
	if (
		'publish' !== get_post_status( $edit_root_id ) &&
		! current_user_can( 'read_post', $edit_root_id )
	) {
		return $response;
	}

	// Mirror `featured_media`: an embeddable link so clients can
	// hydrate the edit root attachment with `?_embed`. Core fires
	// `rest_prepare_attachment` twice per attachment — once from the
	// posts controller's `prepare_item_for_response()` and again from
	// the attachments controller wrapping it — and `add_link()`
	// appends unconditionally, so guard against adding it twice.
	$rel   = 'https://api.w.org/edit-root';
	$links = $response->get_links();
	if ( ! isset( $links[ $rel ] ) ) {
		$response->add_link(
			$rel,
			rest_url( 'wp/v2/media/' . $edit_root_id ),
			array( 'embeddable' => true )
		);
	}

	return $response;
}

/**
 * Clear `_wp_attachment_edit_root_id` from descendants when their
 * edit root is deleted.
 *
 * Without this, descendants would carry a dangling pointer at a
 * recycled attachment id. The REST filter trusts this meta without
 * verifying the edit root still exists, so this cleanup is what keeps
 * the exposed field accurate and prevents it from pointing at an
 * unrelated attachment if the deleted id is later reused.
 *
 * Runs on hard delete only: with `MEDIA_TRASH`, trashing fires no
 * `delete_attachment`, so descendants keep pointing at a trashed
 * edit root (whose URL still resolves) until the trash is purged.
 *
 * @param int $attachment_id Attachment id being deleted.
 */
function gutenberg_clear_edit_root_attachment_id_on_delete( $attachment_id ) {
	$attachment_id = (int) $attachment_id;
	if ( $attachment_id <= 0 ) {
		return;
	}

	// The meta_key index narrows the scan to the rows carrying this
	// key (derivative attachments only); the value comparison then
	// runs on just those rows. Stock postmeta has no meta_value
	// index, but no serialized-blob LIKE is needed either.
	delete_metadata(
		'post',
		0,
		GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
		$attachment_id,
		true
	);
}

// Register only when core doesn't ship the edit-root lineage itself
// (WordPress 7.2, https://github.com/WordPress/wordpress-develop/pull/13303):
// core defines `wp_get_edit_root_attachment_id()` in `post.php`, loaded
// before any plugin, so its presence means core already records the
// meta, exposes the field and link, and cleans up on delete. The
// functions above stay defined either way — the test suite calls them
// directly — only the duplicate registrations are skipped.
if ( ! function_exists( 'wp_get_edit_root_attachment_id' ) ) {
	add_filter( 'wp_edited_image_metadata', 'gutenberg_record_edit_root_attachment_id', 10, 3 );
	add_action( 'rest_api_init', 'gutenberg_register_edit_root_field' );
	add_filter( 'rest_prepare_attachment', 'gutenberg_add_edit_root_link', 10, 3 );
	add_action( 'delete_attachment', 'gutenberg_clear_edit_root_attachment_id_on_delete' );
}
