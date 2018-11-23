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
		const serialized = serialize( this.props.getSelectedBlocks() );

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
			hasMultiSelection,
		} = select( 'core/editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockClientIds = selectedBlockClientId ? [ selectedBlockClientId ] : getMultiSelectedBlockClientIds();

		return {
			hasMultiSelection: hasMultiSelection(),
			selectedBlockClientIds,
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const { getBlocksByClientId } = select( 'core/editor' );
		const { removeBlocks } = dispatch( 'core/editor' );

		return {
			getSelectedBlocks: function() {
				const { hasMultiSelection, selectedBlockClientIds } = ownProps;

				if ( selectedBlockClientIds.length === 0 ) {
					return;
				}

				// Let native copy behaviour take over in input fields.
				if ( ! hasMultiSelection && documentHasSelection() ) {
					return;
				}

				return serialize( getBlocksByClientId( selectedBlockClientIds ) );
			},
			onRemove: removeBlocks,
		};
	} ),
] )( CopyHandler );
