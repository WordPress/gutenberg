/**
 * Internal dependencies
 */
import useSelect from '../use-select';
import { META_SELECTORS } from '../../store';
import memoize from './memoize';

interface QuerySelectResponse {
	/** the requested selector return value */
	data: Object;

	/** is the record still being resolved? Via the `getIsResolving` meta-selector */
	isResolving: boolean;

	/** was the resolution started? Via the `hasStartedResolution` meta-selector */
	hasStarted: boolean;

	/** has the resolution finished? Via the `hasFinishedResolution` meta-selector. */
	hasResolved: boolean;
}

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
 * import { store as coreDataStore } from '@wordpress/core-data';
 *
 * function PageTitleDisplay( { id } ) {
 *   const { data: page, isResolving } = useQuerySelect( ( query ) => {
 *     return query( coreDataStore ).getEntityRecord( 'postType', 'page', id )
 *   }, [ id ] );
 *
 *   if ( isResolving ) {
 *     return 'Loading...';
 *   }
 *
 *   return page.title;
 * }
 *
 * // Rendered in the application:
 * // <PageTitleDisplay id={ 10 } />
 * ```
 *
 * In the above example, when `PageTitleDisplay` is rendered into an
 * application, the page and the resolution details will be retrieved from
 * the store state using the `mapSelect` callback on `useQuerySelect`.
 *
 * If the id prop changes then any page in the state for that id is
 * retrieved. If the id prop doesn't change and other props are passed in
 * that do change, the title will not change because the dependency is just
 * the id.
 * @see useSelect
 *
 * @return {QuerySelectResponse} Queried data.
 */
export default function useQuerySelect( mapQuerySelect, deps ) {
	return useSelect( ( select, registry ) => {
		const resolve = ( store ) => enrichSelectors( select( store ) );
		return mapQuerySelect( resolve, registry );
	}, deps );
}

type QuerySelector = ( ...args ) => QuerySelectResponse;
interface EnrichedSelectors {
	[ key: string ]: QuerySelector;
}

/**
 * Transform simple selectors into ones that return an object with the
 * original return value AND the resolution info.
 *
 * @param {Object} selectors Selectors to enrich
 * @return {EnrichedSelectors} Enriched selectors
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
