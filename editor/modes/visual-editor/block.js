/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

function VisualEditorBlock( { block, onChange, onFocus, onBlur, isSelected } ) {
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

	const className = classnames( 'editor-visual-editor__block', {
		'is-selected': isSelected
	} );

	return (
		<div
			tabIndex="0"
			onFocus={ onFocus }
			onBlur={ onBlur }
			className={ className }
		>
			<BlockEdit
				attributes={ block.attributes }
				onChange={ onAttributesChange } />
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		block: state.blocks.byUid[ ownProps.uid ],
		isSelected: ownProps.uid === state.selectedBlockUid
	} ),
	( dispatch, ownProps ) => ( {
		onChange( updates ) {
			dispatch( {
				type: 'UPDATE_BLOCK',
				uid: ownProps.uid,
				updates
			} );
		},
		onFocus() {
			dispatch( {
				type: 'SELECT_BLOCK',
				uid: ownProps.uid
			} );
		},
		onBlur() {
			dispatch( {
				type: 'CLEAR_SELECTED_BLOCK'
			} );
		}
	} )
)( VisualEditorBlock );
