/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { hasEditorUndo } from '../../store/selectors';

function EditorHistoryUndo( { hasUndo, undo } ) {
	return (
		<IconButton
			icon="undo"
			label={ __( 'Undo' ) }
			disabled={ ! hasUndo }
			onClick={ undo }
			className="editor-history__undo"
		/>
	);
}

export default connect(
	( state ) => ( {
		hasUndo: hasEditorUndo( state ),
	} ),
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
	} )
)( EditorHistoryUndo );
