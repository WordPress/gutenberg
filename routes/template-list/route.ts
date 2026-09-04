import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { ensureView, getFirstTemplateInView } from './view-utils';
import type { Template } from './types';

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

		// Otherwise, preview the template the stage selects by default. The
		// templates endpoint ignores search, ordering and pagination, so
		// fetch every template (the same query the stage uses, so the
		// records are shared) and apply the view client-side.
		const templates = ( await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			'wp_template',
			{ per_page: -1 }
		) ) as Template[] | null;
		const template = getFirstTemplateInView( templates ?? [], view );

		if ( template ) {
			return {
				postType: 'wp_template',
				postId: template.id.toString(),
				isPreview: true,
			};
		}

		// No templates to display
		return undefined;
	},
};
