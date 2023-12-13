/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, RawHTML, useContext } from '@wordpress/element';
import {
	getBlockType,
	getSaveContent,
	isUnmodifiedDefaultBlock,
	serializeRawBlock,
	switchToBlockType,
	getDefaultBlockName,
	isUnmodifiedBlock,
	isReusableBlock,
	getBlockDefaultClassName,
	store as blocksStore,
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import { withDispatch, useDispatch, useSelect } from '@wordpress/data';
import { compose, pure, useMergeRefs, useDisabled } from '@wordpress/compose';
import { safeHTML } from '@wordpress/dom';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockHtml from './block-html';
import { store as blockEditorStore } from '../../store';
import { useLayout } from './layout';
import { BlockListBlockContext } from './block-list-block-context';

import useMovingAnimation from '../use-moving-animation';
import { useFocusFirstElement } from './use-block-props/use-focus-first-element';
import { useIsHovered } from './use-block-props/use-is-hovered';
import { useFocusHandler } from './use-block-props/use-focus-handler';
import { useEventHandlers } from './use-block-props/use-selected-block-event-handlers';
import { useNavModeExit } from './use-block-props/use-nav-mode-exit';
import { useBlockRefProvider } from './use-block-props/use-block-refs';
import { useIntersectionObserver } from './use-block-props/use-intersection-observer';
import { unlock } from '../../lock-unlock';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

/**
 * Merges wrapper props with special handling for classNames and styles.
 *
 * @param {Object} propsA
 * @param {Object} propsB
 *
 * @return {Object} Merged props.
 */
function mergeWrapperProps( propsA, propsB ) {
	const newProps = {
		...propsA,
		...propsB,
	};

	// May be set to undefined, so check if the property is set!
	if (
		propsA?.hasOwnProperty( 'className' ) &&
		propsB?.hasOwnProperty( 'className' )
	) {
		newProps.className = classnames( propsA.className, propsB.className );
	}

	if (
		propsA?.hasOwnProperty( 'style' ) &&
		propsB?.hasOwnProperty( 'style' )
	) {
		newProps.style = { ...propsA.style, ...propsB.style };
	}

	return newProps;
}

function Block( { children, mode, isHtml, className } ) {
	const blockProps = useContext( BlockListBlockContext );
	const htmlSuffix = mode === 'html' && ! isHtml ? '-visual' : '';
	return (
		<div
			{ ...blockProps }
			id={ blockProps.id + htmlSuffix }
			className={ classnames( className, blockProps.className ) }
		>
			{ children }
		</div>
	);
}

function BlockListBlock( {
	block: { __unstableBlockSource },
	mode,
	isLocked,
	canRemove,
	clientId,
	isSelected,
	isSelectionEnabled,
	className,
	__unstableLayoutClassNames: layoutClassNames,
	name,
	isValid,
	attributes,
	wrapperProps,
	setAttributes,
	onReplace,
	onInsertBlocksAfter,
	onMerge,
	toggleSelection,
} ) {
	const { removeBlock } = useDispatch( blockEditorStore );
	const onRemove = useCallback( () => removeBlock( clientId ), [ clientId ] );
	const parentLayout = useLayout() || {};
	const {
		essentialProps,
		mayDisplayControls,
		mayDisplayParentControls,
		themeSupportsLayout,
	} = useContext( BlockListBlockContext );

	// We wrap the BlockEdit component in a div that hides it when editing in
	// HTML mode. This allows us to render all of the ancillary pieces
	// (InspectorControls, etc.) which are inside `BlockEdit` but not
	// `BlockHTML`, even in HTML mode.
	let blockEdit = (
		<BlockEdit
			name={ name }
			isSelected={ isSelected }
			attributes={ attributes }
			setAttributes={ setAttributes }
			insertBlocksAfter={ isLocked ? undefined : onInsertBlocksAfter }
			onReplace={ canRemove ? onReplace : undefined }
			onRemove={ canRemove ? onRemove : undefined }
			mergeBlocks={ canRemove ? onMerge : undefined }
			clientId={ clientId }
			isSelectionEnabled={ isSelectionEnabled }
			toggleSelection={ toggleSelection }
			__unstableLayoutClassNames={ layoutClassNames }
			__unstableParentLayout={
				Object.keys( parentLayout ).length ? parentLayout : undefined
			}
			mayDisplayControls={ mayDisplayControls }
			mayDisplayParentControls={ mayDisplayParentControls }
		/>
	);

	const blockType = getBlockType( name );

	// Determine whether the block has props to apply to the wrapper.
	if ( blockType?.getEditWrapperProps ) {
		wrapperProps = mergeWrapperProps(
			wrapperProps,
			blockType.getEditWrapperProps( attributes )
		);
	}

	const isAligned =
		wrapperProps &&
		!! wrapperProps[ 'data-align' ] &&
		! themeSupportsLayout;

	// Support for sticky position in classic themes with alignment wrappers.
	const isSticky = className?.includes( 'is-position-sticky' );
	const { 'data-align': dataAlign, ...restWrapperProps } = wrapperProps ?? {};

	restWrapperProps.className = classnames(
		restWrapperProps.className,
		dataAlign && themeSupportsLayout && `align${ dataAlign }`,
		! ( dataAlign && isSticky ) && className,
		{
			'wp-block': ! isAligned,
		}
	);

	// For aligned blocks, provide a wrapper element so the block can be
	// positioned relative to the block column.
	// This is only kept for classic themes that don't support layout
	// Historically we used to rely on extra divs and data-align to
	// provide the alignments styles in the editor.
	// Due to the differences between frontend and backend, we migrated
	// to the layout feature, and we're now aligning the markup of frontend
	// and backend.
	if ( isAligned ) {
		blockEdit = (
			<div
				className={ classnames( 'wp-block', isSticky && className ) }
				data-align={ wrapperProps[ 'data-align' ] }
			>
				{ blockEdit }
			</div>
		);
	}

	let block;

	if ( ! isValid ) {
		const saveContent = __unstableBlockSource
			? serializeRawBlock( __unstableBlockSource )
			: getSaveContent( blockType, attributes );

		block = (
			<Block className="has-warning">
				<BlockInvalidWarning clientId={ clientId } />
				<RawHTML>{ safeHTML( saveContent ) }</RawHTML>
			</Block>
		);
	} else if ( mode === 'html' ) {
		// Render blockEdit so the inspector controls don't disappear.
		// See #8969.
		block = (
			<>
				<div style={ { display: 'none' } }>{ blockEdit }</div>
				<Block isHtml>
					<BlockHtml clientId={ clientId } />
				</Block>
			</>
		);
	} else if ( blockType?.apiVersion > 1 ) {
		block = blockEdit;
	} else {
		block = <Block>{ blockEdit }</Block>;
	}

	return (
		<BlockListBlockContext.Provider
			value={ {
				essentialProps,
				wrapperProps: restWrapperProps,
			} }
		>
			<BlockCrashBoundary
				fallback={
					<Block className="has-warning">
						<BlockCrashWarning />
					</Block>
				}
			>
				{ block }
			</BlockCrashBoundary>
		</BlockListBlockContext.Provider>
	);
}

const applyWithDispatch = withDispatch( ( dispatch, ownProps, registry ) => {
	const {
		updateBlockAttributes,
		insertBlocks,
		mergeBlocks,
		replaceBlocks,
		toggleSelection,
		__unstableMarkLastChangeAsPersistent,
		moveBlocksToPosition,
		removeBlock,
	} = dispatch( blockEditorStore );

	// Do not add new properties here, use `useDispatch` instead to avoid
	// leaking new props to the public API (editor.BlockListBlock filter).
	return {
		setAttributes( newAttributes ) {
			const { getMultiSelectedBlockClientIds } =
				registry.select( blockEditorStore );
			const multiSelectedBlockClientIds =
				getMultiSelectedBlockClientIds();
			const { clientId } = ownProps;
			const clientIds = multiSelectedBlockClientIds.length
				? multiSelectedBlockClientIds
				: [ clientId ];

			updateBlockAttributes( clientIds, newAttributes );
		},
		onInsertBlocks( blocks, index ) {
			const { rootClientId } = ownProps;
			insertBlocks( blocks, index, rootClientId );
		},
		onInsertBlocksAfter( blocks ) {
			const { clientId, rootClientId } = ownProps;
			const { getBlockIndex } = registry.select( blockEditorStore );
			const index = getBlockIndex( clientId );
			insertBlocks( blocks, index + 1, rootClientId );
		},
		onMerge( forward ) {
			const { clientId, rootClientId } = ownProps;
			const {
				getPreviousBlockClientId,
				getNextBlockClientId,
				getBlock,
				getBlockAttributes,
				getBlockName,
				getBlockOrder,
				getBlockIndex,
				getBlockRootClientId,
				canInsertBlockType,
			} = registry.select( blockEditorStore );

			/**
			 * Moves the block with clientId up one level. If the block type
			 * cannot be inserted at the new location, it will be attempted to
			 * convert to the default block type.
			 *
			 * @param {string}  _clientId       The block to move.
			 * @param {boolean} changeSelection Whether to change the selection
			 *                                  to the moved block.
			 */
			function moveFirstItemUp( _clientId, changeSelection = true ) {
				const targetRootClientId = getBlockRootClientId( _clientId );
				const blockOrder = getBlockOrder( _clientId );
				const [ firstClientId ] = blockOrder;

				if (
					blockOrder.length === 1 &&
					isUnmodifiedBlock( getBlock( firstClientId ) )
				) {
					removeBlock( _clientId );
				} else {
					registry.batch( () => {
						if (
							canInsertBlockType(
								getBlockName( firstClientId ),
								targetRootClientId
							)
						) {
							moveBlocksToPosition(
								[ firstClientId ],
								_clientId,
								targetRootClientId,
								getBlockIndex( _clientId )
							);
						} else {
							const replacement = switchToBlockType(
								getBlock( firstClientId ),
								getDefaultBlockName()
							);

							if ( replacement && replacement.length ) {
								insertBlocks(
									replacement,
									getBlockIndex( _clientId ),
									targetRootClientId,
									changeSelection
								);
								removeBlock( firstClientId, false );
							}
						}

						if (
							! getBlockOrder( _clientId ).length &&
							isUnmodifiedBlock( getBlock( _clientId ) )
						) {
							removeBlock( _clientId, false );
						}
					} );
				}
			}

			// For `Delete` or forward merge, we should do the exact same thing
			// as `Backspace`, but from the other block.
			if ( forward ) {
				if ( rootClientId ) {
					const nextRootClientId =
						getNextBlockClientId( rootClientId );

					if ( nextRootClientId ) {
						// If there is a block that follows with the same parent
						// block name and the same attributes, merge the inner
						// blocks.
						if (
							getBlockName( rootClientId ) ===
							getBlockName( nextRootClientId )
						) {
							const rootAttributes =
								getBlockAttributes( rootClientId );
							const previousRootAttributes =
								getBlockAttributes( nextRootClientId );

							if (
								Object.keys( rootAttributes ).every(
									( key ) =>
										rootAttributes[ key ] ===
										previousRootAttributes[ key ]
								)
							) {
								registry.batch( () => {
									moveBlocksToPosition(
										getBlockOrder( nextRootClientId ),
										nextRootClientId,
										rootClientId
									);
									removeBlock( nextRootClientId, false );
								} );
								return;
							}
						} else {
							mergeBlocks( rootClientId, nextRootClientId );
							return;
						}
					}
				}

				const nextBlockClientId = getNextBlockClientId( clientId );

				if ( ! nextBlockClientId ) {
					return;
				}

				if ( getBlockOrder( nextBlockClientId ).length ) {
					moveFirstItemUp( nextBlockClientId, false );
				} else {
					mergeBlocks( clientId, nextBlockClientId );
				}
			} else {
				const previousBlockClientId =
					getPreviousBlockClientId( clientId );

				if ( previousBlockClientId ) {
					mergeBlocks( previousBlockClientId, clientId );
				} else if ( rootClientId ) {
					const previousRootClientId =
						getPreviousBlockClientId( rootClientId );

					// If there is a preceding block with the same parent block
					// name and the same attributes, merge the inner blocks.
					if (
						previousRootClientId &&
						getBlockName( rootClientId ) ===
							getBlockName( previousRootClientId )
					) {
						const rootAttributes =
							getBlockAttributes( rootClientId );
						const previousRootAttributes =
							getBlockAttributes( previousRootClientId );

						if (
							Object.keys( rootAttributes ).every(
								( key ) =>
									rootAttributes[ key ] ===
									previousRootAttributes[ key ]
							)
						) {
							registry.batch( () => {
								moveBlocksToPosition(
									getBlockOrder( rootClientId ),
									rootClientId,
									previousRootClientId
								);
								removeBlock( rootClientId, false );
							} );
							return;
						}
					}

					moveFirstItemUp( rootClientId );
				} else {
					removeBlock( clientId );
				}
			}
		},
		onReplace( blocks, indexToSelect, initialPosition ) {
			if (
				blocks.length &&
				! isUnmodifiedDefaultBlock( blocks[ blocks.length - 1 ] )
			) {
				__unstableMarkLastChangeAsPersistent();
			}
			//Unsynced patterns are nested in an array so we need to flatten them.
			const replacementBlocks =
				blocks?.length === 1 && Array.isArray( blocks[ 0 ] )
					? blocks[ 0 ]
					: blocks;
			replaceBlocks(
				[ ownProps.clientId ],
				replacementBlocks,
				indexToSelect,
				initialPosition
			);
		},
		toggleSelection( selectionEnabled ) {
			toggleSelection( selectionEnabled );
		},
	};
} );

BlockListBlock = compose(
	applyWithDispatch,
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );

function BlockListBlockProvider( props ) {
	const { clientId, rootClientId } = props;
	const selectedProps = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				getBlockMode,
				isSelectionEnabled,
				getTemplateLock,
				__unstableGetBlockWithoutInnerBlocks,
				canRemoveBlock,
				canMoveBlock,

				getSettings,
				__unstableGetTemporarilyEditingAsBlocks,
				getBlockEditingMode,
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
				hasSelectedInnerBlock,

				getBlockIndex,
				isTyping,
				getGlobalBlockCount,
				isBlockMultiSelected,
				isAncestorMultiSelected,
				isBlockSubtreeDisabled,
				isBlockHighlighted,
				__unstableIsFullySelected,
				__unstableSelectionHasUnmergeableBlock,
				isBlockBeingDragged,
				hasBlockMovingClientId,
				canInsertBlockType,
				getBlockRootClientId,
				__unstableHasActiveBlockOverlayActive,
				__unstableGetEditorMode,
				getSelectedBlocksInitialCaretPosition,
			} = unlock( select( blockEditorStore ) );
			const block = __unstableGetBlockWithoutInnerBlocks( clientId );

			// This is a temporary fix.
			// This function should never be called when a block is not
			// present in the state. It happens now because the order in
			// withSelect rendering is not correct.
			if ( ! block ) {
				return;
			}

			const _isSelected = isBlockSelected( clientId );
			const templateLock = getTemplateLock( rootClientId );
			const canRemove = canRemoveBlock( clientId, rootClientId );
			const canMove = canMoveBlock( clientId, rootClientId );
			const { name: blockName, attributes, isValid } = block;

			const { hasBlockSupport: _hasBlockSupport } = select( blocksStore );

			const { getActiveBlockVariation } = select( blocksStore );
			const isPartOfMultiSelection =
				isBlockMultiSelected( clientId ) ||
				isAncestorMultiSelected( clientId );
			const blockType = getBlockType( blockName );
			const match = getActiveBlockVariation( blockName, attributes );
			const { outlineMode, supportsLayout } = getSettings();
			const isMultiSelected = isBlockMultiSelected( clientId );
			const checkDeep = true;
			const isAncestorOfSelectedBlock = hasSelectedInnerBlock(
				clientId,
				checkDeep
			);
			const typing = isTyping();
			const hasLightBlockWrapper = blockType?.apiVersion > 1;
			const movingClientId = hasBlockMovingClientId();
			const _hasOverlay =
				__unstableHasActiveBlockOverlayActive( clientId );

			// Do not add new properties here, use `useSelect` instead to avoid
			// leaking new props to the public API (editor.BlockListBlock filter).
			return {
				mode: getBlockMode( clientId ),
				isSelectionEnabled: isSelectionEnabled(),
				isLocked: !! templateLock,
				canRemove,
				canMove,
				// Users of the editor.BlockListBlock filter used to be able to
				// access the block prop.
				// Ideally these blocks would rely on the clientId prop only.
				// This is kept for backward compatibility reasons.
				block,
				name: blockName,
				attributes,
				isValid,
				isSelected: _isSelected,

				themeSupportsLayout: supportsLayout,
				isTemporarilyEditingAsBlocks:
					__unstableGetTemporarilyEditingAsBlocks() === clientId,
				blockEditingMode: getBlockEditingMode( clientId ),
				mayDisplayControls:
					_isSelected ||
					( isFirstMultiSelectedBlock( clientId ) &&
						getMultiSelectedBlockClientIds().every(
							( id ) => getBlockName( id ) === blockName
						) ),
				mayDisplayParentControls:
					_hasBlockSupport(
						getBlockName( clientId ),
						'__experimentalExposeControlsToChildren',
						false
					) && hasSelectedInnerBlock( clientId ),

				index: getBlockIndex( clientId ),
				blockTitle: match?.title || blockType?.title,
				isPartOfSelection: _isSelected || isPartOfMultiSelection,
				adjustScrolling:
					_isSelected || isFirstMultiSelectedBlock( clientId ),
				enableAnimation:
					! typing &&
					getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
				isSubtreeDisabled: isBlockSubtreeDisabled( clientId ),
				isOutlineEnabled: outlineMode,
				hasOverlay: _hasOverlay,
				initialPosition:
					_isSelected && __unstableGetEditorMode() === 'edit'
						? getSelectedBlocksInitialCaretPosition()
						: undefined,
				classNames: classnames(
					'block-editor-block-list__block',
					{
						'is-selected': _isSelected,
						'is-highlighted': isBlockHighlighted( clientId ),
						'is-multi-selected': isMultiSelected,
						'is-partially-selected':
							isMultiSelected &&
							! __unstableIsFullySelected() &&
							! __unstableSelectionHasUnmergeableBlock(),
						'is-reusable': isReusableBlock( blockType ),
						'is-dragging': isBlockBeingDragged( clientId ),
						'has-child-selected': isAncestorOfSelectedBlock,
						'remove-outline': _isSelected && outlineMode && typing,
						'is-block-moving-mode': !! movingClientId,
						'can-insert-moving-block':
							movingClientId &&
							canInsertBlockType(
								getBlockName( movingClientId ),
								getBlockRootClientId( clientId )
							),
						'has-block-overlay': _hasOverlay,
						'is-editing-disabled':
							getBlockEditingMode( clientId ) === 'disabled',
						'is-content-locked-temporarily-editing-as-blocks':
							__unstableGetTemporarilyEditingAsBlocks() ===
							clientId,
					},
					hasLightBlockWrapper ? attributes.className : undefined,
					hasLightBlockWrapper
						? getBlockDefaultClassName( blockName )
						: undefined
				),
			};
		},
		[ clientId, rootClientId ]
	);

	const {
		index,
		name,
		blockTitle,
		isSelected,
		isPartOfSelection,
		adjustScrolling,
		enableAnimation,
		isSubtreeDisabled,
		isOutlineEnabled,
		hasOverlay,
		initialPosition,
		classNames,
		themeSupportsLayout,
		blockEditingMode,
	} = selectedProps;

	const mergedRefs = useMergeRefs( [
		props.ref,
		useFocusFirstElement( { clientId, initialPosition } ),
		useBlockRefProvider( clientId ),
		useFocusHandler( clientId ),
		useEventHandlers( { clientId, isSelected } ),
		useNavModeExit( clientId ),
		useIsHovered( { isEnabled: isOutlineEnabled } ),
		useIntersectionObserver(),
		useMovingAnimation( {
			isSelected: isPartOfSelection,
			adjustScrolling,
			enableAnimation,
			triggerAnimationOnChange: index,
		} ),
		useDisabled( { isDisabled: ! hasOverlay } ),
	] );

	// Block is sometimes not mounted at the right time, causing it be
	// undefined see issue for more info
	// https://github.com/WordPress/gutenberg/issues/17013
	if ( ! selectedProps ) {
		return null;
	}

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );

	const blockProps = {
		tabIndex: blockEditingMode === 'disabled' ? -1 : 0,
		ref: mergedRefs,
		id: `block-${ clientId }`,
		role: 'document',
		'aria-label': blockLabel,
		'data-block': clientId,
		'data-type': name,
		'data-title': blockTitle,
		inert: isSubtreeDisabled ? 'true' : undefined,
		className: classNames,
	};

	const publicProps = {
		mode: selectedProps.mode,
		isSelectionEnabled: selectedProps.isSelectionEnabled,
		isLocked: selectedProps.isLocked,
		canRemove: selectedProps.canRemove,
		canMove: selectedProps.canMove,
		// Users of the editor.BlockListBlock filter used to be able to
		// access the block prop.
		// Ideally these blocks would rely on the clientId prop only.
		// This is kept for backward compatibility reasons.
		block: selectedProps.block,
		name: selectedProps.name,
		attributes: selectedProps.attributes,
		isValid: selectedProps.isValid,
		isSelected: selectedProps.isSelected,
	};

	return (
		<BlockListBlockContext.Provider
			value={ {
				essentialProps: blockProps,
				mayDisplayControls: selectedProps.mayDisplayControls,
				mayDisplayParentControls:
					selectedProps.mayDisplayParentControls,
				themeSupportsLayout,
			} }
		>
			<BlockListBlock { ...props } { ...publicProps } />
		</BlockListBlockContext.Provider>
	);
}

export default pure( BlockListBlockProvider );
