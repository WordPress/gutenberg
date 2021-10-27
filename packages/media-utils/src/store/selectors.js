/**
 * External dependencies
 */
import createSelector from 'rememo';
import { find } from 'lodash';

/**
 * Returns an object describing the deleted attachment, otherwise null.
 *
 * @param {Object} state Global application state.
 * @param {string} id The id to query.
 *
 * @return {?Object} Information about the associated guide.
 */
export const getDeletedAttachment = createSelector(
	( state, id ) => find( state.deletedAttachments, [ 'id', id ] ) ?? null,
	( state ) => [ state.deletedAttachments ]
);
