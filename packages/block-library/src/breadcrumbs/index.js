/**
 * WordPress dependencies
 */
import { breadcrumbs } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: breadcrumbs,
	example: {},
	edit,
	deprecated: [
		{
			attributes: {
				prefersTaxonomy: {
					type: 'boolean',
					default: false,
				},
				separator: {
					type: 'string',
					default: '/',
				},
				showHomeItem: {
					type: 'boolean',
					default: true,
				},
				showCurrentItem: {
					type: 'boolean',
					default: true,
				},
				showOnHomePage: {
					type: 'boolean',
					default: false,
				},
			},
			supports: metadata.supports,
			save() {
				return null;
			},
			migrate( attributes ) {
				// prefersTaxonomy is no longer needed - 'default' style already
				// uses taxonomy for non-hierarchical post types.
				// Just remove the old attribute.
				const { prefersTaxonomy, ...rest } = attributes;
				return {
					...rest,
					breadcrumbStyle: 'default',
				};
			},
		},
		{
			attributes: {
				breadcrumbStyle: {
					type: 'string',
					default: 'default',
					enum: [ 'default', 'taxonomy', 'date' ],
				},
				separator: {
					type: 'string',
					default: '/',
				},
				showHomeItem: {
					type: 'boolean',
					default: true,
				},
				showCurrentItem: {
					type: 'boolean',
					default: true,
				},
				showOnHomePage: {
					type: 'boolean',
					default: false,
				},
			},
			supports: metadata.supports,
			save() {
				return null;
			},
			migrate( attributes ) {
				// Migration from 'taxonomy' style to 'default'
				// since 'default' now handles taxonomy automatically for non-hierarchical posts.
				const { breadcrumbStyle, ...rest } = attributes;
				return {
					...rest,
					breadcrumbStyle:
						breadcrumbStyle === 'taxonomy'
							? 'default'
							: breadcrumbStyle,
				};
			},
		},
	],
};

export const init = () => initBlock( { name, metadata, settings } );
