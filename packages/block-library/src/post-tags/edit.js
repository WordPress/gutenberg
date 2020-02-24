/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function PostTagsDisplay() {
	const [ tags ] = useEntityProp( 'postType', 'post', 'tags' );
	const tagLinks = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			let loaded = true;
			const links = tags.map( ( tagId ) => {
				const tag = getEntityRecord( 'taxonomy', 'post_tag', tagId );
				if ( ! tag ) {
					return ( loaded = false );
				}
				return (
					<a key={ tagId } href={ tag.link }>
						{ tag.name }
					</a>
				);
			} );
			return loaded && links;
		},
		[ tags ]
	);
	return (
		tagLinks &&
		( tagLinks.length === 0
			? __( 'No tags.' )
			: tagLinks.reduce( ( prev, curr ) => [ prev, ' | ', curr ] ) )
	);
}

export default function PostTagsEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Tags Placeholder';
	}
	return <PostTagsDisplay />;
}
