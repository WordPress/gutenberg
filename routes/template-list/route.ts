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
	status?: string;
	slug?: string;
	theme?: string;
	plugin?: string;
	description?: string;
	date?: string;
	author_text?: string;
	is_custom?: boolean;
	meta?: {
		is_wp_suggestion?: boolean;
	};
	title?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
};

function isTemplateActivationEnabled() {
	return Boolean(
		( globalThis as { window?: any } ).window
			?.__experimentalTemplateActivate
	);
}

function getTemplateTitle( template: TemplateRecord | undefined ) {
	const title =
		typeof template?.title === 'string'
			? template.title
			: template?.title?.rendered || template?.title?.raw;

	return title ? decodeEntities( title ) : __( 'Template' );
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

async function canEditTemplate( templateId: string ) {
	return !! ( await resolveSelect( coreStore ).canUser( 'update', {
		kind: 'postType',
		name: 'wp_template',
		id: templateId,
	} ) );
}

async function getTemplateCanvas(
	templateId: string,
	template?: TemplateRecord
) {
	const canvasTemplateId = getCanvasTemplateId( templateId, template );
	const previewStatus = template?.status || 'publish';

	return {
		postType: 'wp_template',
		postId: canvasTemplateId,
		isPreview: true,
		editLink: `/types/wp_template/edit/${ encodeURIComponent(
			canvasTemplateId
		) }`,
		previewLabel: getTemplateTitle( template ),
		previewIcon: layout,
		previewStatus,
		previewStatusLabel: getPreviewStatusLabel( previewStatus ),
		previewEditLabel: __( 'Edit template' ),
		previewCanEdit: await canEditTemplate( canvasTemplateId ),
		previewTone: 'global' as const,
	};
}

function getCanvasTemplateId( templateId: string, template?: TemplateRecord ) {
	if (
		! isTemplateActivationEnabled() ||
		! template?.plugin ||
		! template.slug ||
		! template.theme
	) {
		return templateId;
	}

	return `${ template.theme }//${ template.slug }`;
}

function isCustomTemplate(
	template: TemplateRecord,
	defaultTemplateTypes: Array< { slug: string } > = []
) {
	return (
		template.is_custom ??
		( ! template.meta?.is_wp_suggestion &&
			! defaultTemplateTypes.some(
				( type ) => type.slug === template.slug
			) )
	);
}

function getSortValue( template: TemplateRecord, field?: string ) {
	if ( field === 'title' ) {
		return getTemplateTitle( template );
	}

	return ( template as any )[ field || 'title' ] ?? '';
}

function filterSortAndPaginateTemplates(
	templates: TemplateRecord[],
	view: Awaited< ReturnType< typeof ensureView > >
) {
	let records = templates;

	if ( view.search ) {
		const search = view.search.toLowerCase();
		records = records.filter( ( template ) =>
			[
				getTemplateTitle( template ),
				template.description,
				template.slug,
				template.author_text,
			]
				.filter( Boolean )
				.some( ( value ) =>
					value?.toString().toLowerCase().includes( search )
				)
		);
	}

	if ( view.sort?.field ) {
		const direction = view.sort.direction === 'desc' ? -1 : 1;
		records = [ ...records ].sort( ( a, b ) => {
			const aValue = getSortValue( a, view.sort?.field );
			const bValue = getSortValue( b, view.sort?.field );

			return (
				aValue.toString().localeCompare( bValue.toString(), undefined, {
					numeric: true,
					sensitivity: 'base',
				} ) * direction
			);
		} );
	}

	if ( view.perPage && view.perPage > 0 ) {
		const page = view.page ?? 1;
		const start = ( page - 1 ) * view.perPage;
		records = records.slice( start, start + view.perPage );
	}

	return records;
}

async function getActivationTemplates( activeView: string | undefined ) {
	const [
		site,
		activeTheme,
		staticRecords,
		userRecords,
	] = await Promise.all( [
		resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
		resolveSelect( coreStore ).getCurrentTheme(),
		resolveSelect( coreStore ).getEntityRecords(
			'root',
			'registeredTemplate',
			{ per_page: -1 }
		),
		resolveSelect( coreStore ).getEntityRecords(
			'postType',
			'wp_template',
			{
				per_page: -1,
				combinedTemplates: false,
			}
		),
	] );

	const defaultTemplateTypes =
		activeTheme?.default_template_types ?? [];
	const activeTemplates = [ ...( staticRecords ?? [] ) ] as TemplateRecord[];
	const activeTemplatesOption = site?.active_templates;

	if ( activeTemplatesOption ) {
		for ( const activeSlug in activeTemplatesOption ) {
			const activeId = activeTemplatesOption[ activeSlug ];
			const template = ( userRecords as TemplateRecord[] | undefined )
				?.find(
					( userRecord ) =>
						userRecord.id === activeId &&
						userRecord.theme === activeTheme?.stylesheet
				);

			if ( ! template ) {
				continue;
			}

			const index = activeTemplates.findIndex(
				( { slug } ) => slug === template.slug
			);

			if ( index !== -1 ) {
				activeTemplates[ index ] = template;
			} else {
				activeTemplates.push( template );
			}
		}
	}

	if ( activeView === 'user' ) {
		return ( userRecords ?? [] ) as TemplateRecord[];
	}

	if ( activeView && activeView !== 'active' ) {
		return ( staticRecords ?? [] ).filter(
			( record: TemplateRecord ) => record.author_text === activeView
		) as TemplateRecord[];
	}

	return activeTemplates.filter(
		( template ) =>
			! isCustomTemplate( template, defaultTemplateTypes )
	);
}

async function getTemplateRecord(
	templateId: string,
	activeView: string | undefined
) {
	if ( isTemplateActivationEnabled() ) {
		const templates = await getActivationTemplates( activeView );
		const template = templates.find(
			( record ) => record.id.toString() === templateId
		);

		if ( template ) {
			return template;
		}
	}

	return ( await resolveSelect( coreStore ).getEntityRecord(
		'postType',
		'wp_template',
		templateId
	) ) as TemplateRecord | undefined;
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
			const template = await getTemplateRecord(
				postId,
				params.activeView
			);
			return getTemplateCanvas( postId, template );
		}

		if ( isTemplateActivationEnabled() ) {
			const posts = filterSortAndPaginateTemplates(
				await getActivationTemplates( params.activeView ),
				view
			);

			if ( posts.length > 0 ) {
				const postId = posts[ 0 ].id.toString();
				return getTemplateCanvas( postId, posts[ 0 ] );
			}

			return undefined;
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
