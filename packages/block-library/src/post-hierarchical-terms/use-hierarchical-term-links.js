/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useHierarchicalTermLinks( { postId, postType, term } ) {
	const { rest_base: restBase, slug } = term;

	const [ hierarchicalTermItems ] = useEntityProp(
		'postType',
		postType,
		restBase,
		postId
	);

	const { hierarchicalTermLinks, isLoadingHierarchicalTermLinks } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			let loaded = true;

			const links = map( hierarchicalTermItems, ( itemId ) => {
				const item = getEntityRecord( 'taxonomy', slug, itemId );

				if ( ! item ) {
					return ( loaded = false );
				}

				return (
					<a
						key={ itemId }
						href={ item.link }
						onClick={ ( event ) => event.preventDefault() }
					>
						{ item.name }
					</a>
				);
			} );

			return {
				hierarchicalTermLinks: links,
				isLoadingHierarchicalTermLinks: ! loaded,
			};
		},
		[ hierarchicalTermItems ]
	);

	return { hierarchicalTermLinks, isLoadingHierarchicalTermLinks };
}
