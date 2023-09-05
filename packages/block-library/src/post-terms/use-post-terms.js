/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

const EMPTY_ARRAY = [];

export default function usePostTerms( { postId, term } ) {
	const { slug } = term;

	return useSelect(
		( select ) => {
			const visible = term?.visibility?.publicly_queryable;
			if ( ! visible ) {
				return {
					postTerms: EMPTY_ARRAY,
					isLoading: false,
					hasPostTerms: false,
				};
			}

			const { getEntityRecords, isResolving } = select( coreStore );
			const taxonomyArgs = [
				'taxonomy',
				slug,
				{
					post: postId,
					per_page: -1,
					context: 'view',
				},
			];
			const terms = getEntityRecords( ...taxonomyArgs );

			return {
				postTerms: terms,
				isLoading: isResolving( 'getEntityRecords', taxonomyArgs ),
				hasPostTerms: !! terms?.length,
			};
		},
		[ postId, term?.visibility?.publicly_queryable, slug ]
	);
}
