/**
 * Higher-order function which invokes the given resolver only if it has not
 * already been resolved with the arguments passed to the enhanced function.
 *
 * This only considers resolution state, and notably does not support resolver
 * custom `isFulfilled` behavior.
 *
 * @param {Function} resolver     Original resolver.
 * @param {string}   selectorName Selector name associated with resolver.
 *
 * @return {Function} Enhanced resolver.
 */
const ifNotResolved = ( resolver, selectorName ) => ( ...args ) => async ( {
	select,
	dispatch,
} ) => {
	if ( ! select.hasStartedResolution( selectorName, args ) ) {
		await dispatch( resolver( ...args ) );
	}
};

export default ifNotResolved;
