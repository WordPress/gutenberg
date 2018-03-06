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
	isEditorSidebarOpened,
	isPublishSidebarOpened,
	hasMetaBoxes,
	isSavingMetaBoxes,
} from '../../store/selectors';
import {
	openGeneralSidebar,
	closeGeneralSidebar,
	togglePublishSidebar,
} from '../../store/actions';

function Header( {
	isEditorSidebarOpen,
	onOpenGeneralSidebar,
	onCloseGeneralSidebar,
	isPublishSidebarOpen,
	onTogglePublishSidebar,
	hasActiveMetaboxes,
	isSaving,
} ) {
	const toggleGeneralSidebar = isEditorSidebarOpen ? onCloseGeneralSidebar : onOpenGeneralSidebar;

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
					<PostSavedState
						forceIsDirty={ hasActiveMetaboxes }
						forceIsSaving={ isSaving }
					/>
					<PostPreviewButton />
					<PostPublishPanelToggle
						isOpen={ isPublishSidebarOpen }
						onToggle={ onTogglePublishSidebar }
						forceIsDirty={ hasActiveMetaboxes }
						forceIsSaving={ isSaving }
					/>
					<IconButton
						icon="admin-generic"
						onClick={ toggleGeneralSidebar }
						isToggled={ isEditorSidebarOpen }
						label={ __( 'Settings' ) }
						aria-expanded={ isEditorSidebarOpen }
					/>
					<MoreMenu key="more-menu" />
				</div>
			) }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isEditorSidebarOpen: isEditorSidebarOpened( state ),
		isPublishSidebarOpen: isPublishSidebarOpened( state ),
		hasActiveMetaboxes: hasMetaBoxes( state ),
		isSaving: isSavingMetaBoxes( state ),
	} ),
	{
		onOpenGeneralSidebar: () => openGeneralSidebar( 'edit-post/document' ),
		onCloseGeneralSidebar: closeGeneralSidebar,
		onTogglePublishSidebar: togglePublishSidebar,
	},
	undefined,
	{ storeKey: 'edit-post' }
)( Header );
