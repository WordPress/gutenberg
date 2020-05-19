/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function PostCategoriesDisplay() {
	const [ categories ] = useEntityProp( 'postType', 'post', 'categories' );
	const categoryLinks = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			let loaded = true;
			const links = categories.map( ( categoryId ) => {
				const category = getEntityRecord('taxonomy', 'category', categoryId );
				if ( ! category ) {
					return ( loaded = false );
				}
				return (
					<a key={categoryId } href={ category.link }>
						{ category.name }
					</a>
				);
			} );
			return loaded && links;
		},
		[ categories ]
	);
	return (
		categoryLinks &&
		( categoryLinks.length === 0
			? __( 'No categories.' )
			: categoryLinks.reduce( ( prev, curr ) => [ prev, ', ', curr ] ) )
	);
}

export default function PostCategoriesEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Categories Placeholder';
	}
	return <PostCategoriesDisplay />;
}
