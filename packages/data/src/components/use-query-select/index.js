/**
 * External dependencies
 */
import memoize from 'memize';

/**
 * Internal dependencies
 */
import useSelect from '../use-select';
import { META_SELECTORS } from '../../store';

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
		const resolve = ( store ) => enrichSelectors( select( store ) );
		return mapSelect( resolve, registry );
	}, deps );
}

/**
 * Transform simple selectors into ones that return an object with the
 * original return value AND the resolution info.
 *
 * @param {Object} selectors Selectors to enrich
 * @return {Object} Enriched selectors
 */
const enrichSelectors = memoize( ( selectors ) => {
	const resolvers = {};
	for ( const selectorName in selectors ) {
		if ( META_SELECTORS.includes( selectorName ) ) {
			continue;
		}
		Object.defineProperty( resolvers, selectorName, {
			get: () => ( ...args ) => {
				const {
					getIsResolving,
					hasStartedResolution,
					hasFinishedResolution,
				} = selectors;
				const isResolving = getIsResolving( selectorName, args );
				return {
					data: selectors[ selectorName ]( ...args ),
					isResolving,
					hasStarted: hasStartedResolution( selectorName, args ),
					hasResolved:
						! isResolving &&
						hasFinishedResolution( selectorName, args ),
				};
			},
		} );
	}
	return resolvers;
} );
