/**
 * WordPress dependencies
 */
import {
	getBlockType,
	serialize,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { moreVertical } from '@wordpress/icons';
import {
	Children,
	cloneElement,
	useCallback,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	__unstableUseShortcutEventMatch,
} from '@wordpress/keyboard-shortcuts';
import { pipe, useCopyToClipboard } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import BlockIcon from '../block-icon';
import BlockHTMLConvertButton from './block-html-convert-button';
import __unstableBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';
import { store as blockEditorStore } from '../../store';
import { useShowMoversGestures } from '../block-toolbar/utils';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	DropdownMenuSeparatorV2,
} = unlock( componentsPrivateApis );

function CopyMenuItem( { blocks, onCopy, label } ) {
	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	const copyMenuItemBlocksLabel =
		blocks.length > 1 ? __( 'Copy blocks' ) : __( 'Copy' );
	const copyMenuItemLabel = label ? label : copyMenuItemBlocksLabel;
	return (
		<DropdownMenuItemV2 ref={ ref }>
			{ copyMenuItemLabel }
		</DropdownMenuItemV2>
	);
}

const Shortcut = ( { shortcut } ) => {
	if ( ! shortcut ) {
		return null;
	}

	let displayText;
	let ariaLabel;

	if ( typeof shortcut === 'string' ) {
		displayText = shortcut;
	}

	if ( shortcut !== null && typeof shortcut === 'object' ) {
		displayText = shortcut.display;
		ariaLabel = shortcut.ariaLabel;
	}

	return <span aria-label={ ariaLabel }>{ displayText }</span>;
};

export function BlockSettingsDropdown( {
	clientIds,
	__experimentalSelectBlock,
	children,
	__unstableDisplayLocation,
	toggleProps,
	// Investigate which props are usually forwarded to this component
	...props
} ) {
	const blockClientIds = Array.isArray( clientIds )
		? clientIds
		: [ clientIds ];
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];
	const {
		firstParentClientId,
		isDistractionFree,
		onlyBlock,
		parentBlockType,
		previousBlockClientId,
		selectedBlockClientIds,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockName,
				getBlockRootClientId,
				getPreviousBlockClientId,
				getSelectedBlockClientIds,
				getSettings,
				getBlockAttributes,
			} = select( blockEditorStore );

			const { getActiveBlockVariation } = select( blocksStore );

			const _firstParentClientId =
				getBlockRootClientId( firstBlockClientId );
			const parentBlockName =
				_firstParentClientId && getBlockName( _firstParentClientId );

			return {
				firstParentClientId: _firstParentClientId,
				isDistractionFree: getSettings().isDistractionFree,
				onlyBlock: 1 === getBlockCount( _firstParentClientId ),
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
			};
		},
		[ firstBlockClientId ]
	);
	const { getBlockOrder, getSelectedBlockClientIds } =
		useSelect( blockEditorStore );

	const shortcuts = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
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
	const isMatch = __unstableUseShortcutEventMatch();

	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );
	const hasSelectedBlocks = selectedBlockClientIds.length > 0;

	const updateSelectionAfterDuplicate = useCallback(
		async ( clientIdsPromise ) => {
			if ( __experimentalSelectBlock ) {
				const ids = await clientIdsPromise;
				if ( ids && ids[ 0 ] ) {
					__experimentalSelectBlock( ids[ 0 ], false );
				}
			}
		},
		[ __experimentalSelectBlock ]
	);

	const updateSelectionAfterRemove = useCallback( () => {
		if ( __experimentalSelectBlock ) {
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
	}, [
		__experimentalSelectBlock,
		previousBlockClientId,
		firstParentClientId,
		getBlockOrder,
		hasSelectedBlocks,
		getSelectedBlockClientIds,
	] );

	const removeBlockLabel =
		count === 1 ? __( 'Delete' ) : __( 'Delete blocks' );

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
	const selectParentButtonRef = useRef();
	const { gestures: showParentOutlineGestures } = useShowMoversGestures( {
		ref: selectParentButtonRef,
		onChange( isFocused ) {
			if ( isFocused && isDistractionFree ) {
				return;
			}
			toggleBlockHighlight( firstParentClientId, isFocused );
		},
	} );

	// This can occur when the selected block (the parent)
	// displays child blocks within a List View.
	const parentBlockIsSelected =
		selectedBlockClientIds?.includes( firstParentClientId );

	return (
		<BlockActions
			clientIds={ clientIds }
			__experimentalUpdateSelection={ ! __experimentalSelectBlock }
		>
			{ ( {
				canCopyStyles,
				canDuplicate,
				canInsertDefaultBlock,
				canMove,
				canRemove,
				onDuplicate,
				onInsertAfter,
				onInsertBefore,
				onRemove,
				onCopy,
				onPasteStyles,
				onMoveTo,
				blocks,
			} ) => (
				<DropdownMenuV2
					trigger={
						<Button
							{ ...toggleProps }
							__next40pxDefaultSize
							label={ __( 'Options' ) }
							icon={ moreVertical }
						/>
					}
					align="start"
					side="bottom"
					sideOffset={ 12 }
					// Missing: pressing esc is not just closing the menu, but also the toolbar?
					{ ...props }
				>
					<DropdownMenuGroupV2>
						<__unstableBlockSettingsMenuFirstItem.Slot
						// fillProps={ { onClose } } TODO: onClose missing
						/>
						{ ! parentBlockIsSelected && !! firstParentClientId && (
							<DropdownMenuItemV2
								// TODO: add onMouseMove and onMouseLeave to dropdownmenuitem
								{ ...showParentOutlineGestures }
								ref={ selectParentButtonRef }
								prefix={
									<BlockIcon icon={ parentBlockType.icon } />
								}
								onSelect={ () =>
									selectBlock( firstParentClientId )
								}
							>
								{ sprintf(
									/* translators: %s: Name of the block's parent. */
									__( 'Select parent block (%s)' ),
									parentBlockType.title
								) }
							</DropdownMenuItemV2>
						) }
						{ count === 1 && (
							<BlockHTMLConvertButton
								clientId={ firstBlockClientId }
							/>
						) }
						<CopyMenuItem blocks={ blocks } onCopy={ onCopy } />
						{ canDuplicate && (
							<DropdownMenuItemV2
								onSelect={ pipe(
									// onClose, TODO: missing onClose
									onDuplicate,
									updateSelectionAfterDuplicate
								) }
								suffix={
									<Shortcut
										shortcut={ shortcuts.duplicate }
									/>
								}
							>
								{ __( 'Duplicate' ) }
							</DropdownMenuItemV2>
						) }
						{ canInsertDefaultBlock && (
							<>
								<DropdownMenuItemV2
									onSelect={ pipe(
										// onClose, TODO: add onClose
										onInsertBefore
									) }
									suffix={
										<Shortcut
											shortcut={ shortcuts.insertBefore }
										/>
									}
								>
									{ __( 'Add before' ) }
								</DropdownMenuItemV2>
								<DropdownMenuItemV2
									onSelect={ pipe(
										// onClose, TODO: add onClose
										onInsertAfter
									) }
									suffix={
										<Shortcut
											shortcut={ shortcuts.insertAfter }
										/>
									}
								>
									{ __( 'Add after' ) }
								</DropdownMenuItemV2>
							</>
						) }
					</DropdownMenuGroupV2>
					<DropdownMenuSeparatorV2 />
					{ canCopyStyles && (
						<DropdownMenuGroupV2>
							<CopyMenuItem
								blocks={ blocks }
								onCopy={ onCopy }
								label={ __( 'Copy styles' ) }
							/>
							<DropdownMenuItemV2 onSelect={ onPasteStyles }>
								{ __( 'Paste styles' ) }
							</DropdownMenuItemV2>
						</DropdownMenuGroupV2>
					) }
					<BlockSettingsMenuControls.Slot
						fillProps={ {
							// onClose,
							canMove,
							onMoveTo,
							onlyBlock,
							count,
							firstBlockClientId,
						} }
						clientIds={ clientIds }
						__unstableDisplayLocation={ __unstableDisplayLocation }
					/>
					{ typeof children === 'function'
						? children( {
								/*onClose*/
						  } )
						: Children.map( ( child ) =>
								cloneElement( child, {
									/*onClose*/
								} )
						  ) }
					{ canRemove && (
						<>
							<DropdownMenuSeparatorV2 />
							<DropdownMenuGroupV2>
								<DropdownMenuItemV2
									onClick={ pipe(
										// onClose,
										onRemove,
										updateSelectionAfterRemove
									) }
									suffix={
										<Shortcut
											shortcut={ shortcuts.remove }
										/>
									}
								>
									{ removeBlockLabel }
								</DropdownMenuItemV2>
							</DropdownMenuGroupV2>
						</>
					) }
				</DropdownMenuV2>
			) }
		</BlockActions>
	);
}

export default BlockSettingsDropdown;
