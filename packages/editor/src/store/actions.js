/**
 * External dependencies
 */
import { has, castArray } from 'lodash';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { dispatch, select, apiFetch } from '@wordpress/data-controls';
import {
	parse,
	synchronizeBlocksWithTemplate,
	serialize,
	isUnmodifiedDefaultBlock,
	getFreeformContentHandlerName,
} from '@wordpress/blocks';
import { removep } from '@wordpress/autop';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import {
	STORE_KEY,
	POST_UPDATE_TRANSACTION_ID,
	TRASH_POST_NOTICE_ID,
} from './constants';
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForTrashFail,
} from './utils/notice-builder';
import { awaitNextStateChange, getRegistry } from './controls';
import * as sources from './block-sources';

/**
 * Map of Registry instance to WeakMap of dependencies by custom source.
 *
 * @type WeakMap<WPDataRegistry,WeakMap<WPBlockAttributeSource,Object>>
 */
const lastBlockSourceDependenciesByRegistry = new WeakMap;

/**
 * Given a blocks array, returns a blocks array with sourced attribute values
 * applied. The reference will remain consistent with the original argument if
 * no attribute values must be overridden. If sourced values are applied, the
 * return value will be a modified copy of the original array.
 *
 * @param {WPBlock[]} blocks Original blocks array.
 *
 * @return {WPBlock[]} Blocks array with sourced values applied.
 */
function* getBlocksWithSourcedAttributes( blocks ) {
	const registry = yield getRegistry();
	if ( ! lastBlockSourceDependenciesByRegistry.has( registry ) ) {
		return blocks;
	}

	const blockSourceDependencies = lastBlockSourceDependenciesByRegistry.get( registry );

	let workingBlocks = blocks;
	for ( let i = 0; i < blocks.length; i++ ) {
		let block = blocks[ i ];
		const blockType = yield select( 'core/blocks', 'getBlockType', block.name );

		for ( const [ attributeName, schema ] of Object.entries( blockType.attributes ) ) {
			if ( ! sources[ schema.source ] || ! sources[ schema.source ].apply ) {
				continue;
			}

			if ( ! blockSourceDependencies.has( sources[ schema.source ] ) ) {
				continue;
			}

			const dependencies = blockSourceDependencies.get( sources[ schema.source ] );
			const sourcedAttributeValue = sources[ schema.source ].apply( schema, dependencies );

			// It's only necessary to apply the value if it differs from the
			// block's locally-assigned value, to avoid needlessly resetting
			// the block editor.
			if ( sourcedAttributeValue === block.attributes[ attributeName ] ) {
				continue;
			}

			// Create a shallow clone to mutate, leaving the original intact.
			if ( workingBlocks === blocks ) {
				workingBlocks = [ ...workingBlocks ];
			}

			block = {
				...block,
				attributes: {
					...block.attributes,
					[ attributeName ]: sourcedAttributeValue,
				},
			};

			workingBlocks.splice( i, 1, block );
		}

		// Recurse to apply source attributes to inner blocks.
		if ( block.innerBlocks.length ) {
			const appliedInnerBlocks = yield* getBlocksWithSourcedAttributes( block.innerBlocks );
			if ( appliedInnerBlocks !== block.innerBlocks ) {
				if ( workingBlocks === blocks ) {
					workingBlocks = [ ...workingBlocks ];
				}

				block = {
					...block,
					innerBlocks: appliedInnerBlocks,
				};

				workingBlocks.splice( i, 1, block );
			}
		}
	}

	return workingBlocks;
}

/**
 * Refreshes the last block source dependencies, optionally for a given subset
 * of sources (defaults to the full set of sources).
 *
 * @param {?Array} sourcesToUpdate Optional subset of sources to reset.
 *
 * @yield {Object} Yielded actions or control descriptors.
 */
function* resetLastBlockSourceDependencies( sourcesToUpdate = Object.values( sources ) ) {
	if ( ! sourcesToUpdate.length ) {
		return;
	}

	const registry = yield getRegistry();
	if ( ! lastBlockSourceDependenciesByRegistry.has( registry ) ) {
		lastBlockSourceDependenciesByRegistry.set( registry, new WeakMap );
	}

	const lastBlockSourceDependencies = lastBlockSourceDependenciesByRegistry.get( registry );

	for ( const source of sourcesToUpdate ) {
		const dependencies = yield* source.getDependencies();
		lastBlockSourceDependencies.set( source, dependencies );
	}
}

/**
 * Returns an action generator used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post      Post object.
 * @param {Object} edits     Initial edited attributes object.
 * @param {Array?} template  Block Template.
 */
export function* setupEditor( post, edits, template ) {
	// In order to ensure maximum of a single parse during setup, edits are
	// included as part of editor setup action. Assume edited content as
	// canonical if provided, falling back to post.
	let content;
	if ( has( edits, [ 'content' ] ) ) {
		content = edits.content;
	} else {
		content = post.content;
	}

	let blocks = parse( content );

	// Apply a template for new posts only, if exists.
	const isNewPost = post.status === 'auto-draft';
	if ( isNewPost && template ) {
		blocks = synchronizeBlocksWithTemplate( blocks, template );
	}

	yield resetPost( post );
	yield* resetLastBlockSourceDependencies();
	yield {
		type: 'SETUP_EDITOR',
		post,
		edits,
		template,
	};
	yield resetEditorBlocks( blocks, { __unstableShouldCreateUndoLevel: false } );
	yield setupEditorState( post );
	if ( edits && Object.values( edits ).some( ( edit ) => edit ) ) {
		yield editPost( edits );
	}
	yield* __experimentalSubscribeSources();
}

/**
 * Returns an action object signalling that the editor is being destroyed and
 * that any necessary state or side-effect cleanup should occur.
 *
 * @return {Object} Action object.
 */
export function __experimentalTearDownEditor() {
	return { type: 'TEAR_DOWN_EDITOR' };
}

/**
 * Returns an action generator which loops to await the next state change,
 * calling to reset blocks when a block source dependencies change.
 *
 * @yield {Object} Action object.
 */
export function* __experimentalSubscribeSources() {
	while ( true ) {
		yield awaitNextStateChange();

		// The bailout case: If the editor becomes unmounted, it will flag
		// itself as non-ready. Effectively unsubscribes from the registry.
		const isStillReady = yield select( 'core/editor', '__unstableIsEditorReady' );
		if ( ! isStillReady ) {
			break;
		}

		const registry = yield getRegistry();

		let reset = false;
		for ( const source of Object.values( sources ) ) {
			if ( ! source.getDependencies ) {
				continue;
			}

			const dependencies = yield* source.getDependencies();

			if ( ! lastBlockSourceDependenciesByRegistry.has( registry ) ) {
				lastBlockSourceDependenciesByRegistry.set( registry, new WeakMap );
			}

			const lastBlockSourceDependencies = lastBlockSourceDependenciesByRegistry.get( registry );
			const lastDependencies = lastBlockSourceDependencies.get( source );

			if ( ! isShallowEqual( dependencies, lastDependencies ) ) {
				lastBlockSourceDependencies.set( source, dependencies );

				// Allow the loop to continue in order to assign latest
				// dependencies values, but mark for reset.
				reset = true;
			}
		}

		if ( reset ) {
			yield resetEditorBlocks( yield select( 'core/editor', 'getEditorBlocks' ), { __unstableShouldCreateUndoLevel: false } );
		}
	}
}

/**
 * Returns an action object used in signalling that the latest version of the
 * post has been received, either by initialization or save.
 *
 * @param {Object} post Post object.
 *
 * @return {Object} Action object.
 */
export function resetPost( post ) {
	return {
		type: 'RESET_POST',
		post,
	};
}

/**
 * Returns an action object used in signalling that the latest autosave of the
 * post has been received, by initialization or autosave.
 *
 * @deprecated since 5.6. Callers should use the `receiveAutosaves( postId, autosave )`
 * 			   selector from the '@wordpress/core-data' package.
 *
 * @param {Object} newAutosave Autosave post object.
 *
 * @return {Object} Action object.
 */
export function* resetAutosave( newAutosave ) {
	deprecated( 'resetAutosave action (`core/editor` store)', {
		alternative: 'receiveAutosaves action (`core` store)',
		plugin: 'Gutenberg',
	} );

	const postId = yield select( STORE_KEY, 'getCurrentPostId' );
	yield dispatch( 'core', 'receiveAutosaves', postId, newAutosave );

	return { type: '__INERT__' };
}

/**
 * Action for dispatching that a post update request has started.
 *
 * @param {Object} options
 *
 * @return {Object} An action object
 */
export function __experimentalRequestPostUpdateStart( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE_START',
		options,
	};
}

/**
 * Action for dispatching that a post update request has finished.
 *
 * @param {Object} options
 *
 * @return {Object} An action object
 */
export function __experimentalRequestPostUpdateFinish( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE_FINISH',
		options,
	};
}

/**
 * Returns an action object used in signalling that a patch of updates for the
 * latest version of the post have been received.
 *
 * @param {Object} edits Updated post fields.
 *
 * @return {Object} Action object.
 */
export function updatePost( edits ) {
	return {
		type: 'UPDATE_POST',
		edits,
	};
}

/**
 * Returns an action object used to setup the editor state when first opening
 * an editor.
 *
 * @param {Object} post   Post object.
 *
 * @return {Object} Action object.
 */
export function setupEditorState( post ) {
	return {
		type: 'SETUP_EDITOR_STATE',
		post,
	};
}

/**
 * Returns an action object used in signalling that attributes of the post have
 * been edited.
 *
 * @param {Object} edits Post attributes to edit.
 *
 * @yield {Object} Action object or control.
 */
export function* editPost( edits ) {
	const { id, type } = yield select( 'core/editor', 'getCurrentPost' );
	yield dispatch( 'core', 'editEntityRecord', 'postType', type, id, edits );
}

/**
 * Returns action object produced by the updatePost creator augmented by
 * an optimist option that signals optimistically applying updates.
 *
 * @param {Object} edits  Updated post fields.
 *
 * @return {Object} Action object.
 */
export function __experimentalOptimisticUpdatePost( edits ) {
	return {
		...updatePost( edits ),
		optimist: { id: POST_UPDATE_TRANSACTION_ID },
	};
}

/**
 * Action generator for saving the current post in the editor.
 *
 * @param {Object} options
 */
export function* savePost( options = {} ) {
	yield dispatch( STORE_KEY, 'editPost', {
		content: yield select( 'core/editor', 'getEditedPostContent' ),
	} );
	yield __experimentalRequestPostUpdateStart( options );
	const postType = yield select( 'core/editor', 'getCurrentPostType' );
	const postId = yield select( 'core/editor', 'getCurrentPostId' );
	yield dispatch(
		'core',
		'saveEditedEntityRecord',
		'postType',
		postType,
		postId,
		{
			...options,
			getNoticeActionArgs: ( previousEntity, entity, type ) => {
				const args = getNotificationArgumentsForSaveSuccess( {
					previousPost: previousEntity,
					post: entity,
					postType: type,
					options,
				} );
				if ( args && args.length ) {
					return [ 'core/notices', 'createSuccessNotice', ...args ];
				}
			},
		}
	);
	yield __experimentalRequestPostUpdateFinish( options );
}

/**
 * Action generator for handling refreshing the current post.
 */
export function* refreshPost() {
	const post = yield select(
		STORE_KEY,
		'getCurrentPost'
	);
	const postTypeSlug = yield select(
		STORE_KEY,
		'getCurrentPostType'
	);
	const postType = yield select(
		'core',
		'getPostType',
		postTypeSlug
	);
	const newPost = yield apiFetch(
		{
			// Timestamp arg allows caller to bypass browser caching, which is
			// expected for this specific function.
			path: `/wp/v2/${ postType.rest_base }/${ post.id }` +
				`?context=edit&_timestamp=${ Date.now() }`,
		}
	);
	yield dispatch(
		STORE_KEY,
		'resetPost',
		newPost
	);
}

/**
 * Action generator for trashing the current post in the editor.
 */
export function* trashPost() {
	const postTypeSlug = yield select(
		STORE_KEY,
		'getCurrentPostType'
	);
	const postType = yield select(
		'core',
		'getPostType',
		postTypeSlug
	);
	yield dispatch(
		'core/notices',
		'removeNotice',
		TRASH_POST_NOTICE_ID
	);
	try {
		const post = yield select(
			STORE_KEY,
			'getCurrentPost'
		);
		yield apiFetch(
			{
				path: `/wp/v2/${ postType.rest_base }/${ post.id }`,
				method: 'DELETE',
			}
		);

		// TODO: This should be an updatePost action (updating subsets of post
		// properties), but right now editPost is tied with change detection.
		yield dispatch(
			STORE_KEY,
			'resetPost',
			{ ...post, status: 'trash' }
		);
	} catch ( error ) {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			...getNotificationArgumentsForTrashFail( { error } ),
		);
	}
}

/**
 * Action generator used in signalling that the post should autosave.
 *
 * @param {Object?} options Extra flags to identify the autosave.
 */
export function* autosave( options ) {
	yield dispatch(
		STORE_KEY,
		'savePost',
		{ isAutosave: true, ...options }
	);
}

/**
 * Returns an action object used in signalling that undo history should
 * restore last popped state.
 *
 * @yield {Object} Action object.
 */
export function* redo() {
	yield dispatch( 'core', 'redo' );
}

/**
 * Returns an action object used in signalling that undo history should pop.
 *
 * @yield {Object} Action object.
 */
export function* undo() {
	yield dispatch( 'core', 'undo' );
}

/**
 * Returns an action object used in signalling that undo history record should
 * be created.
 *
 * @return {Object} Action object.
 */
export function createUndoLevel() {
	return { type: 'CREATE_UNDO_LEVEL' };
}

/**
 * Returns an action object used to lock the editor.
 *
 * @param {Object}  lock Details about the post lock status, user, and nonce.
 *
 * @return {Object} Action object.
 */
export function updatePostLock( lock ) {
	return {
		type: 'UPDATE_POST_LOCK',
		lock,
	};
}

/**
 * Returns an action object used to fetch a single reusable block or all
 * reusable blocks from the REST API into the store.
 *
 * @param {?string} id If given, only a single reusable block with this ID will
 *                     be fetched.
 *
 * @return {Object} Action object.
 */
export function __experimentalFetchReusableBlocks( id ) {
	return {
		type: 'FETCH_REUSABLE_BLOCKS',
		id,
	};
}

/**
 * Returns an action object used in signalling that reusable blocks have been
 * received. `results` is an array of objects containing:
 *  - `reusableBlock` - Details about how the reusable block is persisted.
 *  - `parsedBlock` - The original block.
 *
 * @param {Object[]} results Reusable blocks received.
 *
 * @return {Object} Action object.
 */
export function __experimentalReceiveReusableBlocks( results ) {
	return {
		type: 'RECEIVE_REUSABLE_BLOCKS',
		results,
	};
}

/**
 * Returns an action object used to save a reusable block that's in the store to
 * the REST API.
 *
 * @param {Object} id The ID of the reusable block to save.
 *
 * @return {Object} Action object.
 */
export function __experimentalSaveReusableBlock( id ) {
	return {
		type: 'SAVE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used to delete a reusable block via the REST API.
 *
 * @param {number} id The ID of the reusable block to delete.
 *
 * @return {Object} Action object.
 */
export function __experimentalDeleteReusableBlock( id ) {
	return {
		type: 'DELETE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used in signalling that a reusable block's title is
 * to be updated.
 *
 * @param {number} id    The ID of the reusable block to update.
 * @param {string} title The new title.
 *
 * @return {Object} Action object.
 */
export function __experimentalUpdateReusableBlockTitle( id, title ) {
	return {
		type: 'UPDATE_REUSABLE_BLOCK_TITLE',
		id,
		title,
	};
}

/**
 * Returns an action object used to convert a reusable block into a static
 * block.
 *
 * @param {string} clientId The client ID of the block to attach.
 *
 * @return {Object} Action object.
 */
export function __experimentalConvertBlockToStatic( clientId ) {
	return {
		type: 'CONVERT_BLOCK_TO_STATIC',
		clientId,
	};
}

/**
 * Returns an action object used to convert a static block into a reusable
 * block.
 *
 * @param {string} clientIds The client IDs of the block to detach.
 *
 * @return {Object} Action object.
 */
export function __experimentalConvertBlockToReusable( clientIds ) {
	return {
		type: 'CONVERT_BLOCK_TO_REUSABLE',
		clientIds: castArray( clientIds ),
	};
}

/**
 * Returns an action object used in signalling that the user has enabled the
 * publish sidebar.
 *
 * @return {Object} Action object
 */
export function enablePublishSidebar() {
	return {
		type: 'ENABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user has disabled the
 * publish sidebar.
 *
 * @return {Object} Action object
 */
export function disablePublishSidebar() {
	return {
		type: 'DISABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used to signal that post saving is locked.
 *
 * @param  {string} lockName The lock name.
 *
 * @example
 * ```
 * const { subscribe } = wp.data;

 * const initialPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 *
 * // Only allow publishing posts that are set to a future date.
 * if ( 'publish' !== initialPostStatus ) {
 *
 * 	// Track locking.
 * 	let locked = false;
 *
 * 	// Watch for the publish event.
 * 	let unssubscribe = subscribe( () => {
 * 		const currentPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 * 		if ( 'publish' !== currentPostStatus ) {
 *
 * 			// Compare the post date to the current date, lock the post if the date isn't in the future.
 * 			const postDate = new Date( wp.data.select( 'core/editor' ).getEditedPostAttribute( 'date' ) );
 * 			const currentDate = new Date();
 * 			if ( postDate.getTime() <= currentDate.getTime() ) {
 * 				if ( ! locked ) {
 * 					locked = true;
 * 					wp.data.dispatch( 'core/editor' ).lockPostSaving( 'futurelock' );
 * 				}
 * 			} else {
 * 				if ( locked ) {
 * 					locked = false;
 * 					wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'futurelock' );
 * 				}
 * 			}
 * 		}
 * 	} );
 * }
 * ```
 *
 * @return {Object} Action object
 */
export function lockPostSaving( lockName ) {
	return {
		type: 'LOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Returns an action object used to signal that post saving is unlocked.
 *
 * @param  {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function unlockPostSaving( lockName ) {
	return {
		type: 'UNLOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Serializes blocks following backwards compatibility conventions.
 *
 * @param {Array} blocksForSerialization The blocks to serialize.
 *
 * @return {string} The blocks serialization.
 */
export const serializeBlocks = memoize(
	( blocksForSerialization ) => {
		// A single unmodified default block is assumed to
		// be equivalent to an empty post.
		if (
			blocksForSerialization.length === 1 &&
			isUnmodifiedDefaultBlock( blocksForSerialization[ 0 ] )
		) {
			blocksForSerialization = [];
		}

		let content = serialize( blocksForSerialization );

		// For compatibility, treat a post consisting of a
		// single freeform block as legacy content and apply
		// pre-block-editor removep'd content formatting.
		if (
			blocksForSerialization.length === 1 &&
			blocksForSerialization[ 0 ].name === getFreeformContentHandlerName()
		) {
			content = removep( content );
		}

		return content;
	},
	{ maxSize: 1 }
);

/**
 * Returns an action object used to signal that the blocks have been updated.
 *
 * @param {Array}   blocks  Block Array.
 * @param {?Object} options Optional options.
 *
 * @yield {Object} Action object
 */
export function* resetEditorBlocks( blocks, options = {} ) {
	const lastBlockAttributesChange = yield select( 'core/block-editor', '__experimentalGetLastBlockAttributeChanges' );

	// Sync to sources from block attributes updates.
	if ( lastBlockAttributesChange ) {
		const updatedSources = new Set;
		const updatedBlockTypes = new Set;
		for ( const [ clientId, attributes ] of Object.entries( lastBlockAttributesChange ) ) {
			const blockName = yield select( 'core/block-editor', 'getBlockName', clientId );
			if ( updatedBlockTypes.has( blockName ) ) {
				continue;
			}

			updatedBlockTypes.add( blockName );
			const blockType = yield select( 'core/blocks', 'getBlockType', blockName );

			for ( const [ attributeName, newAttributeValue ] of Object.entries( attributes ) ) {
				if ( ! blockType.attributes.hasOwnProperty( attributeName ) ) {
					continue;
				}

				const schema = blockType.attributes[ attributeName ];
				const source = sources[ schema.source ];

				if ( source && source.update ) {
					yield* source.update( schema, newAttributeValue );
					updatedSources.add( source );
				}
			}
		}

		// Dependencies are reset so that source dependencies subscription
		// skips a reset which would otherwise occur by dependencies change.
		// This assures that at most one reset occurs per block change.
		yield* resetLastBlockSourceDependencies( Array.from( updatedSources ) );
	}

	const edits = { blocks: yield* getBlocksWithSourcedAttributes( blocks ) };

	if ( options.__unstableShouldCreateUndoLevel !== false ) {
		edits.content = serializeBlocks( edits.blocks );
	}

	yield* editPost( edits );
}

/*
 * Returns an action object used in signalling that the post editor settings have been updated.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateEditorSettings( settings ) {
	return {
		type: 'UPDATE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Backward compatibility
 */

const getBlockEditorAction = ( name ) => function* ( ...args ) {
	deprecated( '`wp.data.dispatch( \'core/editor\' ).' + name + '`', {
		alternative: '`wp.data.dispatch( \'core/block-editor\' ).' + name + '`',
	} );
	yield dispatch( 'core/block-editor', name, ...args );
};

/**
 * @see resetBlocks in core/block-editor store.
 */
export const resetBlocks = getBlockEditorAction( 'resetBlocks' );

/**
 * @see receiveBlocks in core/block-editor store.
 */
export const receiveBlocks = getBlockEditorAction( 'receiveBlocks' );

/**
 * @see updateBlock in core/block-editor store.
 */
export const updateBlock = getBlockEditorAction( 'updateBlock' );

/**
 * @see updateBlockAttributes in core/block-editor store.
 */
export const updateBlockAttributes = getBlockEditorAction( 'updateBlockAttributes' );

/**
 * @see selectBlock in core/block-editor store.
 */
export const selectBlock = getBlockEditorAction( 'selectBlock' );

/**
 * @see startMultiSelect in core/block-editor store.
 */
export const startMultiSelect = getBlockEditorAction( 'startMultiSelect' );

/**
 * @see stopMultiSelect in core/block-editor store.
 */
export const stopMultiSelect = getBlockEditorAction( 'stopMultiSelect' );

/**
 * @see multiSelect in core/block-editor store.
 */
export const multiSelect = getBlockEditorAction( 'multiSelect' );

/**
 * @see clearSelectedBlock in core/block-editor store.
 */
export const clearSelectedBlock = getBlockEditorAction( 'clearSelectedBlock' );

/**
 * @see toggleSelection in core/block-editor store.
 */
export const toggleSelection = getBlockEditorAction( 'toggleSelection' );

/**
 * @see replaceBlocks in core/block-editor store.
 */
export const replaceBlocks = getBlockEditorAction( 'replaceBlocks' );

/**
 * @see replaceBlock in core/block-editor store.
 */
export const replaceBlock = getBlockEditorAction( 'replaceBlock' );

/**
 * @see moveBlocksDown in core/block-editor store.
 */
export const moveBlocksDown = getBlockEditorAction( 'moveBlocksDown' );

/**
 * @see moveBlocksUp in core/block-editor store.
 */
export const moveBlocksUp = getBlockEditorAction( 'moveBlocksUp' );

/**
 * @see moveBlockToPosition in core/block-editor store.
 */
export const moveBlockToPosition = getBlockEditorAction( 'moveBlockToPosition' );

/**
 * @see insertBlock in core/block-editor store.
 */
export const insertBlock = getBlockEditorAction( 'insertBlock' );

/**
 * @see insertBlocks in core/block-editor store.
 */
export const insertBlocks = getBlockEditorAction( 'insertBlocks' );

/**
 * @see showInsertionPoint in core/block-editor store.
 */
export const showInsertionPoint = getBlockEditorAction( 'showInsertionPoint' );

/**
 * @see hideInsertionPoint in core/block-editor store.
 */
export const hideInsertionPoint = getBlockEditorAction( 'hideInsertionPoint' );

/**
 * @see setTemplateValidity in core/block-editor store.
 */
export const setTemplateValidity = getBlockEditorAction( 'setTemplateValidity' );

/**
 * @see synchronizeTemplate in core/block-editor store.
 */
export const synchronizeTemplate = getBlockEditorAction( 'synchronizeTemplate' );

/**
 * @see mergeBlocks in core/block-editor store.
 */
export const mergeBlocks = getBlockEditorAction( 'mergeBlocks' );

/**
 * @see removeBlocks in core/block-editor store.
 */
export const removeBlocks = getBlockEditorAction( 'removeBlocks' );

/**
 * @see removeBlock in core/block-editor store.
 */
export const removeBlock = getBlockEditorAction( 'removeBlock' );

/**
 * @see toggleBlockMode in core/block-editor store.
 */
export const toggleBlockMode = getBlockEditorAction( 'toggleBlockMode' );

/**
 * @see startTyping in core/block-editor store.
 */
export const startTyping = getBlockEditorAction( 'startTyping' );

/**
 * @see stopTyping in core/block-editor store.
 */
export const stopTyping = getBlockEditorAction( 'stopTyping' );

/**
 * @see enterFormattedText in core/block-editor store.
 */
export const enterFormattedText = getBlockEditorAction( 'enterFormattedText' );

/**
 * @see exitFormattedText in core/block-editor store.
 */
export const exitFormattedText = getBlockEditorAction( 'exitFormattedText' );

/**
 * @see insertDefaultBlock in core/block-editor store.
 */
export const insertDefaultBlock = getBlockEditorAction( 'insertDefaultBlock' );

/**
 * @see updateBlockListSettings in core/block-editor store.
 */
export const updateBlockListSettings = getBlockEditorAction( 'updateBlockListSettings' );
