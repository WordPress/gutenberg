/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { redirect } from '@wordpress/route';

/**
 * Route configuration for creating a new post.
 */
export const route = {
	beforeLoad: ( { params }: { params: { type: string } } ) => {
		if ( params.type === 'page' ) {
			throw redirect( {
				throw: true,
				to: '/types/page/list/all',
			} );
		}
	},
	title: async ( { params }: { params: { type: string } } ) => {
		const postType = await resolveSelect( coreStore ).getPostType(
			params.type
		);
		return postType?.labels?.add_new_item || postType?.labels?.add_new;
	},
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
