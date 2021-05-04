/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useTermLinks( { postId, postType, term } ) {
	const { rest_base: restBase, slug } = term;

	const [ termItems ] = useEntityProp(
		'postType',
		postType,
		restBase,
		postId
	);

	const { termLinks, isLoadingTermLinks } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			let loaded = true;

			const links = map( termItems, ( itemId ) => {
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
				termLinks: links,
				isLoadingTermLinks: ! loaded,
			};
		},
		[ termItems ]
	);

	return { termLinks, isLoadingTermLinks };
}
