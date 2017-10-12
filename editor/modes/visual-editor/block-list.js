/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { throttle, mapValues, noop, invert } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { serialize, getDefaultBlockName, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import VisualEditorBlock from './block';
import BlockDropZone from './block-drop-zone';
import {
	getBlockUids,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getMultiSelectedBlocks,
	getMultiSelectedBlockUids,
} from '../../selectors';
import { insertBlock, multiSelect } from '../../actions';

const INSERTION_POINT_PLACEHOLDER = '[[insertion-point]]';

class VisualEditorBlockList extends Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );
		this.onCopy = this.onCopy.bind( this );
		this.onCut = this.onCut.bind( this );
		this.setBlockRef = this.setBlockRef.bind( this );
		this.appendDefaultBlock = this.appendDefaultBlock.bind( this );
		this.setLastClientY = this.setLastClientY.bind( this );
		this.onPointerMove = throttle( this.onPointerMove.bind( this ), 250 );
		// Browser does not fire `*move` event when the pointer position changes
		// relative to the document, so fire it with the last known position.
		this.onScroll = () => this.onPointerMove( { clientY: this.lastClientY } );

		this.lastClientY = 0;
		this.refs = {};
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

	setBlockRef( ref, uid ) {
		if ( ref === null ) {
			delete this.refs[ uid ];
		} else {
			this.refs = {
				...this.refs,
				[ uid ]: ref,
			};
		}
	}

	onPointerMove( { clientY } ) {
		const BUFFER = 20;
		const { multiSelectedBlocks } = this.props;
		const boundaries = this.refs[ this.selectionAtStart ].getBoundingClientRect();
		const y = clientY - boundaries.top;

		// If there is no selection yet, make the use move at least BUFFER px
		// away from the block with the pointer.
		if (
			! multiSelectedBlocks.length &&
			y + BUFFER > 0 &&
			y - BUFFER < boundaries.height
		) {
			return;
		}

		const key = this.coordMapKeys.reduce( ( acc, topY ) => y > topY ? topY : acc );

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
		const boundaries = this.refs[ uid ].getBoundingClientRect();

		// Create a uid to Y coödinate map.
		const uidToCoordMap = mapValues( this.refs, ( node ) => {
			return node.getBoundingClientRect().top - boundaries.top;
		} );

		// Cache a Y coödinate to uid map for use in `onPointerMove`.
		this.coordMap = invert( uidToCoordMap );
		// Cache an array of the Y coödrinates for use in `onPointerMove`.
		this.coordMapKeys = Object.values( uidToCoordMap );
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
	}

	appendDefaultBlock() {
		const newBlock = createBlock( getDefaultBlockName() );
		this.props.onInsertBlock( newBlock );
	}

	render() {
		const {
			blocks,
			showInsertionPoint,
			insertionPoint,
		} = this.props;

		const blocksWithInsertionPoint = showInsertionPoint
			? [
				...blocks.slice( 0, insertionPoint ),
				INSERTION_POINT_PLACEHOLDER,
				...blocks.slice( insertionPoint ),
			]
			: blocks;

		return (
			<div>
				{ !! blocks.length && blocksWithInsertionPoint.map( ( uid ) => {
					if ( uid === INSERTION_POINT_PLACEHOLDER ) {
						return (
							<div
								key={ INSERTION_POINT_PLACEHOLDER }
								className="editor-visual-editor__insertion-point"
							/>
						);
					}

					return (
						<VisualEditorBlock
							key={ uid }
							uid={ uid }
							blockRef={ ( ref ) => this.setBlockRef( ref, uid ) }
							onSelectionStart={ () => this.onSelectionStart( uid ) }
						/>
					);
				} ) }
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
		insertionPoint: getBlockInsertionPoint( state ),
		showInsertionPoint: isBlockInsertionPointVisible( state ),
		selectionStart: getMultiSelectedBlocksStartUid( state ),
		selectionEnd: getMultiSelectedBlocksEndUid( state ),
		multiSelectedBlocks: getMultiSelectedBlocks( state ),
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
	} ),
	( dispatch ) => ( {
		onInsertBlock( block ) {
			dispatch( insertBlock( block ) );
		},
		onMultiSelect( start, end ) {
			dispatch( multiSelect( start, end ) );
		},
		onRemove( uids ) {
			dispatch( { type: 'REMOVE_BLOCKS', uids } );
		},
	} )
)( VisualEditorBlockList );
