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

export function useResolveEditedEntity() {
	const { name, params = {}, query } = useLocation();
	const { postId = query?.postId } = params; // Fallback to query param for postId for list view routes.
	let postType;
	if ( name === 'navigation-item' ) {
		postType = NAVIGATION_POST_TYPE;
	} else if ( name === 'pattern-item' ) {
		postType = PATTERN_TYPES.user;
	} else if ( name === 'template-part-item' ) {
		postType = TEMPLATE_PART_POST_TYPE;
	} else if ( name === 'template-item' || name === 'templates' ) {
		postType = TEMPLATE_POST_TYPE;
	} else if ( name === 'page-item' || name === 'pages' ) {
		postType = 'page';
	} else if ( name === 'post-item' || name === 'posts' ) {
		postType = 'post';
	}

	const homePage = useSelect( ( select ) => {
		const { getHomePage } = unlock( select( coreDataStore ) );
		return getHomePage();
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
				return;
			}

			// Don't trigger resolution for multi-selected posts.
			if ( postId && postId.includes( ',' ) ) {
				return;
			}

			const { getTemplateId } = unlock( select( coreDataStore ) );

			// If we're rendering a specific page, we need to resolve its template.
			// The site editor only supports pages for now, not other CPTs.
			if (
				postType &&
				postId &&
				authorizedPostTypes.includes( postType )
			) {
				return getTemplateId( postType, postId );
			}

			// If we're rendering the home page, and we have a static home page, resolve its template.
			if ( homePage?.postType === 'page' ) {
				return getTemplateId( 'page', homePage?.postId );
			}

			if ( homePage?.postType === 'wp_template' ) {
				return homePage?.postId;
			}
		},
		[ homePage, postId, postType ]
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
		if ( homePage?.postType === 'page' ) {
			return { postType: 'page', postId: homePage?.postId };
		}

		return {};
	}, [ homePage, postType, postId ] );

	if ( postTypesWithoutParentTemplate.includes( postType ) && postId ) {
		return { isReady: true, postType, postId, context };
	}

	if ( !! homePage ) {
		return {
			isReady: resolvedTemplateId !== undefined,
			postType: TEMPLATE_POST_TYPE,
			postId: resolvedTemplateId,
			context,
		};
	}

	return { isReady: false };
}

export function useSyncDeprecatedEntityIntoState( {
	postType,
	postId,
	context,
	isReady,
} ) {
	const { setEditedEntity } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( isReady ) {
			setEditedEntity( postType, postId, context );
		}
	}, [ isReady, postType, postId, context, setEditedEntity ] );
}
