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
import BlockActions from '../block-actions';
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
BlockSettingsContext.displayName = 'TogglBlockSettingsContexteContext';

function CopyMenuItem( { blocks, onCopy } ) {
	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	const copyMenuItemLabel =
		blocks.length > 1 ? __( 'Copy blocks' ) : __( 'Copy block' );
	return <MenuItem ref={ ref }>{ copyMenuItemLabel }</MenuItem>;
}

function DuplicateMenuItem( { onClose, onDuplicate } ) {
	const { __experimentalSelectBlock, shortcuts } =
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

function RemoveMenuItem( {
	onClose,
	onRemove,
	updateSelectionAfterRemove,
	label,
} ) {
	const { shortcuts } = useContext( BlockSettingsContext );

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
				{ label }
			</MenuItem>
		</MenuGroup>
	);
}

function SelectParentMenuItem( {
	showParentOutlineGestures,
	selectParentButtonRef,
	selectBlock,
	firstParentClientId,
	parentBlockType,
} ) {
	return (
		<MenuItem
			{ ...showParentOutlineGestures }
			ref={ selectParentButtonRef }
			icon={ <BlockIcon icon={ parentBlockType.icon } /> }
			onClick={ () => selectBlock( firstParentClientId ) }
		>
			{ sprintf(
				/* translators: %s: Name of the block's parent. */
				__( 'Select parent block (%s)' ),
				parentBlockType.title
			) }
		</MenuItem>
	);
}

function InsertBeforeMenuItem( { onClose, onInsertBefore } ) {
	const { shortcuts } = useContext( BlockSettingsContext );

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertBefore ) }
			shortcut={ shortcuts.insertBefore }
		>
			{ __( 'Insert before' ) }
		</MenuItem>
	);
}

function InsertAfterMenuItem( { onClose, onInsertAfter } ) {
	const { shortcuts } = useContext( BlockSettingsContext );
	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertAfter ) }
			shortcut={ shortcuts.insertAfter }
		>
			{ __( 'Insert after' ) }
		</MenuItem>
	);
}

function MoveMenuItem( { onClose, onMoveTo } ) {
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
		return;
	}
	return <BlockHTMLConvertButton clientId={ firstBlockClientId } />;
}

function BlockModeMenuItem( { onClose } ) {
	const { blockClientIds } = useContext( BlockSettingsContext );
	const firstBlockClientId = blockClientIds[ 0 ];

	if ( blockClientIds?.length !== 1 ) {
		return;
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
		nextBlockClientId,
		selectedBlockClientIds,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockName,
				getBlockRootClientId,
				getPreviousBlockClientId,
				getNextBlockClientId,
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
				nextBlockClientId: getNextBlockClientId( firstBlockClientId ),
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

	const { selectBlock, toggleBlockHighlight } =
		useDispatch( blockEditorStore );

	const blockTitle = useBlockDisplayTitle( {
		clientId: firstBlockClientId,
		maximumLength: 25,
	} );

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
		]
	);

	const label = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		blockTitle
	);
	const removeBlockLabel = count === 1 ? label : __( 'Remove blocks' );

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

	// memoize blockSettingsActionsContextValue to avoid unnecessary rerenders
	const blockSettingsActionsContextValue = {
		__experimentalSelectBlock,
		shortcuts,
		blockClientIds,
	};

	return (
		<BlockSettingsContext.Provider
			value={ blockSettingsActionsContextValue }
		>
			<BlockActions
				clientIds={ clientIds }
				__experimentalUpdateSelection={ ! __experimentalSelectBlock }
			>
				{ ( {
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
				} ) => (
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Options' ) }
						className="block-editor-block-settings-menu"
						popoverProps={ POPOVER_PROPS }
						noIcons
						{ ...props }
					>
						{ ( { onClose } ) => (
							<>
								<MenuGroup>
									<__unstableBlockSettingsMenuFirstItem.Slot
										fillProps={ { onClose } }
									/>
									{ ! parentBlockIsSelected &&
										!! firstParentClientId && (
											<SelectParentMenuItem
												firstParentClientId={
													firstParentClientId
												}
												parentBlockType={
													parentBlockType
												}
												selectBlock={ selectBlock }
												selectParentButtonRef={
													selectParentButtonRef
												}
												showParentOutlineGestures={
													showParentOutlineGestures
												}
											/>
										) }

									<HTMLConvertMenuItem />

									<CopyMenuItem
										blocks={ blocks }
										onCopy={ onCopy }
									/>
									{ canDuplicate && (
										<DuplicateMenuItem
											onClose={ onClose }
											onDuplicate={ onDuplicate }
										></DuplicateMenuItem>
									) }
									{ canInsertDefaultBlock && (
										<>
											<InsertBeforeMenuItem
												onClose={ onClose }
												onInsertBefore={
													onInsertBefore
												}
											></InsertBeforeMenuItem>
											<InsertAfterMenuItem
												onClose={ onClose }
												onInsertAfter={ onInsertAfter }
											></InsertAfterMenuItem>
										</>
									) }
									{ canMove && ! onlyBlock && (
										<MoveMenuItem
											onClose={ onClose }
											onMoveTo={ onMoveTo }
										></MoveMenuItem>
									) }

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
								{ canRemove && (
									<RemoveMenuItem
										// Todo: extract updateSelectionAfterRemove props requirements to a shared context provider.
										updateSelectionAfterRemove={
											updateSelectionAfterRemove
										}
										label={ removeBlockLabel }
										onClose={ onClose }
										onRemove={ onRemove }
									></RemoveMenuItem>
								) }
							</>
						) }
					</DropdownMenu>
				) }
			</BlockActions>
		</BlockSettingsContext.Provider>
	);
}

export default BlockSettingsDropdown;
