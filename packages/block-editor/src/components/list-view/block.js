/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	hasBlockSupport,
	switchToBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	__experimentalTreeGridCell as TreeGridCell,
	__experimentalTreeGridItem as TreeGridItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { moreVertical } from '@wordpress/icons';
import {
	useCallback,
	useMemo,
	useState,
	useRef,
	memo,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import ListViewLeaf from './leaf';
import useListViewScrollIntoView from './use-list-view-scroll-into-view';
import {
	BlockMoverUpButton,
	BlockMoverDownButton,
} from '../block-mover/button';
import ListViewBlockContents from './block-contents';
import { useListViewContext } from './context';
import {
	getBlockPositionDescription,
	getBlockPropertiesDescription,
	focusListItem,
} from './utils';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';
import { useBlockLock } from '../block-lock';
import AriaReferencedText from './aria-referenced-text';
import { unlock } from '../../lock-unlock';

function ListViewBlock( {
	block: { clientId },
	displacement,
	isAfterDraggedBlocks,
	isDragged,
	isNesting,
	isSelected,
	isBranchSelected,
	selectBlock,
	position,
	level,
	rowCount,
	siblingBlockCount,
	showBlockMovers,
	path,
	isExpanded,
	selectedClientIds,
	isSyncedBranch,
} ) {
	const cellRef = useRef( null );
	const rowRef = useRef( null );
	const settingsRef = useRef( null );
	const [ isHovered, setIsHovered ] = useState( false );
	const [ settingsAnchorRect, setSettingsAnchorRect ] = useState();

	const { isLocked, canEdit, canMove } = useBlockLock( clientId );

	const isFirstSelectedBlock =
		isSelected && selectedClientIds[ 0 ] === clientId;
	const isLastSelectedBlock =
		isSelected &&
		selectedClientIds[ selectedClientIds.length - 1 ] === clientId;

	const {
		toggleBlockHighlight,
		duplicateBlocks,
		multiSelect,
		replaceBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		setOpenedBlockSettingsMenu,
	} = unlock( useDispatch( blockEditorStore ) );

	const {
		canInsertBlockType,
		getSelectedBlockClientIds,
		getPreviousBlockClientId,
		getBlockRootClientId,
		getBlockOrder,
		getBlockParents,
		getBlocksByClientId,
		canRemoveBlocks,
		isGroupable,
	} = useSelect( blockEditorStore );
	const { getGroupingBlockName } = useSelect( blocksStore );

	const blockInformation = useBlockDisplayInformation( clientId );

	const { block, blockName, allowRightClickOverrides } = useSelect(
		( select ) => {
			const { getBlock, getBlockName, getSettings } =
				select( blockEditorStore );

			return {
				block: getBlock( clientId ),
				blockName: getBlockName( clientId ),
				allowRightClickOverrides:
					getSettings().allowRightClickOverrides,
			};
		},
		[ clientId ]
	);

	const showBlockActions =
		// When a block hides its toolbar it also hides the block settings menu,
		// since that menu is part of the toolbar in the editor canvas.
		// List View respects this by also hiding the block settings menu.
		hasBlockSupport( blockName, '__experimentalToolbar', true );
	const instanceId = useInstanceId( ListViewBlock );
	const descriptionId = `list-view-block-select-button__description-${ instanceId }`;

	const {
		expand,
		collapse,
		collapseAll,
		BlockSettingsMenu,
		listViewInstanceId,
		expandedState,
		setInsertedBlock,
		treeGridElementRef,
		rootClientId,
	} = useListViewContext();
	const isMatch = useShortcutEventMatch();

	// Determine which blocks to update:
	// If the current (focused) block is part of the block selection, use the whole selection.
	// If the focused block is not part of the block selection, only update the focused block.
	function getBlocksToUpdate() {
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const isUpdatingSelectedBlocks =
			selectedBlockClientIds.includes( clientId );
		const firstBlockClientId = isUpdatingSelectedBlocks
			? selectedBlockClientIds[ 0 ]
			: clientId;
		const firstBlockRootClientId =
			getBlockRootClientId( firstBlockClientId );

		const blocksToUpdate = isUpdatingSelectedBlocks
			? selectedBlockClientIds
			: [ clientId ];

		return {
			blocksToUpdate,
			firstBlockClientId,
			firstBlockRootClientId,
			selectedBlockClientIds,
		};
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	async function onKeyDown( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		// Do not handle events if it comes from modals;
		// retain the default behavior for these keys.
		if ( event.target.closest( '[role=dialog]' ) ) {
			return;
		}

		const isDeleteKey = [ BACKSPACE, DELETE ].includes( event.keyCode );

		// If multiple blocks are selected, deselect all blocks when the user
		// presses the escape key.
		if (
			isMatch( 'core/block-editor/unselect', event ) &&
			selectedClientIds.length > 0
		) {
			event.stopPropagation();
			event.preventDefault();
			selectBlock( event, undefined );
		} else if (
			isDeleteKey ||
			isMatch( 'core/block-editor/remove', event )
		) {
			const {
				blocksToUpdate: blocksToDelete,
				firstBlockClientId,
				firstBlockRootClientId,
				selectedBlockClientIds,
			} = getBlocksToUpdate();

			// Don't update the selection if the blocks cannot be deleted.
			if ( ! canRemoveBlocks( blocksToDelete ) ) {
				return;
			}

			let blockToFocus =
				getPreviousBlockClientId( firstBlockClientId ) ??
				// If the previous block is not found (when the first block is deleted),
				// fallback to focus the parent block.
				firstBlockRootClientId;

			removeBlocks( blocksToDelete, false );

			// Update the selection if the original selection has been removed.
			const shouldUpdateSelection =
				selectedBlockClientIds.length > 0 &&
				getSelectedBlockClientIds().length === 0;

			// If there's no previous block nor parent block, focus the first block.
			if ( ! blockToFocus ) {
				blockToFocus = getBlockOrder()[ 0 ];
			}

			updateFocusAndSelection( blockToFocus, shouldUpdateSelection );
		} else if ( isMatch( 'core/block-editor/duplicate', event ) ) {
			event.preventDefault();

			const { blocksToUpdate, firstBlockRootClientId } =
				getBlocksToUpdate();

			const canDuplicate = getBlocksByClientId( blocksToUpdate ).every(
				( blockToUpdate ) => {
					return (
						!! blockToUpdate &&
						hasBlockSupport(
							blockToUpdate.name,
							'multiple',
							true
						) &&
						canInsertBlockType(
							blockToUpdate.name,
							firstBlockRootClientId
						)
					);
				}
			);

			if ( canDuplicate ) {
				const updatedBlocks = await duplicateBlocks(
					blocksToUpdate,
					false
				);

				if ( updatedBlocks?.length ) {
					// If blocks have been duplicated, focus the first duplicated block.
					updateFocusAndSelection( updatedBlocks[ 0 ], false );
				}
			}
		} else if ( isMatch( 'core/block-editor/insert-before', event ) ) {
			event.preventDefault();

			const { blocksToUpdate } = getBlocksToUpdate();
			await insertBeforeBlock( blocksToUpdate[ 0 ] );
			const newlySelectedBlocks = getSelectedBlockClientIds();

			// Focus the first block of the newly inserted blocks, to keep focus within the list view.
			setOpenedBlockSettingsMenu( undefined );
			updateFocusAndSelection( newlySelectedBlocks[ 0 ], false );
		} else if ( isMatch( 'core/block-editor/insert-after', event ) ) {
			event.preventDefault();

			const { blocksToUpdate } = getBlocksToUpdate();
			await insertAfterBlock( blocksToUpdate.at( -1 ) );
			const newlySelectedBlocks = getSelectedBlockClientIds();

			// Focus the first block of the newly inserted blocks, to keep focus within the list view.
			setOpenedBlockSettingsMenu( undefined );
			updateFocusAndSelection( newlySelectedBlocks[ 0 ], false );
		} else if ( isMatch( 'core/block-editor/select-all', event ) ) {
			event.preventDefault();

			const { firstBlockRootClientId, selectedBlockClientIds } =
				getBlocksToUpdate();
			const blockClientIds = getBlockOrder( firstBlockRootClientId );
			if ( ! blockClientIds.length ) {
				return;
			}

			// If we have selected all sibling nested blocks, try selecting up a level.
			// This is a similar implementation to that used by `useSelectAll`.
			// `isShallowEqual` is used for the list view instead of a length check,
			// as the array of siblings of the currently focused block may be a different
			// set of blocks from the current block selection if the user is focused
			// on a different part of the list view from the block selection.
			if ( isShallowEqual( selectedBlockClientIds, blockClientIds ) ) {
				// Only select up a level if the first block is not the root block.
				// This ensures that the block selection can't break out of the root block
				// used by the list view, if the list view is only showing a partial hierarchy.
				if (
					firstBlockRootClientId &&
					firstBlockRootClientId !== rootClientId
				) {
					updateFocusAndSelection( firstBlockRootClientId, true );
					return;
				}
			}

			// Select all while passing `null` to skip focusing to the editor canvas,
			// and retain focus within the list view.
			multiSelect(
				blockClientIds[ 0 ],
				blockClientIds[ blockClientIds.length - 1 ],
				null
			);
		} else if ( isMatch( 'core/block-editor/collapse-list-view', event ) ) {
			event.preventDefault();
			const { firstBlockClientId } = getBlocksToUpdate();
			const blockParents = getBlockParents( firstBlockClientId, false );
			// Collapse all blocks.
			collapseAll();
			// Expand all parents of the current block.
			expand( blockParents );
		} else if ( isMatch( 'core/block-editor/group', event ) ) {
			const { blocksToUpdate } = getBlocksToUpdate();
			if ( blocksToUpdate.length > 1 && isGroupable( blocksToUpdate ) ) {
				event.preventDefault();
				const blocks = getBlocksByClientId( blocksToUpdate );
				const groupingBlockName = getGroupingBlockName();
				const newBlocks = switchToBlockType(
					blocks,
					groupingBlockName
				);
				replaceBlocks( blocksToUpdate, newBlocks );
				speak( __( 'Selected blocks are grouped.' ) );
				const newlySelectedBlocks = getSelectedBlockClientIds();
				// Focus the first block of the newly inserted blocks, to keep focus within the list view.
				setOpenedBlockSettingsMenu( undefined );
				updateFocusAndSelection( newlySelectedBlocks[ 0 ], false );
			}
		}
	}

	const onMouseEnter = useCallback( () => {
		setIsHovered( true );
		toggleBlockHighlight( clientId, true );
	}, [ clientId, setIsHovered, toggleBlockHighlight ] );
	const onMouseLeave = useCallback( () => {
		setIsHovered( false );
		toggleBlockHighlight( clientId, false );
	}, [ clientId, setIsHovered, toggleBlockHighlight ] );

	const selectEditorBlock = useCallback(
		( event ) => {
			selectBlock( event, clientId );
			event.preventDefault();
		},
		[ clientId, selectBlock ]
	);

	const updateFocusAndSelection = useCallback(
		( focusClientId, shouldSelectBlock ) => {
			if ( shouldSelectBlock ) {
				selectBlock( undefined, focusClientId, null, null );
			}

			focusListItem( focusClientId, treeGridElementRef?.current );
		},
		[ selectBlock, treeGridElementRef ]
	);

	const toggleExpanded = useCallback(
		( event ) => {
			// Prevent shift+click from opening link in a new window when toggling.
			event.preventDefault();
			event.stopPropagation();
			if ( isExpanded === true ) {
				collapse( clientId );
			} else if ( isExpanded === false ) {
				expand( clientId );
			}
		},
		[ clientId, expand, collapse, isExpanded ]
	);

	// Allow right-clicking an item in the List View to open up the block settings dropdown.
	const onContextMenu = useCallback(
		( event ) => {
			if ( showBlockActions && allowRightClickOverrides ) {
				settingsRef.current?.click();
				// Ensure the position of the settings dropdown is at the cursor.
				setSettingsAnchorRect(
					new window.DOMRect( event.clientX, event.clientY, 0, 0 )
				);
				event.preventDefault();
			}
		},
		[ allowRightClickOverrides, settingsRef, showBlockActions ]
	);

	const onMouseDown = useCallback(
		( event ) => {
			// Prevent right-click from focusing the block,
			// because focus will be handled when opening the block settings dropdown.
			if ( allowRightClickOverrides && event.button === 2 ) {
				event.preventDefault();
			}
		},
		[ allowRightClickOverrides ]
	);

	const settingsPopoverAnchor = useMemo( () => {
		const { ownerDocument } = rowRef?.current || {};

		// If no custom position is set, the settings dropdown will be anchored to the
		// DropdownMenu toggle button.
		if ( ! settingsAnchorRect || ! ownerDocument ) {
			return undefined;
		}

		// Position the settings dropdown at the cursor when right-clicking a block.
		return {
			ownerDocument,
			getBoundingClientRect() {
				return settingsAnchorRect;
			},
		};
	}, [ settingsAnchorRect ] );

	const clearSettingsAnchorRect = useCallback( () => {
		// Clear the custom position for the settings dropdown so that it is restored back
		// to being anchored to the DropdownMenu toggle button.
		setSettingsAnchorRect( undefined );
	}, [ setSettingsAnchorRect ] );

	// Pass in a ref to the row, so that it can be scrolled
	// into view when selected. For long lists, the placeholder for the
	// selected block is also observed, within ListViewLeafPlaceholder.
	useListViewScrollIntoView( {
		isSelected,
		rowItemRef: rowRef,
		selectedClientIds,
	} );

	// When switching between rendering modes (such as template preview and content only),
	// it is possible for a block to temporarily be unavailable. In this case, we should not
	// render the leaf, to avoid errors further down the tree.
	if ( ! block ) {
		return null;
	}

	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingBlockCount,
		level
	);

	const blockPropertiesDescription = getBlockPropertiesDescription(
		blockInformation,
		isLocked
	);

	const hasSiblings = siblingBlockCount > 0;
	const hasRenderedMovers = showBlockMovers && hasSiblings;
	const moverCellClassName = clsx(
		'block-editor-list-view-block__mover-cell',
		{ 'is-visible': isHovered || isSelected }
	);

	const listViewBlockSettingsClassName = clsx(
		'block-editor-list-view-block__menu-cell',
		{ 'is-visible': isHovered || isFirstSelectedBlock }
	);

	let colSpan;
	if ( hasRenderedMovers ) {
		colSpan = 2;
	} else if ( ! showBlockActions ) {
		colSpan = 3;
	}

	const classes = clsx( {
		'is-selected': isSelected,
		'is-first-selected': isFirstSelectedBlock,
		'is-last-selected': isLastSelectedBlock,
		'is-branch-selected': isBranchSelected,
		'is-synced-branch': isSyncedBranch,
		'is-dragging': isDragged,
		'has-single-cell': ! showBlockActions,
		'is-synced': blockInformation?.isSynced,
		'is-draggable': canMove,
		'is-displacement-normal': displacement === 'normal',
		'is-displacement-up': displacement === 'up',
		'is-displacement-down': displacement === 'down',
		'is-after-dragged-blocks': isAfterDraggedBlocks,
		'is-nesting': isNesting,
	} );

	// Only include all selected blocks if the currently clicked on block
	// is one of the selected blocks. This ensures that if a user attempts
	// to alter a block that isn't part of the selection, they're still able
	// to do so.
	const dropdownClientIds = selectedClientIds.includes( clientId )
		? selectedClientIds
		: [ clientId ];

	// Detect if there is a block in the canvas currently being edited and multi-selection is not happening.
	const currentlyEditingBlockInCanvas =
		isSelected && selectedClientIds.length === 1;

	return (
		<ListViewLeaf
			className={ classes }
			isDragged={ isDragged }
			onKeyDown={ onKeyDown }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			onFocus={ onMouseEnter }
			onBlur={ onMouseLeave }
			level={ level }
			position={ position }
			rowCount={ rowCount }
			path={ path }
			id={ `list-view-${ listViewInstanceId }-block-${ clientId }` }
			data-block={ clientId }
			data-expanded={ canEdit ? isExpanded : undefined }
			ref={ rowRef }
		>
			<TreeGridCell
				className="block-editor-list-view-block__contents-cell"
				colSpan={ colSpan }
				ref={ cellRef }
				aria-selected={ !! isSelected }
			>
				{ ( { ref, tabIndex, onFocus } ) => (
					<div className="block-editor-list-view-block__contents-container">
						<ListViewBlockContents
							block={ block }
							onClick={ selectEditorBlock }
							onContextMenu={ onContextMenu }
							onMouseDown={ onMouseDown }
							onToggleExpanded={ toggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							ref={ ref }
							tabIndex={
								currentlyEditingBlockInCanvas ? 0 : tabIndex
							}
							onFocus={ onFocus }
							isExpanded={ canEdit ? isExpanded : undefined }
							selectedClientIds={ selectedClientIds }
							ariaDescribedBy={ descriptionId }
						/>
						<AriaReferencedText id={ descriptionId }>
							{ [
								blockPositionDescription,
								blockPropertiesDescription,
							]
								.filter( Boolean )
								.join( ' ' ) }
						</AriaReferencedText>
					</div>
				) }
			</TreeGridCell>
			{ hasRenderedMovers && (
				<>
					<TreeGridCell
						className={ moverCellClassName }
						withoutGridItem
					>
						<TreeGridItem>
							{ ( { ref, tabIndex, onFocus } ) => (
								<BlockMoverUpButton
									orientation="vertical"
									clientIds={ [ clientId ] }
									ref={ ref }
									tabIndex={ tabIndex }
									onFocus={ onFocus }
								/>
							) }
						</TreeGridItem>
						<TreeGridItem>
							{ ( { ref, tabIndex, onFocus } ) => (
								<BlockMoverDownButton
									orientation="vertical"
									clientIds={ [ clientId ] }
									ref={ ref }
									tabIndex={ tabIndex }
									onFocus={ onFocus }
								/>
							) }
						</TreeGridItem>
					</TreeGridCell>
				</>
			) }

			{ showBlockActions && BlockSettingsMenu && (
				<TreeGridCell
					className={ listViewBlockSettingsClassName }
					aria-selected={ !! isSelected }
					ref={ settingsRef }
				>
					{ ( { ref, tabIndex, onFocus } ) => (
						<BlockSettingsMenu
							clientIds={ dropdownClientIds }
							block={ block }
							icon={ moreVertical }
							label={ __( 'Options' ) }
							popoverProps={ {
								anchor: settingsPopoverAnchor, // Used to position the settings at the cursor on right-click.
							} }
							toggleProps={ {
								ref,
								className: 'block-editor-list-view-block__menu',
								tabIndex,
								onClick: clearSettingsAnchorRect,
								onFocus,
							} }
							disableOpenOnArrowDown
							expand={ expand }
							expandedState={ expandedState }
							setInsertedBlock={ setInsertedBlock }
							__experimentalSelectBlock={
								updateFocusAndSelection
							}
						/>
					) }
				</TreeGridCell>
			) }
		</ListViewLeaf>
	);
}

export default memo( ListViewBlock );
