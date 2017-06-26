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
import SavedState from './saved-state';
import PublishButton from './publish-button';
import PreviewButton from './preview-button';
import ModeSwitcher from './mode-switcher';
import Inserter from '../inserter';
import { hasEditorUndo, hasEditorRedo, isEditorSidebarOpened } from '../selectors';

function Header( {
	undo,
	redo,
	hasRedo,
	hasUndo,
	toggleSidebar,
	isSidebarOpened,
} ) {
	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="editor-header"
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
			</div>
			<div className="editor-header__settings">
				<SavedState />
				<PreviewButton />
				<PublishButton />
				<IconButton
					icon="admin-generic"
					onClick={ toggleSidebar }
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
		toggleSidebar: () => dispatch( { type: 'TOGGLE_SIDEBAR' } ),
	} )
)( Header );
