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
import PublishWithDropdown from './publish-with-dropdown';
import PreviewButton from './preview-button';
import ModeSwitcher from './mode-switcher';
import HeaderToolbar from './header-toolbar';
import { isEditorSidebarOpened } from '../selectors';
import { toggleSidebar } from '../actions';

function Header( { onToggleSidebar, isSidebarOpened } ) {
	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="editor-header"
			tabIndex="-1"
		>
			<HeaderToolbar />
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
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch ) => ( {
		onToggleSidebar: () => dispatch( toggleSidebar() ),
	} )
)( Header );
