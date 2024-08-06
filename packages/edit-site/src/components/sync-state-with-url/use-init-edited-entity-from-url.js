/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES,
} from '../../utils/constants';

const { useLocation } = unlock( routerPrivateApis );

const postTypesWithoutParentTemplate = [
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES.user,
];

const authorizedPostTypes = [ 'page', 'post' ];

function useResolveEditedEntityAndContext( { postId, postType } ) {
	const {
		hasLoadedAllDependencies,
		homepageId,
		postsPageId,
		url,
		frontPageTemplateId,
	} = useSelect( ( select ) => {
		const { getSite, getUnstableBase, getEntityRecords } =
			select( coreDataStore );
		const siteData = getSite();
		const base = getUnstableBase();
		const templates = getEntityRecords( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );
		const _homepageId =
			siteData?.show_on_front === 'page' &&
			[ 'number', 'string' ].includes( typeof siteData.page_on_front ) &&
			!! +siteData.page_on_front // We also need to check if it's not zero(`0`).
				? siteData.page_on_front.toString()
				: null;
		const _postsPageId =
			siteData?.show_on_front === 'page' &&
			[ 'number', 'string' ].includes( typeof siteData.page_for_posts )
				? siteData.page_for_posts.toString()
				: null;
		let _frontPageTemplateId;
		if ( templates ) {
			const frontPageTemplate = templates.find(
				( t ) => t.slug === 'front-page'
			);
			_frontPageTemplateId = frontPageTemplate
				? frontPageTemplate.id
				: false;
		}
		return {
			hasLoadedAllDependencies: !! base && !! siteData,
			homepageId: _homepageId,
			postsPageId: _postsPageId,
			url: base?.home,
			frontPageTemplateId: _frontPageTemplateId,
		};
	}, [] );

	/**
	 * This is a hook that recreates the logic to resolve a template for a given WordPress postID postTypeId
	 * in order to match the frontend as closely as possible in the site editor.
	 *
	 * It is not possible to rely on the server logic because there maybe unsaved changes that impact the template resolution.
	 */
	const resolvedTemplateId = useSelect(
		( select ) => {
			// If we're rendering a post type that doesn't have a template
			// no need to resolve its template.
			if (
				postTypesWithoutParentTemplate.includes( postType ) &&
				postId
			) {
				return undefined;
			}

			// Don't trigger resolution for multi-selected posts.
			if ( postId && postId.includes( ',' ) ) {
				return undefined;
			}

			const {
				getEditedEntityRecord,
				getEntityRecords,
				getDefaultTemplateId,
				__experimentalGetTemplateForLink,
			} = select( coreDataStore );

			function resolveTemplateForPostTypeAndId(
				postTypeToResolve,
				postIdToResolve
			) {
				// For the front page, we always use the front page template if existing.
				if (
					postTypeToResolve === 'page' &&
					homepageId === postIdToResolve
				) {
					// We're still checking whether the front page template exists.
					// Don't resolve the template yet.
					if ( frontPageTemplateId === undefined ) {
						return undefined;
					}

					if ( !! frontPageTemplateId ) {
						return frontPageTemplateId;
					}
				}

				const editedEntity = getEditedEntityRecord(
					'postType',
					postTypeToResolve,
					postIdToResolve
				);
				if ( ! editedEntity ) {
					return undefined;
				}
				// Check if the current page is the posts page.
				if (
					postTypeToResolve === 'page' &&
					postsPageId === postIdToResolve
				) {
					return __experimentalGetTemplateForLink( editedEntity.link )
						?.id;
				}
				// First see if the post/page has an assigned template and fetch it.
				const currentTemplateSlug = editedEntity.template;
				if ( currentTemplateSlug ) {
					const currentTemplate = getEntityRecords(
						'postType',
						TEMPLATE_POST_TYPE,
						{
							per_page: -1,
						}
					)?.find( ( { slug } ) => slug === currentTemplateSlug );
					if ( currentTemplate ) {
						return currentTemplate.id;
					}
				}
				// If no template is assigned, use the default template.
				let slugToCheck;
				// In `draft` status we might not have a slug available, so we use the `single`
				// post type templates slug(ex page, single-post, single-product etc..).
				// Pages do not need the `single` prefix in the slug to be prioritized
				// through template hierarchy.
				if ( editedEntity.slug ) {
					slugToCheck =
						postTypeToResolve === 'page'
							? `${ postTypeToResolve }-${ editedEntity.slug }`
							: `single-${ postTypeToResolve }-${ editedEntity.slug }`;
				} else {
					slugToCheck =
						postTypeToResolve === 'page'
							? 'page'
							: `single-${ postTypeToResolve }`;
				}
				return getDefaultTemplateId( {
					slug: slugToCheck,
				} );
			}

			if ( ! hasLoadedAllDependencies ) {
				return undefined;
			}

			// If we're rendering a specific page, we need to resolve its template.
			// The site editor only supports pages for now, not other CPTs.
			if (
				postType &&
				postId &&
				authorizedPostTypes.includes( postType )
			) {
				return resolveTemplateForPostTypeAndId( postType, postId );
			}

			// If we're rendering the home page, and we have a static home page, resolve its template.
			if ( homepageId ) {
				return resolveTemplateForPostTypeAndId( 'page', homepageId );
			}

			// If we're not rendering a specific page, use the front page template.
			if ( url ) {
				const template = __experimentalGetTemplateForLink( url );
				return template?.id;
			}
		},
		[
			homepageId,
			postsPageId,
			hasLoadedAllDependencies,
			url,
			postId,
			postType,
			frontPageTemplateId,
		]
	);

	const context = useMemo( () => {
		if ( postTypesWithoutParentTemplate.includes( postType ) && postId ) {
			return {};
		}

		if ( postType && postId && authorizedPostTypes.includes( postType ) ) {
			return { postType, postId };
		}
		// TODO: for post types lists we should probably not render the front page, but maybe a placeholder
		// with a message like "Select a page" or something similar.
		if ( homepageId ) {
			return { postType: 'page', postId: homepageId };
		}

		return {};
	}, [ homepageId, postType, postId ] );

	if ( postTypesWithoutParentTemplate.includes( postType ) && postId ) {
		return { isReady: true, postType, postId, context };
	}

	if ( hasLoadedAllDependencies ) {
		return {
			isReady: resolvedTemplateId !== undefined,
			postType: TEMPLATE_POST_TYPE,
			postId: resolvedTemplateId,
			context,
		};
	}

	return { isReady: false };
}

export default function useInitEditedEntityFromURL() {
	const { params = {} } = useLocation();
	const { postType, postId, context, isReady } =
		useResolveEditedEntityAndContext( params );

	const { setEditedEntity } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( isReady ) {
			setEditedEntity( postType, postId, context );
		}
	}, [ isReady, postType, postId, context, setEditedEntity ] );
}
