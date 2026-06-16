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
	ensureTemplateView,
	ensureView,
	getTemplateIdFromPageItemId,
	templateViewToQuery,
	viewToQuery,
} from './view-utils';

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
			postIds?: string[];
			content?: string;
		};
	} ) {
		const { params, search } = context;

		if ( search.content === 'templates' ) {
			const sharedView = await ensureView( params.type, params.slug, {
				page: search.page,
				search: search.search,
			} );
			const templateView = await ensureTemplateView( params.type, {
				page: search.page,
				search: search.search,
			} );

			if ( sharedView.type !== 'list' ) {
				return undefined;
			}

			if ( search.postIds && search.postIds.length > 0 ) {
				const templateId = search.postIds[ 0 ].toString();
				return {
					postType: 'wp_template',
					postId: templateId,
					isPreview: true,
					editLink: `/types/wp_template/edit/${ encodeURIComponent(
						templateId
					) }`,
				};
			}

			const query = templateViewToQuery( templateView, params.type );
			const templates = await resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ ...query, per_page: 1 }
			);

			if ( templates && templates.length > 0 ) {
				const templateId = ( templates[ 0 ] as any ).id.toString();
				return {
					postType: 'wp_template',
					postId: templateId,
					isPreview: true,
					editLink: `/types/wp_template/edit/${ encodeURIComponent(
						templateId
					) }`,
				};
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
		if ( search.postIds && search.postIds.length > 0 ) {
			const postId = search.postIds[ 0 ].toString();
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
