/**
 * Save lock for pending structural suggestions.
 *
 * Structural suggestions use an "apply-and-tag" model: the pending state
 * (`metadata.suggestion` markers, and pending-insert blocks themselves) lives
 * in the REAL block tree, unlike attribute suggestions which stay in the
 * in-memory overlay. Without a guard, Ctrl+S or the periodic editor autosave
 * would serialize that pending state into `post_content`, silently turning a
 * suggester's un-reviewed changes into real draft content.
 *
 * This component locks post saving and autosaving while any pending
 * structural suggestion state exists — either a block in the live tree
 * carrying a `metadata.suggestion` marker, or an overlay entry holding a
 * structural op that hasn't been tagged yet. The lock lifts as soon as the
 * pending set empties (every structural suggestion applied or rejected).
 *
 * Attribute-only overlay entries do NOT engage the lock: the block-editor
 * store is never written for those, so a save serializes clean baseline
 * content.
 */

/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME } from './constants';

const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

/**
 * Lock key shared by the saving and autosaving locks so unlocking is
 * symmetric and can't collide with other subsystems' locks.
 */
export const STRUCTURAL_SUGGESTION_LOCK_KEY =
	'suggestion-mode/pending-structural';

/**
 * Report whether any live block carries a pending `metadata.suggestion`
 * marker. Exported for unit tests.
 *
 * @param {Object|undefined} blockEditor Block-editor selectors.
 * @return {boolean} True when at least one block is tagged.
 */
export function hasPendingStructuralMarker( blockEditor ) {
	if ( ! blockEditor?.getClientIdsWithDescendants ) {
		return false;
	}
	return blockEditor
		.getClientIdsWithDescendants()
		.some(
			( clientId ) =>
				!! blockEditor.getBlockAttributes( clientId )?.metadata
					?.suggestion
		);
}

/**
 * Invisible component that holds the editor's save and autosave locks while
 * pending structural suggestion state exists in the live tree or overlay.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionSaveLock() {
	const { entries } = useSuggestionOverlay();
	const registry = useRegistry();

	const hasStructuralOverlayEntry = Object.values( entries ).some(
		( entry ) => !! entry?.structuralOp
	);

	const hasMarkedBlock = useSelect(
		( select ) =>
			hasPendingStructuralMarker( select( BLOCK_EDITOR_STORE_NAME ) ),
		[]
	);

	const shouldLock = hasStructuralOverlayEntry || hasMarkedBlock;

	useEffect( () => {
		const editor = registry.dispatch( EDITOR_STORE_NAME );
		if ( ! editor?.lockPostSaving ) {
			return undefined;
		}
		if ( shouldLock ) {
			editor.lockPostSaving( STRUCTURAL_SUGGESTION_LOCK_KEY );
			editor.lockPostAutosaving( STRUCTURAL_SUGGESTION_LOCK_KEY );
		} else {
			editor.unlockPostSaving( STRUCTURAL_SUGGESTION_LOCK_KEY );
			editor.unlockPostAutosaving( STRUCTURAL_SUGGESTION_LOCK_KEY );
		}
		return undefined;
	}, [ shouldLock, registry ] );

	// Release the locks on unmount so a torn-down editor (or a disabled
	// experiment) can't leave the post permanently unsaveable.
	useEffect( () => {
		return () => {
			const editor = registry.dispatch( EDITOR_STORE_NAME );
			if ( editor?.unlockPostSaving ) {
				editor.unlockPostSaving( STRUCTURAL_SUGGESTION_LOCK_KEY );
				editor.unlockPostAutosaving( STRUCTURAL_SUGGESTION_LOCK_KEY );
			}
		};
	}, [ registry ] );

	return null;
}
