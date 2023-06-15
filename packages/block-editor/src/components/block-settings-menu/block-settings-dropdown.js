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
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	__unstableUseShortcutEventMatch,
} from '@wordpress/keyboard-shortcuts';
import { pipe } from '@wordpress/compose';

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

const clipboardPermissionCache = {
	read: undefined,
	write: undefined,
};

async function hasClipboardPermission( type ) {
	if ( type !== 'write' && type !== 'read' ) {
		return false;
	}
	if ( clipboardPermissionCache[ type ] !== undefined ) {
		return clipboardPermissionCache[ type ];
	}

	let hasSupport = false;
	try {
		const result = await window.navigator.permissions.query( {
			name: `clipboard-${ type }`,
		} );
		hasSupport = result.state === 'granted' || result.state === 'prompt';
	} catch ( error ) {
		// Possibly the permission is denied.
		// TODO: show an error notice
	}

	clipboardPermissionCache[ type ] = hasSupport;
	return hasSupport;
}

async function writeToClipboard( { text, onSuccess } ) {
	try {
		// Only available on sites using `https` (and localhost)
		if ( ! window.navigator.clipboard ) {
			// TODO: show an error notice
			return;
		}

		await window.navigator.clipboard.writeText( text );
		onSuccess?.();
	} catch ( error ) {
		// Possibly the permission is denied.
		// TODO: show an error notice
	}
}

function CopyMenuItem( { blocks, onCopy, label } ) {
	const [ supportsClipboard, setSupportsClipboard ] = useState( false );
	const copyMenuItemBlocksLabel =
		blocks.length > 1 ? __( 'Copy blocks' ) : __( 'Copy' );
	const copyMenuItemLabel = label ? label : copyMenuItemBlocksLabel;

	useEffect( () => {
		async function testSupport() {
			const hasPermission = await hasClipboardPermission( 'write' );
			setSupportsClipboard( hasPermission );
		}

		testSupport();
	}, [] );

	return (
		<DropdownMenuItemV2
			disabled={ ! supportsClipboard }
			onSelect={ async ( event ) => {
				await writeToClipboard( {
					text: serialize( blocks ),
					onSuccess: onCopy,
				} );
				// Keep the dropdown menu open.
				event.preventDefault();
			} }
		>
			{ copyMenuItemLabel }
		</DropdownMenuItemV2>
	);
}

function PasteStylesMenuItem( { onSelect } ) {
	const [ supportsClipboard, setSupportsClipboard ] = useState( false );
	useEffect( () => {
		async function testSupport() {
			const hasPermission = await hasClipboardPermission( 'read' );
			setSupportsClipboard( hasPermission );
		}

		testSupport();
	}, [] );

	return (
		<DropdownMenuItemV2
			disabled={ ! supportsClipboard }
			onSelect={ ( event ) => {
				onSelect?.();
				// Keep the dropdown menu open.
				event.preventDefault();
			} }
		>
			{ __( 'Paste styles' ) }
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
	label,
	icon,
	disableOpenOnArrowDown,
	// Unused (avoid forwarding with rest props)
	block,
	expand,
	expandedState,
	setInsertedBlock,
	// Rest props
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

	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );

	const closeDropdown = useCallback( () => {
		setIsDropdownOpen( false );
	}, [] );

	// Save the dropdownTriggerId in case it is enforced via toggleProps, so that
	// it can be passed as the value for the `aria-labelledby` prop for the
	// dropdown content. This would normally work out of the box for the
	// `DropdownMenu` component, but in this case the toggle may receive an
	// external id from the parent `ToolbarItem` that can't be ignored.
	const dropdownTriggerId = toggleProps?.id;

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
					open={ isDropdownOpen }
					onOpenChange={ setIsDropdownOpen }
					trigger={
						<Button
							{ ...toggleProps }
							className={ classnames(
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
					align="start"
					side="bottom"
					sideOffset={ 12 }
					onKeyDown={ ( event ) => {
						if ( event.defaultPrevented ) return;

						// TODO: can use `onEscapeKeyDown` prop instead?
						if ( event.key === 'Escape' ) {
							setIsDropdownOpen( false );
							event.preventDefault();
						}

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
							onInsertAfter();
						} else if (
							isMatch(
								'core/block-editor/insert-before',
								event
							) &&
							canInsertDefaultBlock
						) {
							event.preventDefault();
							onInsertBefore();
						}
					} }
					aria-labelledby={ dropdownTriggerId }
					{ ...props }
				>
					<DropdownMenuGroupV2>
						<__unstableBlockSettingsMenuFirstItem.Slot
							fillProps={ { onClose: closeDropdown } }
						/>
						{ ! parentBlockIsSelected && !! firstParentClientId && (
							<DropdownMenuItemV2
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
									onSelect={ onInsertBefore }
									suffix={
										<Shortcut
											shortcut={ shortcuts.insertBefore }
										/>
									}
								>
									{ __( 'Add before' ) }
								</DropdownMenuItemV2>
								<DropdownMenuItemV2
									onSelect={ onInsertAfter }
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
							<PasteStylesMenuItem onSelect={ onPasteStyles } />
						</DropdownMenuGroupV2>
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
						__unstableDisplayLocation={ __unstableDisplayLocation }
					/>
					{ typeof children === 'function' ? children() : children }
					{ canRemove && (
						<>
							<DropdownMenuSeparatorV2 />
							<DropdownMenuGroupV2>
								<DropdownMenuItemV2
									onSelect={ pipe(
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
