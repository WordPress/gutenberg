/**
 * External dependencies
 */
import { connect } from 'react-redux';

function VisualEditorBlock( { uid, block, isActive, activeRect, onChange, onFocus } ) {
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
		<div role="presentation" onFocus={ onFocus } >
			<BlockEdit
				uid={ uid }
				isActive={ isActive }
				activeRect={ activeRect }
				attributes={ block.attributes }
				onChange={ onAttributesChange } />
		</div>
	);
}

const mapStateToProps = ( state, ownProps ) => ( {
	block: state.blocks.byUid[ ownProps.uid ],
	isActive: ownProps.uid === state.blocks.activeUid,
	activeRect: state.blocks.activeRect
} );

const mapDispatchToProps = ( dispatch, ownProps ) => ( {
	onChange( updates ) {
		dispatch( {
			type: 'UPDATE_BLOCK',
			uid: ownProps.uid,
			updates
		} );
	},
	onFocus( e ) {
		dispatch( {
			type: 'ACTIVE_BLOCK',
			uid: ownProps.uid,
			activeRect: e.target.getBoundingClientRect()
		} );
	}
} );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditorBlock );
