/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Block from './block';
import Grid from './grid-item';
import BlockInsertionPoint from './insertion-point';
import { store as blockEditorStore } from '../../store';
import { useEditorWrapperStyles } from '../../hooks/use-editor-wrapper-styles';

/**
 * BlockListItemContent component. Renders a block with an optional insertion point.
 *
 * @param {Object}   props                              Component properties.
 * @param {number}   props.blockWidth                   The width of the block.
 * @param {string}   props.clientId                     The block client ID.
 * @param {string}   props.contentResizeMode            The content resize mode, e.g "stretch".
 * @param {Object}   props.contentStyle                 Styles for the block content
 * @param {Object}   props.index                        Block item index
 * @param {boolean}  props.isStackedHorizontally        Whether the block is stacked horizontally.
 * @param {number}   props.marginHorizontal             The horizontal margin.
 * @param {number}   props.marginVertical               The vertical margin.
 * @param {Function} props.onAddBlock                   On add block callback.
 * @param {Function} props.onDeleteBlock                On delete block callback.
 * @param {number}   props.parentWidth                  The width of the parent block.
 * @param {string}   props.rootClientId                 The root client ID.
 * @param {Function} props.shouldShowInnerBlockAppender Whether to show the inner block appender.
 *
 * @return {Component} The rendered block list item content.
 */
function BlockListItemContent( {
	blockWidth,
	clientId,
	contentResizeMode,
	contentStyle,
	index,
	isStackedHorizontally,
	marginHorizontal,
	marginVertical,
	onAddBlock,
	onDeleteBlock,
	parentWidth,
	rootClientId,
	shouldShowInnerBlockAppender,
} ) {
	const {
		blockAlignment,
		blockName,
		hasParents,
		parentBlockAlignment,
		parentBlockName,
		shouldShowInsertionPointAfter,
		shouldShowInsertionPointBefore,
	} = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockInsertionPoint,
				getBlockName,
				getBlockOrder,
				isBlockInsertionPointVisible,
			} = select( blockEditorStore );
			const blockClientIds = getBlockOrder( rootClientId );
			const insertionPoint = getBlockInsertionPoint();

			const insertionPointVisibleInCurrentRoot =
				! isStackedHorizontally &&
				isBlockInsertionPointVisible() &&
				insertionPoint.rootClientId === rootClientId;

			const isListEmpty = blockClientIds.length === 0;
			const isInsertionPointBeforeBlock =
				blockClientIds[ insertionPoint.index ] === clientId;
			const isInsertionPointAtEnd =
				blockClientIds.length === insertionPoint.index;
			const isBlockLastInList =
				blockClientIds[ insertionPoint.index - 1 ] === clientId;

			const showInsertionPointBefore =
				insertionPointVisibleInCurrentRoot &&
				( isListEmpty || isInsertionPointBeforeBlock );

			const showInsertionPointAfter =
				insertionPointVisibleInCurrentRoot &&
				isInsertionPointAtEnd &&
				isBlockLastInList;

			const blockHasParents = !! rootClientId;
			const name = getBlockName( clientId );
			const parentName = getBlockName( rootClientId );
			const { align } = getBlockAttributes( clientId ) || {};
			const { textAlign: parentBlockAlign } =
				getBlockAttributes( rootClientId ) || {};

			return {
				blockAlignment: align,
				blockName: name,
				hasParents: blockHasParents,
				parentBlockAlignment: parentBlockAlign,
				parentBlockName: parentName,
				shouldShowInsertionPointAfter: showInsertionPointAfter,
				shouldShowInsertionPointBefore: showInsertionPointBefore,
			};
		},
		[ isStackedHorizontally, rootClientId, clientId ]
	);

	const [ wrapperStyles, margin ] = useEditorWrapperStyles( {
		align: blockAlignment,
		blockName,
		blockWidth,
		contentResizeMode,
		hasParents,
		marginHorizontal,
		parentBlockAlignment,
		parentBlockName,
		parentWidth,
	} );

	const shouldShowBlockInsertionPointAfter =
		! shouldShowInnerBlockAppender() && shouldShowInsertionPointAfter;

	return (
		<View style={ wrapperStyles }>
			{ shouldShowInsertionPointBefore && (
				<BlockInsertionPoint
					testID={ `block-insertion-point-before-row-${ index + 1 }` }
				/>
			) }
			<Block
				blockWidth={ blockWidth }
				clientId={ clientId }
				contentStyle={ contentStyle }
				isStackedHorizontally={ isStackedHorizontally }
				marginHorizontal={ margin }
				marginVertical={ marginVertical }
				onAddBlock={ onAddBlock }
				parentBlockAlignment={ parentBlockAlignment }
				onDeleteBlock={ onDeleteBlock }
				parentWidth={ parentWidth }
				rootClientId={ rootClientId }
			/>
			{ shouldShowBlockInsertionPointAfter && (
				<BlockInsertionPoint
					testID={ `block-insertion-point-after-row-${ index + 1 }` }
				/>
			) }
		</View>
	);
}

/**
 * BlockListItem component. Renders a block list item either as a grid item or as a standalone item.
 *
 * @param {Object}   props                              Component properties.
 * @param {boolean}  props.isGridItem                   Whether the block is a grid item.
 * @param {number}   props.numOfColumns                 The number of columns for grid layout.
 * @param {number}   props.parentWidth                  The width of the parent block.
 * @param {number}   props.tileCount                    The total number of tiles in the grid.
 * @param {number}   props.tileIndex                    The index of the current tile in the grid.
 * @param {number}   props.blockWidth                   The width of the block.
 * @param {string}   props.clientId                     The block client ID.
 * @param {string}   props.contentResizeMode            The content resize mode, e.g "stretch".
 * @param {Object}   props.contentStyle                 Styles for the block content
 * @param {Object}   props.index                        Block item index
 * @param {boolean}  props.isStackedHorizontally        Whether the block is stacked horizontally.
 * @param {number}   props.marginHorizontal             The horizontal margin.
 * @param {number}   props.marginVertical               The vertical margin.
 * @param {Function} props.onAddBlock                   On add block callback.
 * @param {Function} props.onDeleteBlock                On delete block callback.
 * @param {string}   props.rootClientId                 The root client ID.
 * @param {Function} props.shouldShowInnerBlockAppender Whether to show the inner block appender.
 *
 * @return {Component|null} The rendered block list item or null if the block width is not provided.
 */
function BlockListItem( props ) {
	const { isGridItem, numOfColumns, tileCount, tileIndex, ...restProps } =
		props;

	if ( ! props?.blockWidth ) {
		return null;
	}

	if ( isGridItem ) {
		return (
			<Grid
				maxWidth={ props?.parentWidth }
				numOfColumns={ numOfColumns }
				tileCount={ tileCount }
				index={ tileIndex }
			>
				<BlockListItemContent { ...restProps } />
			</Grid>
		);
	}

	return <BlockListItemContent { ...restProps } />;
}

export default BlockListItem;
