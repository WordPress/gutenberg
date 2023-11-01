export function areBlocksDirty( originalBlocks, blocks ) {
	return ! isDeepEqual( originalBlocks, blocks, ( prop, x ) => {
		// Skip inner blocks of page list during comparison as they
		// are **always** controlled and may be updated async due to
		// syncing with entity records. Left unchecked this would
		// inadvertently trigger the dirty state.
		if ( x?.name === 'core/page-list' && prop === 'innerBlocks' ) {
			return true;
		}
	} );
}

/**
 * Conditionally compares two candidates for deep equality.
 * Provides an option to skip a given property of an object during comparison.
 *
 * @param {*}                  x          1st candidate for comparison
 * @param {*}                  y          2nd candidate for comparison
 * @param {Function|undefined} shouldSkip a function which can be used to skip a given property of an object.
 * @return {boolean}                      whether the two candidates are deeply equal.
 */
const isDeepEqual = ( x, y, shouldSkip ) => {
	if ( x === y ) {
		return true;
	} else if (
		typeof x === 'object' &&
		x !== null &&
		x !== undefined &&
		typeof y === 'object' &&
		y !== null &&
		y !== undefined
	) {
		if ( Object.keys( x ).length !== Object.keys( y ).length ) return false;

		for ( const prop in x ) {
			if ( y.hasOwnProperty( prop ) ) {
				// Afford skipping a given property of an object.
				if ( shouldSkip && shouldSkip( prop, x ) ) {
					return true;
				}

				if ( ! isDeepEqual( x[ prop ], y[ prop ], shouldSkip ) )
					return false;
			} else return false;
		}

		return true;
	}

	return false;
};
