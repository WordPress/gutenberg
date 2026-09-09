import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { ensureView, viewToQuery } from './view-utils';

/**
 * Route configuration for template list.
 */
export const route = {
	async beforeLoad() {
		// Block themes and classic themes shipping a `theme.json` file opt in
		// automatically, other classic themes have to call
		// `add_theme_support( 'block-templates' )`.
		const theme = await resolveSelect( coreStore ).getCurrentTheme();
		if ( ! theme?.theme_supports?.[ 'block-templates' ] ) {
			throw notFound();
		}
	},
	title: () => __( 'Templates' ),
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
			};
		}

		// No templates to display
		return undefined;
	},
};
