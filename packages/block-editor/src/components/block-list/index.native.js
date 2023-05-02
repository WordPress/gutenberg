/**
 * External dependencies
 */
import { View, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { withDispatch, withSelect, useSelect } from '@wordpress/data';
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
import BlockListItem from './block-list-item';
import BlockListItemCell from './block-list-item-cell';
import {
	BlockListProvider,
	BlockListConsumer,
	DEFAULT_BLOCK_LIST_CONTEXT,
} from './block-list-context';
import { BlockDraggableWrapper } from '../block-draggable';
import { store as blockEditorStore } from '../../store';

const identity = ( x ) => x;

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
		styles.overflowVisible,
	];
	stylesMemo[ styleName ] = computedStyles;
	return computedStyles;
};

export function BlockList( {
	blockClientIds,
	blockCount,
	blockWidth: initialBlockWidth,
	clearSelectedBlock,
	contentResizeMode,
	contentStyle,
	gridProperties,
	header,
	horizontal,
	horizontalAlignment,
	insertBlock,
	isBlockInsertionPointVisible,
	isFloatingToolbarVisible,
	isRTL,
	isReadOnly,
	isRootList,
	isStackedHorizontally,
	marginHorizontal = styles.defaultBlock.marginLeft,
	marginVertical = styles.defaultBlock.marginTop,
	maxWidth,
	onAddBlock,
	onDeleteBlock,
	parentWidth,
	renderAppender,
	renderFooterAppender,
	rootClientId,
	title,
	withFooter = true,
} ) {
	const extraData = useRef( {
		parentWidth,
		renderFooterAppender,
		renderAppender,
		onDeleteBlock,
		contentStyle,
	} );

	const [ blockWidth, setBlockWidth ] = useState( initialBlockWidth || 0 );

	const addBlockToEndOfPost = ( newBlock ) => {
		insertBlock( newBlock, blockCount );
	};

	const scrollViewRef = useRef( null );

	const shouldFlatListPreventAutomaticScroll = () =>
		isBlockInsertionPointVisible;

	const shouldShowInnerBlockAppender = () =>
		renderAppender && blockClientIds.length > 0;

	const getExtraData = () => {
		if (
			extraData.current.parentWidth !== parentWidth ||
			extraData.current.renderFooterAppender !== renderFooterAppender ||
			extraData.current.onDeleteBlock !== onDeleteBlock ||
			extraData.current.contentStyle !== contentStyle ||
			extraData.current.renderAppender !== renderAppender ||
			extraData.current.blockWidth !== blockWidth ||
			extraData.current.gridProperties !== gridProperties
		) {
			extraData.current = {
				parentWidth,
				renderFooterAppender,
				onDeleteBlock,
				contentStyle,
				renderAppender,
				blockWidth,
				gridProperties,
			};
		}
		return extraData.current;
	};

	const onLayout = ( { nativeEvent } ) => {
		const { layout } = nativeEvent;

		const layoutWidth = Math.floor( layout.width );
		if ( isRootList && blockWidth !== layoutWidth ) {
			setBlockWidth( Math.min( layoutWidth, maxWidth ) );
		} else if ( ! isRootList && ! blockWidth ) {
			setBlockWidth( Math.min( layoutWidth, maxWidth ) );
		}
	};

	const renderList = ( extraProps = {} ) => {
		const { parentScrollRef, onScroll } = extraProps;

		const { blockToolbar, headerToolbar, floatingToolbar } = styles;

		const containerStyle = {
			flex: isRootList ? 1 : 0,
			// We set negative margin in the parent to remove the edge spacing between parent block and child block in ineer blocks.
			marginVertical: isRootList ? 0 : -marginVertical,
			marginHorizontal: isRootList ? 0 : -marginHorizontal,
		};

		const isContentStretch = contentResizeMode === 'stretch';
		const isMultiBlocks = blockClientIds.length > 1;
		const { isWider } = alignmentHelpers;
		const extraScrollHeight =
			headerToolbar.height +
			blockToolbar.height +
			( isFloatingToolbarVisible ? floatingToolbar.height : 0 );

		const scrollViewStyle = [
			{ flex: isRootList ? 1 : 0 },
			! isRootList && styles.overflowVisible,
		];

		return (
			<View
				style={ containerStyle }
				onAccessibilityEscape={ clearSelectedBlock }
				onLayout={ onLayout }
				testID="block-list-wrapper"
			>
				<KeyboardAwareFlatList
					{ ...( Platform.OS === 'android'
						? { removeClippedSubviews: false }
						: {} ) } // Disable clipping on Android to fix focus losing. See https://github.com/wordpress-mobile/gutenberg-mobile/pull/741#issuecomment-472746541
					accessibilityLabel="block-list"
					innerRef={ ( ref ) => {
						scrollViewRef.current = parentScrollRef || ref;
					} }
					extraScrollHeight={ extraScrollHeight }
					keyboardShouldPersistTaps="always"
					scrollViewStyle={ scrollViewStyle }
					extraData={ getExtraData() }
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
					listKey={
						rootClientId ? `list-${ rootClientId }` : 'list-root'
					}
					renderItem={ renderItem }
					CellRendererComponent={ BlockListItemCell }
					shouldPreventAutomaticScroll={
						shouldFlatListPreventAutomaticScroll
					}
					title={ title }
					ListHeaderComponent={ header }
					ListEmptyComponent={
						! isReadOnly && (
							<EmptyList
								rootClientId={ rootClientId }
								renderAppender={ renderAppender }
								renderFooterAppender={ renderFooterAppender }
							/>
						)
					}
					ListFooterComponent={ renderBlockListFooter }
					onScroll={ onScroll }
				/>
				{ shouldShowInnerBlockAppender() && (
					<View
						style={ {
							marginHorizontal:
								marginHorizontal -
								styles.innerAppender.marginLeft,
						} }
					>
						<BlockListAppender
							rootClientId={ rootClientId }
							renderAppender={ renderAppender }
							showSeparator
						/>
					</View>
				) }
			</View>
		);
	};

	const renderItem = ( { item: clientId, index } ) => {
		// Extracting the grid item properties here to avoid
		// re-renders in the blockListItem component.
		const isGridItem = !! gridProperties;
		const gridItemProps = gridProperties && {
			numOfColumns: gridProperties.numColumns,
			tileCount: blockClientIds.length,
			tileIndex: blockClientIds.indexOf( clientId ),
		};
		return (
			<BlockListItem
				index={ index }
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
				shouldShowInnerBlockAppender={ shouldShowInnerBlockAppender }
				blockWidth={ blockWidth }
				isGridItem={ isGridItem }
				{ ...gridItemProps }
			/>
		);
	};

	const renderBlockListFooter = () => {
		const paragraphBlock = createBlock( 'core/paragraph' );

		if ( ! isReadOnly && withFooter ) {
			return (
				<>
					<TouchableWithoutFeedback
						accessibilityLabel={ __( 'Add paragraph block' ) }
						testID={ __( 'Add paragraph block' ) }
						onPress={ () => {
							addBlockToEndOfPost( paragraphBlock );
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
	};

	// Use of Context to propagate the main scroll ref to its children e.g InnerBlocks.
	const blockList = isRootList ? (
		<BlockListProvider
			value={ {
				...DEFAULT_BLOCK_LIST_CONTEXT,
				scrollRef: scrollViewRef.current,
			} }
		>
			<BlockDraggableWrapper isRTL={ isRTL }>
				{ ( { onScroll } ) => renderList( { onScroll } ) }
			</BlockDraggableWrapper>
		</BlockListProvider>
	) : (
		<BlockListConsumer>
			{ ( { scrollRef } ) =>
				renderList( {
					parentScrollRef: scrollRef,
				} )
			}
		</BlockListConsumer>
	);

	return blockList;
}

export default compose( [
	withSelect(
		( select, { rootClientId, orientation, filterInnerBlocks } ) => {
			const {
				getBlockCount,
				getBlockHierarchyRootClientId,
				getBlockOrder,
				getSelectedBlockClientId,
				isBlockInsertionPointVisible,
				getSettings,
			} = select( blockEditorStore );

			const isStackedHorizontally = orientation === 'horizontal';

			const selectedBlockClientId = getSelectedBlockClientId();

			let blockClientIds = getBlockOrder( rootClientId );
			// Display only block which fulfill the condition in passed `filterInnerBlocks` function.
			if ( filterInnerBlocks ) {
				blockClientIds = filterInnerBlocks( blockClientIds );
			}

			const { maxWidth } = getSettings();
			const isReadOnly = getSettings().readOnly;

			const blockCount = getBlockCount();
			const rootBlockId = getBlockHierarchyRootClientId(
				selectedBlockClientId
			);

			const isFloatingToolbarVisible =
				!! selectedBlockClientId && !! getBlockCount( rootBlockId );
			const isRTL = getSettings().isRTL;

			return {
				blockClientIds,
				blockCount,
				isBlockInsertionPointVisible:
					Platform.OS === 'ios' && isBlockInsertionPointVisible(),
				isReadOnly,
				isRootList: rootClientId === undefined,
				rootClientId,
				isFloatingToolbarVisible,
				isStackedHorizontally,
				maxWidth,
				isRTL,
			};
		}
	),
	withDispatch( ( dispatch ) => {
		const { insertBlock, replaceBlock, clearSelectedBlock } =
			dispatch( blockEditorStore );

		return {
			clearSelectedBlock,
			insertBlock,
			replaceBlock,
		};
	} ),
	withPreferredColorScheme,
] )( BlockList );

function EmptyList( {
	orientation,
	renderAppender,
	renderFooterAppender,
	rootClientId,
} ) {
	const { shouldShowInsertionPoint } = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( blockEditorStore );

		const isStackedHorizontally = orientation === 'horizontal';
		const blockClientIds = getBlockOrder( rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		const blockInsertionPointIsVisible = isBlockInsertionPointVisible();

		return {
			shouldShowInsertionPoint:
				! isStackedHorizontally &&
				blockInsertionPointIsVisible &&
				insertionPoint.rootClientId === rootClientId &&
				// If list is empty, show the insertion point (via the default appender)
				( blockClientIds.length === 0 ||
					// Or if the insertion point is right before the denoted block.
					! blockClientIds[ insertionPoint.index ] ),
		};
	} );

	if ( renderFooterAppender || renderAppender === false ) {
		return null;
	}

	return (
		<View style={ styles.defaultAppender }>
			<ReadableContentView
				align={
					renderAppender ? WIDE_ALIGNMENTS.alignments.full : undefined
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
