/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { GlobalStylesContext, WIDE_ALIGNMENTS } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	getBlockType,
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './block.scss';
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockMobileToolbar from '../block-mobile-toolbar';

class BlockListBlock extends Component {
	constructor() {
		super( ...arguments );

		this.insertBlocksAfter = this.insertBlocksAfter.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.getBlockWidth = this.getBlockWidth.bind( this );

		this.state = {
			blockWidth: 0,
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
			// focus on the first block inserted
			this.props.onSelect( blocks[ 0 ].clientId );
		}
	}

	getBlockWidth( { nativeEvent } ) {
		const { layout } = nativeEvent;
		const { blockWidth } = this.state;

		if ( blockWidth !== layout.width ) {
			this.setState( { blockWidth: layout.width } );
		}
	}

	getBlockForType() {
		return (
			<GlobalStylesContext.Consumer>
				{ ( globalStyle ) => {
					const mergedStyle = {
						...globalStyle,
						...this.props.wrapperProps.style,
					};
					return (
						<GlobalStylesContext.Provider value={ mergedStyle }>
							<BlockEdit
								name={ this.props.name }
								isSelected={ this.props.isSelected }
								attributes={ this.props.attributes }
								setAttributes={ this.props.onChange }
								onFocus={ this.onFocus }
								onReplace={ this.props.onReplace }
								insertBlocksAfter={ this.insertBlocksAfter }
								mergeBlocks={ this.props.mergeBlocks }
								onCaretVerticalPositionChange={
									this.props.onCaretVerticalPositionChange
								}
								// Block level styles
								wrapperProps={ this.props.wrapperProps }
								// inherited styles merged with block level styles
								mergedStyle={ mergedStyle }
								clientId={ this.props.clientId }
								parentWidth={ this.props.parentWidth }
								contentStyle={ this.props.contentStyle }
								onDeleteBlock={ this.props.onDeleteBlock }
							/>
							<View onLayout={ this.getBlockWidth } />
						</GlobalStylesContext.Provider>
					);
				} }
			</GlobalStylesContext.Consumer>
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

		const accessible = ! ( isSelected || isInnerBlockSelected );
		const isFullWidth = align === WIDE_ALIGNMENTS.alignments.full;
		const screenWidth = Math.floor( Dimensions.get( 'window' ).width );

		return (
			<TouchableWithoutFeedback
				onPress={ this.onFocus }
				accessible={ accessible }
				accessibilityRole={ 'button' }
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
									isFullWidth &&
										blockWidth < screenWidth &&
										styles.borderFullWidth,
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
						{ isValid ? (
							this.getBlockForType()
						) : (
							<BlockInvalidWarning
								blockTitle={ title }
								icon={ icon }
							/>
						) }
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
									isFullWidth={ isFullWidth }
								/>
							) }
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

// Helper function to memoize the wrapperProps since getEditWrapperProps always returns a new reference
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
	withSelect( ( select, { clientId, rootClientId } ) => {
		const {
			getBlockIndex,
			isBlockSelected,
			__unstableGetBlockWithoutInnerBlocks,
			getSelectedBlockClientId,
			getLowestCommonAncestorWithSelectedBlock,
			getBlockParents,
			hasSelectedInnerBlock,
		} = select( 'core/block-editor' );

		const order = getBlockIndex( clientId, rootClientId );
		const isSelected = isBlockSelected( clientId );
		const isInnerBlockSelected = hasSelectedInnerBlock( clientId );
		const block = __unstableGetBlockWithoutInnerBlocks( clientId );
		const { name, attributes, isValid } = block || {};

		const blockType = getBlockType( name || 'core/missing' );
		const title = blockType.title;
		const icon = blockType.icon;

		const parents = getBlockParents( clientId, true );
		const parentId = parents[ 0 ] || '';

		const selectedBlockClientId = getSelectedBlockClientId();

		const commonAncestor = getLowestCommonAncestorWithSelectedBlock(
			clientId
		);
		const commonAncestorIndex = parents.indexOf( commonAncestor ) - 1;
		const firstToSelectId = commonAncestor
			? parents[ commonAncestorIndex ]
			: parents[ parents.length - 1 ];

		const isParentSelected =
			// set false as a default value to prevent re-render when it's changed from null to false
			( selectedBlockClientId || false ) &&
			selectedBlockClientId === parentId;

		const selectedParents = selectedBlockClientId
			? getBlockParents( selectedBlockClientId )
			: [];
		const isDescendantOfParentSelected = selectedParents.includes(
			parentId
		);
		const isTouchable =
			isSelected ||
			isDescendantOfParentSelected ||
			isParentSelected ||
			parentId === '';
		return {
			icon,
			name: name || 'core/missing',
			order,
			title,
			attributes,
			blockType,
			isSelected,
			isInnerBlockSelected,
			isValid,
			isParentSelected,
			firstToSelectId,
			isTouchable,
			wrapperProps: getWrapperProps(
				attributes,
				blockType.getEditWrapperProps
			),
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			insertBlocks,
			mergeBlocks,
			replaceBlocks,
			selectBlock,
			updateBlockAttributes,
		} = dispatch( 'core/block-editor' );

		return {
			mergeBlocks( forward ) {
				const { clientId } = ownProps;
				const {
					getPreviousBlockClientId,
					getNextBlockClientId,
				} = select( 'core/block-editor' );

				if ( forward ) {
					const nextBlockClientId = getNextBlockClientId( clientId );
					if ( nextBlockClientId ) {
						mergeBlocks( clientId, nextBlockClientId );
					}
				} else {
					const previousBlockClientId = getPreviousBlockClientId(
						clientId
					);
					if ( previousBlockClientId ) {
						mergeBlocks( previousBlockClientId, clientId );
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
