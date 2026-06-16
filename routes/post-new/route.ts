/**
 * WordPress dependencies
 */
import { dispatch, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { notFound, redirect } from '@wordpress/route';

const NATIVE_CREATION_POST_TYPES = [ 'post', 'page' ];

/**
 * Route configuration for creating a new post.
 */
export const route = {
	beforeLoad: async ( { params }: { params: { type: string } } ) => {
		if ( params.type === 'page' ) {
			throw redirect( {
				throw: true,
				to: '/types/page/list/all',
			} );
		}

		if ( params.type === 'attachment' ) {
			throw notFound();
		}

		const postType = await resolveSelect( coreStore ).getPostType(
			params.type
		);
		if ( ! postType ) {
			throw notFound();
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

		if ( ! NATIVE_CREATION_POST_TYPES.includes( params.type ) ) {
			return {
				customCanvas: true,
				postType: params.type,
				postId: 'new',
			};
		}

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
