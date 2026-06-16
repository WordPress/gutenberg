/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ensureView, viewToQuery } from './view-utils';

type TemplateRecord = {
	id: string | number;
	title?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
};

function getTemplateTitle( template: TemplateRecord | undefined ) {
	const title =
		typeof template?.title === 'string'
			? template.title
			: template?.title?.rendered || template?.title?.raw;

	return title ? decodeEntities( title ) : __( 'Template' );
}

function getTemplateCanvas( templateId: string, template?: TemplateRecord ) {
	return {
		postType: 'wp_template',
		postId: templateId,
		isPreview: true,
		editLink: `/types/wp_template/edit/${ encodeURIComponent(
			templateId
		) }`,
		previewLabel: getTemplateTitle( template ),
		previewIcon: layout,
		previewStatusLabel: __( 'Template preview' ),
		previewEditLabel: __( 'Edit template' ),
		previewTone: 'global' as const,
	};
}

/**
 * Route configuration for template list.
 */
export const route = {
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
			const template = ( await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				'wp_template',
				postId
			) ) as TemplateRecord | undefined;
			return getTemplateCanvas( postId, template );
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
			return getTemplateCanvas( postId, posts[ 0 ] as TemplateRecord );
		}

		// No templates to display
		return undefined;
	},
};
