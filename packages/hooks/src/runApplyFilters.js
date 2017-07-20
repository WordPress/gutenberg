import HOOKS from './hooks';

/**
 * Performs a filter if it exists.
 *
 * @param  {string} filter The filter to apply.
 * @param  {...*}   args   Optional args to pass to the filter.
 * @return {*}             The filtered value
 * @private
 */
const runApplyFilters = function( filter, args ) {
	var handlers, i;
	if ( HOOKS.filters ) {
		handlers = HOOKS.filters[ filter ];
	}

	if ( ! handlers ) {
		return args[ 0 ];
	}

	HOOKS.filters.current = filter;
	HOOKS.filters[ filter ].runs = HOOKS.filters[ filter ].runs ? HOOKS.filters[ filter ].runs + 1 : 1;

	for ( i = 0; i < handlers.length; i++ ) {
		args[ 0 ] = handlers[ i ].callback.apply( null, args );
	}
	delete( HOOKS.filters.current );

	return args[ 0 ];
}

export default runApplyFilters;
