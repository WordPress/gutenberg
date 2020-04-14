/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data-controls';

/**
 * Higher-order function which invokes the given resolver only if it has not
 * already been resolved with the arguments passed to the enhanced function.
 *
 * This only considers resolution state, and notably does not support resolver
 * custom `isFulfilled` behavior.
 *
 * @template {Function} R
 *
 * @param {R}      resolver     Original resolver.
 * @param {string} selectorName Selector name associated with resolver.
 *
 * @return {R} Enhanced resolver.
 */
const ifNotResolved = ( resolver, selectorName ) =>
	function* resolveIfNotResolved( ...args ) {
		const hasStartedResolution = yield select(
			'core',
			'hasStartedResolution',
			selectorName,
			args
		);

		if ( ! hasStartedResolution ) {
			yield* resolver( ...args );
		}
	};

export default ifNotResolved;
