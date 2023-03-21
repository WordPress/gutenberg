/**
 * External dependencies
 */
import createSelector from 'rememo';

export const getCommands = createSelector(
	( state ) => Object.values( state ),
	( state ) => [ state ]
);
