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
 * Route configuration for template list.
 */
export const route = {
	async canvas( context: {
		params: {
			activeView: string;
		};
		search: {
			page?: number;
			search?: string;
			postIds?: string[];
		};
	} ) {
		const { params, search } = context;

		// Load the view configuration
		const view = await ensureView( params.activeView, {
			page: search.page,
			search: search.search,
		} );

		// Only show canvas for list-type views
		if ( view.type !== 'list' ) {
			return undefined;
		}

		// Check if postId is provided in query params
		if ( search.postIds && search.postIds.length > 0 ) {
			const postId = search.postIds[ 0 ].toString();
			return {
				postType: 'wp_template',
				postId,
				isPreview: true,
				editLink: `/types/wp_template/edit/${ encodeURIComponent(
					postId
				) }`,
			};
		}

		// Otherwise, fetch the first template from the filtered query
		const query = viewToQuery( view );
		const posts = await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			'wp_template',
			{ ...query, per_page: 1 }
		);

		// Return first template if available
		if ( posts && posts.length > 0 ) {
			const postId = ( posts[ 0 ] as any ).id.toString();
			return {
				postType: 'wp_template',
				postId,
				isPreview: true,
				editLink: `/types/wp_template/edit/${ encodeURIComponent(
					postId
				) }`,
			};
		}

		// No templates to display
		return undefined;
	},
};
