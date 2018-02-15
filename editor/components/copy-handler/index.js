/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { documentHasSelection } from '../../utils/dom';
import { removeBlocks } from '../../store/actions';
import {
	getMultiSelectedBlocks,
	getMultiSelectedBlockUids,
	getSelectedBlock,
} from '../../store/selectors';

class CopyHandler extends Component {
	constructor() {
		super( ...arguments );

		this.onCopy = this.onCopy.bind( this );
		this.onCut = this.onCut.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'copy', this.onCopy );
		document.addEventListener( 'cut', this.onCut );
	}

	componentWillUnmount() {
		document.removeEventListener( 'copy', this.onCopy );
		document.removeEventListener( 'cut', this.onCut );
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

	render() {
		return null;
	}
}

export default connect(
	( state ) => {
		return {
			multiSelectedBlocks: getMultiSelectedBlocks( state ),
			multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
			selectedBlock: getSelectedBlock( state ),
		};
	},
	{ onRemove: removeBlocks },
)( CopyHandler );
