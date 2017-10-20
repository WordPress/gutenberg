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
import SavedState from './saved-state';
import PublishWithDropdown from './publish-with-dropdown';
import PreviewButton from './preview-button';
import ModeSwitcher from './mode-switcher';
import Inserter from '../inserter';
import { hasEditorUndo, hasEditorRedo, isEditorSidebarOpened } from '../selectors';
import { toggleSidebar } from '../actions';

function Header( {
	undo,
	redo,
	hasRedo,
	hasUndo,
	onToggleSidebar,
	isSidebarOpened,
} ) {
	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="editor-header"
			tabIndex="-1"
		>
			<div className="editor-header__content-tools">
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
				<div className="editor-header__block-toolbar">
					<Slot name="Editor.Header" />
				</div>
			</div>
			<div className="editor-header__settings">
				<SavedState />
				<PreviewButton />
				<PublishWithDropdown />
				<IconButton
					icon="admin-generic"
					onClick={ onToggleSidebar }
					isToggled={ isSidebarOpened }
					label={ __( 'Settings' ) }
				/>
				<ModeSwitcher />
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
		onToggleSidebar: () => dispatch( toggleSidebar() ),
	} )
)( Header );
