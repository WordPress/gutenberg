/**
 * External dependencies
 */
import { connect } from 'react-redux';

function VisualEditorBlock( { block, onChange } ) {
	const settings = wp.blocks.getBlockSettings( block.blockType );

	let BlockEdit;
	if ( settings ) {
		BlockEdit = settings.edit || settings.save;
	}

	if ( ! BlockEdit ) {
		return null;
	}

	function onAttributesChange( attributes ) {
		onChange( {
			attributes: {
				...block.attributes,
				...attributes
			}
		} );
	}

	return (
		<BlockEdit
			attributes={ block.attributes }
			onChange={ onAttributesChange } />
	);
}

export default connect(
	( state, ownProps ) => ( {
		block: state.blocks.byUid[ ownProps.uid ]
	} ),
	( dispatch, ownProps ) => ( {
		onChange( updates ) {
			dispatch( {
				type: 'UPDATE_BLOCK',
				uid: ownProps.uid,
				updates
			} );
		}
	} )
)( VisualEditorBlock );
