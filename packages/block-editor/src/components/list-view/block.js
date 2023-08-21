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
	useState,
	useRef,
	useEffect,
	useCallback,
	memo,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';
import { focus } from '@wordpress/dom';

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
import { getBlockPositionDescription } from './utils';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';
import { useBlockLock } from '../block-lock';
import AriaReferencedText from './aria-referenced-text';

function ListViewBlock( {
	block: { clientId },
	isDragged,
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
	const [ isHovered, setIsHovered ] = useState( false );

	const { isLocked, canEdit } = useBlockLock( clientId );

	const isFirstSelectedBlock =
		isSelected && selectedClientIds[ 0 ] === clientId;
	const isLastSelectedBlock =
		isSelected &&
		selectedClientIds[ selectedClientIds.length - 1 ] === clientId;

	const { toggleBlockHighlight } = useDispatch( blockEditorStore );

	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = blockInformation?.title || __( 'Untitled' );
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);
	const blockName = useSelect(
		( select ) => select( blockEditorStore ).getBlockName( clientId ),
		[ clientId ]
	);
	const blockEditingMode = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockEditingMode( clientId ),
		[ clientId ]
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

	const {
		isTreeGridMounted,
		expand,
		collapse,
		BlockSettingsMenu,
		listViewInstanceId,
		expandedState,
		setInsertedBlock,
		treeGridElementRef,
	} = useListViewContext();

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

	// If ListView has experimental features related to the Persistent List View,
	// only focus the selected list item on mount; otherwise the list would always
	// try to steal the focus from the editor canvas.
	useEffect( () => {
		if ( ! isTreeGridMounted && isSelected ) {
			cellRef.current.focus();
		}
	}, [] );

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

			const getFocusElement = () => {
				const row = treeGridElementRef.current?.querySelector(
					`[role=row][data-block="${ focusClientId }"]`
				);
				if ( ! row ) return null;
				// Focus the first focusable in the row, which is the ListViewBlockSelectButton.
				return focus.focusable.find( row )[ 0 ];
			};

			let focusElement = getFocusElement();
			if ( focusElement ) {
				focusElement.focus();
			} else {
				// The element hasn't been painted yet. Defer focusing on the next frame.
				// This could happen when all blocks have been deleted and the default block
				// hasn't been added to the editor yet.
				window.requestAnimationFrame( () => {
					focusElement = getFocusElement();
					// Ignore if the element still doesn't exist.
					if ( focusElement ) {
						focusElement.focus();
					}
				} );
			}
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
	} );

	// Only include all selected blocks if the currently clicked on block
	// is one of the selected blocks. This ensures that if a user attempts
	// to alter a block that isn't part of the selection, they're still able
	// to do so.
	const dropdownClientIds = selectedClientIds.includes( clientId )
		? selectedClientIds
		: [ clientId ];

	// Pass in a ref to the row, so that it can be scrolled
	// into view when selected. For long lists, the placeholder for the
	// selected block is also observed, within ListViewLeafPlaceholder.
	useListViewScrollIntoView( {
		isSelected,
		rowItemRef: rowRef,
		selectedClientIds,
	} );

	// Detect if there is a block in the canvas currently being edited and multi-selection is not happening.
	const currentlyEditingBlockInCanvas =
		isSelected && selectedClientIds.length === 1;

	return (
		<ListViewLeaf
			className={ classes }
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
				>
					{ ( { ref, tabIndex, onFocus } ) => (
						<BlockSettingsMenu
							clientIds={ dropdownClientIds }
							block={ block }
							icon={ moreVertical }
							label={ settingsAriaLabel }
							toggleProps={ {
								ref,
								className: 'block-editor-list-view-block__menu',
								tabIndex,
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
