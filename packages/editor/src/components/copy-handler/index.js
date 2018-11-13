/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import { documentHasSelection } from '@wordpress/dom';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

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
		const { selectedBlockClientIds, getBlocks } = this.props;

		if ( ! selectedBlockClientIds || selectedBlockClientIds.length === 0 ) {
			return;
		}

		// Let native copy behaviour take over in input fields.
		if ( selectedBlockClientIds.length === 1 && documentHasSelection() ) {
			return;
		}

		const serialized = serialize( getBlocks( selectedBlockClientIds ) );

		event.clipboardData.setData( 'text/plain', serialized );
		event.clipboardData.setData( 'text/html', serialized );

		event.preventDefault();
	}

	onCut( event ) {
		const { multiSelectedBlockClientIds } = this.props;

		this.onCopy( event );

		if ( multiSelectedBlockClientIds.length ) {
			this.props.onRemove( multiSelectedBlockClientIds );
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getMultiSelectedBlockClientIds,
			getSelectedBlockClientId,
			getBlocks,
		} = select( 'core/editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockClientIds = selectedBlockClientId ? [ selectedBlockClientId ] : getMultiSelectedBlockClientIds();

		return {
			selectedBlockClientIds,

			// We only care about this value when the copy is performed
			// We call it dynamically in the event handler to avoid unnecessary re-renders.
			getBlocks,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onRemove: dispatch( 'core/editor' ).removeBlocks,
	} ) ),
] )( CopyHandler );
