/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { documentHasSelection } from '@wordpress/dom';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

function CopyHandler( { children, onCopy, onCut } ) {
	return (
		<div onCopy={ onCopy } onCut={ onCut }>
			{ children }
		</div>
	);
}

export default compose( [
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			getBlocksByClientId,
			getSelectedBlockClientIds,
			hasMultiSelection,
		} = select( 'core/block-editor' );
		const { removeBlocks } = dispatch( 'core/block-editor' );

		const onCopy = ( event ) => {
			const selectedBlockClientIds = getSelectedBlockClientIds();

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
					const selectedBlockClientIds = getSelectedBlockClientIds();

					removeBlocks( selectedBlockClientIds );
				}
			},
		};
	} ),
] )( CopyHandler );
