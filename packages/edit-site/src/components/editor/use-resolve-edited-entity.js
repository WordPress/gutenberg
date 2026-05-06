/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore, useEntityRecord } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	ATTACHMENT_POST_TYPE,
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES,
} from '../../utils/constants';

const { useLocation } = unlock( routerPrivateApis );

const postTypesWithoutParentTemplate = [
	ATTACHMENT_POST_TYPE,
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
	PATTERN_TYPES.user,
];

const authorizedPostTypes = [ 'page', 'post' ];

function getPostType( name ) {
	let postType;
	if ( name === 'navigation-item' ) {
		postType = NAVIGATION_POST_TYPE;
	} else if ( name === 'pattern-item' ) {
		postType = PATTERN_TYPES.user;
	} else if ( name === 'template-part-item' ) {
		postType = TEMPLATE_PART_POST_TYPE;
	} else if ( name === 'templates' ) {
		postType = TEMPLATE_POST_TYPE;
	} else if ( name === 'template-item' ) {
		postType = TEMPLATE_POST_TYPE;
	} else if ( name === 'page-item' || name === 'pages' ) {
		postType = 'page';
	} else if ( name === 'post-item' || name === 'posts' ) {
		postType = 'post';
	} else if ( name === 'attachment-item' ) {
		postType = ATTACHMENT_POST_TYPE;
	}

	return postType;
}

export function useResolveEditedEntity() {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const { hasEntityRecord } = useSelect( coreDataStore );
	const { name, params = {}, query } = useLocation();
	const { postId = query?.postId } = params; // Fallback to query param for postId for list view routes.
	const postType = getPostType( name, postId ) ?? query?.postType;
	// Extract selectedBlock from URL for selection restoration on navigation back.
	const { selectedBlock } = query;

	// Track which selection we've applied to avoid re-applying the same one,
	// but allow applying a new one if the URL changes.
	const appliedSelectionRef = useRef( null );

	const homePage = useSelect( ( select ) => {
		const { getHomePage } = unlock( select( coreDataStore ) );
		return getHomePage();
	}, [] );

	// Resolve the active theme's `root` template id (if any). This drives the
	// "root template" wrapping behavior: clicking any other template renders
	// it inside `root` with `core/template-content` as the editable slot,
	// matching how the live frontend stacks them.
	//
	// `useEntityRecord` (vs. a bare `getEntityRecord` selector) auto-fetches
	// and reports `hasResolved`, so we can keep the editor in a loading state
	// until we know whether root exists rather than briefly rendering the
	// wrap-less version and flickering into wrap mode once root loads.
	const stylesheet = useSelect(
		( select ) => select( coreDataStore ).getCurrentTheme()?.stylesheet,
		[]
	);
	const rootTemplateId = stylesheet ? `${ stylesheet }//root` : null;
	const { record: rootTemplate, hasResolved: hasResolvedRoot } =
		useEntityRecord( 'postType', TEMPLATE_POST_TYPE, rootTemplateId ?? '', {
			enabled: !! rootTemplateId,
		} );

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

	// Compute entity info based on conditions
	let entity;
	if ( postTypesWithoutParentTemplate.includes( postType ) && postId ) {
		entity = { isReady: true, postType, postId, context };
	} else if ( !! homePage ) {
		entity = {
			isReady: resolvedTemplateId !== undefined,
			postType: TEMPLATE_POST_TYPE,
			postId: resolvedTemplateId,
			context,
		};
	} else {
		entity = { isReady: false };
	}

	// Root-template wrap: when the active theme has `root.html` and the user
	// is editing a different `wp_template`, render `root` as the canvas
	// entity and expose the requested template id as `innerTemplateId`. The
	// `core/template-content` block reads it via the editor settings and
	// renders that template's blocks editably inside the root chrome.
	//
	// `?focusMode=true` (added by `onNavigateToEntityRecord`, e.g. from the
	// "Edit original" toolbar on `core/template-content`) bypasses the wrap
	// so users can drill in to an isolated single-template canvas.
	//
	// We hold off on declaring the entity ready until the root lookup has
	// resolved — otherwise the canvas first paints with the inner template
	// directly and then re-renders into wrap mode, which feels like a flash.
	if (
		rootTemplateId &&
		entity.isReady &&
		entity.postType === TEMPLATE_POST_TYPE &&
		entity.postId &&
		entity.postId !== rootTemplateId &&
		! query?.focusMode
	) {
		if ( ! hasResolvedRoot ) {
			entity = { ...entity, isReady: false };
		} else if ( rootTemplate ) {
			entity = {
				...entity,
				postId: rootTemplateId,
				innerTemplateId: entity.postId,
			};
		}
	}

	// Restore selection from URL synchronously, before EditorProvider renders.
	// This ensures the selection is available when blocks are reset.
	// When editing a page with a template, EditorProvider reads selection from
	// the page entity (context), not the template entity.
	if (
		selectedBlock &&
		entity.isReady &&
		appliedSelectionRef.current !== selectedBlock
	) {
		const selectionPostType = entity.context?.postId
			? entity.context.postType
			: entity.postType;
		const selectionPostId = entity.context?.postId
			? entity.context.postId
			: entity.postId;

		// Only apply selection if the entity record is loaded,
		// otherwise editEntityRecord will throw.
		if (
			hasEntityRecord( 'postType', selectionPostType, selectionPostId )
		) {
			editEntityRecord(
				'postType',
				selectionPostType,
				selectionPostId,
				{
					selection: {
						selectionStart: { clientId: selectedBlock },
						selectionEnd: { clientId: selectedBlock },
					},
				},
				{ undoIgnore: true }
			);
			appliedSelectionRef.current = selectedBlock;
		}
	}

	return entity;
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
			// setEditedEntity expects a string (because the postId used to be
			// the template slug, even for edited templates). Now the postId can
			// be a number (either because it's an auto-draft or edited
			// template). Passing a number could break plugins doing things like
			// `id.includes`. It would be way more complex to keep passing the
			// template slug, while also being incorrect, so the easiest
			// solution is to cast the postId to a string.
			setEditedEntity( postType, String( postId ), context );
		}
	}, [ isReady, postType, postId, context, setEditedEntity ] );
}
