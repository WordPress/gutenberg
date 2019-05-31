/**
 * External dependencies
 */
import {
	findLast,
	map,
	invert,
	mapValues,
	sortBy,
	throttle,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, useRef, useEffect } from '@wordpress/element';
import {
	withSelect,
	withDispatch,
	__experimentalAsyncModeProvider as AsyncModeProvider,
} from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import { getBlockDOMNode } from '../../utils/dom';

const forceSyncUpdates = ( WrappedComponent ) => ( props ) => {
	return (
		<AsyncModeProvider value={ false }>
			<WrappedComponent { ...props } />
		</AsyncModeProvider>
	);
};

const BlockList = ( {
	blockClientIds,
	rootClientId,
	isDraggable,
	isSelectionEnabled,
	selectedBlockClientId,
	multiSelectedBlockClientIds,
	hasMultiSelection,
	renderAppender,
} ) => {
	let lastClientY = 0;
	let nodes = {};

	/**
	 * Binds event handlers to the document for tracking a pending multi-select
	 * in response to a mousedown event occurring in a rendered block.
	 *
	 * @param {string} clientId Client ID of block where mousedown occurred.
	 *
	 * @return {void}
	 */
	const onSelectionStart = ( clientId ) => {
		if ( ! isSelectionEnabled ) {
			return;
		}

		const boundaries = nodes[ clientId ].getBoundingClientRect();

		// Create a clientId to Y coördinate map.
		const clientIdToCoordMap = mapValues( nodes, ( node ) =>
			node.getBoundingClientRect().top - boundaries.top );

		// Cache a Y coördinate to clientId map for use in `onPointerMove`.
		nodes[ clientId ].coordMap = invert( clientIdToCoordMap );
		// Cache an array of the Y coördinates for use in `onPointerMove`.
		// Sort the coördinates, as `this.nodes` will not necessarily reflect
		// the current block sequence.
		nodes[ clientId ].coordMapKeys = sortBy( Object.values( clientIdToCoordMap ) );
		nodes[ clientId ].selectionAtStart = clientId;

		window.addEventListener( 'mousemove', this.onPointerMove );
		// Capture scroll on all elements.
		window.addEventListener( 'scroll', this.onScroll, true );
		window.addEventListener( 'mouseup', this.onSelectionEnd );
	};

	const setLastClientY = ( { clientY } ) => {
		lastClientY = clientY;
	};

	useEffect( () => {
		window.addEventListener( 'mousemove', setLastClientY );

		return () => {
			window.removeEventListener( 'mousemove', this.setLastClientY );
		};
	}, [] );

	return (
		<div className="editor-block-list__layout block-editor-block-list__layout">
			{ map( blockClientIds, ( clientId ) => {
				const isBlockInSelection = hasMultiSelection ?
					multiSelectedBlockClientIds.includes( clientId ) :
					selectedBlockClientId === clientId;
				const setBlockRef = ( node ) => {
					if ( node === null ) {
						delete nodes[ clientId ];
					} else {
						nodes = {
							...nodes,
							[ clientId ]: node,
						};
					}
				};

				return (
					<AsyncModeProvider
						key={ 'block-' + clientId }
						value={ ! isBlockInSelection }
					>
						<BlockListBlock
							clientId={ clientId }
							blockRef={ setBlockRef }
							onSelectionStart={ onSelectionStart }
							rootClientId={ rootClientId }
							isDraggable={ isDraggable }
						/>
					</AsyncModeProvider>
				);
			} ) }

			<BlockListAppender
				rootClientId={ rootClientId }
				renderAppender={ renderAppender }
			/>
		</div>
	);
}

export default compose( [
	// This component needs to always be synchronous
	// as it's the one changing the async mode
	// depending on the block selection.
	forceSyncUpdates,
	withSelect( ( select, ownProps ) => {
		const {
			getBlockOrder,
			isSelectionEnabled,
			isMultiSelecting,
			getMultiSelectedBlocksStartClientId,
			getMultiSelectedBlocksEndClientId,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
		} = select( 'core/block-editor' );

		const { rootClientId } = ownProps;

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			selectionStart: getMultiSelectedBlocksStartClientId(),
			selectionEnd: getMultiSelectedBlocksEndClientId(),
			isSelectionEnabled: isSelectionEnabled(),
			isMultiSelecting: isMultiSelecting(),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			startMultiSelect,
			stopMultiSelect,
			multiSelect,
		} = dispatch( 'core/block-editor' );

		return {
			onStartMultiSelect: startMultiSelect,
			onStopMultiSelect: stopMultiSelect,
			onMultiSelect: multiSelect,
		};
	} ),
] )( BlockList );
