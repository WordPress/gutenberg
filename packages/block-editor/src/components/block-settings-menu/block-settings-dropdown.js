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
import {
	Children,
	cloneElement,
	useCallback,
	useRef,
	createContext,
	useContext,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { pipe, useCopyToClipboard } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockActions } from '../block-actions';
import BlockIcon from '../block-icon';
import BlockModeToggle from './block-mode-toggle';
import BlockHTMLConvertButton from './block-html-convert-button';
import __unstableBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useShowMoversGestures } from '../block-toolbar/utils';

const noop = () => {};
const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	variant: 'toolbar',
};

const BlockSettingsContext = createContext();
BlockSettingsContext.displayName = 'BlockSettingsContext';

function CopyMenuItem() {
	const { blocks, onCopy } = useContext( BlockSettingsContext );

	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	const copyMenuItemLabel =
		blocks.length > 1 ? __( 'Copy blocks' ) : __( 'Copy block' );
	return <MenuItem ref={ ref }>{ copyMenuItemLabel }</MenuItem>;
}

function DuplicateMenuItem( { onClose } ) {
	const { __experimentalSelectBlock, shortcuts, onDuplicate, canDuplicate } =
		useContext( BlockSettingsContext );

	const updateSelectionAfterDuplicate = useCallback(
		__experimentalSelectBlock
			? async ( clientIdsPromise ) => {
					const ids = await clientIdsPromise;
					if ( ids && ids[ 0 ] ) {
						__experimentalSelectBlock( ids[ 0 ] );
					}
			  }
			: noop,
		[ __experimentalSelectBlock ]
	);

	if ( ! canDuplicate ) {
		return null;
	}

	return (
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
	);
}

function RemoveMenuItem( { onClose } ) {
	const {
		shortcuts,
		onRemove,
		canRemove,
		blockClientIds,
		__experimentalSelectBlock,
		previousBlockClientId,
		nextBlockClientId,
		selectedBlockClientIds,
	} = useContext( BlockSettingsContext );

	const firstBlockClientId = blockClientIds[ 0 ];

	const blockTitle = useBlockDisplayTitle( {
		clientId: firstBlockClientId,
		maximumLength: 25,
	} );

	const label = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		blockTitle
	);
	const removeBlockLabel =
		blockClientIds?.length === 1 ? label : __( 'Remove blocks' );

	const updateSelectionAfterRemove = useCallback(
		__experimentalSelectBlock
			? () => {
					const blockToSelect =
						previousBlockClientId || nextBlockClientId;

					if (
						blockToSelect &&
						// From the block options dropdown, it's possible to remove a block that is not selected,
						// in this case, it's not necessary to update the selection since the selected block wasn't removed.
						selectedBlockClientIds.includes( firstBlockClientId ) &&
						// Don't update selection when next/prev block also is in the selection ( and gets removed ),
						// In case someone selects all blocks and removes them at once.
						! selectedBlockClientIds.includes( blockToSelect )
					) {
						__experimentalSelectBlock( blockToSelect );
					}
			  }
			: noop,
		[
			__experimentalSelectBlock,
			previousBlockClientId,
			nextBlockClientId,
			selectedBlockClientIds,
			firstBlockClientId,
		]
	);

	if ( ! canRemove ) {
		return null;
	}

	return (
		<MenuGroup>
			<MenuItem
				onClick={ pipe(
					onClose,
					onRemove,
					updateSelectionAfterRemove
				) }
				shortcut={ shortcuts.remove }
			>
				{ removeBlockLabel }
			</MenuItem>
		</MenuGroup>
	);
}

function SelectParentMenuItem() {
	const { shortcuts, blockClientIds, selectedBlockClientIds } =
		useContext( BlockSettingsContext );

	const firstBlockClientId = blockClientIds[ 0 ];

	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );

	const { isDistractionFree, firstParentClientId, parentBlockType } =
		useSelect(
			( select ) => {
				const {
					getSettings,
					getBlockAttributes,
					getBlockRootClientId,
					getBlockName,
				} = select( blockEditorStore );

				const { getActiveBlockVariation } = select( blocksStore );

				const _firstParentClientId =
					getBlockRootClientId( firstBlockClientId );
				const parentBlockName =
					_firstParentClientId &&
					getBlockName( _firstParentClientId );

				return {
					isDistractionFree: getSettings().isDistractionFree,
					firstParentClientId: _firstParentClientId,
					parentBlockType:
						_firstParentClientId &&
						( getActiveBlockVariation(
							parentBlockName,
							getBlockAttributes( _firstParentClientId )
						) ||
							getBlockType( parentBlockName ) ),
				};
			},
			[ firstBlockClientId ]
		);

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

	if ( ! firstParentClientId || parentBlockIsSelected ) {
		return null;
	}

	return (
		<MenuItem
			ref={ selectParentButtonRef }
			icon={ <BlockIcon icon={ parentBlockType.icon } /> }
			onClick={ () => {
				selectBlock( firstParentClientId );
			} }
			shortcut={ shortcuts.selectParent }
			{ ...showParentOutlineGestures }
		>
			{ sprintf(
				/* translators: %s: Name of the block's parent. */
				__( 'Select parent block (%s)' ),
				parentBlockType.title
			) }
		</MenuItem>
	);
}

function InsertBeforeMenuItem( { onClose } ) {
	const { shortcuts, onInsertBefore, canInsertDefaultBlock } =
		useContext( BlockSettingsContext );

	if ( ! canInsertDefaultBlock ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertBefore ) }
			shortcut={ shortcuts.insertBefore }
		>
			{ __( 'Insert before' ) }
		</MenuItem>
	);
}

function InsertAfterMenuItem( { onClose } ) {
	const { shortcuts, onInsertAfter, canInsertDefaultBlock } =
		useContext( BlockSettingsContext );

	if ( ! canInsertDefaultBlock ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertAfter ) }
			shortcut={ shortcuts.insertAfter }
		>
			{ __( 'Insert after' ) }
		</MenuItem>
	);
}

function MoveMenuItem( { onClose } ) {
	const { onMoveTo, canMove, blockClientIds } =
		useContext( BlockSettingsContext );

	const firstBlockClientId = blockClientIds[ 0 ];

	const { onlyBlock } = useSelect(
		( select ) => {
			const { getBlockCount, getBlockRootClientId } =
				select( blockEditorStore );

			const _firstParentClientId =
				getBlockRootClientId( firstBlockClientId );

			return {
				onlyBlock: 1 === getBlockCount( _firstParentClientId ),
			};
		},
		[ firstBlockClientId ]
	);

	if ( ! canMove || onlyBlock ) {
		return null;
	}

	return (
		<MenuItem onClick={ pipe( onClose, onMoveTo ) }>
			{ __( 'Move to' ) }
		</MenuItem>
	);
}

function HTMLConvertMenuItem() {
	const { blockClientIds } = useContext( BlockSettingsContext );
	const firstBlockClientId = blockClientIds[ 0 ];

	if ( blockClientIds?.length !== 1 ) {
		return null;
	}
	return <BlockHTMLConvertButton clientId={ firstBlockClientId } />;
}

function BlockModeMenuItem( { onClose } ) {
	const { blockClientIds } = useContext( BlockSettingsContext );
	const firstBlockClientId = blockClientIds[ 0 ];

	if ( blockClientIds?.length !== 1 ) {
		return null;
	}

	return (
		<BlockModeToggle clientId={ firstBlockClientId } onToggle={ onClose } />
	);
}

export function BlockSettingsDropdown( {
	clientIds,
	__experimentalSelectBlock,
	children,
	__unstableDisplayLocation,
	children: blockSettingsDropDownChildren,
	...props
} ) {
	const blockClientIds = Array.isArray( clientIds )
		? clientIds
		: [ clientIds ];

	const firstBlockClientId = blockClientIds[ 0 ];
	const { previousBlockClientId, nextBlockClientId, selectedBlockClientIds } =
		useSelect(
			( select ) => {
				const {
					getBlockName,
					getBlockRootClientId,
					getPreviousBlockClientId,
					getNextBlockClientId,
					getSelectedBlockClientIds,
					getBlockAttributes,
				} = select( blockEditorStore );

				const { getActiveBlockVariation } = select( blocksStore );

				const _firstParentClientId =
					getBlockRootClientId( firstBlockClientId );
				const parentBlockName =
					_firstParentClientId &&
					getBlockName( _firstParentClientId );

				return {
					parentBlockType:
						_firstParentClientId &&
						( getActiveBlockVariation(
							parentBlockName,
							getBlockAttributes( _firstParentClientId )
						) ||
							getBlockType( parentBlockName ) ),
					previousBlockClientId:
						getPreviousBlockClientId( firstBlockClientId ),
					nextBlockClientId:
						getNextBlockClientId( firstBlockClientId ),
					selectedBlockClientIds: getSelectedBlockClientIds(),
				};
			},
			[ firstBlockClientId ]
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

	const {
		canDuplicate,
		canInsertDefaultBlock,
		canMove,
		canRemove,
		onDuplicate,
		onInsertAfter,
		onInsertBefore,
		onRemove,
		onCopy,
		onMoveTo,
		blocks,
	} = useBlockActions( {
		clientIds: blockClientIds,
		__experimentalUpdateSelection: ! __experimentalSelectBlock,
	} );

	// Todo: memoize this
	const blockSettingsActionsContextValue = {
		__experimentalSelectBlock, // todo: should this be renamed to something more logically boolean?
		shortcuts, // can we omit from context and access directly from shortcuts store?
		blockClientIds,
		selectedBlockClientIds,
		previousBlockClientId,
		nextBlockClientId,
		blocks,
		canDuplicate,
		onDuplicate,
		onCopy,
		onMoveTo,
		canMove,
		canInsertDefaultBlock,
		onInsertBefore,
		onInsertAfter,
		canRemove,
		onRemove,
	};

	return (
		<BlockSettingsContext.Provider
			value={ blockSettingsActionsContextValue }
		>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Options' ) }
				className="block-editor-block-settings-menu"
				popoverProps={ POPOVER_PROPS }
				noIcons
				{ ...props }
			>
				{ ( { onClose } ) => {
					if ( blockSettingsDropDownChildren?.length ) {
						return blockSettingsDropDownChildren;
					}

					return (
						<>
							<MenuGroup>
								<__unstableBlockSettingsMenuFirstItem.Slot
									fillProps={ { onClose } }
								/>

								<SelectParentMenuItem />

								<HTMLConvertMenuItem />

								<CopyMenuItem />

								<DuplicateMenuItem onClose={ onClose } />

								<InsertBeforeMenuItem onClose={ onClose } />

								<InsertAfterMenuItem onClose={ onClose } />

								<MoveMenuItem onClose={ onClose } />

								<BlockModeMenuItem onClose={ onClose } />
							</MenuGroup>
							<BlockSettingsMenuControls.Slot
								fillProps={ { onClose } }
								clientIds={ clientIds }
								__unstableDisplayLocation={
									__unstableDisplayLocation
								}
							/>
							{ typeof children === 'function'
								? children( { onClose } )
								: Children.map( ( child ) =>
										cloneElement( child, { onClose } )
								  ) }

							<RemoveMenuItem onClose={ onClose } />
						</>
					);
				} }
			</DropdownMenu>
		</BlockSettingsContext.Provider>
	);
}

export default BlockSettingsDropdown;
