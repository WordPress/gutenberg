/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import {
	PostPreviewButton,
	PostSavedState,
	PostPublishPanelToggle,
	PostPublishButton,
} from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { DotTip } from '@wordpress/nux';

/**
 * Internal dependencies
 */
import './style.scss';
import MoreMenu from './more-menu';
import HeaderToolbar from './header-toolbar';
import PinnedPlugins from './pinned-plugins';
import shortcuts from '../../keyboard-shortcuts';

function Header( {
	isEditorSidebarOpened,
	openGeneralSidebar,
	closeGeneralSidebar,
	isPublishSidebarOpened,
	isPublishSidebarEnabled,
	togglePublishSidebar,
	hasActiveMetaboxes,
	isSaving,
} ) {
	const toggleGeneralSidebar = isEditorSidebarOpened ? closeGeneralSidebar : openGeneralSidebar;

	return (
		<div
			role="region"
			/* translators: accessibility text for the top bar landmark region. */
			aria-label={ __( 'Editor top bar' ) }
			className="edit-post-header"
			tabIndex="-1"
		>
			<HeaderToolbar />
			{ ! isPublishSidebarOpened && (
				<div className="edit-post-header__settings">
					<PostSavedState
						forceIsDirty={ hasActiveMetaboxes }
						forceIsSaving={ isSaving }
					/>
					<PostPreviewButton />
					{ isPublishSidebarEnabled ? (
						<PostPublishPanelToggle
							isOpen={ isPublishSidebarOpened }
							onToggle={ togglePublishSidebar }
							forceIsDirty={ hasActiveMetaboxes }
							forceIsSaving={ isSaving }
						/>
					) : (
						<PostPublishButton
							forceIsDirty={ hasActiveMetaboxes }
							forceIsSaving={ isSaving }
						/>
					) }
					<div>
						<IconButton
							icon="admin-generic"
							label={ __( 'Settings' ) }
							onClick={ toggleGeneralSidebar }
							isToggled={ isEditorSidebarOpened }
							aria-expanded={ isEditorSidebarOpened }
							shortcut={ shortcuts.toggleSidebar }
						/>
						<DotTip id="core/editor.settings">
							{ __( 'You’ll find more settings for your page and blocks in the sidebar. Click “Settings” to open it.' ) }
						</DotTip>
					</div>
					<PinnedPlugins.Slot />
					<MoreMenu />
				</div>
			) }
		</div>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		isEditorSidebarOpened: select( 'core/edit-post' ).isEditorSidebarOpened(),
		isPublishSidebarOpened: select( 'core/edit-post' ).isPublishSidebarOpened(),
		isPublishSidebarEnabled: select( 'core/editor' ).isPublishSidebarEnabled(),
		hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
		isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
		hasBlockSelection: !! select( 'core/editor' ).getBlockSelectionStart(),
	} ) ),
	withDispatch( ( dispatch, { hasBlockSelection } ) => {
		const { openGeneralSidebar, closeGeneralSidebar, togglePublishSidebar } = dispatch( 'core/edit-post' );
		const sidebarToOpen = hasBlockSelection ? 'edit-post/block' : 'edit-post/document';
		return {
			openGeneralSidebar: () => openGeneralSidebar( sidebarToOpen ),
			closeGeneralSidebar: closeGeneralSidebar,
			togglePublishSidebar: togglePublishSidebar,
			hasBlockSelection: undefined,
		};
	} ),
)( Header );
