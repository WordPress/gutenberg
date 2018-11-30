/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import { documentHasSelection } from '@wordpress/dom';
import { withDispatch } from '@wordpress/data';
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
		this.props.onCopy( event.clipboardData );
		event.preventDefault();
	}

	onCut( event ) {
		this.props.onCut( event.clipboardData );
		event.preventDefault();
	}

	render() {
		return null;
	}
}

export default compose( [
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			getBlocksByClientId,
			getMultiSelectedBlockClientIds,
			getSelectedBlockClientId,
			hasMultiSelection,
		} = select( 'core/editor' );
		const { removeBlocks } = dispatch( 'core/editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockClientIds = selectedBlockClientId ? [ selectedBlockClientId ] : getMultiSelectedBlockClientIds();

		return {
			onCopy( dataTransfer ) {
				if ( selectedBlockClientIds.length === 0 ) {
					return;
				}

				// Let native copy behaviour take over in input fields.
				if ( ! hasMultiSelection() && documentHasSelection() ) {
					return;
				}

				const serialized = serialize( getBlocksByClientId( selectedBlockClientIds ) );

				dataTransfer.setData( 'text/plain', serialized );
				dataTransfer.setData( 'text/html', serialized );
			},
			onCut( dataTransfer ) {
				this.onCopy( dataTransfer );

				if ( hasMultiSelection() ) {
					removeBlocks( selectedBlockClientIds );
				}
			},
		};
	} ),
] )( CopyHandler );
