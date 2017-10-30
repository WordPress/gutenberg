/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import { hasEditorUndo, hasEditorRedo } from '../../selectors';

function HeaderToolbar( { hasUndo, hasRedo, undo, redo } ) {
	return (
		<div className="editor-header-toolbar">
			<Inserter position="bottom right" />
			<IconButton
				icon="undo"
				label={ __( 'Undo' ) }
				disabled={ ! hasUndo }
				onClick={ undo } />
			<IconButton
				icon="redo"
				label={ __( 'Redo' ) }
				disabled={ ! hasRedo }
				onClick={ redo } />
			<div className="editor-header-toolbar__block-toolbar">
				<Slot name="Editor.Header" />
			</div>
		</div>
	);
}

export default connect(
	( state ) => ( {
		hasUndo: hasEditorUndo( state ),
		hasRedo: hasEditorRedo( state ),
	} ),
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
	} )
)( HeaderToolbar );
