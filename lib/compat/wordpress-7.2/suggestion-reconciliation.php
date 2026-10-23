<?php
/**
 * Suggestion mode: the anchor index and the save pass hooks.
 *
 * @package gutenberg
 */

/**
 * Indexes the suggestion anchors in post content.
 *
 * The single place that knows how a suggestion is anchored in serialized
 * content, so a change to the marker shape only touches this function:
 *
 * - `inline`: a `<mark class="wp-suggestion-<kind>" data-suggestion-id="N">`
 *   run, told apart by `gutenberg_get_suggestion_marker_kind()`. Every kind
 *   (`add`, `del`, `format`, either half of a replacement) counts, nested runs
 *   included, since the Tag Processor sees each opener.
 * - a structural marker type (`pending-insert`, `pending-remove`,
 *   `pending-move`, `pending-attributes`): `metadata.suggestion` on a block,
 *   linked to its notes by `metadata.noteId` and `metadata.suggestion.commentId`.
 * - `pending-attributes` also for any marker that carries a non-empty `after`,
 *   since an attribute edit can ride on another marker type, or the `run` the
 *   save pass leaves in its place.
 * - the anchors the save pass leaves in post content: an emptied inline marker
 *   is still a marker, and a `core/suggestion-placeholder` block names its
 *   note and marker type.
 *
 * Inline markers inside a rich-text attribute stored in the block delimiter
 * JSON (no `html` source) are not seen; that gap is shared with the render
 * strip.
 *
 * @param string $content Post content.
 * @return array<int, array<string, true>> Note ID => set of anchor kinds.
 */
function gutenberg_get_suggestion_anchor_index( $content ) {
	$index = array();
	if ( ! is_string( $content ) || '' === $content ) {
		return $index;
	}

	if ( false !== strpos( $content, 'wp-suggestion-' ) ) {
		$processor = new WP_HTML_Tag_Processor( $content );
		while ( $processor->next_tag( array( 'tag_name' => 'MARK' ) ) ) {
			if ( null === gutenberg_get_suggestion_marker_kind( $processor ) ) {
				continue;
			}
			$id = (int) $processor->get_attribute( 'data-suggestion-id' );
			if ( $id > 0 ) {
				$index[ $id ]['inline'] = true;
			}
		}
	}

	if ( false !== strpos( $content, '"suggestion":' ) || false !== strpos( $content, 'wp:suggestion-placeholder' ) ) {
		gutenberg_index_structural_suggestion_anchors( parse_blocks( $content ), $index );
	}

	return $index;
}

/**
 * Adds the structural markers of a block list, recursively, to an index.
 *
 * @param array $blocks Parsed blocks.
 * @param array $index  Index to add to, see `gutenberg_get_suggestion_anchor_index()`.
 */
function gutenberg_index_structural_suggestion_anchors( $blocks, &$index ) {
	$types = array( 'pending-attributes', 'pending-insert', 'pending-remove', 'pending-move' );
	foreach ( $blocks as $block ) {
		if ( ! empty( $block['innerBlocks'] ) ) {
			gutenberg_index_structural_suggestion_anchors( $block['innerBlocks'], $index );
		}
		if ( Gutenberg_Suggestion_Content::PLACEHOLDER === $block['blockName'] ) {
			$id   = isset( $block['attrs']['id'] ) && is_numeric( $block['attrs']['id'] ) ? (int) $block['attrs']['id'] : 0;
			$type = isset( $block['attrs']['type'] ) ? $block['attrs']['type'] : '';
			if ( $id > 0 && in_array( $type, $types, true ) ) {
				$index[ $id ][ $type ] = true;
			}
			continue;
		}
		$metadata = isset( $block['attrs']['metadata'] ) && is_array( $block['attrs']['metadata'] )
			? $block['attrs']['metadata']
			: array();
		$marker   = isset( $metadata['suggestion'] ) && is_array( $metadata['suggestion'] ) ? $metadata['suggestion'] : null;
		if ( ! $marker || ! isset( $marker['type'] ) || ! in_array( $marker['type'], $types, true ) ) {
			continue;
		}
		$ids = isset( $metadata['noteId'] ) ? (array) $metadata['noteId'] : array();
		if ( isset( $marker['commentId'] ) ) {
			$ids[] = $marker['commentId'];
		}
		$proposes = ( isset( $marker['after'] ) && is_array( $marker['after'] ) && ! empty( $marker['after'] ) ) || isset( $marker['run'] );
		foreach ( $ids as $id ) {
			$id = is_numeric( $id ) ? (int) $id : 0;
			if ( $id <= 0 ) {
				continue;
			}
			$index[ $id ][ $marker['type'] ] = true;
			if ( $proposes ) {
				$index[ $id ]['pending-attributes'] = true;
			}
		}
	}
}

/**
 * Whether the current user can read a post's suggestions, and so get their
 * proposals back in edit-context REST responses.
 *
 * @param int $post_id Post ID.
 * @return bool
 */
function gutenberg_can_read_suggestions( $post_id ) {
	/**
	 * Filters whether the current user can read a post's suggestions.
	 *
	 * @since 7.2.0
	 *
	 * @param bool $can_read Whether the user can read them. Default: whether
	 *                       they can edit the post.
	 * @param int  $post_id  Post ID.
	 */
	return (bool) apply_filters( 'gutenberg_can_read_suggestions', current_user_can( 'edit_post', $post_id ), $post_id );
}

/**
 * Registers the void block that holds a suggested block's place in stored
 * post content.
 *
 * It renders nothing, so with or without Gutenberg a front end never shows a
 * suggested block that was not accepted, and it is never offered in the
 * inserter. Edit-context REST responses replace it with the suggested block
 * for users who can read suggestions.
 */
function gutenberg_register_suggestion_placeholder_block() {
	if ( WP_Block_Type_Registry::get_instance()->is_registered( Gutenberg_Suggestion_Content::PLACEHOLDER ) ) {
		return;
	}
	register_block_type(
		Gutenberg_Suggestion_Content::PLACEHOLDER,
		array(
			'api_version'     => 3,
			'attributes'      => array(
				'id'   => array( 'type' => 'number' ),
				'type' => array( 'type' => 'string' ),
				'run'  => array( 'type' => 'number' ),
			),
			'supports'        => array(
				'inserter' => false,
				'html'     => false,
			),
			'render_callback' => '__return_empty_string',
		)
	);
}
add_action( 'init', 'gutenberg_register_suggestion_placeholder_block' );

Gutenberg_Suggestion_Reconciler::register();
