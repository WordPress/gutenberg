/**
 * External dependencies
 */
import { identity } from 'lodash';
import { View, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { KeyboardAwareFlatList, ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import BlockInsertionPoint from './insertion-point';
import __experimentalBlockListFooter from '../block-list-footer';

const innerToolbarHeight = 44;

export class BlockList extends Component {
	constructor() {
		super( ...arguments );

		this.renderItem = this.renderItem.bind( this );
		this.renderBlockListFooter = this.renderBlockListFooter.bind( this );
		this.renderDefaultBlockAppender = this.renderDefaultBlockAppender.bind( this );
		this.onCaretVerticalPositionChange = this.onCaretVerticalPositionChange.bind( this );
		this.scrollViewInnerRef = this.scrollViewInnerRef.bind( this );
		this.addBlockToEndOfPost = this.addBlockToEndOfPost.bind( this );
		this.shouldFlatListPreventAutomaticScroll = this.shouldFlatListPreventAutomaticScroll.bind( this );
	}

	addBlockToEndOfPost( newBlock ) {
		this.props.insertBlock( newBlock, this.props.blockCount );
	}

	onCaretVerticalPositionChange( targetId, caretY, previousCaretY ) {
		KeyboardAwareFlatList.handleCaretVerticalPositionChange( this.scrollViewRef, targetId, caretY, previousCaretY );
	}

	scrollViewInnerRef( ref ) {
		this.scrollViewRef = ref;
	}

	shouldFlatListPreventAutomaticScroll() {
		return this.props.isBlockInsertionPointVisible;
	}

	renderDefaultBlockAppender() {
		const { shouldShowInsertionPointBefore } = this.props;
		const willShowInsertionPoint = shouldShowInsertionPointBefore(); // call without the client_id argument since this is the appender
		return (
			<ReadableContentView>
				<BlockListAppender				// show the default appender, anormal, when not inserting a block
					rootClientId={ this.props.rootClientId }
					renderAppender={ this.props.renderAppender }
					showSeparator={ willShowInsertionPoint }
				/>
			</ReadableContentView>
		);
	}

	render() {
		const {
			clearSelectedBlock,
			blockClientIds,
			isFullyBordered,
			title,
			header,
			withFooter = true,
			renderAppender,
			isRootList,
		} = this.props;

		return (
			<View
				style={ { flex: isRootList ? 1 : 0 } }
				onAccessibilityEscape={ clearSelectedBlock }
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android' ? { removeClippedSubviews: false } : {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					autoScroll={ this.props.autoScroll }
					innerRef={ this.scrollViewInnerRef }
					extraScrollHeight={ innerToolbarHeight + 10 }
					keyboardShouldPersistTaps="always"
					scrollViewStyle={ { flex: isRootList ? 1 : 0 } }
					data={ blockClientIds }
					extraData={ [ isFullyBordered ] }
					keyExtractor={ identity }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={ this.shouldFlatListPreventAutomaticScroll }
					title={ title }
					ListHeaderComponent={ header }
					ListEmptyComponent={ this.renderDefaultBlockAppender }
					ListFooterComponent={ withFooter && this.renderBlockListFooter }
				/>

				{ renderAppender && blockClientIds.length > 0 && (
					<View style={ styles.paddingToContent }>
						<BlockListAppender
							rootClientId={ this.props.rootClientId }
							renderAppender={ this.props.renderAppender }
						/>
					</View>
				)
				}

			</View>
		);
	}

	isReplaceable( block ) {
		if ( ! block ) {
			return false;
		}
		return isUnmodifiedDefaultBlock( block );
	}

	renderItem( { item: clientId, index } ) {
		const { shouldShowBlockAtIndex, shouldShowInsertionPointBefore, shouldShowInsertionPointAfter } = this.props;
		return (
			<ReadableContentView>
				{ shouldShowInsertionPointBefore( clientId ) && <BlockInsertionPoint /> }
				{ shouldShowBlockAtIndex( index ) && (
					<BlockListBlock
						key={ clientId }
						showTitle={ false }
						clientId={ clientId }
						rootClientId={ this.props.rootClientId }
						onCaretVerticalPositionChange={ this.onCaretVerticalPositionChange }
						isSmallScreen={ ! this.props.isFullyBordered }
					/> ) }
				{ shouldShowInsertionPointAfter( clientId ) && <BlockInsertionPoint /> }
			</ReadableContentView>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		return (
			<>
				<TouchableWithoutFeedback onPress={ () => {
					this.addBlockToEndOfPost( paragraphBlock );
				} } >
					<View style={ styles.blockListFooter } />
				</TouchableWithoutFeedback>
				<__experimentalBlockListFooter.Slot />
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getBlockCount,
			getBlockIndex,
			getBlockOrder,
			getSelectedBlockClientId,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
			getSelectedBlock,
		} = select( 'core/block-editor' );

		const {
			getGroupingBlockName,
		} = select( 'core/blocks' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const selectedBlock = getSelectedBlock();
		const hasInnerBlocks = selectedBlock && selectedBlock.name === getGroupingBlockName();
		const shouldShowInsertionPointBefore = ( clientId ) => {
			return (
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				(
					// if list is empty, show the insertion point (via the default appender)
					blockClientIds.length === 0 ||
					// or if the insertion point is right before the denoted block
					blockClientIds[ insertionPoint.index ] === clientId
				)
			);
		};
		const shouldShowInsertionPointAfter = ( clientId ) => {
			return (
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&

				// if the insertion point is at the end of the list
				blockClientIds.length === insertionPoint.index &&

				// and the denoted block is the last one on the list, show the indicator at the end of the block
				blockClientIds[ insertionPoint.index - 1 ] === clientId
			);
		};

		const selectedBlockIndex = getBlockIndex( selectedBlockClientId, rootClientId );

		const shouldShowBlockAtIndex = ( index ) => {
			const shouldHideBlockAtIndex = (
				! hasInnerBlocks && blockInsertionPointIsVisible &&
				// if `index` === `insertionPoint.index`, then block is replaceable
				index === insertionPoint.index &&
				// only hide selected block
				index === selectedBlockIndex
			);
			return ! shouldHideBlockAtIndex;
		};

		return {
			blockClientIds,
			blockCount: getBlockCount( rootClientId ),
			isBlockInsertionPointVisible: isBlockInsertionPointVisible(),
			shouldShowBlockAtIndex,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			selectedBlockClientId,
			isRootList: rootClientId === undefined,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			insertBlock,
			replaceBlock,
			clearSelectedBlock,
		} = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
	withPreferredColorScheme,
] )( BlockList );
