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

		this.onCopy = ( event ) => this.props.onCopy( event );
		this.onCut = ( event ) => this.props.onCut( event );
	}

	componentDidMount() {
		document.addEventListener( 'copy', this.onCopy );
		document.addEventListener( 'cut', this.onCut );
	}

	componentWillUnmount() {
		document.removeEventListener( 'copy', this.onCopy );
		document.removeEventListener( 'cut', this.onCut );
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

		const onCopy = ( event ) => {
			const selectedBlockClientIds = getSelectedBlockClientId() ?
				[ getSelectedBlockClientId() ] :
				getMultiSelectedBlockClientIds();

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
		};

		return {
			onCopy,
			onCut( event ) {
				onCopy( event );

				if ( hasMultiSelection() ) {
					const selectedBlockClientIds = getSelectedBlockClientId() ?
						[ getSelectedBlockClientId() ] :
						getMultiSelectedBlockClientIds();

					removeBlocks( selectedBlockClientIds );
				}
			},
		};
	} ),
] )( CopyHandler );
