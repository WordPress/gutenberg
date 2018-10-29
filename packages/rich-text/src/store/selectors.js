/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * Returns all the available format types.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Format types.
 */
export const getFormatTypes = createSelector(
	( state ) => Object.values( state.formatTypes ),
	( state ) => [
		state.formatTypes,
	]
);

/**
 * Returns a format type by name.
 *
 * @param {Object} state Data state.
 * @param {string} name Format type name.
 *
 * @return {Object?} Format type.
 */
export function getFormatType( state, name ) {
	return state.formatTypes[ name ];
}
