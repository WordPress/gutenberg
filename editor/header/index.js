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
import PublishToggle from './publish-toggle';
import PreviewButton from './preview-button';
import ModeSwitcher from './mode-switcher';
import HeaderToolbar from './header-toolbar';
import { getActivePanel } from '../selectors';
import { setActivePanel } from '../actions';

function Header( { panel, closeSidebar, showPostSettings } ) {
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
				<PublishToggle />
				<IconButton
					icon="admin-generic"
					onClick={ panel === 'document' ? closeSidebar : showPostSettings }
					isToggled={ panel === 'document' }
					label={ __( 'Settings' ) }
				/>
				<ModeSwitcher />
			</div>
		</div>
	);
}

export default connect(
	( state ) => ( {
		panel: getActivePanel( state ),
	} ),
	{
		closeSidebar: () => setActivePanel( null ),
		showPostSettings: () => setActivePanel( 'document' ),
	}
)( Header );
