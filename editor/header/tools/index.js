/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from '../mode-switcher';
import SavedState from '../saved-state';
import Inserter from '../../inserter';
import PublishButton from './publish-button';
import PreviewButton from './preview-button';
import { isEditorSidebarOpened, hasEditorUndo, hasEditorRedo } from '../../selectors';

function Tools( { undo, redo, hasUndo, hasRedo, isSidebarOpened, toggleSidebar } ) {
	return (
		<div className="editor-tools">
			<PublishButton />
			<SavedState />
			<PreviewButton />
			<Inserter position="bottom">
				{ __( 'Insert' ) }
			</Inserter>
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
			<ModeSwitcher />
			<div className="editor-tools__tabs">
				<IconButton icon="admin-generic" onClick={ toggleSidebar } isToggled={ isSidebarOpened }>
					{ __( 'Settings' ) }
				</IconButton>
			</div>
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
