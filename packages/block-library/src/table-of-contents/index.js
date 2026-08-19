import { __ } from '@wordpress/i18n';
import { tableOfContents as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	deprecated,
	edit,
	example: {
		innerBlocks: [
			{
				name: 'core/heading',
				attributes: {
					level: 2,
					content: __( 'Heading' ),
				},
			},
			{
				name: 'core/heading',
				attributes: {
					level: 3,
					content: __( 'Subheading' ),
				},
			},
			{
				name: 'core/heading',
				attributes: {
					level: 2,
					content: __( 'Heading' ),
				},
			},
			{
				name: 'core/heading',
				attributes: {
					level: 3,
					content: __( 'Subheading' ),
				},
			},
		],
		attributes: {
			headings: [
				{
					content: __( 'Heading' ),
					level: 2,
				},
				{
					content: __( 'Subheading' ),
					level: 3,
				},
				{
					content: __( 'Heading' ),
					level: 2,
				},
				{
					content: __( 'Subheading' ),
					level: 3,
				},
			],
		},
	},
};

export const init = () => initBlock( { name, metadata, settings } );
