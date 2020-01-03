/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { AsyncModeProvider, useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import __experimentalBlockListFooter from '../block-list-footer';
import useMultiSelection from './use-multi-selection';
import { getBlockClientId } from '../../utils/dom';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

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
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const ref = useRef();
	const onSelectionStart = useMultiSelection( { ref, rootClientId } );

	const uiParts = {
		hasMovers: true,
		hasSelectedUI: true,
		...__experimentalUIParts,
	};

	let onFocus;
	let onDragStart;

	if ( ! rootClientId ) {
		/**
		 * Marks the block as selected when focused and not already selected. This
		 * specifically handles the case where block does not set focus on its own
		 * (via `setFocus`), typically if there is no focusable input in the block.
		 *
		 * @param {WPSyntheticEvent} event
		 */
		onFocus = ( event ) => {
			if ( hasMultiSelection ) {
				return;
			}

			const clientId = getBlockClientId( event.target );

			if ( clientId && clientId !== selectedBlockClientId ) {
				selectBlock( clientId );
			}
		};

		/**
		 * Prevents default dragging behavior within a block.
		 * To do: we must handle this in the future and clean up the drag target.
		 * Previously dragging was prevented for multi-selected, but this is no longer
		 * needed.
		 *
		 * @param {WPSyntheticEvent} event Synthetic drag event.
		 */
		onDragStart = ( event ) => {
			// Ensure we target block content, not block controls.
			if ( getBlockClientId( event.target ) ) {
				event.preventDefault();
			}
		};
	}

	return (
		<div
			ref={ ref }
			className={ classnames(
				'block-editor-block-list__layout',
				className
			) }
			onFocus={ onFocus }
			onDragStart={ onDragStart }
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
							onSelectionStart={ onSelectionStart }
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
						/>
					</AsyncModeProvider>
				);
			} ) }
			<BlockListAppender
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
			/>
			<__experimentalBlockListFooter.Slot />
		</div>
	);
}

// This component needs to always be synchronous
// as it's the one changing the async mode
// depending on the block selection.
export default forceSyncUpdates( BlockList );
