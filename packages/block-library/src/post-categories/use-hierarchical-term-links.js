/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useHierarchicalTermLinks( { postId, postType, term } ) {
	const [ hierarchicalTermItems ] = useEntityProp(
		'postType',
		postType,
		term?.restBase,
		postId
	);

	const { hierarchicalTermLinks, isLoadingHierarchicalTermLinks } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );

			let loaded = true;

			const links = map( hierarchicalTermItems, ( itemId ) => {
				const item = getEntityRecord( 'taxonomy', term?.slug, itemId );

				if ( ! item ) {
					return ( loaded = false );
				}

				return (
					<a key={ itemId } href={ item.link }>
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
