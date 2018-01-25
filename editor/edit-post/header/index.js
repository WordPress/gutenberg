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
import {
	PostPreviewButton,
	PostSavedState,
	PostPublishPanelToggle,
} from '../../components';
import EllipsisMenu from './ellipsis-menu';
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

function Header( { isGeneralSidebarEditorOpen, isPublishSidebarOpen, onOpenGeneralSidebar, onCloseGeneralSidebar, onTogglePublishSidebar } ) {
	const toggleGeneralSidebar = isGeneralSidebarEditorOpen ? onCloseGeneralSidebar : onOpenGeneralSidebar;

	return (
		<div
			role="region"
			aria-label={ __( 'Editor toolbar' ) }
			className="editor-header"
			tabIndex="-1"
		>
			<HeaderToolbar />
			{ ! isPublishSidebarOpen && (
				<div className="editor-header__settings">
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
					<EllipsisMenu key="ellipsis-menu" />
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
)( Header );
