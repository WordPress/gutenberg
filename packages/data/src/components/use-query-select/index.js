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
/** @typedef {import('../../types').QuerySelectResponse} QuerySelectResponse */

/**
 * Like useSelect, but the selectors return objects containing
 * both the original data AND the resolution info.
 *
 * @param {Function} mapQuerySelect see useSelect
 * @param {Array}    deps           see useSelect
 *
 * @example
 * ```js
 * import { useQuerySelect } from '@wordpress/data';
 *
 * function HammerPriceDisplay( { currency } ) {
 *   const { data, isResolving } = useQuerySelect( ( query ) => {
 *     return query( 'my-shop' ).getPrice( 'hammer', currency )
 *   }, [ currency ] );
 *
 *   if ( isResolving ) {
 *     return 'Loading...';
 *   }
 *
 *   return new Intl.NumberFormat( 'en-US', {
 *     style: 'currency',
 *     currency,
 *   } ).format( data );
 * }
 *
 * // Rendered in the application:
 * // <HammerPriceDisplay currency="USD" />
 * ```
 *
 * In the above example, when `HammerPriceDisplay` is rendered into an
 * application, the price and the resolution details will be retrieved from
 * the store state using the `mapSelect` callback on `useQuerySelect`.
 *
 * The returned object has the following keys:
 * * data – the return value of the selector.
 * * isResolving – provided by `getIsResolving` meta-selector.
 * * hasStarted – provided by `hasStartedResolution` meta-selector.
 * * hasResolved – provided by `hasFinishedResolution` meta-selector.
 *
 * If the currency prop changes then any price in the state for that currency is
 * retrieved. If the currency prop doesn't change and other props are passed in
 * that do change, the price will not change because the dependency is just the currency.
 * @see useSelect
 *
 * @return {Object} Queried data.
 */
export default function useQuerySelect( mapQuerySelect, deps ) {
	return useSelect( ( select, registry ) => {
		const resolve = ( store ) => enrichSelectors( select( store ) );
		return mapQuerySelect( resolve, registry );
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
				const isResolving = !! getIsResolving( selectorName, args );
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
