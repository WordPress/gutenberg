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

function useResolveEditedEntityAndContext( { postId, postType } ) {
	const { isRequestingSite, homepageId, url } = useSelect( ( select ) => {
		const { getSite, getUnstableBase } = select( coreDataStore );
		const siteData = getSite();
		const base = getUnstableBase();

		return {
			isRequestingSite: ! base,
			homepageId:
				siteData?.show_on_front === 'page'
					? siteData.page_on_front
					: null,
			url: base?.home,
		};
	}, [] );

	const resolvedTemplateId = useSelect(
		( select ) => {
			// If we're rendering a post type that doesn't have a template
			// no need to resolve its template.
			if ( postTypesWithoutParentTemplate.includes( postType ) ) {
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
				const editedEntity = getEditedEntityRecord(
					'postType',
					postTypeToResolve,
					postIdToResolve
				);
				if ( ! editedEntity ) {
					return undefined;
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
				return getDefaultTemplateId( {
					slug: `${ postTypeToResolve }-${ editedEntity?.slug }`,
				} );
			}

			// If we're rendering a specific page, post... we need to resolve its template.
			if ( postType && postId ) {
				return resolveTemplateForPostTypeAndId( postType, postId );
			}

			// If we're rendering the home page, and we have a static home page, resolve its template.
			if ( homepageId ) {
				return resolveTemplateForPostTypeAndId( 'page', homepageId );
			}

			// If we're not rendering a specific page, use the front page template.
			if ( ! isRequestingSite && url ) {
				const template = __experimentalGetTemplateForLink( url );
				return template?.id;
			}
		},
		[ homepageId, isRequestingSite, url, postId, postType ]
	);

	const context = useMemo( () => {
		if ( postTypesWithoutParentTemplate.includes( postType ) ) {
			return {};
		}

		if ( postType && postId ) {
			return { postType, postId };
		}

		if ( homepageId ) {
			return { postType: 'page', postId: homepageId };
		}

		return {};
	}, [ homepageId, postType, postId ] );

	if ( postTypesWithoutParentTemplate.includes( postType ) ) {
		return { isReady: true, postType, postId, context };
	}

	if ( ( postType && postId ) || homepageId || ! isRequestingSite ) {
		return {
			isReady: resolvedTemplateId !== undefined,
			postType: TEMPLATE_POST_TYPE,
			postId: resolvedTemplateId,
			context,
		};
	}

	return { isReady: false };
}

export function useInitEditedEntity( params ) {
	const { postType, postId, context, isReady } =
		useResolveEditedEntityAndContext( params );

	const { setEditedEntity } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( isReady ) {
			setEditedEntity( postType, postId, context );
		}
	}, [ isReady, postType, postId, context, setEditedEntity ] );
}

export default function useInitEditedEntityFromURL() {
	const { params = {} } = useLocation();
	return useInitEditedEntity( params );
}
