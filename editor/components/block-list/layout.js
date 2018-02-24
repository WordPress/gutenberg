/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	findLast,
	map,
	invert,
	isEqual,
	mapValues,
	sortBy,
	throttle,
	get,
	last,
} from 'lodash';
import scrollIntoView from 'dom-scroll-into-view';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { serialize, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockListBlock from './block';
import BlockSelectionClearer from '../block-selection-clearer';
import DefaultBlockAppender from '../default-block-appender';
import {
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getMultiSelectedBlocks,
	getMultiSelectedBlockUids,
	getSelectedBlock,
	isSelectionEnabled,
	isMultiSelecting,
} from '../../store/selectors';
import { startMultiSelect, stopMultiSelect, multiSelect, selectBlock } from '../../store/actions';
import { documentHasSelection } from '../../utils/dom';

class BlockListLayout extends Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );
		this.onShiftSelection = this.onShiftSelection.bind( this );
		this.onCopy = this.onCopy.bind( this );
		this.onCut = this.onCut.bind( this );
		this.setBlockRef = this.setBlockRef.bind( this );
		this.setLastClientY = this.setLastClientY.bind( this );
		this.onPointerMove = throttle( this.onPointerMove.bind( this ), 100 );
		// Browser does not fire `*move` event when the pointer position changes
		// relative to the document, so fire it with the last known position.
		this.onScroll = () => this.onPointerMove( { clientY: this.lastClientY } );

		this.lastClientY = 0;
		this.nodes = {};
	}

	componentDidMount() {
		document.addEventListener( 'copy', this.onCopy );
		document.addEventListener( 'cut', this.onCut );
		window.addEventListener( 'mousemove', this.setLastClientY );
	}

	componentWillUnmount() {
		document.removeEventListener( 'copy', this.onCopy );
		document.removeEventListener( 'cut', this.onCut );
		window.removeEventListener( 'mousemove', this.setLastClientY );
	}

	componentWillReceiveProps( nextProps ) {
		if ( isEqual( this.props.multiSelectedBlockUids, nextProps.multiSelectedBlockUids ) ) {
			return;
		}

		if ( nextProps.multiSelectedBlockUids && nextProps.multiSelectedBlockUids.length > 0 ) {
			const extent = this.nodes[ nextProps.selectionEnd ];
			if ( extent ) {
				scrollIntoView( extent, extent.closest( '.edit-post-layout__content' ), {
					onlyScrollIfNeeded: true,
				} );
			}
		}
	}

	setLastClientY( { clientY } ) {
		this.lastClientY = clientY;
	}

	setBlockRef( node, uid ) {
		if ( node === null ) {
			delete this.nodes[ uid ];
		} else {
			this.nodes = {
				...this.nodes,
				[ uid ]: node,
			};
		}
	}

	/**
	 * Handles a pointer move event to update the extent of the current cursor
	 * multi-selection.
	 *
	 * @param {MouseEvent} event A mousemove event object.
	 *
	 * @return {void}
	 */
	onPointerMove( { clientY } ) {
		// We don't start multi-selection until the mouse starts moving, so as
		// to avoid dispatching multi-selection actions on an in-place click.
		if ( ! this.props.isMultiSelecting ) {
			this.props.onStartMultiSelect();
		}

		const boundaries = this.nodes[ this.selectionAtStart ].getBoundingClientRect();
		const y = clientY - boundaries.top;
		const key = findLast( this.coordMapKeys, ( coordY ) => coordY < y );

		this.onSelectionChange( this.coordMap[ key ] );
	}

	onCopy( event ) {
		const { multiSelectedBlocks, selectedBlock } = this.props;

		if ( ! multiSelectedBlocks.length && ! selectedBlock ) {
			return;
		}

		// Let native copy behaviour take over in input fields.
		if ( selectedBlock && documentHasSelection() ) {
			return;
		}

		const serialized = serialize( selectedBlock || multiSelectedBlocks );

		event.clipboardData.setData( 'text/plain', serialized );
		event.clipboardData.setData( 'text/html', serialized );

		event.preventDefault();
	}

	onCut( event ) {
		const { multiSelectedBlockUids } = this.props;

		this.onCopy( event );

		if ( multiSelectedBlockUids.length ) {
			this.props.onRemove( multiSelectedBlockUids );
		}
	}

	/**
	 * Binds event handlers to the document for tracking a pending multi-select
	 * in response to a mousedown event occurring in a rendered block.
	 *
	 * @param {string} uid UID of the block where mousedown occurred.
	 *
	 * @return {void}
	 */
	onSelectionStart( uid ) {
		if ( ! this.props.isSelectionEnabled ) {
			return;
		}

		const boundaries = this.nodes[ uid ].getBoundingClientRect();

		// Create a uid to Y coördinate map.
		const uidToCoordMap = mapValues( this.nodes, ( node ) =>
			node.getBoundingClientRect().top - boundaries.top );

		// Cache a Y coördinate to uid map for use in `onPointerMove`.
		this.coordMap = invert( uidToCoordMap );
		// Cache an array of the Y coördinates for use in `onPointerMove`.
		// Sort the coördinates, as `this.nodes` will not necessarily reflect
		// the current block sequence.
		this.coordMapKeys = sortBy( Object.values( uidToCoordMap ) );
		this.selectionAtStart = uid;

		window.addEventListener( 'mousemove', this.onPointerMove );
		// Capture scroll on all elements.
		window.addEventListener( 'scroll', this.onScroll, true );
		window.addEventListener( 'mouseup', this.onSelectionEnd );
	}

	onSelectionChange( uid ) {
		const { onMultiSelect, selectionStart, selectionEnd } = this.props;
		const { selectionAtStart } = this;
		const isAtStart = selectionAtStart === uid;

		if ( ! selectionAtStart || ! this.props.isSelectionEnabled ) {
			return;
		}

		if ( isAtStart && selectionStart ) {
			onMultiSelect( null, null );
		}

		if ( ! isAtStart && selectionEnd !== uid ) {
			onMultiSelect( selectionAtStart, uid );
		}
	}

	/**
	 * Handles a mouseup event to end the current cursor multi-selection.
	 *
	 * @return {void}
	 */
	onSelectionEnd() {
		// Cancel throttled calls.
		this.onPointerMove.cancel();

		delete this.coordMap;
		delete this.coordMapKeys;
		delete this.selectionAtStart;

		window.removeEventListener( 'mousemove', this.onPointerMove );
		window.removeEventListener( 'scroll', this.onScroll, true );
		window.removeEventListener( 'mouseup', this.onSelectionEnd );

		// We may or may not be in a multi-selection when mouseup occurs (e.g.
		// an in-place mouse click), so only trigger stop if multi-selecting.
		if ( this.props.isMultiSelecting ) {
			this.props.onStopMultiSelect();
		}
	}

	onShiftSelection( uid ) {
		if ( ! this.props.isSelectionEnabled ) {
			return;
		}

		const { selectedBlock, selectionStart, onMultiSelect, onSelect } = this.props;

		if ( selectedBlock ) {
			onMultiSelect( selectedBlock.uid, uid );
		} else if ( selectionStart ) {
			onMultiSelect( selectionStart, uid );
		} else {
			onSelect( uid );
		}
	}

	render() {
		const {
			blocks,
			showContextualToolbar,
			layout,
			isGroupedByLayout,
			rootUID,
			renderBlockMenu,
		} = this.props;

		let defaultLayout;
		if ( isGroupedByLayout ) {
			defaultLayout = layout;
		}

		const isLastBlockDefault = get( last( blocks ), 'name' ) === getDefaultBlockName();

		return (
			<BlockSelectionClearer className={ 'layout-' + layout }>
				{ map( blocks, ( block, blockIndex ) => (
					<BlockListBlock
						key={ 'block-' + block.uid }
						index={ blockIndex }
						uid={ block.uid }
						blockRef={ this.setBlockRef }
						onSelectionStart={ this.onSelectionStart }
						onShiftSelection={ this.onShiftSelection }
						showContextualToolbar={ showContextualToolbar }
						rootUID={ rootUID }
						layout={ defaultLayout }
						isFirst={ blockIndex === 0 }
						isLast={ blockIndex === blocks.length - 1 }
						renderBlockMenu={ renderBlockMenu }
					/>
				) ) }
				{ ( ! blocks.length || ! isLastBlockDefault ) && (
					<DefaultBlockAppender
						rootUID={ rootUID }
						layout={ defaultLayout }
						showPrompt={ ! blocks.length }
					/>
				) }
			</BlockSelectionClearer>
		);
	}
}

export default connect(
	( state ) => ( {
		selectionStart: getMultiSelectedBlocksStartUid( state ),
		selectionEnd: getMultiSelectedBlocksEndUid( state ),
		multiSelectedBlocks: getMultiSelectedBlocks( state ),
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		selectedBlock: getSelectedBlock( state ),
		isSelectionEnabled: isSelectionEnabled( state ),
		isMultiSelecting: isMultiSelecting( state ),
	} ),
	( dispatch ) => ( {
		onStartMultiSelect() {
			dispatch( startMultiSelect() );
		},
		onStopMultiSelect() {
			dispatch( stopMultiSelect() );
		},
		onMultiSelect( start, end ) {
			dispatch( multiSelect( start, end ) );
		},
		onSelect( uid ) {
			dispatch( selectBlock( uid ) );
		},
		onRemove( uids ) {
			dispatch( { type: 'REMOVE_BLOCKS', uids } );
		},
	} )
)( BlockListLayout );
