/**
 * External dependencies
 */
import { Pressable, useWindowDimensions, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import {
	GlobalStylesContext,
	getMergedGlobalStyles,
	useMobileGlobalStylesColors,
	alignmentHelpers,
	useGlobalStyles,
} from '@wordpress/components';
import {
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
	getBlockType,
	getDefaultBlockName,
	isUnmodifiedBlock,
	isUnmodifiedDefaultBlock,
	switchToBlockType,
} from '@wordpress/blocks';
import {
	useDispatch,
	useSelect,
	withDispatch,
	withSelect,
} from '@wordpress/data';
import { compose, ifCondition, pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockDraggable from '../block-draggable';
import BlockInvalidWarning from './block-invalid-warning';
import BlockMobileToolbar from '../block-mobile-toolbar';
import BlockOutline from './block-outline';
import styles from './block.scss';
import { store as blockEditorStore } from '../../store';
import { useLayout } from './layout';
import useSetting from '../use-setting';

const emptyArray = [];

// Helper function to memoize the wrapperProps since getEditWrapperProps always returns a new reference.
const wrapperPropsCache = new WeakMap();
const emptyObj = {};
function getWrapperProps( value, getWrapperPropsFunction ) {
	if ( ! getWrapperPropsFunction ) {
		return emptyObj;
	}
	const cachedValue = wrapperPropsCache.get( value );
	if ( ! cachedValue ) {
		const wrapperProps = getWrapperPropsFunction( value );
		wrapperPropsCache.set( value, wrapperProps );
		return wrapperProps;
	}
	return cachedValue;
}

function BlockWrapper( {
	accessibilityLabel,
	align,
	blockWidth,
	children,
	clientId,
	draggingClientId,
	draggingEnabled,
	isDescendentBlockSelected,
	isParentSelected,
	isSelected,
	isStackedHorizontally,
	isTouchable,
	marginHorizontal,
	marginVertical,
	onDeleteBlock,
	onFocus,
} ) {
	const { width: screenWidth } = useWindowDimensions();
	const anchorNodeRef = useRef();
	const { isFullWidth } = alignmentHelpers;
	const isScreenWidthEqual = blockWidth === screenWidth;
	const isFullWidthToolbar = isFullWidth( align ) || isScreenWidthEqual;
	const blockWrapperStyles = { flex: 1 };
	const blockWrapperStyle = [
		blockWrapperStyles,
		{
			marginVertical,
			marginHorizontal,
		},
	];
	const accessible = ! ( isSelected || isDescendentBlockSelected );

	return (
		<Pressable
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole="button"
			accessible={ accessible }
			disabled={ ! isTouchable }
			onPress={ onFocus }
			style={ blockWrapperStyle }
		>
			<BlockOutline
				isSelected={ isSelected }
				isParentSelected={ isParentSelected }
				screenWidth={ screenWidth }
			/>
			<BlockDraggable
				clientId={ clientId }
				draggingClientId={ draggingClientId }
				enabled={ draggingEnabled }
				testID="draggable-trigger-content"
			>
				{ children }
			</BlockDraggable>
			<View style={ styles.neutralToolbar } ref={ anchorNodeRef }>
				{ isSelected && (
					<BlockMobileToolbar
						anchorNodeRef={ anchorNodeRef.current }
						blockWidth={ blockWidth }
						clientId={ clientId }
						draggingClientId={ draggingClientId }
						isFullWidth={ isFullWidthToolbar }
						isStackedHorizontally={ isStackedHorizontally }
						onDelete={ onDeleteBlock }
					/>
				) }
			</View>
		</Pressable>
	);
}

function BlockListBlock( {
	attributes,
	blockWidth: blockWrapperWidth,
	canRemove,
	clientId,
	contentStyle,
	isLocked,
	isSelected,
	isSelectionEnabled,
	isStackedHorizontally,
	isValid,
	marginHorizontal,
	marginVertical,
	name,
	onDeleteBlock,
	onInsertBlocksAfter,
	onMerge,
	onReplace,
	parentBlockAlignment,
	parentWidth,
	rootClientId,
	setAttributes,
	toggleSelection,
} ) {
	const {
		baseGlobalStyles,
		blockType,
		draggingClientId,
		draggingEnabled,
		isDescendantOfParentSelected,
		isDescendentBlockSelected,
		isParentSelected,
		order,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockHierarchyRootClientId,
				getBlockIndex,
				getBlockParents,
				getSelectedBlockClientId,
				getSettings,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			const currentBlockType = getBlockType( name || 'core/missing' );
			const blockOrder = getBlockIndex( clientId );
			const descendentBlockSelected = hasSelectedInnerBlock(
				clientId,
				true
			);
			const selectedBlockClientId = getSelectedBlockClientId();

			const parents = getBlockParents( clientId, true );
			const parentSelected =
				// Set false as a default value to prevent re-render when it's changed from null to false.
				( selectedBlockClientId || false ) &&
				selectedBlockClientId === rootClientId;

			const selectedParents = clientId ? parents : [];
			const descendantOfParentSelected =
				selectedParents.includes( rootClientId );
			const hasInnerBlocks = getBlockCount( clientId ) > 0;

			// For blocks with inner blocks, we only enable the dragging in the nested
			// blocks if any of them are selected. This way we prevent the long-press
			// gesture from being disabled for elements within the block UI.
			const isDraggingEnabled =
				! hasInnerBlocks || isSelected || ! descendentBlockSelected;
			// Dragging nested blocks is not supported yet. For this reason, the block to be dragged
			// will be the top in the hierarchy.
			const currentDraggingClientId =
				getBlockHierarchyRootClientId( clientId );

			const globalStylesBaseStyles =
				getSettings()?.__experimentalGlobalStylesBaseStyles;

			return {
				baseGlobalStyles: globalStylesBaseStyles,
				blockType: currentBlockType,
				draggingClientId: currentDraggingClientId,
				draggingEnabled: isDraggingEnabled,
				isDescendantOfParentSelected: descendantOfParentSelected,
				isDescendentBlockSelected: descendentBlockSelected,
				isParentSelected: parentSelected,
				order: blockOrder,
			};
		},
		[ clientId, isSelected, name, rootClientId ]
	);
	const { removeBlock, selectBlock } = useDispatch( blockEditorStore );
	const initialBlockWidth = blockWrapperWidth - 2 * marginHorizontal;
	const [ blockWidth, setBlockWidth ] = useState( initialBlockWidth );
	const parentLayout = useLayout() || {};
	const defaultColors = useMobileGlobalStylesColors();
	const globalStyle = useGlobalStyles();
	const fontSizes = useSetting( 'typography.fontSizes' ) || emptyArray;

	const onRemove = useCallback(
		() => removeBlock( clientId ),
		[ clientId, removeBlock ]
	);
	const onFocus = useCallback( () => {
		if ( ! isSelected ) {
			selectBlock( clientId );
		}
	}, [ selectBlock, clientId, isSelected ] );

	const onLayout = useCallback(
		( { nativeEvent } ) => {
			const layoutWidth = Math.floor( nativeEvent.layout.width );

			if ( ! blockWidth || ! layoutWidth ) {
				return;
			}

			if ( blockWidth !== layoutWidth ) {
				setBlockWidth( layoutWidth );
			}
		},
		[ blockWidth, setBlockWidth ]
	);

	// Block level styles.
	const wrapperProps = getWrapperProps(
		attributes,
		blockType.getEditWrapperProps
	);

	// Inherited styles merged with block level styles.
	const mergedStyle = useMemo( () => {
		return getMergedGlobalStyles(
			baseGlobalStyles,
			globalStyle,
			wrapperProps.style,
			attributes,
			defaultColors,
			name,
			fontSizes
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		// It is crucial to keep the dependencies array minimal to prevent unnecessary calls that could negatively impact performance.
		// JSON.stringify is used for the following purposes:
		// 1. To create a single, comparable value from the globalStyle, wrapperProps.style, and attributes objects. This allows useMemo to
		//    efficiently determine if a change has occurred in any of these objects.
		// 2. To filter the attributes object, ensuring that only the relevant attributes (included in
		//    GlobalStylesContext.BLOCK_STYLE_ATTRIBUTES) are considered as dependencies. This reduces the likelihood of
		//    unnecessary useMemo calls when other, unrelated attributes change.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		JSON.stringify( globalStyle ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		JSON.stringify( wrapperProps.style ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		JSON.stringify(
			Object.fromEntries(
				Object.entries( attributes ?? {} ).filter( ( [ key ] ) =>
					GlobalStylesContext.BLOCK_STYLE_ATTRIBUTES.includes( key )
				)
			)
		),
	] );

	const { align } = attributes;
	const isFocused = isSelected || isDescendentBlockSelected;
	const isTouchable =
		isSelected ||
		isDescendantOfParentSelected ||
		isParentSelected ||
		! rootClientId;

	const accessibilityLabel = getAccessibleBlockLabel(
		blockType,
		attributes,
		order + 1
	);

	return (
		<BlockWrapper
			accessibilityLabel={ accessibilityLabel }
			align={ align }
			blockWidth={ blockWidth }
			clientId={ clientId }
			draggingClientId={ draggingClientId }
			draggingEnabled={ draggingEnabled }
			isFocused={ isFocused }
			isDescendentBlockSelected={ isDescendentBlockSelected }
			isParentSelected={ isParentSelected }
			isSelected={ isSelected }
			isStackedHorizontally={ isStackedHorizontally }
			isTouchable={ isTouchable }
			marginHorizontal={ marginHorizontal }
			marginVertical={ marginVertical }
			onDeleteBlock={ onDeleteBlock }
			onFocus={ onFocus }
		>
			{ () =>
				! isValid ? (
					<BlockInvalidWarning clientId={ clientId } />
				) : (
					<GlobalStylesContext.Provider value={ mergedStyle }>
						<BlockEdit
							attributes={ attributes }
							blockWidth={ blockWidth }
							clientId={ clientId }
							contentStyle={ contentStyle }
							insertBlocksAfter={
								isLocked ? undefined : onInsertBlocksAfter
							}
							isSelected={ isSelected }
							isSelectionEnabled={ isSelectionEnabled }
							mergeBlocks={ canRemove ? onMerge : undefined }
							name={ name }
							onDeleteBlock={ onDeleteBlock }
							onFocus={ onFocus }
							onRemove={ canRemove ? onRemove : undefined }
							onReplace={ canRemove ? onReplace : undefined }
							parentBlockAlignment={ parentBlockAlignment }
							parentWidth={ parentWidth }
							setAttributes={ setAttributes }
							style={ mergedStyle }
							toggleSelection={ toggleSelection }
							__unstableParentLayout={
								Object.keys( parentLayout ).length
									? parentLayout
									: undefined
							}
							wrapperProps={ wrapperProps }
						/>
						<View onLayout={ onLayout } />
					</GlobalStylesContext.Provider>
				)
			}
		</BlockWrapper>
	);
}

const applyWithSelect = withSelect( ( select, { clientId, rootClientId } ) => {
	const {
		isBlockSelected,
		getBlockMode,
		isSelectionEnabled,
		getTemplateLock,
		__unstableGetBlockWithoutInnerBlocks,
		canRemoveBlock,
		canMoveBlock,
	} = select( blockEditorStore );
	const block = __unstableGetBlockWithoutInnerBlocks( clientId );
	const isSelected = isBlockSelected( clientId );
	const templateLock = getTemplateLock( rootClientId );
	const canRemove = canRemoveBlock( clientId, rootClientId );
	const canMove = canMoveBlock( clientId, rootClientId );

	// The fallback to `{}` is a temporary fix.
	// This function should never be called when a block is not present in
	// the state. It happens now because the order in withSelect rendering
	// is not correct.
	const { name, attributes, isValid } = block || {};

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
		name,
		attributes,
		isValid,
		isSelected,
	};
} );

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
			replaceBlocks(
				[ ownProps.clientId ],
				blocks,
				indexToSelect,
				initialPosition
			);
		},
		toggleSelection( selectionEnabled ) {
			toggleSelection( selectionEnabled );
		},
	};
} );

export default compose(
	pure,
	applyWithSelect,
	applyWithDispatch,
	// Block is sometimes not mounted at the right time, causing it be undefined
	// see issue for more info
	// https://github.com/WordPress/gutenberg/issues/17013
	ifCondition( ( { block } ) => !! block )
)( BlockListBlock );
