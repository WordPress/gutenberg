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
import { chevronDown, chevronUp, moreVertical } from '@wordpress/icons';
import {
	Children,
	cloneElement,
	useCallback,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { pipe, useCopyToClipboard, useMergeRefs } from '@wordpress/compose';

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
	isContentOnlyListView,
	expand,
	expandedState,
	setInsertedBlock,
	toggleProps,
	popoverProps: callerPopoverProps,
	...props
} ) {
	// Get the client id of the current block for this menu, if one is set.
	const count = clientIds.length;
	const firstBlockClientId = clientIds[ 0 ];

	// Capture the toggle button element so fills can use it as a popover anchor.
	const [ toggleElement, setToggleElement ] = useState( null );
	const toggleRef = useCallback( ( node ) => setToggleElement( node ), [] );
	const mergedToggleRef = useMergeRefs( [ toggleRef, toggleProps?.ref ] );
	const mergedToggleProps = {
		...toggleProps,
		ref: mergedToggleRef,
	};

	// Fills can hide the dropdown content (e.g. while showing a secondary UI)
	// while keeping the dropdown mounted so focus can return to the fill's
	// menu item on cancel.
	const [ dropdownContentHidden, setDropdownContentHidden ] =
		useState( false );

	const {
		firstParentClientId,
		parentBlockType,
		previousBlockClientId,
		selectedBlockClientIds,
		isContentOnly,
		isZoomOut,
		canEdit,
		canMove,
		isFirst,
		isLast,
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
				canEditBlock,
				canMoveBlocks,
				getBlockIndex,
				getBlockCount,
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
				canEdit: canEditBlock( firstBlockClientId ),
				canMove: canMoveBlocks( clientIds ),
				isFirst: getBlockIndex( firstBlockClientId ) === 0,
				isLast:
					getBlockIndex( firstBlockClientId ) ===
					getBlockCount( _firstParentClientId ) - 1,
			};
		},
		[ firstBlockClientId, clientIds ]
	);

	const { getBlockOrder, getSelectedBlockClientIds } =
		useSelect( blockEditorStore );

	const { moveBlocksDown, moveBlocksUp } = useDispatch( blockEditorStore );

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
				// Hide the dropdown when there are no actions.
				// It is possible that some plugins register fills
				// for this menu even if Core doesn't render anything,
				// in which case we may want to render the menu anyway.
				// That said for now, we can start more conservative.
				const isEmpty =
					! canRemove &&
					! canDuplicate &&
					! canInsertBlock &&
					isContentOnly;

				if ( isEmpty ) {
					return null;
				}

				// When a fill hides the dropdown content (e.g. while
				// showing LinkUI), prevent the dropdown from closing
				// on outside focus so the fill stays mounted.
				const popoverProps = dropdownContentHidden
					? {
							...POPOVER_PROPS,
							...callerPopoverProps,
							style: { visibility: 'hidden' },
							onFocusOutside() {},
					  }
					: {
							...POPOVER_PROPS,
							...callerPopoverProps,
					  };

				return (
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Options' ) }
						className="block-editor-block-settings-menu"
						popoverProps={ popoverProps }
						noIcons
						{ ...props }
						toggleProps={ mergedToggleProps }
					>
						{ ( { onClose } ) => (
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
											parentBlockType={ parentBlockType }
										/>
									) }
									{ canMove && isContentOnlyListView && (
										<>
											<MenuItem
												icon={ chevronUp }
												disabled={ isFirst }
												accessibleWhenDisabled
												onClick={ pipe( onClose, () => {
													moveBlocksUp(
														clientIds,
														firstParentClientId
													);
												} ) }
											>
												{ __( 'Move up' ) }
											</MenuItem>
											<MenuItem
												icon={ chevronDown }
												disabled={ isLast }
												accessibleWhenDisabled
												onClick={ pipe( onClose, () => {
													moveBlocksDown(
														clientIds,
														firstParentClientId
													);
												} ) }
											>
												{ __( 'Move down' ) }
											</MenuItem>
										</>
									) }
									{ canEdit && count === 1 && (
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
									{ canRemove && ! isContentOnly && (
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
									{ canEdit && count === 1 && (
										<CommentIconSlotFill.Slot
											fillProps={ {
												clientId: firstBlockClientId,
												onClose,
											} }
										/>
									) }
								</MenuGroup>
								{ canCopyStyles && ! isContentOnly && (
									<MenuGroup>
										<CopyMenuItem
											clientIds={ clientIds }
											onCopy={ onCopy }
											label={ __( 'Copy styles' ) }
											eventType="copyStyles"
										/>
										{ canEdit && (
											<MenuItem onClick={ onPasteStyles }>
												{ __( 'Paste styles' ) }
											</MenuItem>
										) }
									</MenuGroup>
								) }
								<BlockSettingsMenuControls.Slot
									fillProps={ {
										onClose,
										count,
										firstBlockClientId,
										isContentOnly,
										expand,
										expandedState,
										setInsertedBlock,
										toggleElement,
										setDropdownContentHidden,
									} }
									clientIds={ clientIds }
								/>
								{ typeof children === 'function'
									? children( { onClose } )
									: Children.map( ( child ) =>
											cloneElement( child, { onClose } )
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
						) }
					</DropdownMenu>
				);
			} }
		</BlockActions>
	);
}

export default BlockSettingsDropdown;
