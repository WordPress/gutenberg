/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { __ } from '@wordpress/i18n';
import { FeaturedImageEdit } from './featured-image-edit';
import { FeaturedImageView } from './featured-image-view';

const featuredImageField: Field< BasePost > = {
	id: 'featured_media',
	type: 'text',
	label: __( 'Featured Image' ),
	getValue: ( { item } ) => item.featured_media,
	Edit: FeaturedImageEdit,
	render: FeaturedImageView,
	enableSorting: false,
};

export default featuredImageField;
