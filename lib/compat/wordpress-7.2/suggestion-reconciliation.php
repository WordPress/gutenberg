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
 *   since an attribute edit can ride on another marker type.
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

	if ( false !== strpos( $content, '"suggestion":' ) ) {
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
		$proposes = isset( $marker['after'] ) && is_array( $marker['after'] ) && ! empty( $marker['after'] );
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

Gutenberg_Suggestion_Reconciler::register();
