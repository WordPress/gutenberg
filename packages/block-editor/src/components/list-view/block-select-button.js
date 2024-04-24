/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Tooltip,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { Icon, lockSmall as lock, pinSmall } from '@wordpress/icons';
import { SPACE, ENTER, BACKSPACE, DELETE } from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { __, sprintf } from '@wordpress/i18n';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ListViewExpander from './expander';
import { useBlockLock } from '../block-lock';
import { store as blockEditorStore } from '../../store';
import useListViewImages from './use-list-view-images';
import { useListViewContext } from './context';

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		onClick,
		onContextMenu,
		onMouseDown,
		onToggleExpanded,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
		isExpanded,
		ariaDescribedBy,
		updateFocusAndSelection,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isLocked } = useBlockLock( clientId );
	const {
		canInsertBlockType,
		getSelectedBlockClientIds,
		getPreviousBlockClientId,
		getBlockRootClientId,
		getBlockOrder,
		getBlockParents,
		getBlocksByClientId,
		canRemoveBlocks,
	} = useSelect( blockEditorStore );
	const {
		duplicateBlocks,
		multiSelect,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
	} = useDispatch( blockEditorStore );
	const isMatch = useShortcutEventMatch();
	const isSticky = blockInformation?.positionType === 'sticky';
	const images = useListViewImages( { clientId, isExpanded } );
	const { collapseAll, expand, rootClientId } = useListViewContext();

	const positionLabel = blockInformation?.positionLabel
		? sprintf(
				// translators: 1: Position of selected block, e.g. "Sticky" or "Fixed".
				__( 'Position: %1$s' ),
				blockInformation.positionLabel
		  )
		: '';

	// The `href` attribute triggers the browser's native HTML drag operations.
	// When the link is dragged, the element's outerHTML is set in DataTransfer object as text/html.
	// We need to clear any HTML drag data to prevent `pasteHandler` from firing
	// inside the `useOnBlockDrop` hook.
	const onDragStartHandler = ( event ) => {
		event.dataTransfer.clearData();
		onDragStart?.( event );
	};

	// Determine which blocks to update:
	// If the current (focused) block is part of the block selection, use the whole selection.
	// If the focused block is not part of the block selection, only update the focused block.
	function getBlocksToUpdate() {
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const isUpdatingSelectedBlocks =
			selectedBlockClientIds.includes( clientId );
		const firstBlockClientId = isUpdatingSelectedBlocks
			? selectedBlockClientIds[ 0 ]
			: clientId;
		const firstBlockRootClientId =
			getBlockRootClientId( firstBlockClientId );

		const blocksToUpdate = isUpdatingSelectedBlocks
			? selectedBlockClientIds
			: [ clientId ];

		return {
			blocksToUpdate,
			firstBlockClientId,
			firstBlockRootClientId,
			selectedBlockClientIds,
		};
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	async function onKeyDownHandler( event ) {
		if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
			onClick( event );
		} else if (
			event.keyCode === BACKSPACE ||
			event.keyCode === DELETE ||
			isMatch( 'core/block-editor/remove', event )
		) {
			const {
				blocksToUpdate: blocksToDelete,
				firstBlockClientId,
				firstBlockRootClientId,
				selectedBlockClientIds,
			} = getBlocksToUpdate();

			// Don't update the selection if the blocks cannot be deleted.
			if ( ! canRemoveBlocks( blocksToDelete, firstBlockRootClientId ) ) {
				return;
			}

			let blockToFocus =
				getPreviousBlockClientId( firstBlockClientId ) ??
				// If the previous block is not found (when the first block is deleted),
				// fallback to focus the parent block.
				firstBlockRootClientId;

			removeBlocks( blocksToDelete, false );

			// Update the selection if the original selection has been removed.
			const shouldUpdateSelection =
				selectedBlockClientIds.length > 0 &&
				getSelectedBlockClientIds().length === 0;

			// If there's no previous block nor parent block, focus the first block.
			if ( ! blockToFocus ) {
				blockToFocus = getBlockOrder()[ 0 ];
			}

			updateFocusAndSelection( blockToFocus, shouldUpdateSelection );
		} else if ( isMatch( 'core/block-editor/duplicate', event ) ) {
			if ( event.defaultPrevented ) {
				return;
			}
			event.preventDefault();

			const { blocksToUpdate, firstBlockRootClientId } =
				getBlocksToUpdate();

			const canDuplicate = getBlocksByClientId( blocksToUpdate ).every(
				( block ) => {
					return (
						!! block &&
						hasBlockSupport( block.name, 'multiple', true ) &&
						canInsertBlockType( block.name, firstBlockRootClientId )
					);
				}
			);

			if ( canDuplicate ) {
				const updatedBlocks = await duplicateBlocks(
					blocksToUpdate,
					false
				);

				if ( updatedBlocks?.length ) {
					// If blocks have been duplicated, focus the first duplicated block.
					updateFocusAndSelection( updatedBlocks[ 0 ], false );
				}
			}
		} else if ( isMatch( 'core/block-editor/insert-before', event ) ) {
			if ( event.defaultPrevented ) {
				return;
			}
			event.preventDefault();

			const { blocksToUpdate } = getBlocksToUpdate();
			await insertBeforeBlock( blocksToUpdate[ 0 ] );
			const newlySelectedBlocks = getSelectedBlockClientIds();

			// Focus the first block of the newly inserted blocks, to keep focus within the list view.
			updateFocusAndSelection( newlySelectedBlocks[ 0 ], false );
		} else if ( isMatch( 'core/block-editor/insert-after', event ) ) {
			if ( event.defaultPrevented ) {
				return;
			}
			event.preventDefault();

			const { blocksToUpdate } = getBlocksToUpdate();
			await insertAfterBlock( blocksToUpdate.at( -1 ) );
			const newlySelectedBlocks = getSelectedBlockClientIds();

			// Focus the first block of the newly inserted blocks, to keep focus within the list view.
			updateFocusAndSelection( newlySelectedBlocks[ 0 ], false );
		} else if ( isMatch( 'core/block-editor/select-all', event ) ) {
			if ( event.defaultPrevented ) {
				return;
			}
			event.preventDefault();

			const { firstBlockRootClientId, selectedBlockClientIds } =
				getBlocksToUpdate();
			const blockClientIds = getBlockOrder( firstBlockRootClientId );
			if ( ! blockClientIds.length ) {
				return;
			}

			// If we have selected all sibling nested blocks, try selecting up a level.
			// This is a similar implementation to that used by `useSelectAll`.
			// `isShallowEqual` is used for the list view instead of a length check,
			// as the array of siblings of the currently focused block may be a different
			// set of blocks from the current block selection if the user is focused
			// on a different part of the list view from the block selection.
			if ( isShallowEqual( selectedBlockClientIds, blockClientIds ) ) {
				// Only select up a level if the first block is not the root block.
				// This ensures that the block selection can't break out of the root block
				// used by the list view, if the list view is only showing a partial hierarchy.
				if (
					firstBlockRootClientId &&
					firstBlockRootClientId !== rootClientId
				) {
					updateFocusAndSelection( firstBlockRootClientId, true );
					return;
				}
			}

			// Select all while passing `null` to skip focusing to the editor canvas,
			// and retain focus within the list view.
			multiSelect(
				blockClientIds[ 0 ],
				blockClientIds[ blockClientIds.length - 1 ],
				null
			);
		} else if ( isMatch( 'core/block-editor/collapse-list-view', event ) ) {
			if ( event.defaultPrevented ) {
				return;
			}
			event.preventDefault();
			const { firstBlockClientId } = getBlocksToUpdate();
			const blockParents = getBlockParents( firstBlockClientId, false );
			// Collapse all blocks.
			collapseAll();
			// Expand all parents of the current block.
			expand( blockParents );
		}
	}

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-list-view-block-select-button',
					className
				) }
				onClick={ onClick }
				onContextMenu={ onContextMenu }
				onKeyDown={ onKeyDownHandler }
				onMouseDown={ onMouseDown }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onDragStart={ onDragStartHandler }
				onDragEnd={ onDragEnd }
				draggable={ draggable }
				href={ `#block-${ clientId }` }
				aria-describedby={ ariaDescribedBy }
				aria-expanded={ isExpanded }
			>
				<ListViewExpander onClick={ onToggleExpanded } />
				<BlockIcon
					icon={ blockInformation?.icon }
					showColors
					context="list-view"
				/>
				<HStack
					alignment="center"
					className="block-editor-list-view-block-select-button__label-wrapper"
					justify="flex-start"
					spacing={ 1 }
				>
					<span className="block-editor-list-view-block-select-button__title">
						<Truncate ellipsizeMode="auto">{ blockTitle }</Truncate>
					</span>
					{ blockInformation?.anchor && (
						<span className="block-editor-list-view-block-select-button__anchor-wrapper">
							<Truncate
								className="block-editor-list-view-block-select-button__anchor"
								ellipsizeMode="auto"
							>
								{ blockInformation.anchor }
							</Truncate>
						</span>
					) }
					{ positionLabel && isSticky && (
						<Tooltip text={ positionLabel }>
							<Icon icon={ pinSmall } />
						</Tooltip>
					) }
					{ images.length ? (
						<span
							className="block-editor-list-view-block-select-button__images"
							aria-hidden
						>
							{ images.map( ( image, index ) => (
								<span
									className="block-editor-list-view-block-select-button__image"
									key={ image.clientId }
									style={ {
										backgroundImage: `url(${ image.url })`,
										zIndex: images.length - index, // Ensure the first image is on top, and subsequent images are behind.
									} }
								/>
							) ) }
						</span>
					) : null }
					{ isLocked && (
						<span className="block-editor-list-view-block-select-button__lock">
							<Icon icon={ lock } />
						</span>
					) }
				</HStack>
			</Button>
		</>
	);
}

export default forwardRef( ListViewBlockSelectButton );
