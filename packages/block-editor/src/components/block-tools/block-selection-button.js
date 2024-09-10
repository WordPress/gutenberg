/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { dragHandle } from '@wordpress/icons';
import { Button, Flex, FlexItem } from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { forwardRef, useEffect, useContext } from '@wordpress/element';
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
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { unlock } from '../../lock-unlock';
import { canBindAttribute } from '../../hooks/use-bindings-attributes';
import BlockContext from '../block-context';
import isURLLike from '../link-control/is-url-like';

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
	const blockContext = useContext( BlockContext );
	const registry = useRegistry();

	const sources = useSelect( ( select ) =>
		unlock( select( blocksStore ) ).getAllBlockBindingsSources()
	);

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
				canMoveBlock,
			} = unlock( select( blockEditorStore ) );
			const { getActiveBlockVariation, getBlockType } =
				select( blocksStore );
			const index = getBlockIndex( clientId );
			const { name, attributes } = getBlock( clientId );
			const blockType = getBlockType( name );
			const orientation =
				getBlockListSettings( rootClientId )?.orientation;
			const match = getActiveBlockVariation( name, attributes );

			const boundAttributes = {};
			const blockBindings = attributes?.metadata?.bindings;

			if ( blockBindings ) {
				const blockBindingsBySource = new Map();

				for ( const [ attributeName, binding ] of Object.entries(
					blockBindings
				) ) {
					const { source: sourceName, args: sourceArgs } = binding;
					const source = sources[ sourceName ];
					if (
						! source ||
						! canBindAttribute( name, attributeName )
					) {
						continue;
					}

					blockBindingsBySource.set( source, {
						...blockBindingsBySource.get( source ),
						[ attributeName ]: {
							args: sourceArgs,
						},
					} );
				}

				if ( blockBindingsBySource.size ) {
					for ( const [
						source,
						bindings,
					] of blockBindingsBySource ) {
						// Populate context.
						const context = {};

						if ( source.usesContext?.length ) {
							for ( const key of source.usesContext ) {
								context[ key ] = blockContext[ key ];
							}
						}

						// Get values in batch if the source supports it.
						let values = {};
						if ( ! source.getValues ) {
							Object.keys( bindings ).forEach( ( attr ) => {
								// Default to the `key` or the source label when `getValues` doesn't exist
								values[ attr ] =
									bindings[ attr ].args?.key || source.label;
							} );
						} else {
							values = source.getValues( {
								registry,
								context,
								clientId,
								bindings,
							} );
						}
						for ( const [ attributeName, value ] of Object.entries(
							values
						) ) {
							if (
								attributeName === 'url' &&
								( ! value || ! isURLLike( value ) )
							) {
								// Return null if value is not a valid URL.
								boundAttributes[ attributeName ] = null;
							} else {
								boundAttributes[ attributeName ] = value;
							}
						}
					}
				}
			}

			const newAttributes = {
				...attributes,
				...boundAttributes,
			};

			return {
				blockMovingMode: hasBlockMovingClientId(),
				editorMode: __unstableGetEditorMode(),
				icon: match?.icon || blockType.icon,
				label: getAccessibleBlockLabel(
					blockType,
					newAttributes,
					index + 1,
					orientation
				),
				canMove: canMoveBlock( clientId, rootClientId ),
				getNextBlockClientId,
				getPreviousBlockClientId,
			};
		},
		[ clientId, rootClientId ]
	);
	const { label, icon, blockMovingMode, editorMode, canMove } = selected;
	const { setNavigationMode, removeBlock } = useDispatch( blockEditorStore );

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
									// TODO: Switch to `true` (40px size) if possible
									__next40pxDefaultSize={ false }
									icon={ dragHandle }
									className="block-selection-button_drag-handle"
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
							// TODO: Switch to `true` (40px size) if possible
							__next40pxDefaultSize={ false }
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
