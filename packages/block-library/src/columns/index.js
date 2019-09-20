/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Columns' ),
	icon,
	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},
	example: {
		innerBlocks: [
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/image',
						attributes: {
							url: 'https://images.unsplash.com/photo-1549880339-d93e3072aef4',
						},
					},
				],
			},
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: __( 'WordPress is Open Source Software.' ),
						},
					},
				],
			},
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: __( 'Build' ) + '<br>' +
							__( 'Change' ) + '<br>' +
							__( 'Share' ),
						},
					},
				],
			},
		],
	},
	deprecated,
	edit,
	save,
};

