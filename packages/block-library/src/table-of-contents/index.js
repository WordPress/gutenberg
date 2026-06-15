/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { tableOfContents as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
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
