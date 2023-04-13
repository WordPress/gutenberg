/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, createRef, useMemo } from '@wordpress/element';
import {
	GlobalStylesContext,
	getMergedGlobalStyles,
	useMobileGlobalStylesColors,
	alignmentHelpers,
	useGlobalStyles,
} from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	getBlockType,
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
	switchToBlockType,
	getDefaultBlockName,
	isUnmodifiedBlock,
} from '@wordpress/blocks';
import { useSetting } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './block.scss';
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockMobileToolbar from '../block-mobile-toolbar';
import { store as blockEditorStore } from '../../store';
import BlockDraggable from '../block-draggable';
import { useLayout } from './layout';

const emptyArray = [];
function BlockForType( {
	attributes,
	clientId,
	contentStyle,
	getBlockWidth,
	insertBlocksAfter,
	isSelected,
	onMerge,
	name,
	onBlockFocus,
	onChange,
	onDeleteBlock,
	onReplace,
	parentWidth,
	parentBlockAlignment,
	wrapperProps,
	blockWidth,
	baseGlobalStyles,
} ) {
	const defaultColors = useMobileGlobalStylesColors();
	const fontSizes = useSetting( 'typography.fontSizes' ) || emptyArray;
	const globalStyle = useGlobalStyles();
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
	}, [
		defaultColors,
		globalStyle,
		// I couldn't simply use attributes and wrapperProps.styles as a dependency because they are almost always a new reference.
		// Thanks to the JSON.stringify we check if the value is the same instead of reference.
		JSON.stringify( wrapperProps.style ),
		JSON.stringify(
			Object.fromEntries(
				Object.entries( attributes ?? {} ).filter( ( [ key ] ) =>
					GlobalStylesContext.BLOCK_STYLE_ATTRIBUTES.includes( key )
				)
			)
		),
	] );

	const parentLayout = useLayout();

	return (
		<GlobalStylesContext.Provider value={ mergedStyle }>
			<BlockEdit
				name={ name }
				isSelected={ isSelected }
				attributes={ attributes }
				setAttributes={ onChange }
				onFocus={ onBlockFocus }
				onReplace={ onReplace }
				insertBlocksAfter={ insertBlocksAfter }
				mergeBlocks={ onMerge }
				// Block level styles.
				wrapperProps={ wrapperProps }
				// Inherited styles merged with block level styles.
				style={ mergedStyle }
				clientId={ clientId }
				parentWidth={ parentWidth }
				contentStyle={ contentStyle }
				onDeleteBlock={ onDeleteBlock }
				blockWidth={ blockWidth }
				parentBlockAlignment={ parentBlockAlignment }
				__unstableParentLayout={ parentLayout }
			/>
			<View onLayout={ getBlockWidth } />
		</GlobalStylesContext.Provider>
	);
}

class BlockListBlock extends Component {
	constructor() {
		super( ...arguments );

		this.insertBlocksAfter = this.insertBlocksAfter.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.getBlockWidth = this.getBlockWidth.bind( this );

		this.state = {
			blockWidth: this.props.blockWidth - 2 * this.props.marginHorizontal,
		};

		this.anchorNodeRef = createRef();
	}

	onFocus() {
		const { firstToSelectId, isSelected, onSelect } = this.props;
		if ( ! isSelected ) {
			onSelect( firstToSelectId );
		}
	}

	insertBlocksAfter( blocks ) {
		this.props.onInsertBlocks( blocks, this.props.order + 1 );

		if ( blocks[ 0 ] ) {
			// Focus on the first block inserted.
			this.props.onSelect( blocks[ 0 ].clientId );
		}
	}

	getBlockWidth( { nativeEvent } ) {
		const { layout } = nativeEvent;
		const { blockWidth } = this.state;
		const layoutWidth = Math.floor( layout.width );

		if ( ! blockWidth || ! layoutWidth ) {
			return;
		}

		if ( blockWidth !== layoutWidth ) {
			this.setState( { blockWidth: layoutWidth } );
		}
	}

	getBlockForType() {
		const { blockWidth } = this.state;
		return (
			<BlockForType
				{ ...this.props }
				onBlockFocus={ this.onFocus }
				insertBlocksAfter={ this.insertBlocksAfter }
				getBlockWidth={ this.getBlockWidth }
				blockWidth={ blockWidth }
			/>
		);
	}

	renderBlockTitle() {
		return (
			<View style={ styles.blockTitle }>
				<Text>BlockType: { this.props.name }</Text>
			</View>
		);
	}

	render() {
		const {
			attributes,
			blockType,
			clientId,
			icon,
			isSelected,
			isValid,
			order,
			title,
			isDimmed,
			isTouchable,
			onDeleteBlock,
			isStackedHorizontally,
			isParentSelected,
			getStylesFromColorScheme,
			marginVertical,
			marginHorizontal,
			isInnerBlockSelected,
			name,
			draggingEnabled,
			draggingClientId,
		} = this.props;

		if ( ! attributes || ! blockType ) {
			return null;
		}
		const { blockWidth } = this.state;
		const { align } = attributes;
		const accessibilityLabel = getAccessibleBlockLabel(
			blockType,
			attributes,
			order + 1
		);
		const { isFullWidth, isContainerRelated } = alignmentHelpers;
		const isFocused = isSelected || isInnerBlockSelected;
		const screenWidth = Math.floor( Dimensions.get( 'window' ).width );
		const isScreenWidthEqual = blockWidth === screenWidth;
		const isScreenWidthWider = blockWidth < screenWidth;
		const isFullWidthToolbar = isFullWidth( align ) || isScreenWidthEqual;

		return (
			<TouchableWithoutFeedback
				onPress={ this.onFocus }
				accessible={ ! isFocused }
				accessibilityRole={ 'button' }
				disabled={ isFocused }
			>
				<View
					style={ { flex: 1 } }
					accessibilityLabel={ accessibilityLabel }
				>
					<View
						pointerEvents={ isTouchable ? 'auto' : 'box-only' }
						accessibilityLabel={ accessibilityLabel }
						style={ [
							{ marginVertical, marginHorizontal, flex: 1 },
							isDimmed && styles.dimmed,
						] }
					>
						{ isSelected && (
							<View
								pointerEvents="box-none"
								style={ [
									styles.solidBorder,
									isFullWidth( align ) &&
										isScreenWidthWider &&
										styles.borderFullWidth,
									isFullWidth( align ) &&
										isContainerRelated( name ) &&
										isScreenWidthWider &&
										styles.containerBorderFullWidth,
									getStylesFromColorScheme(
										styles.solidBorderColor,
										styles.solidBorderColorDark
									),
								] }
							/>
						) }
						{ isParentSelected && (
							<View
								style={ [
									styles.dashedBorder,
									getStylesFromColorScheme(
										styles.dashedBorderColor,
										styles.dashedBorderColorDark
									),
								] }
							/>
						) }
						<BlockDraggable
							clientId={ clientId }
							draggingClientId={ draggingClientId }
							enabled={ draggingEnabled }
							testID="draggable-trigger-content"
						>
							{ () =>
								isValid ? (
									this.getBlockForType()
								) : (
									<BlockInvalidWarning
										blockTitle={ title }
										icon={ icon }
										clientId={ clientId }
									/>
								)
							}
						</BlockDraggable>
						<View
							style={ styles.neutralToolbar }
							ref={ this.anchorNodeRef }
						>
							{ isSelected && (
								<BlockMobileToolbar
									clientId={ clientId }
									onDelete={ onDeleteBlock }
									isStackedHorizontally={
										isStackedHorizontally
									}
									blockWidth={ blockWidth }
									anchorNodeRef={ this.anchorNodeRef.current }
									isFullWidth={ isFullWidthToolbar }
									draggingClientId={ draggingClientId }
								/>
							) }
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

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

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockIndex,
			getBlockCount,
			getSettings,
			isBlockSelected,
			getBlock,
			getSelectedBlockClientId,
			getLowestCommonAncestorWithSelectedBlock,
			getBlockParents,
			hasSelectedInnerBlock,
			getBlockHierarchyRootClientId,
		} = select( blockEditorStore );

		const order = getBlockIndex( clientId );
		const isSelected = isBlockSelected( clientId );
		const isInnerBlockSelected = hasSelectedInnerBlock( clientId );
		const block = getBlock( clientId );
		const { name, attributes, isValid } = block || {};

		const blockType = getBlockType( name || 'core/missing' );
		const title = blockType?.title;
		const icon = blockType?.icon;

		const parents = getBlockParents( clientId, true );
		const parentId = parents[ 0 ] || '';

		const selectedBlockClientId = getSelectedBlockClientId();

		const commonAncestor =
			getLowestCommonAncestorWithSelectedBlock( clientId );
		const commonAncestorIndex = parents.indexOf( commonAncestor ) - 1;
		const firstToSelectId = commonAncestor
			? parents[ commonAncestorIndex ]
			: parents[ parents.length - 1 ];

		const isParentSelected =
			// Set false as a default value to prevent re-render when it's changed from null to false.
			( selectedBlockClientId || false ) &&
			selectedBlockClientId === parentId;

		const selectedParents = selectedBlockClientId
			? getBlockParents( selectedBlockClientId )
			: [];
		const isDescendantOfParentSelected =
			selectedParents.includes( parentId );
		const isTouchable =
			isSelected ||
			isDescendantOfParentSelected ||
			isParentSelected ||
			parentId === '';
		const baseGlobalStyles =
			getSettings()?.__experimentalGlobalStylesBaseStyles;

		const hasInnerBlocks = getBlockCount( clientId ) > 0;
		// For blocks with inner blocks, we only enable the dragging in the nested
		// blocks if any of them are selected. This way we prevent the long-press
		// gesture from being disabled for elements within the block UI.
		const draggingEnabled =
			! hasInnerBlocks ||
			isSelected ||
			! hasSelectedInnerBlock( clientId, true );
		// Dragging nested blocks is not supported yet. For this reason, the block to be dragged
		// will be the top in the hierarchy.
		const draggingClientId = getBlockHierarchyRootClientId( clientId );

		return {
			icon,
			name: name || 'core/missing',
			order,
			title,
			attributes,
			blockType,
			draggingClientId,
			draggingEnabled,
			isSelected,
			isInnerBlockSelected,
			isValid,
			isParentSelected,
			firstToSelectId,
			isTouchable,
			baseGlobalStyles,
			wrapperProps: getWrapperProps(
				attributes,
				blockType.getEditWrapperProps
			),
		};
	} ),
	withDispatch( ( dispatch, ownProps, registry ) => {
		const {
			insertBlocks,
			mergeBlocks,
			replaceBlocks,
			selectBlock,
			updateBlockAttributes,
			moveBlocksToPosition,
			removeBlock,
		} = dispatch( blockEditorStore );

		return {
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
					const targetRootClientId =
						getBlockRootClientId( _clientId );
					const blockOrder = getBlockOrder( _clientId );
					const [ firstClientId ] = blockOrder;

					if (
						blockOrder.length === 1 &&
						isUnmodifiedBlock( getBlock( firstClientId ) )
					) {
						removeBlock( _clientId );
					} else {
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
								registry.batch( () => {
									insertBlocks(
										replacement,
										getBlockIndex( _clientId ),
										targetRootClientId,
										changeSelection
									);
									removeBlock( firstClientId, false );
								} );
							}
						}

						if (
							! getBlockOrder( _clientId ).length &&
							isUnmodifiedBlock( getBlock( _clientId ) )
						) {
							removeBlock( _clientId, false );
						}
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
			onInsertBlocks( blocks, index ) {
				insertBlocks( blocks, index, ownProps.rootClientId );
			},
			onSelect( clientId = ownProps.clientId, initialPosition ) {
				selectBlock( clientId, initialPosition );
			},
			onChange: ( attributes ) => {
				updateBlockAttributes( ownProps.clientId, attributes );
			},
			onReplace( blocks, indexToSelect ) {
				replaceBlocks( [ ownProps.clientId ], blocks, indexToSelect );
			},
		};
	} ),
	withPreferredColorScheme,
] )( BlockListBlock );
