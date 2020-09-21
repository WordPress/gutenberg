/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { ResponsiveWrapper } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function PostFeaturedImageDisplay( { context: { postId, postType } } ) {
	const [ featuredImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
	const media = useSelect(
		( select ) =>
			featuredImage && select( 'core' ).getMedia( featuredImage ),
		[ featuredImage ]
	);
	if ( ! media ) {
		return __( 'No Featured Image is set' );
	}
	const alt = media.alt_text || __( 'No alternative text set' );
	return (
		<ResponsiveWrapper
			naturalWidth={ media.media_details.width }
			naturalHeight={ media.media_details.height }
		>
			<img src={ media.source_url } alt={ alt } />
		</ResponsiveWrapper>
	);
}

export default function PostFeaturedImageEdit( props ) {
	if ( ! props.context?.postId ) {
		return __( 'Featured Image' );
	}
	return <PostFeaturedImageDisplay { ...props } />;
}
