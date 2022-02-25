/**
 * External dependencies
 */
import { castArray, flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { moreVertical } from '@wordpress/icons';

import { Children, cloneElement, useCallback } from '@wordpress/element';
import { serialize, store as blocksStore } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { useCopyToClipboard } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import BlockModeToggle from './block-mode-toggle';
import BlockHTMLConvertButton from './block-html-convert-button';
import __unstableBlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import BlockSettingsMenuControls from '../block-settings-menu-controls';
import { store as blockEditorStore } from '../../store';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	isAlternate: true,
};

function CopyMenuItem( { blocks, onCopy } ) {
	const ref = useCopyToClipboard( () => serialize( blocks ), onCopy );
	return <MenuItem ref={ ref }>{ __( 'Copy' ) }</MenuItem>;
}

export function BlockSettingsDropdown( {
	clientIds,
	__experimentalSelectBlock,
	children,
	...props
} ) {
	const blockClientIds = castArray( clientIds );
	const count = blockClientIds.length;
	const firstBlockClientId = blockClientIds[ 0 ];
	const {
		onlyBlock,
		title,
		previousBlockClientId,
		nextBlockClientId,
		selectedBlockClientIds,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockName,
				getPreviousBlockClientId,
				getNextBlockClientId,
				getSelectedBlockClientIds,
			} = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			return {
				onlyBlock: 1 === getBlockCount(),
				title: getBlockType( getBlockName( firstBlockClientId ) )
					?.title,
				previousBlockClientId: getPreviousBlockClientId(
					firstBlockClientId
				),
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

	const updateSelectionAfterRemove = useCallback(
		__experimentalSelectBlock
			? () => {
					const blockToSelect =
						previousBlockClientId || nextBlockClientId;

					if (
						// It's possible to remove a block which is not selected from block options,
						// in this case, update selection only if currently selected block gets removed.
						selectedBlockClientIds.includes( firstBlockClientId ) &&
						// Don't update selection if all blocks gets removed at once
						! selectedBlockClientIds.includes( blockToSelect ) &&
						blockToSelect
					) {
						__experimentalSelectBlock(
							previousBlockClientId || nextBlockClientId
						);
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
		title
	);
	const removeBlockLabel = count === 1 ? label : __( 'Remove blocks' );

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
										onClick={ flow(
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
											onClick={ flow(
												onClose,
												onInsertBefore
											) }
											shortcut={ shortcuts.insertBefore }
										>
											{ __( 'Insert before' ) }
										</MenuItem>
										<MenuItem
											onClick={ flow(
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
										onClick={ flow( onClose, onMoveTo ) }
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
							/>
							{ typeof children === 'function'
								? children( { onClose } )
								: Children.map( ( child ) =>
										cloneElement( child, { onClose } )
								  ) }
							{ canRemove && (
								<MenuGroup>
									<MenuItem
										onClick={ flow(
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
