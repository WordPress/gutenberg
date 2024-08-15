/**
 * External dependencies
 */
import { View, Platform, Pressable } from 'react-native';

/**
 * WordPress dependencies
 */
import { useRef, useState, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import {
	KeyboardAwareFlatList,
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
	DEFAULT_BLOCK_LIST_CONTEXT,
} from './block-list-context';
import { BlockDraggableWrapper } from '../block-draggable';
import { useEditorWrapperStyles } from '../../hooks/use-editor-wrapper-styles';
import { store as blockEditorStore } from '../../store';

const identity = ( x ) => x;

const stylesMemo = {};
const getStyles = ( isStackedHorizontally, horizontalAlignment ) => {
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

export default function BlockList( {
	blockWidth: initialBlockWidth,
	contentResizeMode,
	contentStyle,
	filterInnerBlocks,
	gridProperties,
	header,
	horizontal,
	horizontalAlignment,
	marginHorizontal = styles.defaultBlock.marginLeft,
	marginVertical = styles.defaultBlock.marginTop,
	onAddBlock,
	onDeleteBlock,
	orientation,
	parentWidth,
	renderAppender,
	renderFooterAppender,
	rootClientId,
	withFooter = true,
} ) {
	const {
		blockClientIds,
		blockCount,
		blockInsertionPointIsVisible,
		isReadOnly,
		isRootList,
		isFloatingToolbarVisible,
		isStackedHorizontally,
		maxWidth,
		isRTL,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockHierarchyRootClientId,
				getBlockOrder,
				getSelectedBlockClientId,
				isBlockInsertionPointVisible,
				getSettings,
			} = select( blockEditorStore );

			const selectedBlockClientId = getSelectedBlockClientId();
			const rootBlockId = getBlockHierarchyRootClientId(
				selectedBlockClientId
			);

			let blockOrder = getBlockOrder( rootClientId );
			// Display only block which fulfill the condition in passed `filterInnerBlocks` function.
			if ( filterInnerBlocks ) {
				blockOrder = filterInnerBlocks( blockOrder );
			}

			const {
				isRTL: isRTLSetting,
				maxWidth: maxWidthSetting,
				readOnly,
			} = getSettings();

			return {
				blockClientIds: blockOrder,
				blockCount: getBlockCount(),
				blockInsertionPointIsVisible:
					Platform.OS === 'ios' && isBlockInsertionPointVisible(),
				isReadOnly: readOnly,
				isRootList: rootClientId === undefined,
				isFloatingToolbarVisible:
					!! selectedBlockClientId && !! getBlockCount( rootBlockId ),
				isStackedHorizontally: orientation === 'horizontal',
				maxWidth: maxWidthSetting,
				isRTL: isRTLSetting,
			};
		},
		[ filterInnerBlocks, orientation, rootClientId ]
	);

	const { insertBlock, clearSelectedBlock } = useDispatch( blockEditorStore );

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

	const scrollRef = useRef( null );

	const shouldFlatListPreventAutomaticScroll = () =>
		blockInsertionPointIsVisible;

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

	const { blockToolbar, floatingToolbar } = styles;

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
		blockToolbar.height +
		( isFloatingToolbarVisible ? floatingToolbar.height : 0 );

	return (
		<View
			style={ containerStyle }
			onAccessibilityEscape={ clearSelectedBlock }
			onLayout={ onLayout }
			testID="block-list-wrapper"
		>
			{ isRootList ? (
				<BlockListProvider
					value={ {
						...DEFAULT_BLOCK_LIST_CONTEXT,
						scrollRef: scrollRef.current,
					} }
				>
					<BlockDraggableWrapper isRTL={ isRTL }>
						{ ( { onScroll } ) => (
							<KeyboardAwareFlatList
								accessibilityLabel="block-list"
								ref={ scrollRef }
								extraScrollHeight={ extraScrollHeight }
								keyboardShouldPersistTaps="always"
								extraData={ getExtraData() }
								scrollEnabled={ isRootList }
								contentContainerStyle={ [
									horizontal &&
										styles.horizontalContentContainer,
									isWider( blockWidth, 'medium' ) &&
										( isContentStretch && isMultiBlocks
											? styles.horizontalContentContainerStretch
											: styles.horizontalContentContainerCenter ),
								] }
								data={ blockClientIds }
								keyExtractor={ identity }
								renderItem={ renderItem }
								CellRendererComponent={ BlockListItemCell }
								shouldPreventAutomaticScroll={
									shouldFlatListPreventAutomaticScroll
								}
								ListHeaderComponent={ header }
								ListEmptyComponent={
									! isReadOnly && (
										<EmptyList
											orientation={ orientation }
											rootClientId={ rootClientId }
											renderAppender={ renderAppender }
											renderFooterAppender={
												renderFooterAppender
											}
										/>
									)
								}
								ListFooterComponent={
									<Footer
										addBlockToEndOfPost={
											addBlockToEndOfPost
										}
										isReadOnly={ isReadOnly }
										renderFooterAppender={
											renderFooterAppender
										}
										withFooter={ withFooter }
									/>
								}
								onScroll={ onScroll }
							/>
						) }
					</BlockDraggableWrapper>
				</BlockListProvider>
			) : (
				<>
					{ blockClientIds.length > 0 ? (
						<View style={ [ { flex: 0 }, styles.overflowVisible ] }>
							<View
								style={ [
									...getStyles(
										isStackedHorizontally,
										horizontalAlignment
									),
									horizontal &&
										styles.horizontalContentContainer,
								] }
							>
								{ blockClientIds.map(
									( currentClientId, index ) => {
										return (
											<View key={ currentClientId }>
												{ renderItem( {
													item: currentClientId,
													index,
												} ) }
											</View>
										);
									}
								) }
								<Footer
									addBlockToEndOfPost={ addBlockToEndOfPost }
									isReadOnly={ isReadOnly }
									renderFooterAppender={
										renderFooterAppender
									}
									withFooter={ withFooter }
								/>
							</View>
						</View>
					) : (
						<EmptyList
							orientation={ orientation }
							rootClientId={ rootClientId }
							renderAppender={ renderAppender }
							renderFooterAppender={ renderFooterAppender }
						/>
					) }
				</>
			) }
			{ shouldShowInnerBlockAppender() && (
				<View
					style={ {
						marginHorizontal:
							marginHorizontal - styles.innerAppender.marginLeft,
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
}

function Footer( {
	addBlockToEndOfPost,
	isReadOnly,
	renderFooterAppender,
	withFooter,
} ) {
	const onAddParagraphBlock = useCallback( () => {
		const paragraphBlock = createBlock( 'core/paragraph' );
		addBlockToEndOfPost( paragraphBlock );
	}, [ addBlockToEndOfPost ] );

	if ( ! isReadOnly && withFooter ) {
		return (
			<Pressable
				accessibilityLabel={ __( 'Add paragraph block' ) }
				testID={ __( 'Add paragraph block' ) }
				onPress={ onAddParagraphBlock }
			>
				<View style={ styles.blockListFooter } />
			</Pressable>
		);
	} else if ( renderFooterAppender ) {
		return <View>{ renderFooterAppender() }</View>;
	}

	return null;
}

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
	const align = renderAppender ? WIDE_ALIGNMENTS.alignments.full : undefined;
	const [ wrapperStyles ] = useEditorWrapperStyles( { align } );

	if ( renderFooterAppender || renderAppender === false ) {
		return null;
	}

	const containerStyles = [ styles.defaultAppender, wrapperStyles ];

	return (
		<View style={ containerStyles }>
			<BlockListAppender
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
				showSeparator={ shouldShowInsertionPoint }
			/>
		</View>
	);
}
