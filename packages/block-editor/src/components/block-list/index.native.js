/**
 * External dependencies
 */
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
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockListAppender from '../block-list-appender';
import BlockListItem from './block-list-item.native';

const BlockListContext = createContext();

const keyExtractor = ( item ) => item;

const stylesMemo = {};
const getStyles = (
	isRootList,
	isStackedHorizontally,
	horizontalAlignment
) => {
	if ( isRootList ) {
		return undefined;
	}
	const stylesName = `${ isStackedHorizontally }-${ horizontalAlignment }`;
	if ( stylesMemo[ stylesName ] ) {
		return stylesMemo[ stylesName ];
	}
	const computedStyles = [
		isStackedHorizontally && styles.horizontal,
		horizontalAlignment && styles[ `is-aligned-${ horizontalAlignment }` ],
	];
	stylesMemo[ stylesName ] = computedStyles;
	return computedStyles;
};

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

	shouldComponentUpdate( nextProps ) {
		if (
			JSON.stringify( nextProps.blockClientIds ) !==
				JSON.stringify( this.props.blockClientIds ) ||
			nextProps.blockCount !== this.props.blockCount ||
			nextProps.isReadOnly !== this.props.isReadOnly ||
			nextProps.shouldShowInsertionPointBefore !==
				this.props.shouldShowInsertionPointBefore ||
			nextProps.isBlockInsertionPointVisible !==
				this.props.isBlockInsertionPointVisible
		) {
			return true;
		}
		return false;
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
		return (
			<View style={ styles.defaultAppender }>
				<ReadableContentView>
					<BlockListAppender // show the default appender, anormal, when not inserting a block
						rootClientId={ this.props.rootClientId }
						renderAppender={ this.props.renderAppender }
						showSeparator={ shouldShowInsertionPointBefore }
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
		const { isRootList } = this.props;

		// Use of Context to propagate the main scroll ref to its children e.g InnerBlocks
		return isRootList ? (
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
					scrollEnabled={ isRootList }
					contentContainerStyle={
						horizontal && styles.horizontalContentContainer
					}
					style={ getStyles(
						isRootList,
						isStackedHorizontally,
						horizontalAlignment
					) }
					data={ blockClientIds }
					keyExtractor={ keyExtractor }
					renderItem={ this.renderItem }
					shouldPreventAutomaticScroll={
						this.shouldFlatListPreventAutomaticScroll
					}
					title={ title }
					ListHeaderComponent={ header }
					ListEmptyComponent={
						! isReadOnly && this.renderDefaultBlockAppender
					}
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
		} = this.props;
		return (
			<BlockListItem
				isStackedHorizontally={ isStackedHorizontally }
				rootClientId={ rootClientId }
				clientId={ clientId }
				contentResizeMode={ contentResizeMode }
				contentStyle={ contentStyle }
				onAddBlock={ onAddBlock }
				onDeleteBlock={ onDeleteBlock }
				shouldShowInnerBlockAppender={ this.shouldShowInnerBlockAppender() }
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
		} else if ( renderFooterAppender ) {
			return renderFooterAppender();
		}
		return null;
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
			getBlockHierarchyRootClientId,
		} = select( 'core/block-editor' );

		const isStackedHorizontally =
			__experimentalMoverDirection === 'horizontal';

		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();
		const shouldShowInsertionPointBefore =
			! isStackedHorizontally &&
			blockInsertionPointIsVisible &&
			insertionPoint.rootClientId === rootClientId &&
			// if list is empty, show the insertion point (via the default appender)
			( blockClientIds.length === 0 ||
				// or if the insertion point is right before the denoted block
				! blockClientIds[ insertionPoint.index ] );

		const isReadOnly = getSettings().readOnly;

		const rootBlockId = getBlockHierarchyRootClientId(
			selectedBlockClientId
		);
		const hasRootInnerBlocks = !! getBlockCount( rootBlockId );

		const isFloatingToolbarVisible =
			!! selectedBlockClientId && hasRootInnerBlocks;

		return {
			blockClientIds,
			blockCount: getBlockCount( rootClientId ),
			isBlockInsertionPointVisible: isBlockInsertionPointVisible(),
			shouldShowInsertionPointBefore,
			isReadOnly,
			isRootList: rootClientId === undefined,
			isFloatingToolbarVisible,
			isStackedHorizontally,
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
