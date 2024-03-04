/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
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
import { sprintf, __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

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
import { getBlockPositionDescription, focusListItem } from './utils';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';
import { useBlockLock } from '../block-lock';
import AriaReferencedText from './aria-referenced-text';

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

	const { toggleBlockHighlight } = useDispatch( blockEditorStore );

	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle =
		blockInformation?.name || blockInformation?.title || __( 'Untitled' );

	const { block, blockName, blockEditingMode } = useSelect(
		( select ) => {
			const { getBlock, getBlockName, getBlockEditingMode } =
				select( blockEditorStore );

			return {
				block: getBlock( clientId ),
				blockName: getBlockName( clientId ),
				blockEditingMode: getBlockEditingMode( clientId ),
			};
		},
		[ clientId ]
	);
	const allowRightClickOverrides = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().allowRightClickOverrides,
		[]
	);

	const showBlockActions =
		// When a block hides its toolbar it also hides the block settings menu,
		// since that menu is part of the toolbar in the editor canvas.
		// List View respects this by also hiding the block settings menu.
		hasBlockSupport( blockName, '__experimentalToolbar', true ) &&
		// Don't show the settings menu if block is disabled or content only.
		blockEditingMode === 'default';
	const instanceId = useInstanceId( ListViewBlock );
	const descriptionId = `list-view-block-select-button__${ instanceId }`;

	const {
		expand,
		collapse,
		BlockSettingsMenu,
		listViewInstanceId,
		expandedState,
		setInsertedBlock,
		treeGridElementRef,
	} = useListViewContext();

	// If multiple blocks are selected, deselect all blocks when the user
	// presses the escape key.
	const onKeyDown = ( event ) => {
		if (
			event.keyCode === ESCAPE &&
			! event.defaultPrevented &&
			selectedClientIds.length > 0
		) {
			event.stopPropagation();
			event.preventDefault();
			selectBlock( event, undefined );
		}
	};

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

	const blockAriaLabel = isLocked
		? sprintf(
				// translators: %s: The title of the block. This string indicates a link to select the locked block.
				__( '%s (locked)' ),
				blockTitle
		  )
		: blockTitle;

	const settingsAriaLabel = sprintf(
		// translators: %s: The title of the block.
		__( 'Options for %s' ),
		blockTitle
	);

	const hasSiblings = siblingBlockCount > 0;
	const hasRenderedMovers = showBlockMovers && hasSiblings;
	const moverCellClassName = classnames(
		'block-editor-list-view-block__mover-cell',
		{ 'is-visible': isHovered || isSelected }
	);

	const listViewBlockSettingsClassName = classnames(
		'block-editor-list-view-block__menu-cell',
		{ 'is-visible': isHovered || isFirstSelectedBlock }
	);

	let colSpan;
	if ( hasRenderedMovers ) {
		colSpan = 2;
	} else if ( ! showBlockActions ) {
		colSpan = 3;
	}

	const classes = classnames( {
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
							ariaLabel={ blockAriaLabel }
							ariaDescribedBy={ descriptionId }
							updateFocusAndSelection={ updateFocusAndSelection }
						/>
						<AriaReferencedText id={ descriptionId }>
							{ blockPositionDescription }
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
							label={ settingsAriaLabel }
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
