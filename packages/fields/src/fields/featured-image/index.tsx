import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import FeaturedImageEdit from './edit';
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';
import { FeaturedImageView } from './featured-image-view';

const featuredImageField: Field< BasePostWithEmbeddedFeaturedMedia > = {
	id: 'featured_media',
	type: 'media',
	label: __( 'Featured Image' ),
	placeholder: __( 'Set featured image' ),
	Edit: FeaturedImageEdit,
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
