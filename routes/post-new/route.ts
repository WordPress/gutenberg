/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Route configuration for creating a new post.
 */
export const route = {
	async canvas( context: {
		params: {
			type: string;
		};
	} ) {
		const { params } = context;

		const newPost = await dispatch( coreStore ).saveEntityRecord(
			'postType',
			params.type,
			{
				title: 'Auto Draft',
				content: '',
				status: 'auto-draft',
			}
		);

		return {
			postType: params.type,
			postId: String( newPost.id ),
		};
	},
};
