/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useCallback } from '@wordpress/element';
import { AsyncModeProvider, useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockAsyncModeProvider from './block-async-mode-provider';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import __experimentalBlockListFooter from '../block-list-footer';

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

/**
 * Returns for the deepest node at the start or end of a container node. Ignores
 * any text nodes that only contain HTML formatting whitespace.
 *
 * @param {Element} node Container to search.
 * @param {string} type 'start' or 'end'.
 */
function getDeepestNode( node, type ) {
	const child = type === 'start' ? 'firstChild' : 'lastChild';
	const sibling = type === 'start' ? 'nextSibling' : 'previousSibling';

	while ( node[ child ] ) {
		node = node[ child ];

		while (
			node.nodeType === node.TEXT_NODE &&
			/^[ \t\n]*$/.test( node.data ) &&
			node[ sibling ]
		) {
			node = node[ sibling ];
		}
	}

	return node;
}

function BlockList( {
	className,
	rootClientId,
	__experimentalMoverDirection: moverDirection = 'vertical',
	isDraggable,
	renderAppender,
} ) {
	function selector( select ) {
		const {
			getBlockOrder,
			isSelectionEnabled,
			isMultiSelecting,
			getSelectedBlockClientId,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			getGlobalBlockCount,
			isTyping,
			getBlockParents,
		} = select( 'core/block-editor' );

		return {
			blockClientIds: getBlockOrder( rootClientId ),
			isSelectionEnabled: isSelectionEnabled(),
			isMultiSelecting: isMultiSelecting(),
			selectedBlockClientId: getSelectedBlockClientId(),
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
			hasMultiSelection: hasMultiSelection(),
			enableAnimation: (
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD
			),
			getBlockParents,
		};
	}

	const {
		blockClientIds,
		isSelectionEnabled,
		isMultiSelecting,
		selectedBlockClientId,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		enableAnimation,
		getBlockParents,
	} = useSelect( selector );
	const {
		startMultiSelect,
		stopMultiSelect,
		multiSelect,
		selectBlock,
	} = useDispatch( 'core/block-editor' );
	const ref = useRef();
	const rafId = useRef();
	const startClientId = useRef();

	/**
	 * When the component updates, and there is multi selection, we need to
	 * select the entire block contents.
	 */
	useEffect( () => {
		if ( ! hasMultiSelection || isMultiSelecting ) {
			return;
		}

		const { length } = multiSelectedBlockClientIds;
		// These must be in the right DOM order.
		const start = multiSelectedBlockClientIds[ 0 ];
		const end = multiSelectedBlockClientIds[ length - 1 ];
		const startIndex = blockClientIds.indexOf( start );

		// The selected block is not in this block list.
		if ( startIndex === -1 ) {
			return;
		}

		let startNode = ref.current.querySelector(
			`[data-block="${ start }"]`
		);
		let endNode = ref.current.querySelector(
			`[data-block="${ end }"]`
		);

		const selection = window.getSelection();
		const range = document.createRange();

		// The most stable way to select the whole block contents is to start
		// and end at the deepest points.
		startNode = getDeepestNode( startNode, 'start' );
		endNode = getDeepestNode( endNode, 'end' );

		range.setStartBefore( startNode );
		range.setEndAfter( endNode );

		selection.removeAllRanges();
		selection.addRange( range );
	}, [
		hasMultiSelection,
		isMultiSelecting,
		multiSelectedBlockClientIds,
		blockClientIds,
		selectBlock,
	] );

	const onSelectionChange = useCallback( () => {
		const selection = window.getSelection();

		// If no selection is found, end multi selection.
		if ( ! selection.rangeCount || selection.isCollapsed ) {
			return;
		}

		let { focusNode } = selection;
		let clientId;

		// Find the client ID of the block where the selection ends.
		do {
			focusNode = focusNode.parentElement;
		} while (
			focusNode &&
			! ( clientId = focusNode.getAttribute( 'data-block' ) )
		);

		console.log( startClientId.current );

		if ( startClientId.current === clientId ) {
			selectBlock( clientId );
		} else {
			const startPath = [ ...getBlockParents( startClientId.current ), startClientId.current ];
			const endPath = [ ...getBlockParents( clientId ), clientId ];
			const depth = Math.min( startPath.length, endPath.length ) - 1;

			multiSelect( startPath[ depth ], endPath[ depth ] );
		}
	}, [ selectBlock, getBlockParents, multiSelect ] );

	/**
	 * Handles a mouseup event to end the current mouse multi-selection.
	 */
	const onSelectionEnd = useCallback( () => {
		document.removeEventListener( 'selectionchange', onSelectionChange );
		// Equivalent to attaching the listener once.
		window.removeEventListener( 'mouseup', onSelectionEnd );
		// The browser selection won't have updated yet at this point, so wait
		// until the next animation frame to get the browser selection.
		rafId.current = window.requestAnimationFrame( () => {
			onSelectionChange();
			stopMultiSelect();
		} );
	}, [ onSelectionChange, stopMultiSelect ] );

	// Only clean up when unmounting, these are added and cleaned up elsewhere.
	useEffect( () => () => {
		document.removeEventListener( 'selectionchange', onSelectionChange );
		window.removeEventListener( 'mouseup', onSelectionEnd );
		window.cancelAnimationFrame( rafId.current );
	}, [ onSelectionEnd ] );

	/**
	 * Binds event handlers to the document for tracking a pending multi-select
	 * in response to a mousedown event occurring in a rendered block.
	 */
	const onSelectionStart = useCallback( ( clientId ) => {
		if ( ! isSelectionEnabled ) {
			return;
		}

		startClientId.current = clientId;
		startMultiSelect();

		// `onSelectionStart` is called after `mousedown` and `mouseleave`
		// (from a block). The selection ends when `mouseup` happens anywhere
		// in the window.
		document.addEventListener( 'selectionchange', onSelectionChange );
		window.addEventListener( 'mouseup', onSelectionEnd );

		// Removing the contenteditable attributes within the block editor is
		// essential for selection to work across editable areas. The edible
		// hosts are removed, allowing selection to be extended outside the
		// DOM element. `startMultiSelect` sets a flag in the store so the rich
		// text components are updated, but the rerender may happen very slowly,
		// especially in Safari for the blocks that are asynchonously rendered.
		// To ensure the browser instantly removes the selection boundaries, we
		// remove the contenteditable attributes manually.
		Array.from( ref.current.querySelectorAll( '.rich-text' ) )
			.forEach( ( node ) => node.removeAttribute( 'contenteditable' ) );
	}, [ isSelectionEnabled, startMultiSelect, onSelectionEnd ] );

	return (
		<div
			ref={ ref }
			className={ classnames(
				'editor-block-list__layout block-editor-block-list__layout',
				className
			) }
		>
			{ blockClientIds.map( ( clientId, index ) => {
				const isBlockInSelection = hasMultiSelection ?
					multiSelectedBlockClientIds.includes( clientId ) :
					selectedBlockClientId === clientId;

				return (
					<BlockAsyncModeProvider
						key={ 'block-' + clientId }
						clientId={ clientId }
						isBlockInSelection={ isBlockInSelection }
					>
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
						/>
					</BlockAsyncModeProvider>
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
