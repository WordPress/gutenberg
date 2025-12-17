/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { MediaEdit } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';
import { FeaturedImageView } from './featured-image-view';

const featuredImageField: Field< BasePostWithEmbeddedFeaturedMedia > = {
	id: 'featured_media',
	type: 'media',
	label: __( 'Featured Image' ),
	Edit: ( props ) => <MediaEdit { ...props } />,
	render: FeaturedImageView,
	enableSorting: false,
	filterBy: false,
};

/**
 * Featured Image field for BasePostWithEmbeddedFeaturedMedia.
 */
export default featuredImageField;
