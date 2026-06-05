/**
 * WordPress dependencies
 */
import type { Field, Form } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { PostTypeFormData } from '../types';

export const rewriteSlugField: Field< PostTypeFormData > = {
	id: 'rewrite_slug',
	label: __( 'Slug' ),
	type: 'text',
	description: __(
		'Custom permalink slug for this post type. Defaults to the post type key.'
	),
	getValue: ( { item } ) => item.config.rewrite.slug,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			rewrite: {
				...item.config.rewrite,
				slug: String( value ?? '' ),
			},
		},
	} ),
	isValid: { maxLength: 200 },
	enableSorting: false,
	filterBy: false,
};

export const rewriteWithFrontField: Field< PostTypeFormData > = {
	id: 'rewrite_with_front',
	label: __( 'With front' ),
	type: 'boolean',
	Edit: 'toggle',
	description: __(
		'Whether the permalink should be prepended with the WP_Rewrite front base (e.g. /blog/ in /blog/my-post-type/).'
	),
	getValue: ( { item } ) => item.config.rewrite.with_front,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			rewrite: { ...item.config.rewrite, with_front: !! value },
		},
	} ),
	enableSorting: false,
	filterBy: false,
};

export const rewriteFeedsField: Field< PostTypeFormData > = {
	id: 'rewrite_feeds',
	label: __( 'Feeds' ),
	type: 'boolean',
	Edit: 'toggle',
	description: __(
		'Whether a feed permalink structure should be built for this post type.'
	),
	getValue: ( { item } ) => item.config.rewrite.feeds,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			rewrite: { ...item.config.rewrite, feeds: !! value },
		},
	} ),
	enableSorting: false,
	filterBy: false,
};

export const rewritePagesField: Field< PostTypeFormData > = {
	id: 'rewrite_pages',
	label: __( 'Pages' ),
	type: 'boolean',
	Edit: 'toggle',
	description: __(
		'Whether the permalink structure should provide for pagination (e.g. /my-post-type/page/2/).'
	),
	getValue: ( { item } ) => item.config.rewrite.pages,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			rewrite: { ...item.config.rewrite, pages: !! value },
		},
	} ),
	enableSorting: false,
	filterBy: false,
};

export const rewriteEpMaskField: Field< PostTypeFormData > = {
	id: 'rewrite_ep_mask',
	label: __( 'Endpoint mask' ),
	type: 'integer',
	description: __(
		'Endpoint mask to assign to this post type. Accepts EP_* constants. Defaults to EP_PERMALINK.'
	),
	getValue: ( { item } ) => item.config.rewrite.ep_mask,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			rewrite: {
				...item.config.rewrite,
				ep_mask:
					value !== undefined && value !== ''
						? Number( value )
						: undefined,
			},
		},
	} ),
	enableSorting: false,
	filterBy: false,
};

export const rewriteFormFields: Form[ 'fields' ] = [
	'rewrite_slug',
	'rewrite_with_front',
	'rewrite_feeds',
	'rewrite_pages',
	'rewrite_ep_mask',
];
