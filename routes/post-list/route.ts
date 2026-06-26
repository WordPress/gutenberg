/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { home, layout, page, postList } from '@wordpress/icons';
import { notFound } from '@wordpress/route';

/**
 * Internal dependencies
 */
import {
	ensureView,
	getTemplateIdFromPageItemId,
	getTemplateSlugFromPlaceholderItemId,
	viewToQuery,
} from './view-utils';
import { isPageApplicableTemplate } from './template-utils';

function getFirstPostId( postIds?: string[] | string ) {
	if ( Array.isArray( postIds ) ) {
		return postIds[ 0 ];
	}

	return postIds;
}

type PostTypeObject = {
	has_archive?: boolean;
};

type SiteSettings = {
	show_on_front?: string;
	page_on_front?: number;
};

type TemplateSlotKind = 'archive' | 'single';

type TemplateSlot = {
	kind: TemplateSlotKind;
	slug: string;
};

type TemplateRecord = {
	id: string | number;
	slug?: string;
	status?: string;
	title?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
	post_types?: string[];
	postTypes?: string[];
	site_editor_template_context?: {
		post_type?: string;
		slot?: TemplateSlotKind | null;
		canonical_slug?: string | null;
		is_active_slot?: boolean;
	} | null;
};

type PreviewableRecord = {
	id?: number | string;
	link?: string;
	status?: string;
	title?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
};

function getPlainTextTitle( title?: string ) {
	if ( ! title ) {
		return '';
	}

	return decodeEntities( title.replace( /<[^>]+>/g, '' ) ).trim();
}

function getRecordTitle(
	record: PreviewableRecord | undefined,
	fallback: string
) {
	const title =
		typeof record?.title === 'string'
			? record.title
			: record?.title?.rendered || record?.title?.raw;

	return getPlainTextTitle( title ) || fallback;
}

function isHomeEquivalentTitle( title: string ) {
	const normalizedTitle = title
		.toLocaleLowerCase()
		.replace( /[^a-z0-9]+/g, '' );

	return [ 'home', 'homepage', 'frontpage' ].includes( normalizedTitle );
}

function getStaticHomepageLabel( record: PreviewableRecord | undefined ) {
	const title = getRecordTitle( record, __( 'Home' ) );
	if ( isHomeEquivalentTitle( title ) ) {
		return __( 'Home' );
	}

	return sprintf(
		/* translators: %s: The title of the static page used as the homepage. */
		__( 'Home (%s)' ),
		title
	);
}

function getPreviewStatusLabel(
	recordOrStatus?: PreviewableRecord | TemplateRecord | string
) {
	const status =
		typeof recordOrStatus === 'string'
			? recordOrStatus
			: recordOrStatus?.status;

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

function getPostTypePreviewIcon( postType: string ) {
	if ( postType === 'page' ) {
		return page;
	}

	if ( postType === 'post' ) {
		return postList;
	}

	return page;
}

function getPostTypePreviewEditLabel( postType: string ) {
	return postType === 'page' ? __( 'Edit page' ) : __( 'Edit' );
}

async function canEditPostTypeRecord(
	postType: string,
	postId: string | number
) {
	return !! ( await resolveSelect( coreStore ).canUser( 'update', {
		kind: 'postType',
		name: postType,
		id: postId,
	} ) );
}

function getPreferredTemplateSlot(
	postType: string,
	postTypeObject?: PostTypeObject
): TemplateSlot | undefined {
	if ( postType === 'page' ) {
		return undefined;
	}

	if ( postType === 'post' ) {
		return {
			kind: 'archive',
			slug: 'home',
		};
	}

	if ( postTypeObject?.has_archive ) {
		return {
			kind: 'archive',
			slug: `archive-${ postType }`,
		};
	}

	return {
		kind: 'single',
		slug: `single-${ postType }`,
	};
}

function isTemplateForSlot(
	record: TemplateRecord,
	postType: string,
	slot: TemplateSlot
) {
	const context = record.site_editor_template_context;
	return (
		context?.post_type === postType &&
		context?.is_active_slot &&
		context?.slot === slot.kind &&
		context?.canonical_slug === slot.slug
	);
}

function getTemplateCanvas(
	templateId: string | number,
	editLink?: string,
	template?: TemplateRecord,
	previewCanEdit?: boolean
) {
	const postId = String( templateId );
	return {
		postType: 'wp_template',
		postId,
		isPreview: true,
		editLink:
			editLink ??
			`/types/wp_template/edit/${ encodeURIComponent( postId ) }`,
		previewLabel: getRecordTitle( template, __( 'Template' ) ),
		previewIcon: layout,
		previewStatus: template?.status || 'publish',
		previewStatusLabel: getPreviewStatusLabel(
			template?.status || 'publish'
		),
		previewEditLabel: __( 'Edit template' ),
		previewCanEdit,
		previewTone: 'global' as const,
	};
}

/**
 * Route configuration for post list.
 */
export const route = {
	beforeLoad: async ( { params }: { params: { type: string } } ) => {
		try {
			const postType = await resolveSelect( coreStore ).getPostType(
				params.type
			);

			if ( ! postType ) {
				throw notFound();
			}
		} catch {
			throw notFound();
		}
	},
	title: async ( { params }: { params: { type: string } } ) => {
		const postType = await resolveSelect( coreStore ).getPostType(
			params.type
		);
		return postType?.labels?.name || params.type;
	},
	async canvas( context: {
		params: {
			type: string;
			slug: string;
		};
		search: {
			page?: number;
			search?: string;
			postIds?: string[] | string;
			content?: string;
		};
	} ) {
		const { params, search } = context;

		if ( search.content === 'templates' ) {
			const selectedTemplateId = getFirstPostId( search.postIds );
			if ( selectedTemplateId ) {
				const templateId = selectedTemplateId.toString();
				const placeholderTemplateSlug =
					getTemplateSlugFromPlaceholderItemId( templateId );

				if ( placeholderTemplateSlug ) {
					const fallbackTemplateId = await resolveSelect(
						coreStore
					).getDefaultTemplateId( {
						slug: placeholderTemplateSlug,
					} );

					if ( ! fallbackTemplateId ) {
						return undefined;
					}

					return getTemplateCanvas(
						fallbackTemplateId,
						`/types/${ encodeURIComponent(
							params.type
						) }/list/${ encodeURIComponent(
							params.slug
						) }?content=templates&postIds=${ encodeURIComponent(
							templateId
						) }&createTemplate=${ encodeURIComponent(
							placeholderTemplateSlug
						) }`
					);
				}

				const selectedTemplate = ( await resolveSelect(
					coreStore
				).getEntityRecord( 'postType', 'wp_template', templateId ) ) as
					| TemplateRecord
					| undefined;

				return getTemplateCanvas(
					templateId,
					undefined,
					selectedTemplate,
					await canEditPostTypeRecord( 'wp_template', templateId )
				);
			}

			const templates = ( await resolveSelect(
				coreStore
			).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
				...( params.type === 'page' ? {} : { post_type: params.type } ),
			} ) ) as TemplateRecord[] | undefined;

			if ( params.type === 'page' ) {
				const pageTemplate = templates?.find(
					isPageApplicableTemplate
				);
				if ( pageTemplate ) {
					return getTemplateCanvas(
						pageTemplate.id,
						undefined,
						pageTemplate,
						await canEditPostTypeRecord(
							'wp_template',
							pageTemplate.id
						)
					);
				}

				return undefined;
			}

			const postTypeObject = await resolveSelect( coreStore ).getPostType(
				params.type
			);
			const preferredSlot = getPreferredTemplateSlot(
				params.type,
				postTypeObject
			);
			if ( ! preferredSlot ) {
				return undefined;
			}

			const slotTemplate = templates?.find( ( template ) =>
				isTemplateForSlot( template, params.type, preferredSlot )
			);
			if ( slotTemplate ) {
				return getTemplateCanvas(
					slotTemplate.id,
					undefined,
					slotTemplate,
					await canEditPostTypeRecord(
						'wp_template',
						slotTemplate.id
					)
				);
			}

			const fallbackTemplateId = await resolveSelect(
				coreStore
			).getDefaultTemplateId( { slug: preferredSlot.slug } );
			if ( fallbackTemplateId ) {
				return getTemplateCanvas(
					fallbackTemplateId,
					undefined,
					undefined,
					await canEditPostTypeRecord(
						'wp_template',
						fallbackTemplateId
					)
				);
			}

			return undefined;
		}

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
		const selectedPostId = getFirstPostId( search.postIds );
		if ( selectedPostId ) {
			const postId = selectedPostId.toString();
			const templateId = getTemplateIdFromPageItemId( postId );
			if ( templateId ) {
				return getTemplateCanvas(
					templateId,
					undefined,
					undefined,
					await canEditPostTypeRecord( 'wp_template', templateId )
				);
			}

			const post = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				params.type,
				postId
			);
			const previewRecord = post as PreviewableRecord | undefined;

			if ( params.type === 'page' ) {
				const siteSettings = ( await resolveSelect(
					coreStore
				).getEntityRecord( 'root', 'site' ) ) as
					| SiteSettings
					| undefined;

				if (
					siteSettings?.show_on_front === 'page' &&
					siteSettings.page_on_front &&
					Number( postId ) === Number( siteSettings.page_on_front )
				) {
					return {
						postType: params.type,
						postId,
						isPreview: true,
						editLink: `/types/${ params.type }/edit/${ postId }?skipStartPageOptions=true`,
						previewUrl: previewRecord?.link,
						previewLabel: getStaticHomepageLabel( previewRecord ),
						previewIcon: home,
						previewStatus: 'homepage',
						previewStatusLabel: getPreviewStatusLabel( 'publish' ),
						previewEditLabel: __( 'Edit page' ),
						previewCanEdit: await canEditPostTypeRecord(
							params.type,
							postId
						),
					};
				}
			}

			return {
				postType: params.type,
				postId,
				isPreview: true,
				editLink: `/types/${ params.type }/edit/${ postId }?skipStartPageOptions=true`,
				previewUrl: previewRecord?.link,
				previewLabel: getRecordTitle( previewRecord, params.type ),
				previewIcon: getPostTypePreviewIcon( params.type ),
				previewStatus: previewRecord?.status,
				previewStatusLabel: getPreviewStatusLabel( previewRecord ),
				previewEditLabel: getPostTypePreviewEditLabel( params.type ),
				previewCanEdit: await canEditPostTypeRecord(
					params.type,
					postId
				),
			};
		}

		if ( params.type === 'page' ) {
			const siteSettings = ( await resolveSelect(
				coreStore
			).getEntityRecord( 'root', 'site' ) ) as SiteSettings | undefined;
			if ( siteSettings?.show_on_front === 'posts' ) {
				const templateId = await resolveSelect(
					coreStore
				).getDefaultTemplateId( { slug: 'front-page' } );

				if ( templateId ) {
					return getTemplateCanvas(
						templateId,
						undefined,
						{
							id: templateId,
							title: __( 'Home' ),
						},
						await canEditPostTypeRecord( 'wp_template', templateId )
					);
				}
			}

			const frontPageId =
				siteSettings?.show_on_front === 'page'
					? siteSettings.page_on_front
					: undefined;

			if ( frontPageId ) {
				const frontPage = ( await resolveSelect(
					coreStore
				).getEntityRecord( 'postType', 'page', frontPageId ) ) as any;

				if ( frontPage ) {
					const postId = frontPage.id.toString();
					return {
						postType: params.type,
						postId,
						isPreview: true,
						editLink: `/types/${ params.type }/edit/${ postId }?skipStartPageOptions=true`,
						previewUrl: frontPage.link,
						previewLabel: getStaticHomepageLabel( frontPage ),
						previewIcon: home,
						previewStatus: 'homepage',
						previewStatusLabel: getPreviewStatusLabel( 'publish' ),
						previewEditLabel: __( 'Edit page' ),
						previewCanEdit: await canEditPostTypeRecord(
							params.type,
							postId
						),
					};
				}
			}
		}

		// Otherwise, fetch the first post from the filtered query
		const query = viewToQuery( view, params.type );
		const posts = await resolveSelect( coreStore ).getEntityRecords(
			'postType',
			params.type,
			{ ...query, per_page: 1, _fields: 'id' }
		);

		// Return first post if available
		if ( posts && posts.length > 0 ) {
			const postId = ( posts[ 0 ] as any ).id.toString();
			return {
				postType: params.type,
				postId,
				isPreview: true,
				editLink: `/types/${ params.type }/edit/${ postId }?skipStartPageOptions=true`,
				previewUrl: ( posts[ 0 ] as any ).link,
				previewLabel: getRecordTitle( posts[ 0 ] as any, params.type ),
				previewIcon: getPostTypePreviewIcon( params.type ),
				previewStatus: ( posts[ 0 ] as any ).status,
				previewStatusLabel: getPreviewStatusLabel( posts[ 0 ] as any ),
				previewEditLabel: getPostTypePreviewEditLabel( params.type ),
				previewCanEdit: await canEditPostTypeRecord(
					params.type,
					postId
				),
			};
		}

		// No posts to display
		return undefined;
	},
};
