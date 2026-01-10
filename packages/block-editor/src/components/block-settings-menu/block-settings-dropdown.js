/**
 * WordPress dependencies
 */
import {
	getBlockType,
	serialize,
	store as blocksStore,
} from '@wordpress/blocks';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { moreVertical } from '@wordpress/icons';
import { Children, cloneElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { pipe, useCopyToClipboard } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import CommentIconSlotFill from '../../components/collab/block-comment-icon-slot';
import BlockHTMLConvertButton from './block-html-convert-button';
import __unstableBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';
import BlockParentSelectorMenuItem from './block-parent-selector-menu-item';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useNotifyCopy } from '../../utils/use-notify-copy';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
};

function CopyMenuItem( {
	clientIds,
	onCopy,
	label,
	shortcut,
	eventType = 'copy',
	__experimentalUpdateSelection: updateSelection = false,
} ) {
	const { getBlocksByClientId } = useSelect( blockEditorStore );
	const { removeBlocks } = useDispatch( blockEditorStore );
	const notifyCopy = useNotifyCopy();
	const ref = useCopyToClipboard(
		() => serialize( getBlocksByClientId( clientIds ) ),
		() => {
			switch ( eventType ) {
				case 'copy':
				case 'copyStyles':
					onCopy();
					notifyCopy( eventType, clientIds );
					break;
				case 'cut':
					notifyCopy( eventType, clientIds );
					removeBlocks( clientIds, updateSelection );
					break;
				default:
					break;
			}
		}
	);
	const copyMenuItemLabel = label ? label : __( 'Copy' );
	return (
		<MenuItem ref={ ref } shortcut={ shortcut }>
			{ copyMenuItemLabel }
		</MenuItem>
	);
}

export function BlockSettingsDropdown( {
	block,
	clientIds,
	children,
	__experimentalSelectBlock,
	expand,
	collapse,
	expandedState,
	...props
} ) {
	// Get the client id of the current block for this menu, if one is set.
	const count = clientIds.length;
	const firstBlockClientId = clientIds[ 0 ];

	const {
		firstParentClientId,
		parentBlockType,
		previousBlockClientId,
		selectedBlockClientIds,
		isContentOnly,
		isZoomOut,
	} = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockRootClientId,
				getPreviousBlockClientId,
				getSelectedBlockClientIds,
				getBlockAttributes,
				getBlockEditingMode,
				isZoomOut: _isZoomOut,
			} = unlock( select( blockEditorStore ) );

			const { getActiveBlockVariation } = select( blocksStore );

			const _firstParentClientId =
				getBlockRootClientId( firstBlockClientId );
			const parentBlockName =
				_firstParentClientId && getBlockName( _firstParentClientId );

			return {
				firstParentClientId: _firstParentClientId,
				parentBlockType:
					_firstParentClientId &&
					( getActiveBlockVariation(
						parentBlockName,
						getBlockAttributes( _firstParentClientId )
					) ||
						getBlockType( parentBlockName ) ),
				previousBlockClientId:
					getPreviousBlockClientId( firstBlockClientId ),
				selectedBlockClientIds: getSelectedBlockClientIds(),
				isContentOnly:
					getBlockEditingMode( firstBlockClientId ) === 'contentOnly',
				isZoomOut: _isZoomOut(),
			};
		},
		[ firstBlockClientId ]
	);

	const { getBlockOrder, getSelectedBlockClientIds, getBlocks } =
		useSelect( blockEditorStore );

	const shortcuts = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			copy: getShortcutRepresentation( 'core/block-editor/copy' ),
			cut: getShortcutRepresentation( 'core/block-editor/cut' ),
			duplicate: getShortcutRepresentation(
				'core/block-editor/duplicate'
			),
			remove: getShortcutRepresentation( 'core/block-editor/remove' ),
			insertAfter: getShortcutRepresentation(
				'core/block-editor/insert-after'
			),
			insertBefore: getShortcutRepresentation(
				'core/block-editor/insert-before'
			),
		};
	}, [] );
	const hasSelectedBlocks = selectedBlockClientIds.length > 0;

	async function updateSelectionAfterDuplicate( clientIdsPromise ) {
		if ( ! __experimentalSelectBlock ) {
			return;
		}

		const ids = await clientIdsPromise;
		if ( ids && ids[ 0 ] ) {
			__experimentalSelectBlock( ids[ 0 ], false );
		}
	}

	function updateSelectionAfterRemove() {
		if ( ! __experimentalSelectBlock ) {
			return;
		}

		let blockToFocus = previousBlockClientId || firstParentClientId;

		// Focus the first block if there's no previous block nor parent block.
		if ( ! blockToFocus ) {
			blockToFocus = getBlockOrder()[ 0 ];
		}

		// Only update the selection if the original selection is removed.
		const shouldUpdateSelection =
			hasSelectedBlocks && getSelectedBlockClientIds().length === 0;

		__experimentalSelectBlock( blockToFocus, shouldUpdateSelection );
	}

	// This can occur when the selected block (the parent)
	// displays child blocks within a List View.
	const parentBlockIsSelected =
		selectedBlockClientIds?.includes( firstParentClientId );

	const shouldShowBlockParentMenuItem =
		! parentBlockIsSelected && !! firstParentClientId;

	// Only show expand/collapse options if we're in List View context
	// (expand, collapse, and expandedState are only passed from List View)
	const showExpandCollapseOptions = expand && collapse && expandedState;

	// Helper functions for expand/collapse - defined inline to avoid import issues
	function hasInnerBlocksHelper( clientId ) {
		try {
			const innerBlocks = getBlocks( clientId );
			return innerBlocks && innerBlocks.length > 0;
		} catch ( error ) {
			return false;
		}
	}

	function getAllDescendantIdsHelper( clientId ) {
		try {
			const innerBlocks = getBlocks( clientId );
			const descendants = [];

			if ( ! innerBlocks ) {
				return descendants;
			}

			innerBlocks.forEach( ( innerBlock ) => {
				if ( innerBlock && innerBlock.clientId ) {
					descendants.push( innerBlock.clientId );
					descendants.push(
						...getAllDescendantIdsHelper( innerBlock.clientId )
					);
				}
			} );

			return descendants;
		} catch ( error ) {
			return [];
		}
	}

	function handleExpandRecursively() {
		if ( ! expand ) {
			return;
		}

		// Expand all selected blocks and their descendants
		const allIdsToExpand = [];
		clientIds.forEach( ( clientId ) => {
			allIdsToExpand.push( clientId );
			allIdsToExpand.push( ...getAllDescendantIdsHelper( clientId ) );
		} );

		expand( allIdsToExpand );
	}

	function handleCollapseChildren() {
		if ( ! collapse ) {
			return;
		}

		// Collapse all selected blocks and their descendants
		clientIds.forEach( ( clientId ) => {
			collapse( clientId );
			const descendantIds = getAllDescendantIdsHelper( clientId );
			descendantIds.forEach( ( childId ) => {
				collapse( childId );
			} );
		} );
	}

	return (
		<BlockActions
			clientIds={ clientIds }
			__experimentalUpdateSelection={ ! __experimentalSelectBlock }
		>
			{ ( {
				canCopyStyles,
				canDuplicate,
				canInsertBlock,
				canRemove,
				onDuplicate,
				onInsertAfter,
				onInsertBefore,
				onRemove,
				onCopy,
				onPasteStyles,
			} ) => {
				// It is possible that some plugins register fills for this menu
				// even if Core doesn't render anything in the block settings menu.
				// in which case, we may want to render the menu anyway.
				// That said for now, we can start more conservative.
				const isEmpty =
					! canRemove &&
					! canDuplicate &&
					! canInsertBlock &&
					isContentOnly;

				if ( isEmpty ) {
					return null;
				}

				return (
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Options' ) }
						className="block-editor-block-settings-menu"
						popoverProps={ POPOVER_PROPS }
						noIcons
						{ ...props }
					>
						{ ( { onClose } ) => {
							// Calculate these values only when the menu is opened
							// to avoid performance issues during render
							let blockHasChildren = false;
							let canExpandRecursively = false;
							let canCollapseChildren = false;

							if ( showExpandCollapseOptions ) {
								// Check all selected blocks
								let anyBlockHasChildren = false;
								let anyBlockIsCollapsed = false;
								let anyBlockIsExpanded = false;

								clientIds.forEach( ( clientId ) => {
									const hasChildren =
										hasInnerBlocksHelper( clientId );

									if ( hasChildren ) {
										anyBlockHasChildren = true;

										const isInState =
											clientId in expandedState;
										const isExplicitlyCollapsed =
											expandedState[ clientId ] === false;
										const isCollapsed =
											! isInState ||
											isExplicitlyCollapsed;

										if ( isCollapsed ) {
											anyBlockIsCollapsed = true;

											// Also check if this block has collapsed descendants
											const descendants =
												getAllDescendantIdsHelper(
													clientId
												);
											descendants.forEach(
												( descendantId ) => {
													const descendantHasChildren =
														hasInnerBlocksHelper(
															descendantId
														);
													if (
														descendantHasChildren
													) {
														const descIsInState =
															descendantId in
															expandedState;
														const descIsCollapsed =
															! descIsInState ||
															expandedState[
																descendantId
															] === false;
														if ( descIsCollapsed ) {
															anyBlockIsCollapsed = true;
														}
													}
												}
											);
										} else {
											anyBlockIsExpanded = true;
										}
									}
								} );

								blockHasChildren = anyBlockHasChildren;
								canExpandRecursively = anyBlockIsCollapsed;
								canCollapseChildren = anyBlockIsExpanded;
							}

							return (
								<>
									<MenuGroup>
										<__unstableBlockSettingsMenuFirstItem.Slot
											fillProps={ { onClose } }
										/>
										{ shouldShowBlockParentMenuItem && (
											<BlockParentSelectorMenuItem
												parentClientId={
													firstParentClientId
												}
												parentBlockType={
													parentBlockType
												}
											/>
										) }
										{ count === 1 && (
											<BlockHTMLConvertButton
												clientId={ firstBlockClientId }
											/>
										) }
										{ ! isContentOnly && (
											<CopyMenuItem
												clientIds={ clientIds }
												onCopy={ onCopy }
												shortcut={ shortcuts.copy }
											/>
										) }
										{ ! isContentOnly && (
											<CopyMenuItem
												clientIds={ clientIds }
												label={ __( 'Cut' ) }
												eventType="cut"
												shortcut={ shortcuts.cut }
												__experimentalUpdateSelection={
													! __experimentalSelectBlock
												}
											/>
										) }
										{ canDuplicate && (
											<MenuItem
												onClick={ pipe(
													onClose,
													onDuplicate,
													updateSelectionAfterDuplicate
												) }
												shortcut={ shortcuts.duplicate }
											>
												{ __( 'Duplicate' ) }
											</MenuItem>
										) }
										{ canInsertBlock && ! isZoomOut && (
											<>
												<MenuItem
													onClick={ pipe(
														onClose,
														onInsertBefore
													) }
													shortcut={
														shortcuts.insertBefore
													}
												>
													{ __( 'Add before' ) }
												</MenuItem>
												<MenuItem
													onClick={ pipe(
														onClose,
														onInsertAfter
													) }
													shortcut={
														shortcuts.insertAfter
													}
												>
													{ __( 'Add after' ) }
												</MenuItem>
											</>
										) }
										{ count === 1 && (
											<CommentIconSlotFill.Slot
												fillProps={ {
													clientId:
														firstBlockClientId,
													onClose,
												} }
											/>
										) }
									</MenuGroup>
									{ showExpandCollapseOptions &&
										blockHasChildren &&
										( canExpandRecursively ||
											canCollapseChildren ) && (
											<MenuGroup>
												{ canExpandRecursively && (
													<MenuItem
														onClick={ pipe(
															onClose,
															handleExpandRecursively
														) }
													>
														{ __(
															'Expand all blocks'
														) }
													</MenuItem>
												) }
												{ canCollapseChildren && (
													<MenuItem
														onClick={ pipe(
															onClose,
															handleCollapseChildren
														) }
													>
														{ __(
															'Collapse nested blocks'
														) }
													</MenuItem>
												) }
											</MenuGroup>
										) }
									{ canCopyStyles && ! isContentOnly && (
										<MenuGroup>
											<CopyMenuItem
												clientIds={ clientIds }
												onCopy={ onCopy }
												label={ __( 'Copy styles' ) }
												eventType="copyStyles"
											/>
											<MenuItem onClick={ onPasteStyles }>
												{ __( 'Paste styles' ) }
											</MenuItem>
										</MenuGroup>
									) }
									{ ! isContentOnly && (
										<BlockSettingsMenuControls.Slot
											fillProps={ {
												onClose,
												count,
												firstBlockClientId,
											} }
											clientIds={ clientIds }
										/>
									) }
									{ typeof children === 'function'
										? children( { onClose } )
										: Children.map( ( child ) =>
												cloneElement( child, {
													onClose,
												} )
										  ) }
									{ canRemove && (
										<MenuGroup>
											<MenuItem
												onClick={ pipe(
													onClose,
													onRemove,
													updateSelectionAfterRemove
												) }
												shortcut={ shortcuts.remove }
											>
												{ __( 'Delete' ) }
											</MenuItem>
										</MenuGroup>
									) }
								</>
							);
						} }
					</DropdownMenu>
				);
			} }
		</BlockActions>
	);
}

export default BlockSettingsDropdown;
