/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import __experimentalBlockListFooter from '../block-list-footer';
import RootContainer from './root-container';
import useBlockDropZone from '../block-drop-zone';

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
	__experimentalMoverDirection: moverDirection = 'vertical',
	isDraggable,
	renderAppender,
	__experimentalUIParts = {},
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
		} = select( 'core/block-editor' );

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			isMultiSelecting: isMultiSelecting(),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
			enableAnimation: (
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD
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
	} = useSelect( selector, [ rootClientId ] );

	const uiParts = {
		hasMovers: true,
		hasSelectedUI: true,
		...__experimentalUIParts,
	};

	const Container = rootClientId ? 'div' : RootContainer;

	const ref = useRef();

	const targetClientId = useBlockDropZone( {
		element: ref,
		rootClientId,
	} );

	return (
		<Container
			ref={ ref }
			className={ classnames(
				'block-editor-block-list__layout',
				className
			) }
		>
			{ blockClientIds.map( ( clientId, index ) => {
				const isBlockInSelection = hasMultiSelection ?
					multiSelectedBlockClientIds.includes( clientId ) :
					selectedBlockClientId === clientId;

				return (
					<AsyncModeProvider key={ clientId } value={ ! isBlockInSelection }>
						<BlockListBlock
							rootClientId={ rootClientId }
							clientId={ clientId }
							isDraggable={ isDraggable }
							moverDirection={ moverDirection }
							isMultiSelecting={ isMultiSelecting }
							// This prop is explicitely computed and passed down
							// to avoid being impacted by the async mode
							// otherwise there might be a small delay to trigger the animation.
							animateOnChange={ index }
							enableAnimation={ enableAnimation }
							hasSelectedUI={ uiParts.hasSelectedUI }
							hasMovers={ uiParts.hasMovers }
							className={ clientId === targetClientId ? 'is-drop-target' : undefined }
						/>
					</AsyncModeProvider>
				);
			} ) }
			<BlockListAppender
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
				className={ targetClientId === null ? 'is-drop-target' : undefined }
			/>
			<__experimentalBlockListFooter.Slot />
		</Container>
	);
}

// This component needs to always be synchronous
// as it's the one changing the async mode
// depending on the block selection.
export default forceSyncUpdates( BlockList );
