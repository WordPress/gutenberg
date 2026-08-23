/**
 * Keeps suggestion state off the clipboard.
 *
 * A suggestion is a proposal about *this* post: the inline `<mark
 * class="wp-suggestion">` wrapper, the block-level `metadata.suggestion`
 * marker and the `metadata.noteId` link all point at a note comment attached
 * to this post's id. Copying blocks serializes those attributes verbatim, so
 * pasting into a different post carries markers whose notes do not exist
 * there: the text stays permanently highlighted with no Accept/Reject to
 * clear it, and if a note with the same id ever exists on the destination
 * post the marker silently binds to an unrelated suggestion.
 *
 * The clipboard is the one route out of the editor that cannot be
 * intercepted at the far end - the paste may land in another site, another
 * app, or a plain text file - so the strip runs on copy, via the
 * `blockEditor.copiedBlocks` filter that `setClipboardBlocks` applies just
 * before serializing.
 *
 * What survives the strip is the text a suggestion wraps, in every marker
 * kind. A `del` run is content that is still in the document, a `format` run
 * is unchanged text, and an `add` run is text the author can see and select
 * on screen; dropping any of it would make copy return less than what was
 * highlighted. Only the proposal *about* that text is removed.
 */
import { addFilter } from '@wordpress/hooks';
import { stripSuggestionMarkersFromAttributes } from '../inline-suggestions';

/**
 * Drop the post-scoped `metadata` keys a suggestion writes: the note link and
 * the block-level pending marker. Other metadata (a custom block name, a
 * binding) describes the block itself and travels with it.
 *
 * @param {Object|undefined} attributes Block attributes.
 * @return {Object|undefined} Attributes without suggestion metadata, returned
 * by reference when there was none to remove.
 */
function stripSuggestionMetadata( attributes ) {
	const metadata = attributes?.metadata;
	if ( ! metadata || typeof metadata !== 'object' ) {
		return attributes;
	}
	if ( metadata.noteId === undefined && metadata.suggestion === undefined ) {
		return attributes;
	}
	const {
		noteId: _noteId,
		suggestion: _suggestion,
		...remainingMetadata
	} = metadata;
	const next = { ...attributes };
	if ( Object.keys( remainingMetadata ).length > 0 ) {
		next.metadata = remainingMetadata;
	} else {
		// An empty object would serialize as `{"metadata":{}}` - noise on
		// every copied block that ever carried a suggestion.
		delete next.metadata;
	}
	return next;
}

/**
 * Strip inline suggestion markers and suggestion metadata from a block and
 * its descendants.
 *
 * @param {Object} block Block object.
 * @return {Object} The block with suggestion state removed, returned by
 * reference when nothing changed.
 */
export function stripSuggestionDataFromBlock( block ) {
	if ( ! block || typeof block !== 'object' ) {
		return block;
	}
	const attributes = stripSuggestionMetadata(
		stripSuggestionMarkersFromAttributes( block.attributes )
	);
	const innerBlocks = stripSuggestionDataFromBlocks( block.innerBlocks );
	if (
		attributes === block.attributes &&
		innerBlocks === block.innerBlocks
	) {
		return block;
	}
	return { ...block, attributes, innerBlocks };
}

/**
 * Strip suggestion state from a list of blocks.
 *
 * @param {Object[]} blocks Blocks about to be serialized to the clipboard.
 * @return {Object[]} Blocks without suggestion state, returned by reference
 * when nothing changed.
 */
export function stripSuggestionDataFromBlocks( blocks ) {
	if ( ! Array.isArray( blocks ) ) {
		return blocks;
	}
	let changed = false;
	const next = blocks.map( ( block ) => {
		const stripped = stripSuggestionDataFromBlock( block );
		if ( stripped !== block ) {
			changed = true;
		}
		return stripped;
	} );
	return changed ? next : blocks;
}

let filterRegistered = false;

/**
 * Register the copy-time strip. Registered for every user rather than behind
 * the Suggestion Mode experiment: content that already holds markers can
 * outlive the flag being switched off, and the filter is a reference-returning
 * no-op for blocks that carry no suggestion state.
 */
export function registerClipboardSuggestionStrip() {
	if ( filterRegistered ) {
		return;
	}
	filterRegistered = true;
	addFilter(
		'blockEditor.copiedBlocks',
		'core/editor/strip-suggestions-on-copy',
		stripSuggestionDataFromBlocks
	);
}
