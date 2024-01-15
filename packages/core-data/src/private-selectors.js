/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getRawEntityRecord,
	getEntityRecordEdits,
	getEditedEntityRecord,
} from './selectors';

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param {Object} state State tree.
 *
 * @return {Object} The undo manager.
 */
export function getUndoManager( state ) {
	return state.undoManager;
}

/**
 * Retrieve the fallback Navigation.
 *
 * @param {Object} state Data state.
 * @return {string|number} The ID for the fallback Navigation post.
 */
export function getNavigationFallbackId( state ) {
	return state.navigationFallbackId;
}

const EMPTY_BLOCKS = [];
const entityBlocksCache = new Map();

export const getEditedEntityRecordWithBlocks = createSelector(
	( state, kind, name, recordId ) => {
		const record = {
			...getRawEntityRecord( state, kind, name, recordId ),
			...getEntityRecordEdits( state, kind, name, recordId ),
		};

		if ( ! record.blocks ) {
			if ( record.content && typeof record.content !== 'function' ) {
				if ( ! entityBlocksCache.has( recordId ) ) {
					entityBlocksCache.set( recordId, parse( record.content ) );
				}

				record.blocks = entityBlocksCache.get( recordId );
			} else {
				record.blocks = EMPTY_BLOCKS;
			}
		}

		return record;
	},
	getEditedEntityRecord.getDependants
);
