/**
 * External dependencies
 */
import _ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch, AsyncModeProvider } from '@wordpress/data';
import {
	useState,
	useRef,
	useEffect,
	RawHTML,
	useContext,
} from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import { BREAKPOINTS } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockListAppender from '../block-list-appender';
import ButtonBlockAppender from '../inner-blocks/button-block-appender';
import BlockListBlock from './block';
import {
	createInitialLayouts,
	appendNewBlocks,
	resizeOverflowingBlocks,
	cropAndFillEmptyCells,
	hashGrid,
	createGridStyleRules,
} from './grid-utils';
import { BlockNodes } from './root-container';

const ReactGridLayout = WidthProvider( _ReactGridLayout );
function BlockGrid( {
	rootClientId,
	blockClientIds,
	className,
	hasMultiSelection,
	multiSelectedBlockClientIds,
	selectedBlockClientId,
	isDraggable,
	isMultiSelecting,
	enableAnimation,
	__experimentalUIParts,
	targetClientId,
} ) {
	const [ nodes ] = useContext( BlockNodes );
	const { grid, cols = 2, rows = 2 } = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getBlockAttributes( rootClientId ),
		[ rootClientId ]
	);
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const [ layout, setLayout ] = useState(
		createInitialLayouts( grid, blockClientIds )
	);

	const lastClickedBlockAppenderIdRef = useRef();
	const blockClientIdsRef = useRef( blockClientIds );

	useEffect(
		() => {
			let nextLayout = layout;

			nextLayout = appendNewBlocks(
				nextLayout,
				lastClickedBlockAppenderIdRef.current,
				blockClientIdsRef.current,
				blockClientIds
			);
			nextLayout = resizeOverflowingBlocks( nextLayout, nodes );
			nextLayout = cropAndFillEmptyCells( nextLayout, cols, rows );

			if ( layout !== nextLayout ) {
				setLayout( nextLayout );
			}

			blockClientIdsRef.current = blockClientIds;
		},
		// We reference `grid` here instead of `layouts` to avoid
		// potential chained updates when block appenders are being displaced
		// and overflows happen. `grid` will only change with
		// persistent user changes and not when block appenders
		// are displaced.
		[ grid, blockClientIds, nodes, cols, rows ]
	);

	return (
		<div
			className={ classnames(
				'editor-block-list__layout block-editor-block-list__layout block-editor-block-list__grid',
				className
			) }
		>
			<ReactGridLayout
				cols={ cols }
				draggableCancel='input,textarea,[contenteditable=""],[contenteditable="true"]'
				layout={ layout }
				margin={ [ 0, 0 ] }
				onLayoutChange={ ( nextLayout ) => {
					setLayout( nextLayout );
					updateBlockAttributes( rootClientId, {
						grid: nextLayout.filter(
							( item ) => ! item.i.startsWith( 'block-appender' )
						),
					} );
				} }
				rowHeight={ 200 }
				verticalCompact={ false }
			>
				{ [
					...layout
						.filter( ( item ) =>
							item.i.startsWith( 'block-appender' )
						)
						.map( ( item ) => (
							<div
								key={ item.i }
								id={ item.i }
								onClick={ ( { currentTarget: { id } } ) =>
									( lastClickedBlockAppenderIdRef.current = id )
								}
								onKeyPress={ ( { currentTarget: { id } } ) =>
									( lastClickedBlockAppenderIdRef.current = id )
								}
								role="button"
								tabIndex="0"
							>
								<BlockListAppender
									rootClientId={ rootClientId }
									renderAppender={ ButtonBlockAppender }
								/>
							</div>
						) ),
					...blockClientIds.map( ( blockClientId, index ) => {
						const isBlockInSelection = hasMultiSelection
							? multiSelectedBlockClientIds.includes(
									blockClientId
							  )
							: selectedBlockClientId === blockClientId;
						return (
							<div
								key={ `block-${ blockClientId }` }
								className="block-editor-block-list__grid-item"
							>
								<AsyncModeProvider
									key={ blockClientId }
									value={ ! isBlockInSelection }
								>
									<BlockListBlock
										rootClientId={ rootClientId }
										clientId={ blockClientId }
										isDraggable={ isDraggable }
										isMultiSelecting={ isMultiSelecting }
										// This prop is explicitely computed and passed down
										// to avoid being impacted by the async mode
										// otherwise there might be a small delay to trigger the animation.
										animateOnChange={ index }
										enableAnimation={ enableAnimation }
										hasSelectedUI={
											__experimentalUIParts.hasSelectedUI
										}
										className={
											blockClientId === targetClientId
												? 'is-drop-target'
												: undefined
										}
									/>
								</AsyncModeProvider>
							</div>
						);
					} ),
				] }
			</ReactGridLayout>
		</div>
	);
}

BlockGrid.Content = ( {
	attributes: { grid, breakpoint = 'small', cols = 2, rows = 2, align },
	innerBlocks,
} ) => {
	const gridId = `editor-block-list__grid-content-${ hashGrid( grid ) }`;
	return (
		<div id={ gridId } className={ `align${ align }` }>
			<RawHTML>
				{ `<style>
#${ gridId } {
	display: grid;
}

${ createGridStyleRules( gridId, grid, BREAKPOINTS[ breakpoint ], cols, rows ) }
</style>` }
			</RawHTML>
			{ grid
				.map( ( item, i ) => ( {
					item,
					element: (
						<div
							id={ `editor-block-list__grid-content-item-${ i }` }
							key={ i }
						>
							{ /* Guard here, because inner blocks are not available during validation. */ }
							{ innerBlocks[ i ] && (
								<RawHTML>
									{ serialize( innerBlocks[ i ], {
										isInnerBlocks: true,
									} ) }
								</RawHTML>
							) }
						</div>
					),
				} ) )
				.sort( ( a, b ) => {
					const rowSort = a.item.y - b.item.y;
					if ( rowSort !== 0 ) {
						return rowSort;
					}
					return a.item.x - b.item.x;
				} )
				.map( ( item ) => item.element ) }
		</div>
	);
};

export default BlockGrid;
