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
import { compose } from '@wordpress/compose';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { KeyboardAwareFlatList, ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import DefaultBlockAppender from '../default-block-appender';

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
		this.getNewBlockInsertionIndex = this.getNewBlockInsertionIndex.bind( this );
		this.shouldFlatListPreventAutomaticScroll = this.shouldFlatListPreventAutomaticScroll.bind( this );
	}

	finishBlockAppendingOrReplacing( newBlock ) {
		// now determine whether we need to replace the currently selected block (if it's empty)
		// or just add a new block as usual
		if ( this.isReplaceable( this.props.selectedBlock ) ) {
			// do replace here
			this.props.replaceBlock( this.props.selectedBlockClientId, newBlock );
		} else {
			this.props.insertBlock( newBlock, this.getNewBlockInsertionIndex() );
		}
	}

	getNewBlockInsertionIndex() {
		if ( this.props.isPostTitleSelected ) {
			// if post title selected, insert at top of post
			return 0;
		} else if ( this.props.selectedBlockIndex === -1 ) {
			// if no block selected, insert at end of post
			return this.props.blockCount;
		}
		// insert after selected block
		return this.props.selectedBlockIndex + 1;
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
		return (
			<ReadableContentView>
				<DefaultBlockAppender
					rootClientId={ this.props.rootClientId }
					containerStyle={ [
						styles.blockContainerFocused,
						this.blockHolderBorderStyle(),
						{ borderColor: 'transparent' },
					] }
				/>
			</ReadableContentView>
		);
	}

	render() {
		return (
			<View
				style={ { flex: 1 } }
				onAccessibilityEscape={ this.props.clearSelectedBlock }
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android' ? { removeClippedSubviews: false } : {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					innerRef={ this.scrollViewInnerRef }
					extraScrollHeight={ innerToolbarHeight + 10 }
					keyboardShouldPersistTaps="always"
					style={ styles.list }
					data={ this.props.blockClientIds }
					extraData={ [ this.props.isFullyBordered ] }
					keyExtractor={ identity }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={ this.shouldFlatListPreventAutomaticScroll }
					title={ this.props.title }
					ListHeaderComponent={ this.props.header }
					ListEmptyComponent={ this.renderDefaultBlockAppender }
					ListFooterComponent={ this.renderBlockListFooter }
				/>
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
		const { shouldShowBlockAtIndex, shouldShowInsertionPoint } = this.props;
		return (
			<ReadableContentView>
				{ shouldShowInsertionPoint( clientId ) && this.renderAddBlockSeparator() }
				{ shouldShowBlockAtIndex( index ) && (
					<BlockListBlock
						key={ clientId }
						showTitle={ false }
						clientId={ clientId }
						rootClientId={ this.props.rootClientId }
						onCaretVerticalPositionChange={ this.onCaretVerticalPositionChange }
						borderStyle={ this.blockHolderBorderStyle() }
						focusedBorderColor={ styles.blockHolderFocused.borderColor }
					/> ) }
			</ReadableContentView>
		);
	}

	renderAddBlockSeparator() {
		return (
			<View style={ styles.containerStyleAddHere } >
				<View style={ styles.lineStyleAddHere }></View>
				<Text style={ styles.labelStyleAddHere } >{ __( 'ADD BLOCK HERE' ) }</Text>
				<View style={ styles.lineStyleAddHere }></View>
			</View>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		return (
			<TouchableWithoutFeedback onPress={ () => {
				this.finishBlockAppendingOrReplacing( paragraphBlock );
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
			getBlockName,
			getBlockIndex,
			getBlockOrder,
			getSelectedBlock,
			getSelectedBlockClientId,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const shouldShowInsertionPoint = ( clientId ) => {
			return (
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				blockClientIds[ insertionPoint.index ] === clientId
			);
		};

		const selectedBlockIndex = getBlockIndex( selectedBlockClientId );
		const shouldShowBlockAtIndex = ( index ) => {
			const shouldHideBlockAtIndex = (
				blockInsertionPointIsVisible &&
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
			getBlockName,
			isBlockInsertionPointVisible: isBlockInsertionPointVisible(),
			shouldShowBlockAtIndex,
			shouldShowInsertionPoint,
			selectedBlock: getSelectedBlock(),
			selectedBlockClientId,
			selectedBlockIndex,
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
] )( BlockList );

