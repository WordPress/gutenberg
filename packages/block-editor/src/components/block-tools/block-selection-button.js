/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { dragHandle, trash } from '@wordpress/icons';
import { Button, Flex, FlexItem, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import {
	BACKSPACE,
	DELETE,
	UP,
	DOWN,
	LEFT,
	RIGHT,
	TAB,
	ESCAPE,
	ENTER,
	SPACE,
} from '@wordpress/keycodes';
import {
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
	store as blocksStore,
} from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { focus } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';
import BlockDraggable from '../block-draggable';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockMover from '../block-mover';
import Shuffle from '../block-toolbar/shuffle';

/**
 * Block selection button component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string} props          Component props.
 * @param {string} props.clientId Client ID of block.
 *
 * @return {Component} The component to be rendered.
 */
function BlockSelectionButton( { clientId, rootClientId } ) {
	const selected = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockIndex,
				hasBlockMovingClientId,
				getBlockListSettings,
				__unstableGetEditorMode,
				getNextBlockClientId,
				getPreviousBlockClientId,
				canRemoveBlock,
				canMoveBlock,
			} = select( blockEditorStore );
			const { getActiveBlockVariation, getBlockType } =
				select( blocksStore );
			const index = getBlockIndex( clientId );
			const { name, attributes } = getBlock( clientId );
			const blockType = getBlockType( name );
			const orientation =
				getBlockListSettings( rootClientId )?.orientation;
			const match = getActiveBlockVariation( name, attributes );
			const isBlockTemplatePart =
				blockType?.name === 'core/template-part';

			let isNextBlockTemplatePart = false;
			const nextClientId = getNextBlockClientId();
			if ( nextClientId ) {
				const { name: nextName } = getBlock( nextClientId );
				const nextBlockType = getBlockType( nextName );
				isNextBlockTemplatePart =
					nextBlockType?.name === 'core/template-part';
			}

			let isPrevBlockTemplatePart = false;
			const prevClientId = getPreviousBlockClientId();
			if ( prevClientId ) {
				const { name: prevName } = getBlock( prevClientId );
				const prevBlockType = getBlockType( prevName );
				isPrevBlockTemplatePart =
					prevBlockType?.name === 'core/template-part';
			}

			return {
				blockMovingMode: hasBlockMovingClientId(),
				editorMode: __unstableGetEditorMode(),
				icon: match?.icon || blockType.icon,
				label: getAccessibleBlockLabel(
					blockType,
					attributes,
					index + 1,
					orientation
				),
				isBlockTemplatePart,
				isNextBlockTemplatePart,
				isPrevBlockTemplatePart,
				canRemove: canRemoveBlock( clientId, rootClientId ),
				canMove: canMoveBlock( clientId, rootClientId ),
			};
		},
		[ clientId, rootClientId ]
	);
	const {
		label,
		icon,
		blockMovingMode,
		editorMode,
		isBlockTemplatePart,
		isNextBlockTemplatePart,
		isPrevBlockTemplatePart,
		canRemove,
		canMove,
	} = selected;
	const { setNavigationMode, removeBlock } = useDispatch( blockEditorStore );
	const ref = useRef();

	// Focus the breadcrumb in navigation mode.
	useEffect( () => {
		if ( editorMode === 'navigation' ) {
			ref.current.focus();
			speak( label );
		}
	}, [ label, editorMode ] );
	const blockElement = useBlockElement( clientId );

	const {
		hasBlockMovingClientId,
		getBlockIndex,
		getBlockRootClientId,
		getClientIdsOfDescendants,
		getSelectedBlockClientId,
		getMultiSelectedBlocksEndClientId,
		getPreviousBlockClientId,
		getNextBlockClientId,
	} = useSelect( blockEditorStore );
	const {
		selectBlock,
		clearSelectedBlock,
		setBlockMovingClientId,
		moveBlockToPosition,
	} = useDispatch( blockEditorStore );

	function onKeyDown( event ) {
		const { keyCode } = event;
		const isUp = keyCode === UP;
		const isDown = keyCode === DOWN;
		const isLeft = keyCode === LEFT;
		const isRight = keyCode === RIGHT;
		const isTab = keyCode === TAB;
		const isEscape = keyCode === ESCAPE;
		const isEnter = keyCode === ENTER;
		const isSpace = keyCode === SPACE;
		const isShift = event.shiftKey;
		if ( isEscape && editorMode === 'navigation' ) {
			setNavigationMode( false );
			event.preventDefault();
			return;
		}

		if ( keyCode === BACKSPACE || keyCode === DELETE ) {
			removeBlock( clientId );
			event.preventDefault();
			return;
		}

		const selectedBlockClientId = getSelectedBlockClientId();
		const selectionEndClientId = getMultiSelectedBlocksEndClientId();
		const selectionBeforeEndClientId = getPreviousBlockClientId(
			selectionEndClientId || selectedBlockClientId
		);
		const selectionAfterEndClientId = getNextBlockClientId(
			selectionEndClientId || selectedBlockClientId
		);

		const navigateUp = ( isTab && isShift ) || isUp;
		const navigateDown = ( isTab && ! isShift ) || isDown;
		// Move out of current nesting level (no effect if at root level).
		const navigateOut = isLeft;
		// Move into next nesting level (no effect if the current block has no innerBlocks).
		const navigateIn = isRight;

		let focusedBlockUid;
		if ( navigateUp ) {
			focusedBlockUid = selectionBeforeEndClientId;
		} else if ( navigateDown ) {
			focusedBlockUid = selectionAfterEndClientId;
		} else if ( navigateOut ) {
			focusedBlockUid =
				getBlockRootClientId( selectedBlockClientId ) ??
				selectedBlockClientId;
		} else if ( navigateIn ) {
			focusedBlockUid =
				getClientIdsOfDescendants( selectedBlockClientId )[ 0 ] ??
				selectedBlockClientId;
		}
		const startingBlockClientId = hasBlockMovingClientId();
		if ( isEscape && startingBlockClientId && ! event.defaultPrevented ) {
			setBlockMovingClientId( null );
			event.preventDefault();
		}
		if ( ( isEnter || isSpace ) && startingBlockClientId ) {
			const sourceRoot = getBlockRootClientId( startingBlockClientId );
			const destRoot = getBlockRootClientId( selectedBlockClientId );
			const sourceBlockIndex = getBlockIndex( startingBlockClientId );
			let destinationBlockIndex = getBlockIndex( selectedBlockClientId );
			if (
				sourceBlockIndex < destinationBlockIndex &&
				sourceRoot === destRoot
			) {
				destinationBlockIndex -= 1;
			}
			moveBlockToPosition(
				startingBlockClientId,
				sourceRoot,
				destRoot,
				destinationBlockIndex
			);
			selectBlock( startingBlockClientId );
			setBlockMovingClientId( null );
		}
		// Prevent the block from being moved into itself.
		if (
			startingBlockClientId &&
			selectedBlockClientId === startingBlockClientId &&
			navigateIn
		) {
			return;
		}
		if ( navigateDown || navigateUp || navigateOut || navigateIn ) {
			if ( focusedBlockUid ) {
				event.preventDefault();
				selectBlock( focusedBlockUid );
			} else if ( isTab && selectedBlockClientId ) {
				let nextTabbable;

				if ( navigateDown ) {
					nextTabbable = blockElement;
					do {
						nextTabbable = focus.tabbable.findNext( nextTabbable );
					} while (
						nextTabbable &&
						blockElement.contains( nextTabbable )
					);

					if ( ! nextTabbable ) {
						nextTabbable =
							blockElement.ownerDocument.defaultView.frameElement;
						nextTabbable = focus.tabbable.findNext( nextTabbable );
					}
				} else {
					nextTabbable = focus.tabbable.findPrevious( blockElement );
				}

				if ( nextTabbable ) {
					event.preventDefault();
					nextTabbable.focus();
					clearSelectedBlock();
				}
			}
		}
	}

	const classNames = classnames(
		'block-editor-block-list__block-selection-button',
		{
			'is-block-moving-mode': !! blockMovingMode,
		}
	);

	const dragHandleLabel = __( 'Drag' );

	return (
		<div className={ classNames }>
			<Flex
				justify="center"
				className="block-editor-block-list__block-selection-button__content"
			>
				<FlexItem>
					<BlockIcon icon={ icon } showColors />
				</FlexItem>
				{ canMove && (
					<FlexItem>
						<BlockDraggable clientIds={ [ clientId ] }>
							{ ( draggableProps ) => (
								<Button
									icon={ dragHandle }
									className="block-selection-button_drag-handle"
									aria-hidden="true"
									label={ dragHandleLabel }
									// Should not be able to tab to drag handle as this
									// button can only be used with a pointer device.
									tabIndex="-1"
									{ ...draggableProps }
								/>
							) }
						</BlockDraggable>
					</FlexItem>
				) }
				{ editorMode === 'zoom-out' && ! isBlockTemplatePart && (
					<FlexItem>
						<BlockMover
							clientIds={ [ clientId ] }
							hideDragHandle
							isBlockMoverUpButtonDisabled={
								isPrevBlockTemplatePart
							}
							isBlockMoverDownButtonDisabled={
								isNextBlockTemplatePart
							}
						/>
					</FlexItem>
				) }
				{ editorMode === 'navigation' && (
					<FlexItem>
						<BlockDraggable clientIds={ [ clientId ] }>
							{ ( draggableProps ) => (
								<Button
									icon={ dragHandle }
									className="block-selection-button_drag-handle"
									aria-hidden="true"
									label={ dragHandleLabel }
									// Should not be able to tab to drag handle as this
									// button can only be used with a pointer device.
									tabIndex="-1"
									{ ...draggableProps }
								/>
							) }
						</BlockDraggable>
					</FlexItem>
				) }
				{ canMove && canRemove && editorMode === 'zoom-out' && (
					<Shuffle clientId={ clientId } as={ Button } />
				) }
				{ canRemove &&
					editorMode === 'zoom-out' &&
					! isBlockTemplatePart && (
						<FlexItem>
							<ToolbarButton
								icon={ trash }
								label="Delete"
								onClick={ () => {
									removeBlock( clientId );
								} }
							/>
						</FlexItem>
					) }
				{ editorMode === 'navigation' && (
					<FlexItem>
						<Button
							ref={ ref }
							onClick={
								editorMode === 'navigation'
									? () => setNavigationMode( false )
									: undefined
							}
							onKeyDown={ onKeyDown }
							label={ label }
							showTooltip={ false }
							className="block-selection-button_select-button"
						>
							<BlockTitle
								clientId={ clientId }
								maximumLength={ 35 }
							/>
						</Button>
					</FlexItem>
				) }
			</Flex>
		</div>
	);
}

export default BlockSelectionButton;
