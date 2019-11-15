/**
 * External dependencies
 */
import { identity } from 'lodash';
import { Text, View, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
import FloatingToolbar from './block-mobile-floating-toolbar';

const innerToolbarHeight = 44;

export class BlockList extends Component {
	constructor() {
		super( ...arguments );

		this.renderItem = this.renderItem.bind( this );
		this.renderAddBlockSeparator = this.renderAddBlockSeparator.bind( this );
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

	blockHolderBorderStyle() {
		return this.props.isFullyBordered ? styles.blockHolderFullBordered : styles.blockHolderSemiBordered;
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
				{ willShowInsertionPoint ?
					this.renderAddBlockSeparator() :	// show the new-block indicator when we're inserting a block or
					<BlockListAppender				// show the default appender, as normal, when not inserting a block
						rootClientId={ this.props.rootClientId }
						renderAppender={ this.props.renderAppender }
					/>
				}
			</ReadableContentView>
		);
	}

	render() {
		const { clearSelectedBlock, blockClientIds, isFullyBordered, title, header, withFooter = true, renderAppender, isFirstBlock, selectedBlockParentId, isRootList } = this.props;

		const showFloatingToolbar = isFirstBlock && selectedBlockParentId !== '';
		return (
			<View
				style={ { flex: isRootList ? 1 : 0 } }
				onAccessibilityEscape={ clearSelectedBlock }
			>
				{ showFloatingToolbar && <FloatingToolbar.Slot fillProps={ { innerFloatingToolbar: showFloatingToolbar } } /> }
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

				{ renderAppender && blockClientIds.length > 0 &&
					<BlockListAppender
						rootClientId={ this.props.rootClientId }
						renderAppender={ this.props.renderAppender }
					/>
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
		const blockHolderFocusedStyle = this.props.getStylesFromColorScheme( styles.blockHolderFocused, styles.blockHolderFocusedDark );
		const { shouldShowBlockAtIndex, shouldShowInsertionPointBefore, shouldShowInsertionPointAfter } = this.props;
		return (
			<ReadableContentView>
				{ shouldShowInsertionPointBefore( clientId ) && this.renderAddBlockSeparator() }
				{ shouldShowBlockAtIndex( index ) && (
					<BlockListBlock
						key={ clientId }
						showTitle={ false }
						clientId={ clientId }
						rootClientId={ this.props.rootClientId }
						onCaretVerticalPositionChange={ this.onCaretVerticalPositionChange }
						borderStyle={ this.blockHolderBorderStyle() }
						focusedBorderColor={ blockHolderFocusedStyle.borderColor }
					/> ) }
				{ shouldShowInsertionPointAfter( clientId ) && this.renderAddBlockSeparator() }
			</ReadableContentView>
		);
	}

	renderAddBlockSeparator() {
		const lineStyle = this.props.getStylesFromColorScheme( styles.lineStyleAddHere, styles.lineStyleAddHereDark );
		const labelStyle = this.props.getStylesFromColorScheme( styles.labelStyleAddHere, styles.labelStyleAddHereDark );
		return (
			<View style={ styles.containerStyleAddHere } >
				<View style={ lineStyle }></View>
				<Text style={ labelStyle } >{ __( 'ADD BLOCK HERE' ) }</Text>
				<View style={ lineStyle }></View>
			</View>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		return (
			<TouchableWithoutFeedback onPress={ () => {
				this.addBlockToEndOfPost( paragraphBlock );
			} } >
				<View style={ styles.blockListFooter } />
			</TouchableWithoutFeedback>
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
			getBlockRootClientId,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const selectedBlock = getSelectedBlock();
		const isSelectedGroup = selectedBlock && selectedBlock.name === 'core/group';
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

		const isFirstBlock = selectedBlockIndex === 0;

		const selectedBlockParentId = getBlockRootClientId( selectedBlockClientId );

		const shouldShowBlockAtIndex = ( index ) => {
			const shouldHideBlockAtIndex = (
				! isSelectedGroup && blockInsertionPointIsVisible &&
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
			isFirstBlock,
			selectedBlockParentId,
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
