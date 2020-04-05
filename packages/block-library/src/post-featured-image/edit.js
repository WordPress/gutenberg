/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { ResponsiveWrapper } from '@wordpress/components';

function PostFeaturedImageDisplay() {
	const [ featuredImage ] = useEntityProp(
		'postType',
		'post',
		'featured_media'
	);
	const media = useSelect(
		( select ) =>
			featuredImage && select( 'core' ).getMedia( featuredImage ),
		[ featuredImage ]
	);
	return media ? (
		<ResponsiveWrapper
			naturalWidth={ media.media_details.width }
			naturalHeight={ media.media_details.height }
		>
			<img src={ media.source_url } alt="Post Featured Media" />
		</ResponsiveWrapper>
	) : null;
}

export default function PostFeaturedImageEdit() {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Featured Image Placeholder';
	}
	return <PostFeaturedImageDisplay />;
}
