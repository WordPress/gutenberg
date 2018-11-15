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
		const { hasMultiSelection, selectedBlockClientIds, getBlocksByClientId } = this.props;

		if ( selectedBlockClientIds.length === 0 ) {
			return;
		}

		// Let native copy behaviour take over in input fields.
		if ( ! hasMultiSelection && documentHasSelection() ) {
			return;
		}

		const serialized = serialize( getBlocksByClientId( selectedBlockClientIds ) );

		event.clipboardData.setData( 'text/plain', serialized );
		event.clipboardData.setData( 'text/html', serialized );

		event.preventDefault();
	}

	onCut( event ) {
		const { hasMultiSelection, selectedBlockClientIds } = this.props;

		this.onCopy( event );

		if ( hasMultiSelection ) {
			this.props.onRemove( selectedBlockClientIds );
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
			getBlocksByClientId,
			hasMultiSelection,
		} = select( 'core/editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockClientIds = selectedBlockClientId ? [ selectedBlockClientId ] : getMultiSelectedBlockClientIds();

		return {
			hasMultiSelection: hasMultiSelection(),
			selectedBlockClientIds,

			// We only care about this value when the copy is performed
			// We call it dynamically in the event handler to avoid unnecessary re-renders.
			getBlocksByClientId,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onRemove: dispatch( 'core/editor' ).removeBlocks,
	} ) ),
] )( CopyHandler );
