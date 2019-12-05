/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import {
	withSelect,
	withDispatch,
	AsyncModeProvider,
} from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockAsyncModeProvider from './block-async-mode-provider';
import BlockListBlock from './block';
import BlockListAppender from '../block-list-appender';
import __experimentalBlockListFooter from '../block-list-footer';
import BlockInsertionPoint from './insertion-point';

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

class BlockList extends Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );
		this.setSelection = this.setSelection.bind( this );
		this.updateNativeSelection = this.updateNativeSelection.bind( this );

		this.ref = createRef();
	}

	componentDidUpdate() {
		this.updateNativeSelection();
	}

	componentWillUnmount() {
		window.removeEventListener( 'mouseup', this.onSelectionEnd );
		window.cancelAnimationFrame( this.rafId );
	}

	/**
	 * When the component updates, and there is multi selection, we need to
	 * select the entire block contents.
	 */
	updateNativeSelection() {
		const {
			hasMultiSelection,
			blockClientIds,
			// These must be in the right DOM order.
			multiSelectedBlockClientIds,
		} = this.props;

		if ( ! hasMultiSelection ) {
			return;
		}

		const { length } = multiSelectedBlockClientIds;
		const start = multiSelectedBlockClientIds[ 0 ];
		const end = multiSelectedBlockClientIds[ length - 1 ];
		const startIndex = blockClientIds.indexOf( start );

		// The selected block is not in this block list.
		if ( startIndex === -1 ) {
			return;
		}

		let startNode = this.ref.current.querySelector(
			`[data-block="${ start }"]`
		);
		let endNode = this.ref.current.querySelector(
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
	}

	/**
	 * Binds event handlers to the document for tracking a pending multi-select
	 * in response to a mousedown event occurring in a rendered block.
	 *
	 * @param {string} clientId Client ID of block where mousedown occurred.
	 */
	onSelectionStart( clientId ) {
		if ( ! this.props.isSelectionEnabled ) {
			return;
		}

		this.startClientId = clientId;
		this.props.onStartMultiSelect();

		// `onSelectionStart` is called after `mousedown` and `mouseleave`
		// (from a block). The selection ends when `mouseup` happens anywhere
		// in the window.
		window.addEventListener( 'mouseup', this.onSelectionEnd );

		// Removing the contenteditable attributes within the block editor is
		// essential for selection to work across editable areas. The edible
		// hosts are removed, allowing selection to be extended outside the
		// DOM element. `onStartMultiSelect` sets a flag in the store so the
		// rich text components are updated, but the rerender may happen very
		// slowly, especially in Safari for the blocks that are asynchonously
		// rendered. To ensure the browser instantly removes the selection
		// boundaries, we remove the contenteditable attributes manually.
		Array.from(
			this.ref.current.querySelectorAll( '.rich-text' )
		).forEach( ( node ) => {
			node.removeAttribute( 'contenteditable' );
		} );
	}

	/**
	 * Handles a mouseup event to end the current mouse multi-selection.
	 */
	onSelectionEnd() {
		// Equivalent to attaching the listener once.
		window.removeEventListener( 'mouseup', this.onSelectionEnd );

		if ( ! this.props.isMultiSelecting ) {
			return;
		}

		// The browser selection won't have updated yet at this point, so wait
		// until the next animation frame to get the browser selection.
		this.rafId = window.requestAnimationFrame( this.setSelection );
	}

	setSelection() {
		const selection = window.getSelection();
		const {
			onStopMultiSelect,
			onMultiSelect,
			getBlockParents,
		} = this.props;

		// If no selection is found, end multi selection.
		if ( ! selection.rangeCount || selection.isCollapsed ) {
			this.props.onStopMultiSelect();
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

		// If the final selection doesn't leave the block, there is no multi
		// selection.
		if ( this.startClientId === clientId ) {
			onStopMultiSelect();
			return;
		}

		const startPath = [ ...getBlockParents( this.startClientId ), this.startClientId ];
		const endPath = [ ...getBlockParents( clientId ), clientId ];
		const depth = Math.min( startPath.length, endPath.length ) - 1;

		onMultiSelect( startPath[ depth ], endPath[ depth ] );
		onStopMultiSelect();
	}

	render() {
		const {
			className,
			blockClientIds,
			rootClientId,
			__experimentalMoverDirection: moverDirection = 'vertical',
			selectedBlockClientId,
			multiSelectedBlockClientIds,
			hasMultiSelection,
			renderAppender,
			enableAnimation,
			isMultiSelecting,
		} = this.props;

		return (
			<div
				ref={ this.ref }
				className={ classnames(
					'editor-block-list__layout block-editor-block-list__layout',
					className
				) }
			>
				{ blockClientIds.map( ( clientId, index ) => {
					const isBlockInSelection = hasMultiSelection ?
						multiSelectedBlockClientIds.includes( clientId ) :
						selectedBlockClientId === clientId;
					const isFirstMultiSelected = multiSelectedBlockClientIds[ 0 ] === clientId;
					const shouldShowInsertionPoint = ! isMultiSelecting && (
						( isBlockInSelection && isFirstMultiSelected ) ||
						! isBlockInSelection
					);

					return (
						<BlockAsyncModeProvider
							key={ 'block-' + clientId }
							clientId={ clientId }
							isBlockInSelection={ isBlockInSelection }
						>
							{ shouldShowInsertionPoint && (
								<BlockInsertionPoint
									clientId={ clientId }
									rootClientId={ rootClientId }
								/>
							) }
							<BlockListBlock
								rootClientId={ rootClientId }
								clientId={ clientId }
								onSelectionStart={ this.onSelectionStart }
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
			getGlobalBlockCount,
			isTyping,
			getBlockParents,
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
			enableAnimation: (
				! isTyping() &&
				getGlobalBlockCount() <= BLOCK_ANIMATION_THRESHOLD
			),
			getBlockParents,
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
