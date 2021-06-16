/**
 * External dependencies
 */
import { identity } from 'lodash';
import { View, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, createContext } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import {
	KeyboardAwareFlatList,
	ReadableContentView,
	WIDE_ALIGNMENTS,
	alignmentHelpers,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListAppender from '../block-list-appender';
import BlockListItem from './block-list-item.native';
import { store as blockEditorStore } from '../../store';

const BlockListContext = createContext();

export const OnCaretVerticalPositionChange = createContext();

const stylesMemo = {};
const getStyles = (
	isRootList,
	isStackedHorizontally,
	horizontalAlignment
) => {
	if ( isRootList ) {
		return;
	}
	const styleName = `${ isStackedHorizontally }-${ horizontalAlignment }`;
	if ( stylesMemo[ styleName ] ) {
		return stylesMemo[ styleName ];
	}
	const computedStyles = [
		isStackedHorizontally && styles.horizontal,
		horizontalAlignment && styles[ `is-aligned-${ horizontalAlignment }` ],
	];
	stylesMemo[ styleName ] = computedStyles;
	return computedStyles;
};

export class BlockList extends Component {
	constructor() {
		super( ...arguments );
		this.extraData = {
			parentWidth: this.props.parentWidth,
			renderFooterAppender: this.props.renderFooterAppender,
			renderAppender: this.props.renderAppender,
			onDeleteBlock: this.props.onDeleteBlock,
			contentStyle: this.props.contentStyle,
		};
		this.renderItem = this.renderItem.bind( this );
		this.renderBlockListFooter = this.renderBlockListFooter.bind( this );
		this.onCaretVerticalPositionChange = this.onCaretVerticalPositionChange.bind(
			this
		);
		this.scrollViewInnerRef = this.scrollViewInnerRef.bind( this );
		this.addBlockToEndOfPost = this.addBlockToEndOfPost.bind( this );
		this.shouldShowInnerBlockAppender = this.shouldShowInnerBlockAppender.bind(
			this
		);
		this.renderEmptyList = this.renderEmptyList.bind( this );
		this.getExtraData = this.getExtraData.bind( this );

		this.onLayout = this.onLayout.bind( this );

		this.listHeight = 0;
		this.offsetOfIndex = this.offsetOfIndex.bind( this );
		this.itemHeights = [];

		this.state = {
			blockWidth: this.props.blockWidth || 0,
		};
	}

	addBlockToEndOfPost( newBlock ) {
		this.props.insertBlock( newBlock, this.props.blockCount );
	}

	onCaretVerticalPositionChange( targetId, caretY, previousCaretY ) {
		KeyboardAwareFlatList.handleCaretVerticalPositionChange(
			this.scrollViewRef,
			targetId,
			caretY,
			previousCaretY
		);
	}

	scrollViewInnerRef( ref ) {
		this.scrollViewRef = ref;
	}

	shouldShowInnerBlockAppender() {
		const { blockClientIds, renderAppender } = this.props;
		return renderAppender && blockClientIds.length > 0;
	}

	renderEmptyList() {
		return (
			<EmptyListComponentCompose
				rootClientId={ this.props.rootClientId }
				renderAppender={ this.props.renderAppender }
				renderFooterAppender={ this.props.renderFooterAppender }
			/>
		);
	}

	getExtraData() {
		const {
			parentWidth,
			renderFooterAppender,
			onDeleteBlock,
			contentStyle,
			renderAppender,
		} = this.props;
		const { blockWidth } = this.state;
		if (
			this.extraData.parentWidth !== parentWidth ||
			this.extraData.renderFooterAppender !== renderFooterAppender ||
			this.extraData.onDeleteBlock !== onDeleteBlock ||
			this.extraData.contentStyle !== contentStyle ||
			this.extraData.renderAppender !== renderAppender ||
			this.extraData.blockWidth !== blockWidth
		) {
			this.extraData = {
				parentWidth,
				renderFooterAppender,
				onDeleteBlock,
				contentStyle,
				renderAppender,
				blockWidth,
			};
		}
		return this.extraData;
	}

	onLayout( { nativeEvent } ) {
		const { layout } = nativeEvent;
		const { blockWidth } = this.state;
		const { isRootList, maxWidth } = this.props;

		// update the known list height. Using it to compute how much empty space to reserve in the footer
		this.listHeight = layout.height;

		const layoutWidth = Math.floor( layout.width );
		if ( isRootList && blockWidth !== layoutWidth ) {
			this.setState( {
				blockWidth: Math.min( layoutWidth, maxWidth ),
			} );
		} else if ( ! isRootList && ! blockWidth ) {
			this.setState( { blockWidth: Math.min( layoutWidth, maxWidth ) } );
		}
	}

	/**
	 * Computes the offset of a block in pixels, by adding up all the block heights before it.
	 */
	offsetOfIndex( heights, blockClientIds, index ) {
		const ITEM_HEIGHT = 30; // just a kinda arbitrary default height, just to have it non zero.
		const offset = blockClientIds
			.slice( 0, index + 1 ) // only add up to the index we want (adding 1 to include the indexed item itself too)
			.reduce(
				// accumulate the heights of the items
				( acc, id ) =>
					heights[ id ] && heights[ id ] > 0
						? acc + heights[ id ]
						: acc + ITEM_HEIGHT,
				0
			);
		return offset;
	}

	componentDidUpdate( prevProps ) {
		const {
			isBlockInsertionPointVisible,
			insertionPoint,
			blockClientIds,
		} = this.props;

		// if we're now showing the new-block indicator, trigger a scroll to it
		if (
			isBlockInsertionPointVisible !==
			prevProps.isBlockInsertionPointVisible
		) {
			const insertionPointInRootList =
				insertionPoint.rootClientId === undefined;
			if ( insertionPointInRootList && isBlockInsertionPointVisible ) {
				const jumpToIndex = insertionPoint.index - 1; // scrolling goes to the bottom of the item so, let's scroll to one above
				const offset =
					jumpToIndex < 0
						? 0
						: this.offsetOfIndex(
								this.itemHeights,
								blockClientIds,
								jumpToIndex
						  );
				if ( Platform.OS === 'android' ) {
					this.scrollViewRef.scrollToOffset( { offset } );
				} else {
					this.scrollViewRef.scrollTo( { y: offset } );
				}
			}
		}
	}

	render() {
		const { isRootList } = this.props;
		// Use of Context to propagate the main scroll ref to its children e.g InnerBlocks
		const blockList = isRootList ? (
			<BlockListContext.Provider value={ this.scrollViewRef }>
				{ this.renderList() }
			</BlockListContext.Provider>
		) : (
			<BlockListContext.Consumer>
				{ ( ref ) =>
					this.renderList( {
						parentScrollRef: ref,
					} )
				}
			</BlockListContext.Consumer>
		);

		return (
			<OnCaretVerticalPositionChange.Provider
				value={ this.onCaretVerticalPositionChange }
			>
				{ blockList }
			</OnCaretVerticalPositionChange.Provider>
		);
	}

	renderList( extraProps = {} ) {
		const {
			clearSelectedBlock,
			blockClientIds,
			title,
			header,
			isReadOnly,
			isRootList,
			horizontal,
			marginVertical = styles.defaultBlock.marginTop,
			marginHorizontal = styles.defaultBlock.marginLeft,
			isFloatingToolbarVisible,
			isStackedHorizontally,
			horizontalAlignment,
			contentResizeMode,
			blockWidth,
		} = this.props;
		const { parentScrollRef } = extraProps;

		const {
			blockToolbar,
			blockBorder,
			headerToolbar,
			floatingToolbar,
		} = styles;

		const containerStyle = {
			flex: isRootList ? 1 : 0,
			// We set negative margin in the parent to remove the edge spacing between parent block and child block in ineer blocks
			marginVertical: isRootList ? 0 : -marginVertical,
			marginHorizontal: isRootList ? 0 : -marginHorizontal,
		};

		const isContentStretch = contentResizeMode === 'stretch';
		const isMultiBlocks = blockClientIds.length > 1;
		const { isWider } = alignmentHelpers;

		return (
			<View
				style={ containerStyle }
				onAccessibilityEscape={ clearSelectedBlock }
				onLayout={ this.onLayout }
				testID="block-list-wrapper"
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android'
						? { removeClippedSubviews: false }
						: {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					autoScroll={ this.props.autoScroll }
					innerRef={ ( ref ) => {
						this.scrollViewInnerRef( parentScrollRef || ref );
					} }
					extraScrollHeight={
						blockToolbar.height + blockBorder.width
					}
					inputAccessoryViewHeight={
						headerToolbar.height +
						( isFloatingToolbarVisible
							? floatingToolbar.height
							: 0 )
					}
					keyboardShouldPersistTaps="always"
					scrollViewStyle={ [
						{ flex: isRootList ? 1 : 0 },
						! isRootList && styles.overflowVisible,
					] }
					horizontal={ horizontal }
					extraData={ this.getExtraData() }
					scrollEnabled={ isRootList }
					contentContainerStyle={ [
						horizontal && styles.horizontalContentContainer,
						isWider( blockWidth, 'medium' ) &&
							( isContentStretch && isMultiBlocks
								? styles.horizontalContentContainerStretch
								: styles.horizontalContentContainerCenter ),
					] }
					style={ getStyles(
						isRootList,
						isStackedHorizontally,
						horizontalAlignment
					) }
					data={ blockClientIds }
					keyExtractor={ identity }
					renderItem={ this.renderItem }
					title={ title }
					ListHeaderComponent={ header }
					ListEmptyComponent={ ! isReadOnly && this.renderEmptyList }
					ListFooterComponent={ this.renderBlockListFooter }
				/>
				{ this.shouldShowInnerBlockAppender() && (
					<View
						style={ {
							marginHorizontal:
								marginHorizontal -
								styles.innerAppender.marginLeft,
						} }
					>
						<BlockListAppender
							rootClientId={ this.props.rootClientId }
							renderAppender={ this.props.renderAppender }
							showSeparator
						/>
					</View>
				) }
			</View>
		);
	}

	renderItem( { item: clientId } ) {
		const {
			contentResizeMode,
			contentStyle,
			onAddBlock,
			onDeleteBlock,
			rootClientId,
			isStackedHorizontally,
			parentWidth,
			marginVertical = styles.defaultBlock.marginTop,
			marginHorizontal = styles.defaultBlock.marginLeft,
		} = this.props;
		const { blockWidth } = this.state;
		return (
			<BlockListItem
				isStackedHorizontally={ isStackedHorizontally }
				rootClientId={ rootClientId }
				clientId={ clientId }
				parentWidth={ parentWidth }
				contentResizeMode={ contentResizeMode }
				contentStyle={ contentStyle }
				onAddBlock={ onAddBlock }
				marginVertical={ marginVertical }
				marginHorizontal={ marginHorizontal }
				onDeleteBlock={ onDeleteBlock }
				shouldShowInnerBlockAppender={
					this.shouldShowInnerBlockAppender
				}
				blockWidth={ blockWidth }
				onLayout={
					( object ) =>
						( this.itemHeights[ clientId ] =
							object.nativeEvent.layout.height ) // Capture the block height. We'll use the list of heights to compute offsets.
				}
			/>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		const {
			isReadOnly,
			withFooter = true,
			renderFooterAppender,
		} = this.props;

		if ( ! isReadOnly && withFooter ) {
			const footerHeight = Math.max(
				( this.listHeight * 3 ) / 4, // set the footer to 3 quarters of the list height to give room for the inserter *plus* the insertion point
				styles.blockListFooter.minHeight
			);

			return (
				<>
					<TouchableWithoutFeedback
						accessibilityLabel={ __( 'Add paragraph block' ) }
						testID={ __( 'Add paragraph block' ) }
						onPress={ () => {
							this.addBlockToEndOfPost( paragraphBlock );
						} }
					>
						<View
							style={ [
								styles.blockListFooter,
								{ height: footerHeight },
							] }
						/>
					</TouchableWithoutFeedback>
				</>
			);
		} else if ( renderFooterAppender ) {
			return renderFooterAppender();
		}
		return null;
	}
}

export default compose( [
	withSelect(
		( select, { rootClientId, orientation, filterInnerBlocks } ) => {
			const {
				getBlockCount,
				getBlockOrder,
				getSelectedBlockClientId,
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
				getSettings,
			} = select( blockEditorStore );

			const isStackedHorizontally = orientation === 'horizontal';

			const selectedBlockClientId = getSelectedBlockClientId();

			let blockClientIds = getBlockOrder( rootClientId );
			// Display only block which fulfill the condition in passed `filterInnerBlocks` function
			if ( filterInnerBlocks ) {
				blockClientIds = filterInnerBlocks( blockClientIds );
			}

			const { maxWidth } = getSettings();
			const isReadOnly = getSettings().readOnly;

			const blockCount = getBlockCount();
			const hasRootInnerBlocks = !! blockCount;

			const isFloatingToolbarVisible =
				!! selectedBlockClientId && hasRootInnerBlocks;

			const insertionPoint = getBlockInsertionPoint();

			return {
				blockClientIds,
				blockCount,
				insertionPoint,
				isBlockInsertionPointVisible: isBlockInsertionPointVisible(),
				selectedBlockClientId,
				isReadOnly,
				isRootList: rootClientId === undefined,
				isFloatingToolbarVisible,
				isStackedHorizontally,
				maxWidth,
			};
		}
	),
	withDispatch( ( dispatch ) => {
		const { insertBlock, replaceBlock, clearSelectedBlock } = dispatch(
			blockEditorStore
		);

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
	withPreferredColorScheme,
] )( BlockList );

class EmptyListComponent extends Component {
	render() {
		const {
			shouldShowInsertionPoint,
			rootClientId,
			renderAppender,
			renderFooterAppender,
		} = this.props;

		if ( renderFooterAppender ) {
			return null;
		}

		return (
			<View style={ styles.defaultAppender }>
				<ReadableContentView
					align={
						renderAppender
							? WIDE_ALIGNMENTS.alignments.full
							: undefined
					}
				>
					<BlockListAppender
						rootClientId={ rootClientId }
						renderAppender={ renderAppender }
						showSeparator={ shouldShowInsertionPoint }
					/>
				</ReadableContentView>
			</View>
		);
	}
}

const EmptyListComponentCompose = compose( [
	withSelect( ( select, { rootClientId, orientation } ) => {
		const {
			getBlockOrder,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( blockEditorStore );

		const isStackedHorizontally = orientation === 'horizontal';
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const shouldShowInsertionPoint =
			! isStackedHorizontally &&
			blockInsertionPointIsVisible &&
			insertionPoint.rootClientId === rootClientId &&
			// if list is empty, show the insertion point (via the default appender)
			( blockClientIds.length === 0 ||
				// or if the insertion point is right before the denoted block
				! blockClientIds[ insertionPoint.index ] );

		return {
			shouldShowInsertionPoint,
		};
	} ),
] )( EmptyListComponent );
