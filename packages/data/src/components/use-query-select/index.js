/**
 * Internal dependencies
 */
import useSelect from '../use-select';
import { META_SELECTORS } from "../../store";

/** @typedef {import('../../types').StoreDescriptor} StoreDescriptor */

/**
 * Like useSelect, but the selectors return objects containing
 * both the original data AND the resolution info.
 *
 * @param {Function|StoreDescriptor|string} mapSelect see useSelect
 * @param {Array}                           deps      see useSelect
 * @return {Function} A custom react hook.
 */
export default function useQuerySelect( mapSelect, deps ) {
	return useSelect( ( select, registry ) => {
		// Memoization would be nice here
		const resolve = ( store ) => enrichSelectors( select( store ) );
		return mapSelect( resolve, select, registry );
	}, deps );
}

/**
 * Transform simple selectors into ones that return an object with the
 * original return value AND the resolution info.
 *
 * @param {Object} selectors Selectors to enrich
 * @return {Object} Enriched selectors
 */
function enrichSelectors( selectors ) {
	const resolvers = {};
	for ( const selectorName in selectors ) {
		if ( META_SELECTORS.includes( selectorName ) ) {
			continue;
		}
		Object.defineProperty( resolvers, selectorName, {
			get: () => ( ...args ) => ( {
				data: selectors[ selectorName ]( ...args ),
				isResolving: selectors.getIsResolving( selectorName, args ),
				hasStarted: selectors.hasStartedResolution(
					selectorName,
					args
				),
				hasFinished: selectors.hasFinishedResolution(
					selectorName,
					args
				),
			} ),
		} );
	}
	return resolvers;
}
