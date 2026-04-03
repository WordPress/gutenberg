/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Store name for suggestion decorations. Used by the format-library package
 * to apply suggestion-insert and suggestion-delete highlighting at the view
 * layer.
 */
export const SUGGESTION_DECORATION_STORE = 'core/suggestion-decorations';

const EMPTY_RANGES = [];

const store = createReduxStore( SUGGESTION_DECORATION_STORE, {
	reducer( state = { version: 0, insertions: {}, deletions: {} }, action ) {
		switch ( action.type ) {
			case 'SET_DECORATION_RANGES':
				return {
					version: state.version + 1,
					insertions: action.insertions,
					deletions: action.deletions,
				};
			default:
				return state;
		}
	},
	selectors: {
		getDecorationVersion: ( state ) => state.version,
		getInsertionRanges: ( state, key ) =>
			state.insertions[ key ] || EMPTY_RANGES,
		getDeletionRanges: ( state, key ) =>
			state.deletions[ key ] || EMPTY_RANGES,
	},
	actions: {
		setDecorationRanges: ( insertions, deletions ) => ( {
			type: 'SET_DECORATION_RANGES',
			insertions,
			deletions,
		} ),
	},
} );

register( store );

export { store };
