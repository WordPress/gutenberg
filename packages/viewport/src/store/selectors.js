/**
 * Returns true if the viewport matches the given query, or false otherwise.
 *
 * @param {Object} state Viewport state object.
 * @param {string} query Query string. Includes operator and breakpoint name,
 *                       space separated. Operator defaults to >=.
 *
 * @example
 *
 * ```js
 * isViewportMatch( state, '< huge' );
 * isViewPortMatch( state, 'medium' );
 * ```
 *
 * @return {boolean} Whether viewport matches query.
 */
export function isViewportMatch( state, query ) {
	// Default to `>=` if no operator is present.
	if ( query.indexOf( ' ' ) === -1 ) {
		query = '>= ' + query;
	}

	return !! state[ query ];
}
