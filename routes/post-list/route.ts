/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { ensureView, viewToQuery } from './view-utils';

/**
 * Route configuration for post list.
 */
export const route = {
	async canvas( context: {
		params: {
			type: string;
			slug: string;
		};
		search: {
			page?: number;
			search?: string;
			postId?: string;
		};
	} ) {
		const { params, search } = context;

		// Load the view configuration
		const view = await ensureView( params.type, params.slug, {
			page: search.page,
			search: search.search,
		} );

		// Only show canvas for list-type views
		if ( view.type !== 'list' ) {
			return undefined;
		}

		// Check if postId is provided in query params
		if ( search.postId ) {
			return {
				postType: params.type,
				postId: search.postId.toString(),
			};
		}

		// Otherwise, fetch the first post from the filtered query
		const query = viewToQuery( view, params.type );
		const posts = await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			params.type,
			{ ...query, per_page: 1 }
		);

		// Return first post if available
		if ( posts && posts.length > 0 ) {
			return {
				postType: params.type,
				postId: ( posts[ 0 ] as any ).id.toString(),
			};
		}

		// No posts to display
		return undefined;
	},
};
