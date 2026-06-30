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

type TemplatePartRecord = {
	id: string | number;
	status?: string;
	title?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
};

function getTemplatePartTitle( templatePart: TemplatePartRecord | undefined ) {
	const title =
		typeof templatePart?.title === 'string'
			? templatePart.title
			: templatePart?.title?.rendered || templatePart?.title?.raw;

	return title ? decodeEntities( title ) : __( 'Template part' );
}

function getPreviewStatusLabel( status?: string ) {
	switch ( status ) {
		case 'publish':
			return __( 'Published' );
		case 'future':
			return __( 'Scheduled' );
		case 'draft':
		case 'auto-draft':
			return __( 'Draft' );
		case 'pending':
			return __( 'Pending review' );
		case 'private':
			return __( 'Private' );
		case 'trash':
			return __( 'Trash' );
		default:
			return __( 'Preview' );
	}
}

async function canEditTemplatePart( templatePartId: string ) {
	return !! ( await resolveSelect( coreStore ).canUser( 'update', {
		kind: 'postType',
		name: 'wp_template_part',
		id: templatePartId,
	} ) );
}

async function getTemplatePartCanvas(
	templatePartId: string,
	templatePart?: TemplatePartRecord
) {
	const previewStatus = templatePart?.status || 'publish';

	return {
		postType: 'wp_template_part',
		postId: templatePartId,
		isPreview: true,
		editLink: `/types/wp_template_part/edit/${ encodeURIComponent(
			templatePartId
		) }`,
		previewLabel: getTemplatePartTitle( templatePart ),
		previewIcon: layout,
		previewStatus,
		previewStatusLabel: getPreviewStatusLabel( previewStatus ),
		previewEditLabel: __( 'Edit template part' ),
		previewCanEdit: await canEditTemplatePart( templatePartId ),
		previewTone: 'global' as const,
	};
}

/**
 * Route configuration for template part list.
 */
export const route = {
	title: () => __( 'Template Parts' ),
	async canvas( context: {
		params: {
			area: string;
		};
		search: {
			page?: number;
			search?: string;
			postIds?: string[];
		};
	} ) {
		const { params, search } = context;

		// Load the view configuration
		const view = await ensureView( params.area, {
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
			const templatePart = ( await resolveSelect(
				coreStore
			).getEntityRecord( 'postType', 'wp_template_part', postId ) ) as
				| TemplatePartRecord
				| undefined;
			return getTemplatePartCanvas( postId, templatePart );
		}

		// Otherwise, fetch the first template part from the filtered query
		const query = viewToQuery( view );
		const posts = await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			'wp_template_part',
			{ ...query, per_page: 1 }
		);

		// Return first template part if available
		if ( posts && posts.length > 0 ) {
			const postId = ( posts[ 0 ] as any ).id.toString();
			return getTemplatePartCanvas(
				postId,
				posts[ 0 ] as TemplatePartRecord
			);
		}

		// No template parts to display
		return undefined;
	},
};
