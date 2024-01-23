/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	__unstableUseShortcutEventMatch,
} from '@wordpress/keyboard-shortcuts';
import { pipe, useCopyToClipboard, useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import BlockIcon from '../block-icon';
import BlockHTMLConvertButton from './block-html-convert-button';
import __unstableBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useShowHoveredOrFocusedGestures } from '../block-toolbar/utils';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

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

function CopyMenuItem( { blocks, onCopy, label } ) {
	// TODO: pass clipboard container if copy doesn't work
	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	const copyMenuItemLabel = label ? label : __( 'Copy' );
	return (
		<DropdownMenuItem ref={ ref } hideOnClick={ false }>
			<DropdownMenuItemLabel>{ copyMenuItemLabel }</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

function ParentSelectorMenuItem( { parentClientId, parentBlockType } ) {
	const isSmallViewport = useViewportMatch( 'medium', '<' );
	const { selectBlock } = useDispatch( blockEditorStore );

	// Allows highlighting the parent block outline when focusing or hovering
	// the parent block selector within the child.
	const menuItemRef = useRef();
	const gesturesProps = useShowHoveredOrFocusedGestures( {
		ref: menuItemRef,
		highlightParent: true,
	} );

	if ( ! isSmallViewport ) {
		return null;
	}

	return (
		<DropdownMenuItem
			{ ...gesturesProps }
			ref={ menuItemRef }
			prefix={ <BlockIcon icon={ parentBlockType.icon } /> }
			onClick={ () => selectBlock( parentClientId ) }
		>
			<DropdownMenuItemLabel>
				{ sprintf(
					/* translators: %s: Name of the block's parent. */
					__( 'Select parent block (%s)' ),
					parentBlockType.title
				) }
			</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

export function BlockSettingsDropdown( {
	block,
	clientIds,
	__experimentalSelectBlock,
	children,
	__unstableDisplayLocation,
	toggleProps,
	label,
	icon,
	disableOpenOnArrowDown,
	// Unused (avoid forwarding with rest props)
	expand,
	expandedState,
	setInsertedBlock,
	// Rest props
	...props
} ) {
	// Get the client id of the current block for this menu, if one is set.
	const currentClientId = block?.clientId;
	const blockClientIds = Array.isArray( clientIds )
		? clientIds
		: [ clientIds ];
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];
	const {
		firstParentClientId,
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
				getBlockAttributes,
			} = select( blockEditorStore );

			const { getActiveBlockVariation } = select( blocksStore );

			const _firstParentClientId =
				getBlockRootClientId( firstBlockClientId );
			const parentBlockName =
				_firstParentClientId && getBlockName( _firstParentClientId );

			return {
				firstParentClientId: _firstParentClientId,
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

	const openedBlockSettingsMenu = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getOpenedBlockSettingsMenu(),
		[]
	);

	const { setOpenedBlockSettingsMenu } = unlock(
		useDispatch( blockEditorStore )
	);

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

	// This can occur when the selected block (the parent)
	// displays child blocks within a List View.
	const parentBlockIsSelected =
		selectedBlockClientIds?.includes( firstParentClientId );

	// When a currentClientId is in use, treat the menu as a controlled component.
	// This ensures that only one block settings menu is open at a time.
	// This is a temporary solution to work around an issue with `onFocusOutside`
	// where it does not allow a dropdown to be closed if focus was never within
	// the dropdown to begin with. Examples include a user either CMD+Clicking or
	// right clicking into an inactive window.
	// See: https://github.com/WordPress/gutenberg/pull/54083
	const open = ! currentClientId
		? undefined
		: openedBlockSettingsMenu === currentClientId || false;

	const onToggle = useCallback(
		( localOpen ) => {
			if ( localOpen && openedBlockSettingsMenu !== currentClientId ) {
				setOpenedBlockSettingsMenu( currentClientId );
			} else if (
				! localOpen &&
				openedBlockSettingsMenu &&
				openedBlockSettingsMenu === currentClientId
			) {
				setOpenedBlockSettingsMenu( undefined );
			}
		},
		[ currentClientId, openedBlockSettingsMenu, setOpenedBlockSettingsMenu ]
	);

	// Save the dropdownTriggerId in case it is enforced via toggleProps, so that
	// it can be passed as the value for the `aria-labelledby` prop for the
	// dropdown content. This would normally work out of the box for the
	// `DropdownMenu` component, but in this case the toggle may receive an
	// external id from the parent `ToolbarItem` that can't be ignored.
	const dropdownMenuExtraProps = {};

	if ( !! toggleProps?.id ) {
		dropdownMenuExtraProps[ 'aria-labelledby' ] = toggleProps?.id;
	}

	const closeDropdown = useCallback( () => {
		setOpenedBlockSettingsMenu( undefined );
	}, [ setOpenedBlockSettingsMenu ] );

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
				<DropdownMenu
					// TODO: should we partially enable features from the modal behaviour?
					modal={ false }
					open={ open }
					// TODO: will this work?
					onOpenChange={ onToggle }
					trigger={
						<Button
							{ ...toggleProps }
							className={ classnames(
								// TODO: this classname doesn't seem to be used anywhere
								'block-editor-block-settings-menu__trigger',
								toggleProps?.className
							) }
							onKeyDown={ ( event ) => {
								if (
									disableOpenOnArrowDown &&
									event.key === 'ArrowDown'
								) {
									event.preventDefault();
								}
								toggleProps?.onKeyDown?.( event );
							} }
							__next40pxDefaultSize
							label={ label ?? __( 'Options' ) }
							icon={ icon ?? moreVertical }
						/>
					}
					className="block-editor-block-settings-menu"
					placement="bottom-start"
					gutter={ 12 }
					onKeyDown={ ( /** @type {KeyboardEvent} */ event ) => {
						if ( event.defaultPrevented ) return;

						if (
							isMatch( 'core/block-editor/remove', event ) &&
							canRemove
						) {
							event.preventDefault();
							updateSelectionAfterRemove( onRemove() );
						} else if (
							isMatch( 'core/block-editor/duplicate', event ) &&
							canDuplicate
						) {
							event.preventDefault();
							updateSelectionAfterDuplicate( onDuplicate() );
						} else if (
							isMatch(
								'core/block-editor/insert-after',
								event
							) &&
							canInsertDefaultBlock
						) {
							event.preventDefault();
							setOpenedBlockSettingsMenu( undefined );
							onInsertAfter();
						} else if (
							isMatch(
								'core/block-editor/insert-before',
								event
							) &&
							canInsertDefaultBlock
						) {
							event.preventDefault();
							setOpenedBlockSettingsMenu( undefined );
							onInsertBefore();
						}
					} }
					{ ...dropdownMenuExtraProps }
					{ ...props }
				>
					<>
						<DropdownMenuGroup>
							{ /* TODO: forward context around this slot */ }
							{ /* TODO: check that actually calling `closeDropdown` works */ }
							<__unstableBlockSettingsMenuFirstItem.Slot
								fillProps={ { onClose: closeDropdown } }
							/>
							{ ! parentBlockIsSelected &&
								!! firstParentClientId && (
									<ParentSelectorMenuItem
										parentClientId={ firstParentClientId }
										parentBlockType={ parentBlockType }
									/>
								) }
							{ count === 1 && (
								<BlockHTMLConvertButton
									clientId={ firstBlockClientId }
								/>
							) }
							<CopyMenuItem blocks={ blocks } onCopy={ onCopy } />
							{ canDuplicate && (
								<DropdownMenuItem
									onClick={ pipe(
										onDuplicate,
										updateSelectionAfterDuplicate
									) }
									suffix={
										<Shortcut
											shortcut={ shortcuts.duplicate }
										/>
									}
								>
									<DropdownMenuItemLabel>
										{ __( 'Duplicate' ) }
									</DropdownMenuItemLabel>
								</DropdownMenuItem>
							) }
							{ canInsertDefaultBlock && (
								<>
									<DropdownMenuItem
										onClick={ onInsertBefore }
										suffix={
											<Shortcut
												shortcut={
													shortcuts.insertBefore
												}
											/>
										}
									>
										<DropdownMenuItemLabel>
											{ __( 'Add before' ) }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={ onInsertAfter }
										suffix={
											<Shortcut
												shortcut={
													shortcuts.insertAfter
												}
											/>
										}
									>
										<DropdownMenuItemLabel>
											{ __( 'Add after' ) }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
								</>
							) }
						</DropdownMenuGroup>
						{ canCopyStyles && (
							<>
								{ /* TODO: review separator strategy */ }
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<CopyMenuItem
										blocks={ blocks }
										onCopy={ onCopy }
										label={ __( 'Copy styles' ) }
									/>
									<DropdownMenuItem
										onClick={ onPasteStyles }
										hideOnClick={ false }
									>
										<DropdownMenuItemLabel>
											{ __( 'Paste styles' ) }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</>
						) }
						<BlockSettingsMenuControls.Slot
							fillProps={ {
								onClose: closeDropdown,
								canMove,
								onMoveTo,
								onlyBlock,
								count,
								firstBlockClientId,
							} }
							clientIds={ clientIds }
							__unstableDisplayLocation={
								__unstableDisplayLocation
							}
						/>
						{ /* TODO: make sure that children don't use the `onClose` function */ }
						{ typeof children === 'function'
							? children()
							: children }
						{ canRemove && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem
										onClick={ pipe(
											onRemove,
											updateSelectionAfterRemove
										) }
										suffix={
											<Shortcut
												shortcut={ shortcuts.remove }
											/>
										}
									>
										<DropdownMenuItemLabel>
											{ __( 'Delete' ) }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</>
						) }
					</>
				</DropdownMenu>
			) }
		</BlockActions>
	);
}

export default BlockSettingsDropdown;
