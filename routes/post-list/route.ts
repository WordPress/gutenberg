/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
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

function getFirstPostId( postIds?: string[] | string ) {
	if ( Array.isArray( postIds ) ) {
		return postIds[ 0 ];
	}

	return postIds;
}

type PostTypeObject = {
	has_archive?: boolean;
};

type TemplateSlotKind = 'archive' | 'single';

type TemplateSlot = {
	kind: TemplateSlotKind;
	slug: string;
};

type TemplateRecord = {
	id: string | number;
	slug?: string;
	post_types?: string[];
	postTypes?: string[];
	site_editor_template_context?: {
		post_type?: string;
		slot?: TemplateSlotKind | null;
		canonical_slug?: string | null;
		is_active_slot?: boolean;
	} | null;
};

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

function isPageTemplate( record: TemplateRecord ) {
	return (
		record.post_types?.includes( 'page' ) ||
		record.postTypes?.includes( 'page' ) ||
		record.slug === 'page' ||
		!! record.slug?.startsWith( 'page-' )
	);
}

function getTemplateCanvas( templateId: string | number, editLink?: string ) {
	const postId = String( templateId );
	return {
		postType: 'wp_template',
		postId,
		isPreview: true,
		editLink:
			editLink ??
			`/types/wp_template/edit/${ encodeURIComponent( postId ) }`,
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

				return getTemplateCanvas( templateId );
			}

			const templates = ( await resolveSelect(
				coreStore
			).getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
				post_type: params.type,
			} ) ) as TemplateRecord[] | undefined;

			if ( params.type === 'page' ) {
				const pageTemplate = templates?.find( isPageTemplate );
				if ( pageTemplate ) {
					return getTemplateCanvas( pageTemplate.id );
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
				return getTemplateCanvas( slotTemplate.id );
			}

			const fallbackTemplateId = await resolveSelect(
				coreStore
			).getDefaultTemplateId( { slug: preferredSlot.slug } );
			if ( fallbackTemplateId ) {
				return getTemplateCanvas( fallbackTemplateId );
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
				return {
					postType: 'wp_template',
					postId: templateId,
					isPreview: true,
					editLink: `/types/wp_template/edit/${ encodeURIComponent(
						templateId
					) }`,
				};
			}

			const post = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				params.type,
				postId
			);

			return {
				postType: params.type,
				postId,
				isPreview: true,
				editLink: `/types/${ params.type }/edit/${ postId }?skipStartPageOptions=true`,
				previewUrl: ( post as any )?.link,
			};
		}

		if ( params.type === 'page' ) {
			const siteSettings = ( await resolveSelect(
				coreStore
			).getEntityRecord( 'root', 'site' ) ) as
				| {
						show_on_front?: string;
						page_on_front?: number;
				  }
				| undefined;
			if ( siteSettings?.show_on_front === 'posts' ) {
				const templateId = await resolveSelect(
					coreStore
				).getDefaultTemplateId( { slug: 'front-page' } );

				if ( templateId ) {
					return {
						postType: 'wp_template',
						postId: templateId,
						isPreview: true,
						editLink: `/types/wp_template/edit/${ encodeURIComponent(
							templateId
						) }`,
					};
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
					};
				}
			}
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
			const postId = ( posts[ 0 ] as any ).id.toString();
			return {
				postType: params.type,
				postId,
				isPreview: true,
				editLink: `/types/${ params.type }/edit/${ postId }?skipStartPageOptions=true`,
				previewUrl: ( posts[ 0 ] as any ).link,
			};
		}

		// No posts to display
		return undefined;
	},
};
