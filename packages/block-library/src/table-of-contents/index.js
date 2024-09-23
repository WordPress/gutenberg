/**
 * WordPress dependencies
 */
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
		attributes: {
			headings: [
				{
					content: 'Heading',
					level: 2,
				},
				{
					content: 'Subheading',
					level: 3,
				},
				{
					content: 'Heading',
					level: 2,
				},
				{
					content: 'Subheading',
					level: 3,
				},
			],
		},
	},
};

export const init = () => initBlock( { name, metadata, settings } );
