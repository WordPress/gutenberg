/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { serialize } from '@wordpress/blocks';
import { documentHasSelection } from '@wordpress/dom';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

class CopyHandler extends Component {
	componentDidMount() {
		document.addEventListener( 'copy', this.props.onCopy );
		document.addEventListener( 'cut', this.props.onCut );
	}

	componentWillUnmount() {
		document.removeEventListener( 'copy', this.props.onCopy );
		document.removeEventListener( 'cut', this.props.onCut );
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
			onCopy( event ) {
				if ( selectedBlockClientIds.length === 0 ) {
					return;
				}

				// Let native copy behaviour take over in input fields.
				if ( ! hasMultiSelection() && documentHasSelection() ) {
					return;
				}

				const serialized = serialize( getBlocksByClientId( selectedBlockClientIds ) );

				event.clipboardData.setData( 'text/plain', serialized );
				event.clipboardData.setData( 'text/html', serialized );

				event.preventDefault();
			},
			onCut( event ) {
				this.onCopy( event );

				if ( hasMultiSelection() ) {
					removeBlocks( selectedBlockClientIds );
				}
			},
		};
	} ),
] )( CopyHandler );
