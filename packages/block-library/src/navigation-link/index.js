/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker as icon } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Link' ),

	icon,

	description: __( 'Add a page, link, or another item to your navigation.' ),

	variations: [
		{
			name: 'link',
			isDefault: true,
			title: __( 'Link' ),
			description: __( 'A link to a URL.' ),
			attributes: {},
		},
		{
			name: 'post',
			title: __( 'Post' ),
			description: __( 'A link to a post.' ),
			attributes: { type: 'post' },
		},
		{
			name: 'page',
			title: __( 'Page' ),
			description: __( 'A link to a page.' ),
			attributes: { type: 'page' },
		},
		{
			name: 'category',
			title: __( 'Category' ),
			description: __( 'A link to a category.' ),
			attributes: { type: 'category' },
		},
		{
			name: 'tag',
			title: __( 'Tag' ),
			description: __( 'A link to a tag.' ),
			attributes: { type: 'tag' },
		},
	],

	__experimentalLabel: ( { label } ) => label,

	merge( leftAttributes, { label: rightLabel = '' } ) {
		return {
			...leftAttributes,
			label: leftAttributes.label + rightLabel,
		};
	},

	edit,

	save,

	deprecated: [
		{
			isEligible( attributes ) {
				return attributes.nofollow;
			},

			attributes: {
				label: {
					type: 'string',
				},
				type: {
					type: 'string',
				},
				nofollow: {
					type: 'boolean',
				},
				description: {
					type: 'string',
				},
				id: {
					type: 'number',
				},
				opensInNewTab: {
					type: 'boolean',
					default: false,
				},
				url: {
					type: 'string',
				},
			},

			migrate( { nofollow, ...rest } ) {
				return {
					rel: nofollow ? 'nofollow' : '',
					...rest,
				};
			},

			save() {
				return <InnerBlocks.Content />;
			},
		},
	],
};
