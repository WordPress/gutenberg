/**
 * External dependencies
 */
import { Pressable, View } from 'react-native';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useMemo,
	useState,
	useRef,
	memo,
} from '@wordpress/element';
import {
	GlobalStylesContext,
	getMergedGlobalStyles,
	useMobileGlobalStylesColors,
	useGlobalStyles,
	withFilters,
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
import { compose, ifCondition } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockDraggable from '../block-draggable';
import BlockInvalidWarning from './block-invalid-warning';
import BlockOutline from './block-outline';
import { store as blockEditorStore } from '../../store';
import { useLayout } from './layout';
import useScrollUponInsertion from './use-scroll-upon-insertion';
import { useSettings } from '../use-settings';
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY = [];

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

function BlockWrapper( {
	accessibilityLabel,
	blockCategory,
	children,
	clientId,
	draggingClientId,
	draggingEnabled,
	hasInnerBlocks,
	isDescendentBlockSelected,
	isRootList,
	isSelected,
	isTouchable,
	marginHorizontal,
	marginVertical,
	name,
	onFocus,
} ) {
	const blockWrapperStyles = { flex: 1 };
	const blockWrapperStyle = [
		blockWrapperStyles,
		{
			marginVertical,
			marginHorizontal,
		},
	];
	const accessible = ! ( isSelected || isDescendentBlockSelected );

	const ref = useRef();
	const [ isLayoutCalculated, setIsLayoutCalculated ] = useState();
	useScrollUponInsertion( {
		clientId,
		isSelected,
		isLayoutCalculated,
		elementRef: ref,
	} );
	const onLayout = useCallback( () => {
		setIsLayoutCalculated( true );
	}, [] );

	return (
		<Pressable
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole="button"
			accessible={ accessible }
			disabled={ ! isTouchable }
			onPress={ onFocus }
			style={ blockWrapperStyle }
			ref={ ref }
			onLayout={ onLayout }
		>
			<BlockOutline
				blockCategory={ blockCategory }
				hasInnerBlocks={ hasInnerBlocks }
				isRootList={ isRootList }
				isSelected={ isSelected }
				name={ name }
			/>
			<BlockDraggable
				clientId={ clientId }
				draggingClientId={ draggingClientId }
				enabled={ draggingEnabled }
				testID="draggable-trigger-content"
			>
				{ children }
			</BlockDraggable>
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
	wrapperProps,
} ) {
	const {
		baseGlobalStyles,
		blockCategory,
		blockType,
		draggingClientId,
		draggingEnabled,
		hasInnerBlocks,
		isDescendantOfParentSelected,
		isDescendentBlockSelected,
		isParentSelected,
		order,
		mayDisplayControls,
		blockEditingMode,
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
				getBlockName,
				isFirstMultiSelectedBlock,
				getMultiSelectedBlockClientIds,
				getBlockEditingMode,
			} = select( blockEditorStore );
			const currentBlockType = getBlockType( name || 'core/missing' );
			const currentBlockCategory = currentBlockType?.category;
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
			const blockHasInnerBlocks = getBlockCount( clientId ) > 0;

			// For blocks with inner blocks, we only enable the dragging in the nested
			// blocks if any of them are selected. This way we prevent the long-press
			// gesture from being disabled for elements within the block UI.
			const isDraggingEnabled =
				! blockHasInnerBlocks ||
				isSelected ||
				! descendentBlockSelected;
			// Dragging nested blocks is not supported yet. For this reason, the block to be dragged
			// will be the top in the hierarchy.
			const currentDraggingClientId =
				getBlockHierarchyRootClientId( clientId );

			const globalStylesBaseStyles =
				getSettings()?.__experimentalGlobalStylesBaseStyles;

			return {
				baseGlobalStyles: globalStylesBaseStyles,
				blockCategory: currentBlockCategory,
				blockType: currentBlockType,
				draggingClientId: currentDraggingClientId,
				draggingEnabled: isDraggingEnabled,
				hasInnerBlocks: blockHasInnerBlocks,
				isDescendantOfParentSelected: descendantOfParentSelected,
				isDescendentBlockSelected: descendentBlockSelected,
				isParentSelected: parentSelected,
				order: blockOrder,
				mayDisplayControls:
					isSelected ||
					( isFirstMultiSelectedBlock( clientId ) &&
						getMultiSelectedBlockClientIds().every(
							( id ) => getBlockName( id ) === name
						) ),
				blockEditingMode: getBlockEditingMode( clientId ),
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
	const [ fontSizes ] = useSettings( 'typography.fontSizes' );

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

	// Determine whether the block has props to apply to the wrapper.
	if ( blockType?.getEditWrapperProps ) {
		wrapperProps = mergeWrapperProps(
			wrapperProps,
			blockType.getEditWrapperProps( attributes )
		);
	}

	// Inherited styles merged with block level styles.
	const mergedStyle = useMemo( () => {
		return getMergedGlobalStyles(
			baseGlobalStyles,
			globalStyle,
			wrapperProps?.style,
			attributes,
			defaultColors,
			name,
			fontSizes || EMPTY_ARRAY
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
		JSON.stringify( wrapperProps?.style ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		JSON.stringify(
			Object.fromEntries(
				Object.entries( attributes ?? {} ).filter( ( [ key ] ) =>
					GlobalStylesContext.BLOCK_STYLE_ATTRIBUTES.includes( key )
				)
			)
		),
	] );

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
			blockCategory={ blockCategory }
			clientId={ clientId }
			draggingClientId={ draggingClientId }
			draggingEnabled={ draggingEnabled }
			hasInnerBlocks={ hasInnerBlocks }
			isDescendentBlockSelected={ isDescendentBlockSelected }
			isFocused={ isFocused }
			isRootList={ ! rootClientId }
			isSelected={ isSelected }
			isStackedHorizontally={ isStackedHorizontally }
			isTouchable={ isTouchable }
			marginHorizontal={ marginHorizontal }
			marginVertical={ marginVertical }
			name={ name }
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
							mayDisplayControls={ mayDisplayControls }
							blockEditingMode={ blockEditingMode }
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
		getBlockWithoutAttributes,
		getBlockAttributes,
		canRemoveBlock,
		canMoveBlock,
	} = unlock( select( blockEditorStore ) );
	const block = getBlockWithoutAttributes( clientId );
	const attributes = getBlockAttributes( clientId );
	const isSelected = isBlockSelected( clientId );
	const templateLock = getTemplateLock( rootClientId );
	const canRemove = canRemoveBlock( clientId, rootClientId );
	const canMove = canMoveBlock( clientId, rootClientId );

	// The fallback to `{}` is a temporary fix.
	// This function should never be called when a block is not present in
	// the state. It happens now because the order in withSelect rendering
	// is not correct.
	const { name, isValid } = block || {};

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
	memo,
	applyWithSelect,
	applyWithDispatch,
	// Block is sometimes not mounted at the right time, causing it be undefined
	// see issue for more info
	// https://github.com/WordPress/gutenberg/issues/17013
	ifCondition( ( { block } ) => !! block ),
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );
