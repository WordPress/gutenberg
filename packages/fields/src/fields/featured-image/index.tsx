import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import MediaEdit from '../../components/media-edit';
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';
import { FeaturedImageView } from './featured-image-view';

const featuredImageField: Field< BasePostWithEmbeddedFeaturedMedia > = {
	id: 'featured_media',
	type: 'media',
	label: __( 'Featured Image' ),
	placeholder: __( 'Set featured image' ),
	Edit: ( props ) => (
		<MediaEdit
			{ ...props }
			isExpanded
			// Opens the featured-image media frame, as the classic panel
			// does; plugins extending `editor.MediaUpload` recognize the
			// featured image by it.
			mediaUploadProps={ { unstableFeaturedImageFlow: true } }
		/>
	),
	render: FeaturedImageView,
	setValue: ( { value } ) => ( {
		featured_media: value ?? 0,
	} ),
	enableSorting: false,
	filterBy: false,
};

/**
 * Featured Image field for BasePostWithEmbeddedFeaturedMedia.
 */
export default featuredImageField;
