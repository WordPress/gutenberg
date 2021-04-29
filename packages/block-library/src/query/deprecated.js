/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	// Version with NO wrapper `div` element.
	{
		attributes: {
			queryId: {
				type: 'number',
			},
			query: {
				type: 'object',
				default: {
					perPage: null,
					pages: 0,
					offset: 0,
					postType: 'post',
					categoryIds: [],
					tagIds: [],
					order: 'desc',
					orderBy: 'date',
					author: '',
					search: '',
					exclude: [],
					sticky: '',
					inherit: true,
				},
			},
			layout: {
				type: 'object',
				default: {
					type: 'list',
				},
			},
		},
		supports: {
			html: false,
		},
		save() {
			return <InnerBlocks.Content />;
		},
	},
];

export default deprecated;
