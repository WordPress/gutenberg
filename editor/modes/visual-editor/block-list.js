/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { throttle, reduce, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { serialize, getDefaultBlock, createBlock } from 'blocks';
import { ENTER } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import VisualEditorBlock from './block';
import Inserter from '../../inserter';
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
		this.onPlaceholderKeyDown = this.onPlaceholderKeyDown.bind( this );
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
		window.addEventListener( 'touchmove', this.setLastClientY );
	}

	componentWillUnmount() {
		document.removeEventListener( 'copy', this.onCopy );
		document.removeEventListener( 'cut', this.onCut );
		window.removeEventListener( 'mousemove', this.setLastClientY );
		window.removeEventListener( 'touchmove', this.setLastClientY );
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
		const BUFFER = 60;
		const { multiSelectedBlocks } = this.props;
		const y = clientY + window.pageYOffset;

		// If there is no selection yet, make the use move at least BUFFER px
		// away from the block with the pointer.
		if (
			! multiSelectedBlocks.length &&
			y - this.startLowerBoundary < BUFFER &&
			this.startUpperBoundary - y < BUFFER
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
		const { pageYOffset } = window;
		const boundaries = this.refs[ uid ].getBoundingClientRect();

		// Create a Y coödinate map to unique block IDs.
		this.coordMap = reduce( this.refs, ( acc, node, blockUid ) => ( {
			...acc,
			[ pageYOffset + node.getBoundingClientRect().top ]: blockUid,
		} ), {} );
		// Cache an array of the Y coödrinates for use in `onPointerMove`.
		this.coordMapKeys = Object.keys( this.coordMap );
		this.selectionAtStart = uid;

		this.startUpperBoundary = pageYOffset + boundaries.top;
		this.startLowerBoundary = pageYOffset + boundaries.bottom;

		window.addEventListener( 'mousemove', this.onPointerMove );
		window.addEventListener( 'touchmove', this.onPointerMove );
		window.addEventListener( 'scroll', this.onScroll );
		window.addEventListener( 'mouseup', this.onSelectionEnd );
		window.addEventListener( 'touchend', this.onSelectionEnd );
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
		delete this.startUpperBoundary;
		delete this.startLowerBoundary;

		window.removeEventListener( 'mousemove', this.onPointerMove );
		window.removeEventListener( 'touchmove', this.onPointerMove );
		window.removeEventListener( 'scroll', this.onScroll );
		window.removeEventListener( 'mouseup', this.onSelectionEnd );
		window.removeEventListener( 'touchend', this.onSelectionEnd );
	}

	onPlaceholderKeyDown( event ) {
		if ( event.keyCode === ENTER ) {
			this.appendDefaultBlock();
		}
	}

	appendDefaultBlock() {
		const newBlock = createBlock( getDefaultBlock() );
		this.props.onInsertBlock( newBlock );
	}

	render() {
		const { blocks, showInsertionPoint, insertionPoint, multiSelectedBlockUids } = this.props;
		const insertionPointIndex = blocks.indexOf( insertionPoint );
		const blocksWithInsertionPoint = showInsertionPoint
			? [
				...blocks.slice( 0, insertionPointIndex + 1 ),
				INSERTION_POINT_PLACEHOLDER,
				...blocks.slice( insertionPointIndex + 1 ),
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
							multiSelectedBlockUids={ multiSelectedBlockUids }
						/>
					);
				} ) }
				{ ! blocks.length &&
					<input
						type="text"
						readOnly
						className="editor-visual-editor__placeholder"
						value={ __( 'Write your story' ) }
						onFocus={ this.appendDefaultBlock }
						onClick={ noop }
						onKeyDown={ noop }
					/>
				}
				<div className="editor-visual-editor__continue-writing">
					<Inserter position="top right" />
					{ !! blocks.length &&
						<input
							type="text"
							readOnly
							className="editor-visual-editor__placeholder"
							value={ __( 'Continue writing…' ) }
							onFocus={ noop }
							onClick={ this.appendDefaultBlock }
							onKeyDown={ this.onPlaceholderKeyDown }
						/>
					}
				</div>
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
