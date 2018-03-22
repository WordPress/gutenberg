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
import { hasEditorRedo } from '../../store/selectors';

function EditorHistoryRedo( { hasRedo, redo } ) {
	return (
		<IconButton
			icon="redo"
			label={ __( 'Redo' ) }
			disabled={ ! hasRedo }
			onClick={ redo }
			className="editor-history__undo"
		/>
	);
}

export default connect(
	( state ) => ( {
		hasRedo: hasEditorRedo( state ),
	} ),
	( dispatch ) => ( {
		redo: () => dispatch( { type: 'REDO' } ),
	} )
)( EditorHistoryRedo );
