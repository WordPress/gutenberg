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
import type * as ET from './entity-types';
import type { State } from './selectors';
import {
	getRawEntityRecord,
	getEntityRecordEdits,
	getEditedEntityRecord,
} from './selectors';

type EntityRecordKey = string | number;

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param state State tree.
 *
 * @return The undo manager.
 */
export function getUndoManager( state: State ) {
	return state.undoManager;
}

/**
 * Retrieve the fallback Navigation.
 *
 * @param state Data state.
 * @return The ID for the fallback Navigation post.
 */
export function getNavigationFallbackId(
	state: State
): EntityRecordKey | undefined {
	return state.navigationFallbackId;
}

const EMPTY_BLOCKS = [];
const entityBlocksCache = new Map< Object, Array< any > >();

/**
 * Returns the specified entity record, merged with its edits.
 *
 * @param state    State tree.
 * @param kind     Entity kind.
 * @param name     Entity name.
 * @param recordId Record ID.
 *
 * @return The entity record, merged with its edits.
 */
export const getEditedEntityRecordWithBlocks = createSelector(
	< EntityRecord extends ET.EntityRecord< any > >(
		state: State,
		kind: string,
		name: string,
		recordId: EntityRecordKey
	): ET.Updatable< EntityRecord > | undefined => {
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
