/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY = [];

/**
 * Mirrors the editor's content-only section state into List View expansion.
 * Whenever a section block (template part, synced/unsynced pattern) enters
 * inline edit mode — via the toolbar/card "Edit" button or the List View
 * "Unlock" toggle — the section's row and its descendants are exclusively
 * expanded so the user can see everything inside. Exiting edit mode restores
 * the rows we expanded back to collapsed.
 *
 * @param {Object}   props
 * @param {Function} props.expandExclusively Replaces the auto-expanded set;
 *                                           call with `[]` to collapse it.
 */
export default function useListViewEditedSectionSync( { expandExclusively } ) {
	const editedSection = useSelect(
		( select ) =>
			unlock(
				select( blockEditorStore )
			).getEditedContentOnlySection() ?? null,
		[]
	);

	// Resolved separately so its memoization is keyed on `editedSection`
	// rather than the wrapping object identity returned by `useSelect`.
	// `getClientIdsOfDescendants` returns a stable reference when the
	// descendants haven't changed, which keeps the effect below idempotent.
	const descendants = useSelect(
		( select ) =>
			editedSection
				? select( blockEditorStore ).getClientIdsOfDescendants(
						editedSection
				  )
				: EMPTY_ARRAY,
		[ editedSection ]
	);

	useEffect( () => {
		expandExclusively(
			editedSection ? [ editedSection, ...descendants ] : EMPTY_ARRAY
		);
	}, [ editedSection, descendants, expandExclusively ] );
}
