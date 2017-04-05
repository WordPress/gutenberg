/**
 * External dependencies
 */
import { connect } from 'react-redux';

function VisualEditorBlock( { uid, block, isActive, onChange, onFocus } ) {
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
		<div role="none" onFocus={ onFocus } >
			<BlockEdit
				uid={ uid }
				isActive={ isActive }
				attributes={ block.attributes }
				onChange={ onAttributesChange } />
		</div>
	);
}

const mapStateToProps = ( state, ownProps ) => ( {
	block: state.blocks.byUid[ ownProps.uid ],
	isActive: ownProps.uid === state.blocks.activeUid
} );

const mapDispatchToProps = ( dispatch, ownProps ) => ( {
	onChange( updates ) {
		dispatch( {
			type: 'UPDATE_BLOCK',
			uid: ownProps.uid,
			updates
		} );
	},
	onFocus( ) {
		dispatch( {
			type: 'ACTIVE_BLOCK',
			uid: ownProps.uid
		} );
	}
} );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditorBlock );
