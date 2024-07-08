/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { dragHandle } from '@wordpress/icons';
import { Button, Flex, FlexItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef, useEffect, useMemo, useRef } from '@wordpress/element';
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
import { unlock } from '../../lock-unlock';

/**
 * Given `clientIdsTree` data structure as the haystack, and `selectedClientId`
 * as the needle, find the neighboring blocks (parent, firstChild, previous, next).
 *
 * @param {Object}  clientIdsTree  A block hierarchy with each block only containing
 *                                 the `clientId` and `innerBlocks` properties.
 * @param {string}  targetClientId The clientId to find.
 * @param {?Object} parent         The parent block of the currently selected block.
 *                                 This can be omitted when searching from the root.
 */
function findBlockNeighbors( clientIdsTree, targetClientId, parent ) {
	for (
		let blockIndex = 0;
		blockIndex < clientIdsTree.length;
		blockIndex++
	) {
		const block = clientIdsTree[ blockIndex ];

		if ( block.clientId === targetClientId ) {
			return {
				parent: parent?.clientId,
				previous: clientIdsTree[ blockIndex - 1 ]?.clientId,
				next: clientIdsTree[ blockIndex + 1 ]?.clientId,
				firstChild: block?.innerBlocks?.[ 0 ]?.clientId,
				blockIndex,
			};
		}

		// Search the inner blocks for the selected block.
		if ( block?.innerBlocks?.length ) {
			const result = findBlockNeighbors(
				block.innerBlocks,
				targetClientId,
				block
			);

			if ( result ) {
				return result;
			}
		}
	}
}

/**
 * Block selection button component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string} props          Component props.
 * @param {string} props.clientId Client ID of block.
 * @param {Object} ref            Reference to the component.
 *
 * @return {Component} The component to be rendered.
 */
function BlockSelectionButton( { clientId, rootClientId }, ref ) {
	const selected = useSelect(
		( select ) => {
			const {
				getBlock,
				hasBlockMovingClientId,
				__unstableGetEditorMode,
				getNextBlockClientId,
				getPreviousBlockClientId,
				canMoveBlock,
			} = select( blockEditorStore );
			const { getEnabledClientIdsTree } = unlock(
				select( blockEditorStore )
			);
			const { getActiveBlockVariation, getBlockType } =
				select( blocksStore );
			const { name, attributes } = getBlock( clientId );
			const blockType = getBlockType( name );
			const match = getActiveBlockVariation( name, attributes );

			return {
				blockType,
				attributes,
				blockMovingMode: hasBlockMovingClientId(),
				editorMode: __unstableGetEditorMode(),
				icon: match?.icon || blockType.icon,
				canMove: canMoveBlock( clientId, rootClientId ),
				getNextBlockClientId,
				getPreviousBlockClientId,
				enabledClientIdsTree: getEnabledClientIdsTree(),
			};
		},
		[ clientId, rootClientId ]
	);
	const {
		blockType,
		attributes,
		icon,
		blockMovingMode,
		editorMode,
		canMove,
		enabledClientIdsTree,
	} = selected;
	const {
		setNavigationMode,
		removeBlock,
		selectBlock,
		clearSelectedBlock,
		setBlockMovingClientId,
		moveBlockToPosition,
	} = useDispatch( blockEditorStore );

	const {
		hasBlockMovingClientId,
		getBlockIndex,
		getBlockRootClientId,
		getSelectedBlockClientId,
		getBlockListSettings,
	} = useSelect( blockEditorStore );

	const { parent, firstChild, previous, next, blockIndex } = useMemo(
		() => findBlockNeighbors( enabledClientIdsTree, clientId ),
		[ enabledClientIdsTree, clientId ]
	);

	const label = useMemo( () => {
		const orientation = getBlockListSettings(
			parent?.clientId ?? ''
		)?.orientation;
		return getAccessibleBlockLabel(
			blockType,
			attributes,
			blockIndex,
			orientation
		);
	}, [
		attributes,
		blockIndex,
		blockType,
		getBlockListSettings,
		parent?.clientId,
	] );

	// Focus the block selection button in navigation mode.
	// Only one block selection button renders at a time (for the individual selected block),
	// so the instance should only be focused on change of client id.
	const focusedClientId = useRef();
	useEffect( () => {
		const canFocus =
			editorMode === 'navigation' &&
			focusedClientId.current !== clientId &&
			ref?.current?.focus;

		if ( canFocus ) {
			ref.current.focus();
			speak( label );
			focusedClientId.current = clientId;
		}
	}, [ clientId, editorMode, label, ref ] );
	const blockElement = useBlockElement( clientId );

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

		if ( keyCode === BACKSPACE || keyCode === DELETE ) {
			removeBlock( clientId );
			event.preventDefault();
			return;
		}

		const selectedBlockClientId = getSelectedBlockClientId();
		const navigateUp = isUp || ( isTab && isShift );
		const navigateDown = isDown || ( isTab && ! isShift );
		// Move out of current nesting level (no effect if at root level).
		const navigateOut = isLeft;
		// Move into next nesting level (no effect if the current block has no innerBlocks).
		const navigateIn = isRight;

		// Select mode block navigation.
		if ( navigateDown || navigateUp || navigateOut || navigateIn ) {
			let focusedBlockUid;
			if ( navigateUp || navigateDown ) {
				focusedBlockUid = navigateUp ? previous : next;
			} else if ( navigateOut || navigateIn ) {
				focusedBlockUid = navigateOut ? parent : firstChild;
			}

			// If a next block to focus was found, select it, else
			// handle moving focus out of the block tree.
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

		// Block moving mode.
		const movingBlockClientId = hasBlockMovingClientId();
		if ( movingBlockClientId ) {
			if ( isEscape && ! event.defaultPrevented ) {
				setBlockMovingClientId( null );
				event.preventDefault();
			}
			if ( isEnter || isSpace ) {
				const sourceRoot = getBlockRootClientId( movingBlockClientId );
				const destRoot = getBlockRootClientId( selectedBlockClientId );
				const sourceBlockIndex = getBlockIndex( movingBlockClientId );
				let destinationBlockIndex = getBlockIndex(
					selectedBlockClientId
				);
				if (
					sourceBlockIndex < destinationBlockIndex &&
					sourceRoot === destRoot
				) {
					destinationBlockIndex -= 1;
				}
				moveBlockToPosition(
					movingBlockClientId,
					sourceRoot,
					destRoot,
					destinationBlockIndex
				);
				selectBlock( movingBlockClientId );
				setBlockMovingClientId( null );
			}
		}
	}

	const classNames = clsx(
		'block-editor-block-list__block-selection-button',
		{
			'is-block-moving-mode': !! blockMovingMode,
		}
	);

	const dragHandleLabel = __( 'Drag' );
	const showBlockDraggable = canMove && editorMode === 'navigation';

	return (
		<div className={ classNames }>
			<Flex
				justify="center"
				className="block-editor-block-list__block-selection-button__content"
			>
				<FlexItem>
					<BlockIcon icon={ icon } showColors />
				</FlexItem>
				{ showBlockDraggable && (
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

export default forwardRef( BlockSelectionButton );
