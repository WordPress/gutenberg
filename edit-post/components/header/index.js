/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import {
	PostPreviewButton,
	PostSavedState,
	PostPublishPanelToggle,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import MoreMenu from './more-menu';
import HeaderToolbar from './header-toolbar';
import {
	getOpenedGeneralSidebar,
	isPublishSidebarOpened,
} from '../../store/selectors';
import {
	openGeneralSidebar,
	closeGeneralSidebar,
	togglePublishSidebar,
} from '../../store/actions';

function Header( {
	isGeneralSidebarEditorOpen,
	onOpenGeneralSidebar,
	onCloseGeneralSidebar,
	isPublishSidebarOpen,
	onTogglePublishSidebar,
} ) {
	const toggleGeneralSidebar = isGeneralSidebarEditorOpen ? onCloseGeneralSidebar : onOpenGeneralSidebar;

	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="edit-post-header"
			tabIndex="-1"
		>
			<HeaderToolbar />
			{ ! isPublishSidebarOpen && (
				<div className="edit-post-header__settings">
					<PostSavedState />
					<PostPreviewButton />
					<PostPublishPanelToggle
						isOpen={ isPublishSidebarOpen }
						onToggle={ onTogglePublishSidebar }
					/>
					<IconButton
						icon="admin-generic"
						onClick={ toggleGeneralSidebar }
						isToggled={ isGeneralSidebarEditorOpen }
						label={ __( 'Settings' ) }
						aria-expanded={ isGeneralSidebarEditorOpen }
					/>
					<MoreMenu key="more-menu" />
				</div>
			) }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isGeneralSidebarEditorOpen: getOpenedGeneralSidebar( state ) === 'editor',
		isPublishSidebarOpen: isPublishSidebarOpened( state ),
	} ),
	{
		onOpenGeneralSidebar: () => openGeneralSidebar( 'editor' ),
		onCloseGeneralSidebar: closeGeneralSidebar,
		onTogglePublishSidebar: togglePublishSidebar,
	},
	undefined,
	{ storeKey: 'edit-post' }
)( Header );
