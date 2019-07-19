/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import {
	ViewEditingModePicker,
} from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { DotTip } from '@wordpress/nux';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import HeaderToolbar from './header-toolbar';
import MoreMenu from './more-menu';
import PinnedPlugins from './pinned-plugins';
import PublishControls from './publish-controls';
import shortcuts from '../../keyboard-shortcuts';

function Header( {
	closeGeneralSidebar,
	isEditorSidebarOpened,
	openGeneralSidebar,
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
			<div className="edit-post-header__toolbar">
				<FullscreenModeClose />
				<HeaderToolbar />
			</div>
			<div className="edit-post-header__settings">
				<ViewEditingModePicker />
				<PublishControls />
				<div>
					<IconButton
						icon="admin-generic"
						label={ __( 'Settings' ) }
						onClick={ toggleGeneralSidebar }
						isToggled={ isEditorSidebarOpened }
						aria-expanded={ isEditorSidebarOpened }
						shortcut={ shortcuts.toggleSidebar }
					/>
					<DotTip tipId="core/editor.settings">
						{ __( 'You’ll find more settings for your page and blocks in the sidebar. Click the cog icon to toggle the sidebar open and closed.' ) }
					</DotTip>
				</div>
				<PinnedPlugins.Slot />
				<MoreMenu />
			</div>
		</div>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		isEditorSidebarOpened: select( 'core/edit-post' ).isEditorSidebarOpened(),
	} ) ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const { getBlockSelectionStart } = select( 'core/block-editor' );
		const { openGeneralSidebar, closeGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			openGeneralSidebar: () => openGeneralSidebar( getBlockSelectionStart() ? 'edit-post/block' : 'edit-post/document' ),
			closeGeneralSidebar,
		};
	} ),
)( Header );
