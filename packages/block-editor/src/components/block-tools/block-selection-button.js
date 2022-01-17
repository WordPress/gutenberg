/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { dragHandle } from '@wordpress/icons';
import { Button, Flex, FlexItem } from '@wordpress/components';
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
	getBlockType,
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
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
import useBlockDisplayInformation from '../use-block-display-information';

/**
 * Block selection button component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string} props          Component props.
 * @param {string} props.clientId Client ID of block.
 *
 * @return {WPComponent} The component to be rendered.
 */
function BlockSelectionButton( { clientId, rootClientId, blockElement } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const selected = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockIndex,
				hasBlockMovingClientId,
				getBlockListSettings,
			} = select( blockEditorStore );
			const index = getBlockIndex( clientId );
			const { name, attributes } = getBlock( clientId );
			const blockMovingMode = hasBlockMovingClientId();
			return {
				index,
				name,
				attributes,
				blockMovingMode,
				orientation: getBlockListSettings( rootClientId )?.orientation,
			};
		},
		[ clientId, rootClientId ]
	);
	const { index, name, attributes, blockMovingMode, orientation } = selected;
	const { setNavigationMode, removeBlock } = useDispatch( blockEditorStore );
	const ref = useRef();

	const blockType = getBlockType( name );
	const label = getAccessibleBlockLabel(
		blockType,
		attributes,
		index + 1,
		orientation
	);

	// Focus the breadcrumb in navigation mode.
	useEffect( () => {
		ref.current.focus();

		speak( label );
	}, [ label ] );

	const {
		hasBlockMovingClientId,
		getBlockIndex,
		getBlockRootClientId,
		getClientIdsOfDescendants,
		getSelectedBlockClientId,
		getMultiSelectedBlocksEndClientId,
		getPreviousBlockClientId,
		getNextBlockClientId,
		isNavigationMode,
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
				getClientIdsOfDescendants( [ selectedBlockClientId ] )[ 0 ] ??
				selectedBlockClientId;
		}
		const startingBlockClientId = hasBlockMovingClientId();
		if ( isEscape && isNavigationMode() ) {
			clearSelectedBlock();
			event.preventDefault();
		}
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
					<BlockIcon icon={ blockInformation?.icon } showColors />
				</FlexItem>
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
				<FlexItem>
					<Button
						ref={ ref }
						onClick={ () => setNavigationMode( false ) }
						onKeyDown={ onKeyDown }
						label={ label }
						className="block-selection-button_select-button"
					>
						<BlockTitle clientId={ clientId } />
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}

export default BlockSelectionButton;
