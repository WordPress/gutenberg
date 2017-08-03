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
import './style.scss';
import Inserter from '../../inserter';
import PublishButton from './publish-button';
import PreviewButton from './preview-button';
import { isEditorSidebarOpened, hasEditorUndo, hasEditorRedo } from '../../selectors';

function Tools( { undo, redo, hasUndo, hasRedo, isSidebarOpened, toggleSidebar } ) {
	return (
		<div className="editor-tools">
			<IconButton
				className="editor-tools__undo"
				icon="undo"
				label={ __( 'Undo' ) }
				disabled={ ! hasUndo }
				onClick={ undo } />
			<IconButton
				className="editor-tools__redo"
				icon="redo"
				label={ __( 'Redo' ) }
				disabled={ ! hasRedo }
				onClick={ redo } />
			<Inserter position="bottom">
				{ __( 'Insert' ) }
			</Inserter>
			<PreviewButton />
			<div className="editor-tools__tabs">
				<IconButton icon="admin-generic" onClick={ toggleSidebar } isToggled={ isSidebarOpened }>
					{ __( 'Settings' ) }
				</IconButton>
			</div>
			<PublishButton />
		</div>
	);
}

export default connect(
	( state ) => ( {
		hasUndo: hasEditorUndo( state ),
		hasRedo: hasEditorRedo( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( Tools );
