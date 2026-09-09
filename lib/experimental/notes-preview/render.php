<?php
/**
 * Note anchors in rendered preview markup.
 *
 * On a preview request from someone entitled to read the post's notes, each
 * block carrying `metadata.noteId` gets a `data-wp-note-id` attribute, and the
 * inline `<mark class="wp-note">` markers that core unwraps on the front end
 * are left in place. Together these give a front-end script the same anchors
 * the editor has, without the editor bundle.
 *
 * Nothing here runs on a published view, for a logged-out visitor, or for
 * anyone without `read_post_notes` on the post being previewed.
 *
 * @package gutenberg
 */

/**
 * Whether the current request is a preview a note reader is entitled to see.
 *
 * @return bool True when note anchors should be rendered.
 */
function gutenberg_notes_preview_is_active() {
	if ( ! is_singular() || ! is_preview() || ! is_user_logged_in() ) {
		return false;
	}

	$post = get_post( get_queried_object_id() );

	if ( ! $post instanceof WP_Post ) {
		return false;
	}

	if ( ! gutenberg_notes_preview_post_type_supports_notes( $post->post_type ) ) {
		return false;
	}

	if ( post_password_required( $post ) ) {
		return false;
	}

	return current_user_can( 'read_post_notes', $post->ID );
}

/**
 * Arms the note anchor filters for this request.
 *
 * Hooking the decision once on `template_redirect` keeps the capability check
 * off the per-block path: when the viewer is not entitled to notes the render
 * filters are simply never added. `template_redirect` also does not fire for
 * admin, REST, cron or CLI requests, so block rendering in those contexts is
 * untouched.
 */
function gutenberg_notes_preview_maybe_enable_anchors() {
	if ( ! gutenberg_notes_preview_is_active() ) {
		return;
	}

	/*
	 * Inline note markers carry the same information the reviewer is entitled
	 * to read in the panel, so keep them rather than unwrapping them. Both the
	 * core filter and the plugin's copy are removed.
	 */
	remove_filter( 'render_block', 'wp_strip_inline_note_markers' );
	remove_filter( 'render_block', 'gutenberg_strip_inline_note_markers' );

	// Priority 20, after any stripping that other code may still do.
	add_filter( 'render_block', 'gutenberg_notes_preview_add_block_anchor', 20, 2 );
}

add_action( 'template_redirect', 'gutenberg_notes_preview_maybe_enable_anchors' );

/**
 * Normalises a block's `metadata.noteId` into a list of note IDs.
 *
 * Mirrors getNoteIdsFromMetadata() in
 * packages/editor/src/components/collab-sidebar/utils.js: the attribute holds
 * either a single ID or an array of them, and only positive integers count.
 *
 * @param mixed $note_id Raw `metadata.noteId` attribute value.
 * @return int[] Unique note IDs, in the order they appear.
 */
function gutenberg_notes_preview_note_ids( $note_id ) {
	$raw = is_array( $note_id ) ? $note_id : array( $note_id );
	$ids = array();

	foreach ( $raw as $value ) {
		if ( ! is_scalar( $value ) || ! is_numeric( $value ) ) {
			continue;
		}

		$id = (int) $value;

		if ( $id > 0 && ! in_array( $id, $ids, true ) ) {
			$ids[] = $id;
		}
	}

	return $ids;
}

/**
 * Adds the note anchor attribute to a rendered block.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Parsed block, including its attributes.
 * @return string Block HTML, with `data-wp-note-id` on the outermost tag.
 */
function gutenberg_notes_preview_add_block_anchor( $block_content, $block ) {
	if ( ! isset( $block['attrs']['metadata']['noteId'] ) || '' === $block_content ) {
		return $block_content;
	}

	$note_ids = gutenberg_notes_preview_note_ids( $block['attrs']['metadata']['noteId'] );

	if ( empty( $note_ids ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );

	// Blocks whose output has no tag at all cannot carry an anchor; the thread
	// still reaches the reviewer through the panel.
	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	$processor->set_attribute( 'data-wp-note-id', implode( ',', $note_ids ) );

	return $processor->get_updated_html();
}
