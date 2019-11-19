/**
 * External dependencies
 */
import _ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useRef, useEffect, RawHTML } from '@wordpress/element';
import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockListAppender from '../block-list-appender';
import ButtonBlockAppender from '../inner-blocks/button-block-appender';
import BlockAsyncModeProvider from './block-async-mode-provider';
import BlockListBlock from './block';
import BlockControls from '../block-controls';
import {
	createInitialLayouts,
	appendNewBlocks,
	resizeOverflowingBlocks,
	cropAndFillEmptyCells,
	COLS,
	BREAKPOINTS,
	hashGrid,
	createGridStyleRules,
} from './grid-utils';

const ReactGridLayout = WidthProvider( _ReactGridLayout );
function BlockGrid( {
	rootClientId,
	blockClientIds,
	nodes,
	className,
	hasMultiSelection,
	multiSelectedBlockClientIds,
	selectedBlockClientId,
	setBlockRef,
	onSelectionStart,
} ) {
	const { grid } = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockAttributes( rootClientId ),
		[ rootClientId ]
	);
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const [ breakpoint, setBreakpoint ] = useState( 'xxs' );
	const [ layouts, setLayouts ] = useState(
		createInitialLayouts( grid, blockClientIds )
	);

	const lastClickedBlockAppenderIdRef = useRef();
	const blockClientIdsRef = useRef( blockClientIds );

	useEffect(
		() => {
			let nextLayouts = layouts;

			nextLayouts = appendNewBlocks(
				nextLayouts,
				breakpoint,
				lastClickedBlockAppenderIdRef.current,
				blockClientIdsRef.current,
				blockClientIds
			);
			nextLayouts = resizeOverflowingBlocks( nextLayouts, breakpoint, nodes );
			nextLayouts = cropAndFillEmptyCells( nextLayouts, breakpoint );

			if ( layouts !== nextLayouts ) {
				setLayouts( nextLayouts );
			}

			blockClientIdsRef.current = blockClientIds;
		},
		// We reference `grid` here instead of `layouts` to avoid
		// potential chained updates when block appenders are being displaced
		// and overflows happen. `grid` will only change with
		// persistent user changes and not when block appenders
		// are displaced.
		[ grid, blockClientIds, nodes, breakpoint ]
	);

	return (
		<div
			className={ classnames(
				'editor-block-list__layout block-editor-block-list__layout block-editor-block-list__grid',
				className
			) }
		>
			<ReactGridLayout
				cols={ COLS[ breakpoint ] }
				draggableCancel='input,textarea,[contenteditable=""],[contenteditable="true"]'
				layout={ layouts[ breakpoint ] }
				margin={ [ 0, 0 ] }
				onLayoutChange={ ( nextLayout ) => {
					setLayouts( { ...layouts, [ breakpoint ]: nextLayout } );
					updateBlockAttributes( rootClientId, {
						grid: {
							...grid,
							[ breakpoint ]: nextLayout.filter(
								( item ) => ! item.i.startsWith( 'block-appender' )
							),
						},
					} );
				} }
				rowHeight={ 200 }
				style={ {
					minWidth: BREAKPOINTS[ breakpoint ],
				} }
				verticalCompact={ false }
			>
				{ [
					...layouts[ breakpoint ]
						.filter( ( item ) => item.i.startsWith( 'block-appender' ) )
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
					...blockClientIds.map( ( blockClientId ) => {
						const isBlockInSelection = hasMultiSelection ?
							multiSelectedBlockClientIds.includes( blockClientId ) :
							selectedBlockClientId === blockClientId;
						return (
							<div
								key={ `block-${ blockClientId }` }
								className="block-editor-block-list__grid-item"
							>
								<BlockAsyncModeProvider
									clientId={ blockClientId }
									isBlockInSelection={ isBlockInSelection }
								>
									<BlockListBlock
										rootClientId={ rootClientId }
										clientId={ blockClientId }
										blockRef={ setBlockRef }
										onSelectionStart={ onSelectionStart }
										isLocked
									/>
								</BlockAsyncModeProvider>
							</div>
						);
					} ),
				] }
			</ReactGridLayout>
			<BlockControls>
				<Toolbar
					icon="smartphone"
					label={ __( 'Change breakpoint' ) }
					controls={ Object.keys( BREAKPOINTS ).map( ( _breakpoint ) => ( {
						title: `${ _breakpoint } (>= ${ BREAKPOINTS[ _breakpoint ] }px)`,
						isActive: breakpoint === _breakpoint,
						onClick: setBreakpoint.bind( null, _breakpoint ),
					} ) ) }
					isCollapsed
				/>
			</BlockControls>
		</div>
	);
}

BlockGrid.Content = ( { attributes: { grid, align }, innerBlocks } ) => {
	const gridId = `editor-block-list__grid-content-${ hashGrid( grid ) }`;
	return (
		<div id={ gridId } className={ `align${ align }` }>
			<RawHTML>
				{ `<style>
#${ gridId } {
	display: grid;
}

${ createGridStyleRules( gridId, grid ) }
</style>` }
			</RawHTML>
			{ /**
      * We loop over the grid and not inner blocks directly,
      * because inner blocks are not provided during validation,
      * so this block would never pass validation if its
      * own markup depended on its inner blocks.
      */ }
			{ Object.keys( grid )
				.reduce(
					( acc, breakpoint ) =>
						// We use the breakpoint with the most blocks as its set of
						// blocks will be a superset of the others' and therefore
						// allow us to render all blocks once.
						grid[ breakpoint ].length > acc.length ? grid[ breakpoint ] : acc,
					grid.xxs
				)
				.map( ( _item, i ) => (
					<div id={ `editor-block-list__grid-content-item-${ i }` } key={ i }>
						{ /* Guard here, because inner blocks are not available during validation. */ }
						{ innerBlocks[ i ] && (
							<RawHTML>
								{ serialize( innerBlocks[ i ], { isInnerBlocks: true } ) }
							</RawHTML>
						) }
					</div>
				) ) }
		</div>
	);
};

export default BlockGrid;
