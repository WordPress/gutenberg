/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	findLast,
	flatMap,
	invert,
	mapValues,
	noop,
	throttle,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, findDOMNode } from '@wordpress/element';
import { serialize, getDefaultBlockName, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import VisualEditorBlock from './block';
import VisualEditorSiblingInserter from './sibling-inserter';
import BlockDropZone from './block-drop-zone';
import {
	getBlockUids,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getMultiSelectedBlocks,
	getMultiSelectedBlockUids,
	getSelectedBlock,
} from '../../selectors';
import { insertBlock, startMultiSelect, stopMultiSelect, multiSelect, selectBlock } from '../../actions';

class VisualEditorBlockList extends Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );
		this.onShiftSelection = this.onShiftSelection.bind( this );
		this.onCopy = this.onCopy.bind( this );
		this.onCut = this.onCut.bind( this );
		this.setBlockRef = this.setBlockRef.bind( this );
		this.appendDefaultBlock = this.appendDefaultBlock.bind( this );
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

	setLastClientY( { clientY } ) {
		this.lastClientY = clientY;
	}

	setBlockRef( ref ) {
		// To avoid dynamically creating function references for ref on every
		// block element, instead reach into props of element directly.
		const uid = ref.props.uid;
		const node = findDOMNode( ref );

		if ( ref === null ) {
			delete this.nodes[ uid ];
		} else {
			this.nodes = {
				...this.nodes,
				[ uid ]: node,
			};
		}
	}

	onPointerMove( { clientY } ) {
		const boundaries = this.nodes[ this.selectionAtStart ].getBoundingClientRect();
		const y = clientY - boundaries.top;
		const key = findLast( this.coordMapKeys, ( coordY ) => coordY < y );

		this.onSelectionChange( this.coordMap[ key ] );
	}

	onCopy( event ) {
		const { multiSelectedBlocks } = this.props;

		if ( multiSelectedBlocks.length ) {
			const serialized = serialize( multiSelectedBlocks );

			event.clipboardData.setData( 'text/plain', serialized );
			event.clipboardData.setData( 'text/html', serialized );
			event.preventDefault();
		}
	}

	onCut( event ) {
		const { multiSelectedBlockUids } = this.props;

		this.onCopy( event );

		if ( multiSelectedBlockUids.length ) {
			this.props.onRemove( multiSelectedBlockUids );
		}
	}

	onSelectionStart( uid ) {
		const boundaries = this.nodes[ uid ].getBoundingClientRect();

		// Create a uid to Y coördinate map.
		const uidToCoordMap = mapValues( this.nodes, ( node ) => {
			return node.getBoundingClientRect().top - boundaries.top;
		} );

		// Cache a Y coördinate to uid map for use in `onPointerMove`.
		this.coordMap = invert( uidToCoordMap );
		// Cache an array of the Y coördinates for use in `onPointerMove`.
		this.coordMapKeys = Object.values( uidToCoordMap );
		this.selectionAtStart = uid;

		window.addEventListener( 'mousemove', this.onPointerMove );
		// Capture scroll on all elements.
		window.addEventListener( 'scroll', this.onScroll, true );
		window.addEventListener( 'mouseup', this.onSelectionEnd );

		this.props.onStartMultiSelect();
	}

	onSelectionChange( uid ) {
		const { onMultiSelect, selectionStart, selectionEnd } = this.props;
		const { selectionAtStart } = this;
		const isAtStart = selectionAtStart === uid;

		if ( ! selectionAtStart ) {
			return;
		}

		if ( isAtStart && selectionStart ) {
			onMultiSelect( null, null );
		}

		if ( ! isAtStart && selectionEnd !== uid ) {
			onMultiSelect( selectionAtStart, uid );
		}
	}

	onSelectionEnd() {
		// Cancel throttled calls.
		this.onPointerMove.cancel();

		delete this.coordMap;
		delete this.coordMapKeys;
		delete this.selectionAtStart;

		window.removeEventListener( 'mousemove', this.onPointerMove );
		window.removeEventListener( 'scroll', this.onScroll, true );
		window.removeEventListener( 'mouseup', this.onSelectionEnd );

		this.props.onStopMultiSelect();
	}

	onShiftSelection( uid ) {
		const { selectedBlock, selectionStart, onMultiSelect, onSelect } = this.props;

		if ( selectedBlock ) {
			onMultiSelect( selectedBlock.uid, uid );
		} else if ( selectionStart ) {
			onMultiSelect( selectionStart, uid );
		} else {
			onSelect( uid );
		}
	}

	appendDefaultBlock() {
		const newBlock = createBlock( getDefaultBlockName() );
		this.props.onInsertBlock( newBlock );
	}

	render() {
		const { blocks } = this.props;

		return (
			<div>
				{ !! blocks.length && <VisualEditorSiblingInserter insertIndex={ 0 } /> }
				{ flatMap( blocks, ( uid, index ) => [
					<VisualEditorBlock
						key={ 'block-' + uid }
						uid={ uid }
						ref={ this.setBlockRef }
						onSelectionStart={ this.onSelectionStart }
						onShiftSelection={ this.onShiftSelection }
					/>,
					<VisualEditorSiblingInserter
						key={ 'sibling-inserter-' + uid }
						insertIndex={ index + 1 }
					/>,
				] ) }
				{ ! blocks.length &&
					<div className="editor-visual-editor__placeholder">
						<BlockDropZone />
						<input
							type="text"
							readOnly
							value={ __( 'Write your story' ) }
							onFocus={ this.appendDefaultBlock }
							onClick={ noop }
							onKeyDown={ noop }
						/>
					</div>
				}
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
		selectionStart: getMultiSelectedBlocksStartUid( state ),
		selectionEnd: getMultiSelectedBlocksEndUid( state ),
		multiSelectedBlocks: getMultiSelectedBlocks( state ),
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		selectedBlock: getSelectedBlock( state ),
	} ),
	( dispatch ) => ( {
		onInsertBlock( block ) {
			dispatch( insertBlock( block ) );
		},
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
)( VisualEditorBlockList );
