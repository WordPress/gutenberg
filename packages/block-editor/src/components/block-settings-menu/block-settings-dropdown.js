/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType, serialize } from '@wordpress/blocks';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { moreVertical } from '@wordpress/icons';
import {
	Children,
	cloneElement,
	useCallback,
	useRef,
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
	isAlternate: true,
};

function CopyMenuItem( { blocks, onCopy } ) {
	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	const copyMenuItemLabel =
		blocks.length > 1 ? __( 'Copy blocks' ) : __( 'Copy block' );
	return <MenuItem ref={ ref }>{ copyMenuItemLabel }</MenuItem>;
}

export function BlockSettingsDropdown( {
	clientIds,
	__experimentalSelectBlock,
	children,
	__unstableDisplayLocation,
	...props
} ) {
	const blockClientIds = castArray( clientIds );
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
				getBlockParents,
				getPreviousBlockClientId,
				getNextBlockClientId,
				getSelectedBlockClientIds,
				getSettings,
			} = select( blockEditorStore );

			const parents = getBlockParents( firstBlockClientId );
			const _firstParentClientId = parents[ parents.length - 1 ];
			const parentBlockName = getBlockName( _firstParentClientId );

			return {
				firstParentClientId: _firstParentClientId,
				isDistractionFree: getSettings().isDistractionFree,
				onlyBlock: 1 === getBlockCount(),
				parentBlockType: getBlockType( parentBlockName ),
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

	return (
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
								{ firstParentClientId !== undefined && (
									<MenuItem
										{ ...showParentOutlineGestures }
										ref={ selectParentButtonRef }
										icon={
											<BlockIcon
												icon={ parentBlockType.icon }
											/>
										}
										onClick={ () =>
											selectBlock( firstParentClientId )
										}
									>
										{ sprintf(
											/* translators: %s: Name of the block's parent. */
											__( 'Select parent block (%s)' ),
											parentBlockType.title
										) }
									</MenuItem>
								) }
								{ count === 1 && (
									<BlockHTMLConvertButton
										clientId={ firstBlockClientId }
									/>
								) }
								<CopyMenuItem
									blocks={ blocks }
									onCopy={ onCopy }
								/>
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
								{ canInsertDefaultBlock && (
									<>
										<MenuItem
											onClick={ pipe(
												onClose,
												onInsertBefore
											) }
											shortcut={ shortcuts.insertBefore }
										>
											{ __( 'Insert before' ) }
										</MenuItem>
										<MenuItem
											onClick={ pipe(
												onClose,
												onInsertAfter
											) }
											shortcut={ shortcuts.insertAfter }
										>
											{ __( 'Insert after' ) }
										</MenuItem>
									</>
								) }
								{ canMove && ! onlyBlock && (
									<MenuItem
										onClick={ pipe( onClose, onMoveTo ) }
									>
										{ __( 'Move to' ) }
									</MenuItem>
								) }
								{ count === 1 && (
									<BlockModeToggle
										clientId={ firstBlockClientId }
										onToggle={ onClose }
									/>
								) }
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
							) }
						</>
					) }
				</DropdownMenu>
			) }
		</BlockActions>
	);
}

export default BlockSettingsDropdown;
