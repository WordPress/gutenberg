/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { parse } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

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

function getBlockAtPath( blocks, blockPath ) {
	if ( ! Array.isArray( blockPath ) || ! blockPath.length ) {
		return;
	}

	let blockList = blocks;
	let block;

	for ( const index of blockPath ) {
		block = blockList?.[ index ];
		if ( ! block ) {
			return;
		}
		blockList = block.innerBlocks;
	}

	return block;
}

function getContentString( record ) {
	if ( typeof record?.content === 'string' ) {
		return record.content;
	}

	if ( typeof record?.content?.raw === 'string' ) {
		return record.content.raw;
	}

	return '';
}

function getSelectedBlockPath( selectedBlockPath ) {
	const value = Array.isArray( selectedBlockPath )
		? selectedBlockPath[ 0 ]
		: selectedBlockPath;

	if ( typeof value !== 'string' ) {
		return;
	}

	const blockPath = value.split( '.' ).map( ( index ) => Number( index ) );
	return blockPath.every(
		( index ) => Number.isInteger( index ) && index >= 0
	)
		? blockPath
		: undefined;
}

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
	}

	return postType;
}

export function useResolveEditedEntity() {
	const { editEntityRecord } = useDispatch( coreDataStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	const editorBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);
	const { getEditedEntityRecord, hasEntityRecord } =
		useSelect( coreDataStore );
	const { name, params = {}, query } = useLocation();
	const { postId = query?.postId } = params; // Fallback to query param for postId for list view routes.
	const postType = getPostType( name, postId ) ?? query?.postType;
	// Extract selectedBlock from URL for selection restoration on navigation.
	const { selectedBlock, selectedBlockPath } = query;

	// Track which selection we've applied to avoid re-applying the same one,
	// but allow applying a new one if the URL changes.
	const appliedSelectionRef = useRef( null );

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

	// Restore selection from URL synchronously, before EditorProvider renders.
	// This ensures the selection is available when blocks are reset.
	// When editing a page with a template, EditorProvider reads selection from
	// the page entity (context), not the template entity.
	if ( ( selectedBlock || selectedBlockPath ) && entity.isReady ) {
		const selectionPostType = entity.context?.postId
			? entity.context.postType
			: entity.postType;
		const selectionPostId = entity.context?.postId
			? entity.context.postId
			: entity.postId;
		const selectionKey = [
			selectionPostType,
			selectionPostId,
			selectedBlock || '',
			selectedBlockPath || '',
		].join( ':' );

		// Only apply selection if the entity record is loaded,
		// otherwise editEntityRecord will throw.
		if (
			appliedSelectionRef.current !== selectionKey &&
			hasEntityRecord( 'postType', selectionPostType, selectionPostId )
		) {
			const edits = {
				selection: {
					selectionStart: { clientId: selectedBlock },
					selectionEnd: { clientId: selectedBlock },
				},
			};

			if ( ! selectedBlock ) {
				const record = getEditedEntityRecord(
					'postType',
					selectionPostType,
					selectionPostId
				);
				const blockPath = getSelectedBlockPath( selectedBlockPath );
				const blocks =
					record?.blocks ?? parse( getContentString( record ) );
				const block = getBlockAtPath( blocks, blockPath );

				if ( block?.clientId ) {
					if ( ! record?.blocks ) {
						edits.blocks = blocks;
					}
					edits.selection = {
						selectionStart: { clientId: block.clientId },
						selectionEnd: { clientId: block.clientId },
					};
				}
			}

			if ( edits.selection.selectionStart.clientId ) {
				editEntityRecord(
					'postType',
					selectionPostType,
					selectionPostId,
					edits,
					{ undoIgnore: true }
				);
				appliedSelectionRef.current = selectionKey;
			}
		}
	}

	useEffect( () => {
		if ( selectedBlock ) {
			selectBlock( selectedBlock );
			return;
		}

		const blockPath = getSelectedBlockPath( selectedBlockPath );
		if ( ! blockPath || ! entity.isReady ) {
			return;
		}

		const block = getBlockAtPath( editorBlocks, blockPath );
		if ( block?.clientId ) {
			selectBlock( block.clientId );
		}
	}, [
		editorBlocks,
		entity.isReady,
		selectBlock,
		selectedBlock,
		selectedBlockPath,
	] );

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
