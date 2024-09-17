/**
 * WordPress dependencies
 */
import { loop as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	example: {
		viewportWidth: 650,
		attributes: {
			namespace: 'core/posts-list',
			query: {
				perPage: 4,
				pages: 1,
				offset: 0,
				postType: 'post',
				order: 'desc',
				orderBy: 'date',
				author: '',
				search: '',
				sticky: 'exclude',
				inherit: false,
			},
		},
		innerBlocks: [
			{
				name: 'core/post-template',
				attributes: {
					layout: {
						type: 'grid',
						columnCount: 2,
					},
				},
				innerBlocks: [
					{
						name: 'core/post-title',
					},
					{
						name: 'core/post-date',
					},
					{
						name: 'core/post-excerpt',
					},
				],
			},
		],
	},
	save,
	variations,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
