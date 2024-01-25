/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getRenderingMode } from './selectors';

const EMPTY_INSERTION_POINT = {
	rootClientId: undefined,
	insertionIndex: undefined,
	filterValue: undefined,
};

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export const getInsertionPoint = createRegistrySelector(
	( select ) => ( state ) => {
		if ( typeof state.blockInserterPanel === 'object' ) {
			return {
				rootClientId: state.blockInserterPanel?.rootClientId,
				insertionIndex: state.blockInserterPanel?.insertionIndex,
				filterValue: state.blockInserterPanel?.filterValue,
			};
		}

		if ( getRenderingMode( state ) === 'template-locked' ) {
			const [ postContentClientId ] =
				select( blockEditorStore ).__experimentalGetGlobalBlocksByName(
					'core/post-content'
				);
			if ( postContentClientId ) {
				return {
					rootClientId: postContentClientId,
					insertionIndex: undefined,
					filterValue: undefined,
				};
			}
		}

		return EMPTY_INSERTION_POINT;
	}
);

/**
 * Get the initial tab id for the inserter.
 * A category corresponds to one of the tab ids defined in packages/block-editor/src/components/inserter/tabs.js.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} The initial tab category to open when the inserter is opened.
 */
export const getInserterInitialTab = createRegistrySelector(
	() => ( state ) =>
		typeof state.blockInserterPanel === 'object'
			? state.blockInserterPanel?.initialTab
			: null
);

export function getListViewToggleRef( state ) {
	return state.listViewToggleRef;
}
