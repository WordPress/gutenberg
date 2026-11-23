import deprecated from '@wordpress/deprecated';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	isUnmodifiedBlock,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import type {
	BlockEditorThunkArgs,
	BlockRemovalRule,
	InsertionPoint,
	LastFocus,
	RemovalPromptMessage,
	Settings,
	State,
	StyleOverride,
	TreeBlock,
} from './types';
import { unlock } from '../lock-unlock';
import { LAYOUT_TEMPLATE_LOCKS } from '../components/block-lock/constants';

const { isContentBlock } = unlock( blocksPrivateApis );

const castArray = < T >( maybeArray: T | T[] ): T[] =>
	Array.isArray( maybeArray ) ? maybeArray : [ maybeArray ];

/**
 * A list of private/experimental block editor settings that
 * should not become a part of the WordPress public API.
 * BlockEditorProvider will remove these settings from the
 * settings object it receives.
 *
 * @see https://github.com/WordPress/gutenberg/pull/46131
 */
const privateSettings = [
	'inserterMediaCategories',
	'blockInspectorAnimation',
	'mediaSideload',
];

/**
 * Action that updates the block editor settings and
 * conditionally preserves the experimental ones.
 *
 * @param settings                          Updated settings
 * @param options                           Options object.
 * @param options.stripExperimentalSettings Whether to strip experimental settings.
 * @param options.reset                     Whether to reset the settings.
 * @return Action object
 */
export function __experimentalUpdateSettings(
	settings: Settings,
	{
		stripExperimentalSettings = false,
		reset = false,
	}: { stripExperimentalSettings?: boolean; reset?: boolean } = {}
) {
	let incomingSettings = settings;

	if ( Object.hasOwn( incomingSettings, '__unstableIsPreviewMode' ) ) {
		deprecated(
			"__unstableIsPreviewMode argument in wp.data.dispatch('core/block-editor').updateSettings",
			{
				since: '6.8',
				alternative: 'isPreviewMode',
			}
		);

		incomingSettings = { ...incomingSettings };
		incomingSettings.isPreviewMode =
			incomingSettings.__unstableIsPreviewMode as boolean | undefined;
		delete incomingSettings.__unstableIsPreviewMode;
	}

	let cleanSettings = incomingSettings;

	if ( stripExperimentalSettings ) {
		cleanSettings = {};
		for ( const key in incomingSettings ) {
			if ( ! privateSettings.includes( key ) ) {
				cleanSettings[ key ] = incomingSettings[ key ];
			}
		}
	}
	return {
		type: 'UPDATE_SETTINGS',
		settings: cleanSettings,
		reset,
	};
}

/**
 * Hides the block interface (eg. toolbar, outline, etc.)
 *
 * @return Action object.
 */
export function hideBlockInterface() {
	return {
		type: 'HIDE_BLOCK_INTERFACE',
	};
}

/**
 * Shows the block interface (eg. toolbar, outline, etc.)
 *
 * @return Action object.
 */
export function showBlockInterface() {
	return {
		type: 'SHOW_BLOCK_INTERFACE',
	};
}

/**
 * Yields action objects used in signalling that the blocks corresponding to
 * the set of specified client IDs are to be removed.
 *
 * Compared to `removeBlocks`, this private interface exposes an additional
 * parameter; see `forceRemove`.
 *
 * @param clientIds      Client IDs of blocks to remove.
 * @param selectPrevious True if the previous block
 *                       or the immediate parent
 *                       (if no previous block exists)
 *                       should be selected
 *                       when a block is removed.
 * @param forceRemove    Whether to force the operation,
 *                       bypassing any checks for certain
 *                       block types.
 */
export const privateRemoveBlocks =
	(
		clientIds: string | string[],
		selectPrevious: boolean = true,
		forceRemove: boolean = false
	) =>
	( { select, dispatch, registry }: BlockEditorThunkArgs ) => {
		if ( ! clientIds || ! clientIds.length ) {
			return;
		}

		clientIds = castArray( clientIds );
		const canRemoveBlocks = select.canRemoveBlocks( clientIds );

		if ( ! canRemoveBlocks ) {
			return;
		}

		// In certain editing contexts, we'd like to prevent accidental removal
		// of important blocks. For example, in the site editor, the Query Loop
		// block is deemed important. In such cases, we'll ask the user for
		// confirmation that they intended to remove such block(s). However,
		// the editor instance is responsible for presenting those confirmation
		// prompts to the user. Any instance opting into removal prompts must
		// register using `setBlockRemovalRules()`.
		//
		// @see https://github.com/WordPress/gutenberg/pull/51145
		const rules = ! forceRemove && select.getBlockRemovalRules();

		if ( rules ) {
			function flattenBlocks( blocks: TreeBlock[] ) {
				const result: Omit< TreeBlock, 'innerBlocks' >[] = [];
				const stack = [ ...blocks ];
				while ( stack.length ) {
					const { innerBlocks, ...block } = stack.shift()!;
					stack.push( ...innerBlocks );
					result.push( block );
				}
				return result;
			}

			// Removal only runs for existing blocks.
			const blockList = clientIds.map( select.getBlock ) as TreeBlock[];
			const flattenedBlocks = flattenBlocks( blockList );

			// Find the first message and use it.
			let message;
			for ( const rule of rules ) {
				message = rule.callback( flattenedBlocks );
				if ( message ) {
					dispatch(
						displayBlockRemovalPrompt(
							clientIds,
							selectPrevious,
							message
						)
					);
					return;
				}
			}
		}

		// When the removal covers all the inner blocks of an otherwise
		// unmodified container, remove the container as well: an empty
		// husk requiring a second removal is never the intention.
		let removeRoot = false;
		const rootClientId = select.getBlockRootClientId( clientIds[ 0 ] );
		// A wrapper that only exists as a slot of a larger block (a column
		// in columns) keeps its place: emptying it must not reshape the
		// parent layout.
		if (
			rootClientId &&
			! getBlockType( select.getBlockName( rootClientId )! )?.parent
				?.length
		) {
			const blockOrder = select.getBlockOrder( rootClientId );
			removeRoot =
				blockOrder.length === clientIds.length &&
				blockOrder.every( ( clientId ) =>
					clientIds.includes( clientId )
				) &&
				isUnmodifiedBlock(
					// The check reads the attributes, not the inner blocks.
					select.__unstableGetBlockWithoutInnerBlocks(
						rootClientId
					) as Block
				);
		}

		if ( selectPrevious ) {
			dispatch.selectPreviousBlock(
				removeRoot ? rootClientId! : clientIds[ 0 ],
				selectPrevious
			);
		}

		// We're batching these two actions because an extra `undo/redo` step can
		// be created, based on whether we insert a default block or not.
		registry.batch( () => {
			dispatch( {
				type: 'REMOVE_BLOCKS',
				clientIds: removeRoot ? [ rootClientId ] : clientIds,
			} );
			// To avoid a focus loss when removing the last block, assure there is
			// always a default block if the last of the blocks have been removed.
			dispatch( ensureDefaultBlock() );
		} );
	};

/**
 * Action which will insert a default block insert action if there
 * are no other blocks at the root of the editor. This action should be used
 * in actions which may result in no blocks remaining in the editor (removal,
 * replacement, etc).
 */
export const ensureDefaultBlock =
	() =>
	( { select, dispatch }: BlockEditorThunkArgs ) => {
		// To avoid a focus loss when removing the last block, assure there is
		// always a default block if the last of the blocks have been removed.
		const count = select.getBlockCount();
		if ( count > 0 ) {
			return;
		}

		// If there's an custom appender, don't insert default block.
		// We have to remember to manually move the focus elsewhere to
		// prevent it from being lost though.
		const { __unstableHasCustomAppender } = select.getSettings();
		if ( __unstableHasCustomAppender ) {
			return;
		}

		dispatch.insertDefaultBlock();
	};

/**
 * Returns an action object used in signalling that a block removal prompt must
 * be displayed.
 *
 * Contrast with `setBlockRemovalRules`.
 *
 * @param clientIds      Client IDs of blocks to remove.
 * @param selectPrevious True if the previous block or the
 *                       immediate parent (if no previous
 *                       block exists) should be selected
 *                       when a block is removed.
 * @param message        Message to display in the prompt.
 *
 * @return Action object.
 */
function displayBlockRemovalPrompt(
	clientIds: string | string[],
	selectPrevious: boolean,
	message: RemovalPromptMessage
) {
	return {
		type: 'DISPLAY_BLOCK_REMOVAL_PROMPT',
		clientIds,
		selectPrevious,
		message,
	};
}

/**
 * Returns an action object used in signalling that a block removal prompt must
 * be cleared, either be cause the user has confirmed or canceled the request
 * for removal.
 *
 * @return Action object.
 */
export function clearBlockRemovalPrompt() {
	return {
		type: 'CLEAR_BLOCK_REMOVAL_PROMPT',
	};
}

/**
 * Returns an action object used to set up any rules that a block editor may
 * provide in order to prevent a user from accidentally removing certain
 * blocks. These rules are then used to display a confirmation prompt to the
 * user. For instance, in the Site Editor, the Query Loop block is important
 * enough to warrant such confirmation.
 *
 * IMPORTANT: Registering rules implicitly signals to the `privateRemoveBlocks`
 * action that the editor will be responsible for displaying block removal
 * prompts and confirming deletions. This action is meant to be used by
 * component `BlockRemovalWarningModal` only.
 *
 * The data is a record whose keys are block types (e.g. 'core/query') and
 * whose values are the explanation to be shown to users (e.g. 'Query Loop
 * displays a list of posts or pages.').
 *
 * Contrast with `displayBlockRemovalPrompt`.
 *
 * @param rules Block removal rules.
 * @return Action object.
 */
export function setBlockRemovalRules(
	rules: BlockRemovalRule[] | false = false
) {
	return {
		type: 'SET_BLOCK_REMOVAL_RULES',
		rules,
	};
}

export function setStyleOverride( id: unknown, style: StyleOverride ) {
	return {
		type: 'SET_STYLE_OVERRIDE',
		id,
		style,
	};
}

export function deleteStyleOverride( id: unknown ) {
	return {
		type: 'DELETE_STYLE_OVERRIDE',
		id,
	};
}

/**
 * Action that sets the element that had focus when focus leaves the editor canvas.
 *
 * @param lastFocus The last focused element.
 *
 *
 * @return Action object.
 */
export function setLastFocus( lastFocus: LastFocus | null | false = null ) {
	return {
		type: 'LAST_FOCUS',
		lastFocus,
	};
}

/**
 * Returns an action object used in signalling that the user has begun to drag.
 *
 * @return Action object.
 */
export function startDragging() {
	return {
		type: 'START_DRAGGING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped dragging.
 *
 * @return Action object.
 */
export function stopDragging() {
	return {
		type: 'STOP_DRAGGING',
	};
}

/**
 * @param clientId The block's clientId, or `null` to clear.
 *
 * @return  Action object.
 */
export function expandBlock( clientId: string | null ) {
	return {
		type: 'SET_BLOCK_EXPANDED_IN_LIST_VIEW',
		clientId,
	};
}

/**
 * @param value
 * @param value.rootClientId The root client ID to insert at.
 * @param value.index        The index to insert at.
 *
 * @return Action object.
 */
export function setInsertionPoint( value: InsertionPoint | null ) {
	return {
		type: 'SET_INSERTION_POINT',
		value,
	};
}

/**
 * Mark a contentOnly section as being edited.
 *
 * @param clientId The client id of the block.
 * @return Thunk action.
 */
export const editContentOnlySection =
	( clientId?: string | null ) =>
	( { select, dispatch }: BlockEditorThunkArgs ) => {
		if ( ! clientId ) {
			dispatch( {
				type: 'EDIT_CONTENT_ONLY_SECTION',
				clientId,
			} );
			return;
		}

		const sectionClientId = select.isSectionBlock( clientId )
			? clientId
			: ( select.getParentSectionBlock( clientId ) ?? clientId );

		if ( select.getSelectedBlockClientId() !== clientId ) {
			dispatch.selectBlock( clientId );
		}

		dispatch( {
			type: 'EDIT_CONTENT_ONLY_SECTION',
			clientId: sectionClientId,
		} );
	};

/**
 * Action that stops editing a contentOnly section.
 *
 * @return Thunk action.
 */
export const stopEditingContentOnlySection =
	() =>
	( { select, dispatch }: BlockEditorThunkArgs ) => {
		const editedSectionClientId = select.getEditedContentOnlySection();
		if ( ! editedSectionClientId ) {
			return;
		}

		const selectedClientId = select.getSelectedBlockClientId();
		if ( selectedClientId ) {
			const isWithinEditedSection =
				selectedClientId === editedSectionClientId ||
				select
					.getBlockParents( selectedClientId )
					.includes( editedSectionClientId );

			if (
				isWithinEditedSection &&
				! isContentBlock( select.getBlockName( selectedClientId ) )
			) {
				dispatch.selectBlock( editedSectionClientId );
			}
		}

		dispatch( {
			type: 'EDIT_CONTENT_ONLY_SECTION',
		} );
	};

/**
 * Sets the zoom level.
 *
 * @param zoom the new zoom level
 * @return Action object.
 */
export const setZoomLevel =
	( zoom: State[ 'zoomLevel' ] = 100 ) =>
	( { select, dispatch }: BlockEditorThunkArgs ) => {
		// When switching to zoom-out mode, we need to select the parent section
		if ( zoom !== 100 ) {
			const firstSelectedClientId = select.getBlockSelectionStart();
			const sectionRootClientId = select.getSectionRootClientId();

			if ( firstSelectedClientId ) {
				let sectionClientId;

				if ( sectionRootClientId ) {
					const sectionClientIds =
						select.getBlockOrder( sectionRootClientId );

					// If the selected block is a section block, use it.
					if ( sectionClientIds?.includes( firstSelectedClientId ) ) {
						sectionClientId = firstSelectedClientId;
					} else {
						// If the selected block is not a section block, find
						// the parent section that contains the selected block.
						sectionClientId = select
							.getBlockParents( firstSelectedClientId )
							.find( ( parent ) =>
								sectionClientIds.includes( parent )
							);
					}
				} else {
					sectionClientId = select.getBlockHierarchyRootClientId(
						firstSelectedClientId
					);
				}

				if ( sectionClientId ) {
					dispatch.selectBlock( sectionClientId );
				} else {
					dispatch.clearSelectedBlock();
				}

				speak( __( 'You are currently in zoom-out mode.' ) );
			}
		}

		dispatch( {
			type: 'SET_ZOOM_LEVEL',
			zoom,
		} );
	};

/**
 * Resets the Zoom state.
 * @return Action object.
 */
export function resetZoomLevel() {
	return {
		type: 'RESET_ZOOM_LEVEL',
	};
}

/**
 * Opens the list view content panel popover.
 *
 * @return Action object.
 */
export function openListViewContentPanel() {
	return {
		type: 'OPEN_LIST_VIEW_CONTENT_PANEL',
	};
}

/**
 * Closes the list view content panel popover.
 *
 * @return Action object.
 */
export function closeListViewContentPanel() {
	return {
		type: 'CLOSE_LIST_VIEW_CONTENT_PANEL',
	};
}

/**
 * Returns an action object used to open the viewport modal
 * for the given client IDs.
 *
 * @param clientIds Client IDs of blocks to configure viewport settings for.
 * @return Action object.
 */
export function showViewportModal( clientIds: string[] ) {
	return {
		type: 'SHOW_VIEWPORT_MODAL',
		clientIds,
	};
}

/**
 * Returns an action object used to close the viewport modal.
 *
 * @return Action object.
 */
export function hideViewportModal() {
	return {
		type: 'HIDE_VIEWPORT_MODAL',
	};
}

/**
 * Requests to open a specific inspector tab, optionally with additional options.
 * This action signals intent to switch to a particular tab in the block inspector.
 *
 * @param tabName             The name of the tab to open (e.g., 'list-view', 'settings', 'styles').
 * @param [options]           Optional configuration.
 * @param [options.openPanel] Client ID of a specific panel to open (for tabs that support panels).
 *
 * @return Action object.
 */
export function requestInspectorTab(
	tabName: string,
	options: { openPanel?: string } = {}
) {
	return {
		type: 'REQUEST_INSPECTOR_TAB',
		tabName,
		options,
	};
}

/**
 * Clears the requested inspector tab state after it has been handled.
 *
 * @return Action object.
 */
export function clearRequestedInspectorTab() {
	return {
		type: 'CLEAR_REQUESTED_INSPECTOR_TAB',
	};
}

/**
 * Sets the selected style state for a block's style controls.
 *
 * @param clientId The block client ID.
 * @param value    The selected state value.
 *
 * @return Action object.
 */
export function setSelectedBlockStyleState(
	clientId: string,
	value: Record< string, unknown >
) {
	return {
		type: 'SET_SELECTED_BLOCK_STYLE_STATE',
		clientId,
		value,
	};
}

/**
 * Sets whether the selected style state is shown on the canvas.
 *
 * @param clientId The block client ID.
 * @param value    Whether to show the selected state on the canvas.
 *
 * @return Action object.
 */
export function setSelectedBlockStyleStateCanvasPreview(
	clientId: string,
	value: boolean
) {
	return {
		type: 'SET_SELECTED_BLOCK_STYLE_STATE_CANVAS_PREVIEW',
		clientId,
		value,
	};
}

/**
 * Sets the globally selected viewport style state. When set to a value other
 * than 'default', block style edits in the inspector apply to that viewport.
 * Driven by the editor's device preview while Responsive editing is enabled.
 *
 * @param viewport The selected viewport state (e.g. 'default', 'tablet', 'mobile').
 *
 * @return Action object.
 */
export function setStyleStateViewport( viewport: string ) {
	return {
		type: 'SET_STYLE_STATE_VIEWPORT',
		viewport,
	};
}

/**
 * Sets whether Responsive editing is enabled. When enabled, the device preview
 * also drives which viewport block style edits are applied to. Session-only.
 *
 * @param enabled Whether Responsive editing is enabled.
 *
 * @return Action object.
 */
export function setResponsiveEditing( enabled: boolean ) {
	return {
		type: 'SET_RESPONSIVE_EDITING',
		enabled,
	};
}

/**
 * The lock properties to change. A property left out keeps its value.
 */
export interface BlockLockChanges {
	/**
	 * Whether the block is locked in place.
	 */
	move?: boolean;
	/**
	 * Whether the block is protected from deletion.
	 */
	remove?: boolean;
	/**
	 * Whether the inner layout of the block is locked. Only applies to blocks
	 * whose layout can be locked.
	 */
	layout?: boolean;
	/**
	 * Whether the styles are locked: the controls of the Styles tab can't be
	 * changed. Stored as `lock.styles`.
	 */
	styles?: boolean;
}

/**
 * Locks or unlocks blocks and every block inside them, in a single undo step.
 *
 * Movement and deletion are stored in the `lock` attribute, and the layout
 * lock as `templateLock: 'all'`, which keeps blocks from being added, moved or
 * removed inside, without making the block a content-only section. The layout
 * of an unsynced pattern is locked by the pattern and left as it is: detaching
 * the pattern is what unlocks it. A full unlock also clears any `templateLock`
 * the other blocks carry.
 *
 * Unlocking a property of a block also unlocks it where the blocks above hold
 * it: the styles of locked ancestors, and the layout of a parent that keeps the
 * block in place.
 *
 * A block without a template lock of its own passes on the one of the block
 * above it, so a layout unlock under a block that stays layout-locked is
 * stored as `templateLock: false`, and otherwise by removing the template lock.
 *
 * @param clientIds Client IDs of the blocks to lock or unlock.
 * @param changes   The lock properties to change.
 */
export const setBlocksLock =
	( clientIds: string[], changes: BlockLockChanges ) =>
	( { select, dispatch }: BlockEditorThunkArgs ) => {
		const targetIds = [
			...new Set( [
				...clientIds,
				...select.getClientIdsOfDescendants( clientIds ),
			] ),
		];
		const isFullUnlock =
			changes.move === false &&
			changes.remove === false &&
			changes.layout === false;
		const lockableIds = targetIds.filter( ( clientId ) => {
			const blockName = select.getBlockName( clientId );
			return !! blockName && select.canLockBlockType( blockName );
		} );
		const attributesByClientId: Record<
			string,
			Record< string, unknown >
		> = {};

		// First, the layout lock, which the lock of the blocks inside depends on.
		const nextTemplateLocks = new Map< string, unknown >();
		for ( const clientId of lockableIds ) {
			const attributes = select.getBlockAttributes( clientId ) ?? {};
			const nextAttributes: Record< string, unknown > = {};
			let templateLock = attributes.templateLock;

			// The layout of a pattern is the pattern's: it changes by editing or
			// detaching the pattern, so leave it.
			if (
				changes.layout !== undefined &&
				select.canLayoutLockBlock( clientId ) &&
				! select.isPatternLockedBlock( clientId )
			) {
				if ( changes.layout ) {
					templateLock = 'all';
				} else if (
					isFullUnlock ||
					LAYOUT_TEMPLATE_LOCKS.includes( templateLock as string )
				) {
					templateLock = undefined;
				}
				nextAttributes.templateLock = templateLock;
			}

			nextTemplateLocks.set( clientId, templateLock );
			attributesByClientId[ clientId ] = nextAttributes;
		}

		// Unlocking a property of a block can't leave the blocks above it
		// holding that property locked, so they give it up: an unlocked style
		// unlocks the styles of every locked ancestor, and unlocked movement or
		// deletion unlocks the layout of the parent that keeps the block in
		// place. A pattern keeps its layout, which detaching it unlocks.
		const targetIdSet = new Set( targetIds );
		const ancestorAttributes = new Map<
			string,
			Record< string, unknown >
		>();
		const getAncestorAttributes = ( ancestorId: string ) => {
			if ( ! ancestorAttributes.has( ancestorId ) ) {
				ancestorAttributes.set( ancestorId, {} );
			}
			return ancestorAttributes.get( ancestorId )!;
		};
		for ( const clientId of clientIds ) {
			if ( changes.styles === false ) {
				for ( const ancestorId of select.getBlockParents( clientId ) ) {
					if (
						targetIdSet.has( ancestorId ) ||
						! select.isStylesLockedBlock( ancestorId )
					) {
						continue;
					}
					const ancestorLock = {
						...select.getBlockAttributes( ancestorId )?.lock,
					};
					delete ancestorLock.styles;
					getAncestorAttributes( ancestorId ).lock = Object.keys(
						ancestorLock
					).length
						? ancestorLock
						: undefined;
				}
			}

			const parentId = select.getBlockRootClientId( clientId );
			if (
				! parentId ||
				targetIdSet.has( parentId ) ||
				select.isPatternLockedBlock( parentId )
			) {
				continue;
			}
			const parentTemplateLock =
				select.getBlockAttributes( parentId )?.templateLock;
			const isHeldInPlace =
				( changes.move === false && parentTemplateLock === 'all' ) ||
				( changes.remove === false &&
					( parentTemplateLock === 'all' ||
						parentTemplateLock === 'insert' ) );
			if ( isHeldInPlace ) {
				getAncestorAttributes( parentId ).templateLock = undefined;
			}
		}

		// The template lock a block has of its own once the changes apply, and
		// whether the changes set it.
		const getNextOwnTemplateLock = ( clientId: string ) => {
			const ancestorChange = ancestorAttributes.get( clientId );
			if ( ancestorChange?.hasOwnProperty( 'templateLock' ) ) {
				return { isChanged: true, value: ancestorChange.templateLock };
			}
			if (
				attributesByClientId[ clientId ]?.hasOwnProperty(
					'templateLock'
				)
			) {
				return {
					isChanged: true,
					value: nextTemplateLocks.get( clientId ),
				};
			}
			return {
				isChanged: false,
				value: select.getBlockAttributes( clientId )?.templateLock,
			};
		};

		// The template lock the blocks inside a block get once the changes
		// apply. A block without a template lock of its own passes on the one
		// of the nearest block above that has one.
		const getNextTemplateLock = (
			rootClientId: string | null | undefined
		): unknown => {
			let clientId = rootClientId;
			while ( clientId ) {
				const { isChanged, value } = getNextOwnTemplateLock( clientId );
				if ( value !== undefined ) {
					return value;
				}
				// Nothing changes from here up, so the editor's own answer
				// holds, including a lock its inner blocks set themselves.
				if (
					! isChanged &&
					! select
						.getBlockParents( clientId )
						.some(
							( parentId ) =>
								getNextOwnTemplateLock( parentId ).isChanged
						)
				) {
					return select.getTemplateLock( clientId );
				}
				clientId = select.getBlockRootClientId( clientId );
			}
			return select.getTemplateLock( null );
		};

		// A block whose template lock is cleared would pass on the lock of a
		// block above it instead, so where one still applies, an explicit
		// `false` unlocks the layout. Go top down, so each block sees the
		// final lock of the blocks above it.
		const clearedTemplateLockIds = [
			...ancestorAttributes.keys(),
			...nextTemplateLocks.keys(),
		]
			.filter( ( clientId, index, ids ) => {
				const { isChanged, value } = getNextOwnTemplateLock( clientId );
				return (
					ids.indexOf( clientId ) === index &&
					isChanged &&
					value === undefined
				);
			} )
			.sort(
				( a, b ) =>
					select.getBlockParents( a ).length -
					select.getBlockParents( b ).length
			);
		for ( const clientId of clearedTemplateLockIds ) {
			const inheritedTemplateLock = getNextTemplateLock(
				select.getBlockRootClientId( clientId )
			);
			if (
				inheritedTemplateLock !== 'all' &&
				inheritedTemplateLock !== 'insert'
			) {
				continue;
			}
			if (
				ancestorAttributes
					.get( clientId )
					?.hasOwnProperty( 'templateLock' )
			) {
				ancestorAttributes.get( clientId )!.templateLock = false;
			} else {
				nextTemplateLocks.set( clientId, false );
				attributesByClientId[ clientId ].templateLock = false;
			}
		}

		// Then the lock of each block.
		for ( const clientId of lockableIds ) {
			const attributes = select.getBlockAttributes( clientId ) ?? {};
			const lock = { ...attributes.lock };

			if ( changes.move !== undefined ) {
				lock.move = changes.move;
			}
			if ( changes.remove !== undefined ) {
				lock.remove = changes.remove;
			}
			// Nothing passes a styles lock down, so an unlock removes it. A
			// synced pattern or a template part keeps its styles in itself.
			if ( changes.styles && select.canStylesLockBlock( clientId ) ) {
				lock.styles = true;
			} else if ( changes.styles === false ) {
				delete lock.styles;
			}

			const rootClientId = select.getBlockRootClientId( clientId );
			const isInsideTargets =
				rootClientId !== null && nextTemplateLocks.has( rootClientId );
			const parentTemplateLock = getNextTemplateLock( rootClientId );
			const isLockedByParent =
				parentTemplateLock === 'all' || parentTemplateLock === 'insert';

			let nextLock: typeof lock | undefined = lock;
			if ( isLockedByParent && isInsideTargets ) {
				// An explicit `false` would let the block out of the layout lock
				// of its parent, so keep only what the block locks itself.
				nextLock = Object.fromEntries(
					Object.entries( lock ).filter( ( [ , value ] ) => value )
				);
			}
			// An explicit `false` overrides a template lock inherited from a
			// parent outside the blocks, so keep it only then.
			const needsExplicitUnlock = isLockedByParent && ! isInsideTargets;
			attributesByClientId[ clientId ].lock =
				Object.values( nextLock ).some( Boolean ) || needsExplicitUnlock
					? nextLock
					: undefined;
		}

		for ( const [ ancestorId, attributes ] of ancestorAttributes ) {
			attributesByClientId[ ancestorId ] = attributes;
		}

		const updatedClientIds = Object.keys( attributesByClientId );
		if ( ! updatedClientIds.length ) {
			return;
		}

		dispatch.updateBlockAttributes(
			updatedClientIds,
			attributesByClientId,
			{
				uniqueByBlock: true,
			}
		);
	};
