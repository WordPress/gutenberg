/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect, useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BREAKPOINTS } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import RootContainer from './root-container';
import useBlockDropZone from '../block-drop-zone';
import BlockGrid from './grid';
import BlockControls from '../block-controls';

/**
 * If the block count exceeds the threshold, we disable the reordering animation
 * to avoid laginess.
 */
const BLOCK_ANIMATION_THRESHOLD = 200;

const forceSyncUpdates = ( WrappedComponent ) => ( props ) => {
	return (
		<AsyncModeProvider value={ false }>
			<WrappedComponent { ...props } />
		</AsyncModeProvider>
	);
};

function BlockList( {
	className,
	rootClientId,
	isDraggable,
	renderAppender,
	__experimentalUIParts = {},
	__experimentalGridMode,
} ) {
	function selector( select ) {
		const {
			getBlockOrder,
			isMultiSelecting,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			getGlobalBlockCount,
			isTyping,
			getBlockAttributes,
		} = select( 'core/block-editor' );
		const attributes = getBlockAttributes( rootClientId ) || {};
		return {
			blockClientIds: getBlockOrder( rootClientId ),
			isMultiSelecting: isMultiSelecting(),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
			enableAnimation:
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD,
			attributes,
			gridModeEnabled: select( 'core/viewport' ).isViewportMatch(
				attributes.breakpoint || 'small'
			),
		};
	}

	const {
		blockClientIds,
		isMultiSelecting,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		enableAnimation,
		attributes,
		gridModeEnabled,
	} = useSelect( selector, [ rootClientId ] );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const Container = rootClientId ? 'div' : RootContainer;
	const ref = useRef();
	const targetClientId = useBlockDropZone( {
		element: ref,
		rootClientId,
	} );
	const __experimentalContainerProps = rootClientId
		? {}
		: { hasPopover: __experimentalUIParts.hasPopover };

	const gridModeControls = __experimentalGridMode ? (
		<BlockControls>
			<Toolbar
				icon="smartphone"
				label={ __( 'Change breakpoint' ) }
				controls={ Object.keys( BREAKPOINTS ).map(
					( _breakpoint ) => ( {
						title: `${ _breakpoint } (>= ${ BREAKPOINTS[ _breakpoint ] }px)`,
						isActive: attributes.breakpoint === _breakpoint,
						onClick: () =>
							updateBlockAttributes( rootClientId, {
								breakpoint: _breakpoint,
							} ),
					} )
				) }
				isCollapsed
			/>
			<Toolbar
				icon="image-flip-horizontal"
				label={ __( 'Change number of columns' ) }
				controls={ [ 2, 3, 4 ].map( ( cols ) => ( {
					title: cols,
					isActive: attributes.cols === cols,
					onClick: () =>
						updateBlockAttributes( rootClientId, {
							cols,
						} ),
				} ) ) }
				isCollapsed
			/>
			<Toolbar
				icon="image-flip-vertical"
				label={ __( 'Change number of rows' ) }
				controls={ [ 2, 3, 4 ].map( ( rows ) => ( {
					title: rows,
					isActive: attributes.rows === rows,
					onClick: () =>
						updateBlockAttributes( rootClientId, {
							rows,
						} ),
				} ) ) }
				isCollapsed
			/>
		</BlockControls>
	) : null;

	if ( __experimentalGridMode && gridModeEnabled ) {
		return (
			<Container
				ref={ ref }
				className={ classnames(
					'block-editor-block-list__layout',
					className
				) }
			>
				<BlockGrid
					rootClientId={ rootClientId }
					blockClientIds={ blockClientIds }
					className={ className }
					hasMultiSelection={ hasMultiSelection }
					multiSelectedBlockClientIds={ multiSelectedBlockClientIds }
					selectedBlockClientId={ selectedBlockClientId }
					isDraggable={ isDraggable }
					isMultiSelecting={ isMultiSelecting }
					enableAnimation={ enableAnimation }
					__experimentalUIParts={ __experimentalUIParts }
					targetClientId={ targetClientId }
				/>
				{ gridModeControls }
			</Container>
		);
	}

	return (
		<Container
			ref={ ref }
			className={ classnames(
				'block-editor-block-list__layout',
				className
			) }
			{ ...__experimentalContainerProps }
		>
			{ blockClientIds.map( ( clientId, index ) => {
				const isBlockInSelection = hasMultiSelection
					? multiSelectedBlockClientIds.includes( clientId )
					: selectedBlockClientId === clientId;

				return (
					<AsyncModeProvider
						key={ clientId }
						value={ ! isBlockInSelection }
					>
						<BlockListBlock
							rootClientId={ rootClientId }
							clientId={ clientId }
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
								clientId === targetClientId
									? 'is-drop-target'
									: undefined
							}
						/>
					</AsyncModeProvider>
				);
			} ) }
			<BlockListAppender
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
				className={
					targetClientId === null ? 'is-drop-target' : undefined
				}
			/>
			{ gridModeControls }
		</Container>
	);
}

// This component needs to always be synchronous
// as it's the one changing the async mode
// depending on the block selection.
BlockList = forceSyncUpdates( BlockList );
BlockList.GridContent = BlockGrid.Content;
export default BlockList;
