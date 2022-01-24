/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function usePostTerms( { postId, postType, term } ) {
	const { rest_base: restBase, slug } = term;
	const [ termIds ] = useEntityProp( 'postType', postType, restBase, postId );
	return useSelect(
		( select ) => {
			const visible = term?.visibility?.publicly_queryable;
			if ( ! visible ) {
				return {
					postTerms: [],
					_isLoading: false,
					hasPostTerms: false,
				};
			}
			if ( ! termIds ) {
				// Waiting for post terms to be fetched.
				return { isLoading: term?.postTerms?.includes( postType ) };
			}
			if ( ! termIds.length ) {
				return { isLoading: false };
			}
			const { getEntityRecords, isResolving } = select( coreStore );
			const taxonomyArgs = [
				'taxonomy',
				slug,
				{
					include: termIds,
					context: 'view',
				},
			];
			const terms = getEntityRecords( ...taxonomyArgs );
			const _isLoading = isResolving( 'getEntityRecords', taxonomyArgs );
			return {
				postTerms: terms,
				isLoading: _isLoading,
				hasPostTerms: !! terms?.length,
			};
		},
		[ termIds, term?.visibility?.publicly_queryable ]
	);
}
