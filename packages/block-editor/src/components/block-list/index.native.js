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
import { createBlock } from '@wordpress/blocks';
import {
	KeyboardAwareFlatList,
	ReadableContentView,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import BlockInsertionPoint from './insertion-point';

export class BlockList extends Component {
	constructor() {
		super( ...arguments );

		this.renderItem = this.renderItem.bind( this );
		this.renderBlockListFooter = this.renderBlockListFooter.bind( this );
		this.renderDefaultBlockAppender = this.renderDefaultBlockAppender.bind(
			this
		);
		this.onCaretVerticalPositionChange = this.onCaretVerticalPositionChange.bind(
			this
		);
		this.scrollViewInnerRef = this.scrollViewInnerRef.bind( this );
		this.addBlockToEndOfPost = this.addBlockToEndOfPost.bind( this );
		this.shouldFlatListPreventAutomaticScroll = this.shouldFlatListPreventAutomaticScroll.bind(
			this
		);
		this.shouldShowInnerBlockAppender = this.shouldShowInnerBlockAppender.bind(
			this
		);
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

	shouldFlatListPreventAutomaticScroll() {
		return this.props.isBlockInsertionPointVisible;
	}

	renderDefaultBlockAppender() {
		const { shouldShowInsertionPointBefore } = this.props;
		const willShowInsertionPoint = shouldShowInsertionPointBefore(); // call without the client_id argument since this is the appender
		return (
			<View style={ styles.defaultAppender }>
				<ReadableContentView>
					<BlockListAppender // show the default appender, anormal, when not inserting a block
						rootClientId={ this.props.rootClientId }
						renderAppender={ this.props.renderAppender }
						showSeparator={ willShowInsertionPoint }
					/>
				</ReadableContentView>
			</View>
		);
	}

	shouldShowInnerBlockAppender() {
		const { blockClientIds, renderAppender } = this.props;
		return renderAppender && blockClientIds.length > 0;
	}

	render() {
		const {
			clearSelectedBlock,
			blockClientIds,
			title,
			header,
			withFooter = true,
			isReadOnly,
			isRootList,
			horizontal,
			scrollEnabled,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			marginVertical = styles.defaultBlock.marginTop,
			marginHorizontal = styles.defaultBlock.marginLeft,
		} = this.props;

		const { blockToolbar, blockBorder, headerToolbar } = styles;

		const forceRefresh =
			shouldShowInsertionPointBefore || shouldShowInsertionPointAfter;

		const containerStyle = {
			flex: isRootList ? 1 : 0,
			// We set negative margin in the parent to remove the edge spacing between parent block and child block in ineer blocks
			marginVertical: isRootList ? 0 : -marginVertical,
			marginHorizontal: isRootList ? 0 : -marginHorizontal,
		};

		return (
			<View
				style={ containerStyle }
				onAccessibilityEscape={ clearSelectedBlock }
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android'
						? { removeClippedSubviews: false }
						: {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					autoScroll={ this.props.autoScroll }
					innerRef={ this.scrollViewInnerRef }
					extraScrollHeight={
						blockToolbar.height + blockBorder.width
					}
					inputAccessoryViewHeight={ headerToolbar.height }
					keyboardShouldPersistTaps="always"
					scrollViewStyle={ [
						{ flex: isRootList ? 1 : 0 },
						! isRootList && styles.overflowVisible,
					] }
					horizontal={ horizontal }
					scrollEnabled={ scrollEnabled }
					contentContainerStyle={
						horizontal && styles.horizontalContentContainer
					}
					style={ ! isRootList && styles.overflowVisible }
					data={ blockClientIds }
					keyExtractor={ identity }
					extraData={ forceRefresh }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={
						this.shouldFlatListPreventAutomaticScroll
					}
					title={ title }
					ListHeaderComponent={ header }
					ListEmptyComponent={
						! isReadOnly && this.renderDefaultBlockAppender
					}
					ListFooterComponent={
						! isReadOnly && withFooter && this.renderBlockListFooter
					}
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
			isReadOnly,
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			marginVertical = styles.defaultBlock.marginTop,
			marginHorizontal = styles.defaultBlock.marginLeft,
			horizontalDirection,
			contentResizeMode,
			contentStyle,
			onAddBlock,
			onDeleteBlock,
		} = this.props;

		const readableContentViewStyle = contentResizeMode === 'stretch' && {
			flex: 1,
		};

		return (
			<ReadableContentView style={ readableContentViewStyle }>
				<View
					style={ readableContentViewStyle }
					pointerEvents={ isReadOnly ? 'box-only' : 'auto' }
				>
					{ shouldShowInsertionPointBefore( clientId ) && (
						<BlockInsertionPoint />
					) }
					<BlockListBlock
						key={ clientId }
						showTitle={ false }
						clientId={ clientId }
						marginVertical={ marginVertical }
						marginHorizontal={ marginHorizontal }
						rootClientId={ this.props.rootClientId }
						onCaretVerticalPositionChange={
							this.onCaretVerticalPositionChange
						}
						horizontalDirection={ horizontalDirection }
						contentStyle={ contentStyle }
						onAddBlock={ onAddBlock }
						onDeleteBlock={ onDeleteBlock }
					/>
					{ ! this.shouldShowInnerBlockAppender() &&
						shouldShowInsertionPointAfter( clientId ) && (
							<BlockInsertionPoint />
						) }
				</View>
			</ReadableContentView>
		);
	}

	renderBlockListFooter() {
		const paragraphBlock = createBlock( 'core/paragraph' );
		return (
			<>
				<TouchableWithoutFeedback
					accessibilityLabel={ __( 'Add paragraph block' ) }
					onPress={ () => {
						this.addBlockToEndOfPost( paragraphBlock );
					} }
				>
					<View style={ styles.blockListFooter } />
				</TouchableWithoutFeedback>
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId, __experimentalMoverDirection } ) => {
		const {
			getBlockCount,
			getBlockOrder,
			getSelectedBlockClientId,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
			getSettings,
		} = select( 'core/block-editor' );

		const horizontalDirection =
			__experimentalMoverDirection === 'horizontal';

		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const shouldShowInsertionPointBefore = ( clientId ) => {
			return (
				! horizontalDirection &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if list is empty, show the insertion point (via the default appender)
				( blockClientIds.length === 0 ||
					// or if the insertion point is right before the denoted block
					blockClientIds[ insertionPoint.index ] === clientId )
			);
		};
		const shouldShowInsertionPointAfter = ( clientId ) => {
			return (
				! horizontalDirection &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// if the insertion point is at the end of the list
				blockClientIds.length === insertionPoint.index &&
				// and the denoted block is the last one on the list, show the indicator at the end of the block
				blockClientIds[ insertionPoint.index - 1 ] === clientId
			);
		};

		const isReadOnly = getSettings().readOnly;

		return {
			blockClientIds,
			blockCount: getBlockCount( rootClientId ),
			isBlockInsertionPointVisible: isBlockInsertionPointVisible(),
			shouldShowInsertionPointBefore,
			shouldShowInsertionPointAfter,
			selectedBlockClientId,
			isReadOnly,
			isRootList: rootClientId === undefined,
			horizontalDirection,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { insertBlock, replaceBlock, clearSelectedBlock } = dispatch(
			'core/block-editor'
		);

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
	withPreferredColorScheme,
] )( BlockList );
