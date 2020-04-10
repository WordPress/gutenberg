/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { PostPreviewButton, PostSavedState } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { cog } from '@wordpress/icons';
import { PinnedItems } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import HeaderToolbar from './header-toolbar';
import MoreMenu from './more-menu';
import PostPublishButtonOrToggle from './post-publish-button-or-toggle';
import PreviewOptions from '../preview-options';

function Header( { onToggleInserter, isInserterOpen } ) {
	const {
		shortcut,
		hasActiveMetaboxes,
		isEditorSidebarOpened,
		isPublishSidebarOpened,
		isSaving,
		getBlockSelectionStart,
	} = useSelect(
		( select ) => ( {
			shortcut: select(
				'core/keyboard-shortcuts'
			).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' ),
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			isEditorSidebarOpened: select(
				'core/edit-post'
			).isEditorSidebarOpened(),
			isPublishSidebarOpened: select(
				'core/edit-post'
			).isPublishSidebarOpened(),
			isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
			getBlockSelectionStart: select( 'core/block-editor' )
				.getBlockSelectionStart,
		} ),
		[]
	);
	const { openGeneralSidebar, closeGeneralSidebar } = useDispatch(
		'core/edit-post'
	);

	const toggleGeneralSidebar = isEditorSidebarOpened
		? closeGeneralSidebar
		: () =>
				openGeneralSidebar(
					getBlockSelectionStart()
						? 'edit-post/block'
						: 'edit-post/document'
				);

	return (
		<div className="edit-post-header">
			<FullscreenModeClose />
			<div className="edit-post-header__toolbar">
				<HeaderToolbar
					onToggleInserter={ onToggleInserter }
					isInserterOpen={ isInserterOpen }
				/>
			</div>
			<div className="edit-post-header__settings">
				{ ! isPublishSidebarOpened && (
					// This button isn't completely hidden by the publish sidebar.
					// We can't hide the whole toolbar when the publish sidebar is open because
					// we want to prevent mounting/unmounting the PostPublishButtonOrToggle DOM node.
					// We track that DOM node to return focus to the PostPublishButtonOrToggle
					// when the publish sidebar has been closed.
					<PostSavedState
						forceIsDirty={ hasActiveMetaboxes }
						forceIsSaving={ isSaving }
					/>
				) }
				<PreviewOptions
					forceIsAutosaveable={ hasActiveMetaboxes }
					forcePreviewLink={ isSaving ? null : undefined }
				/>
				<PostPreviewButton
					forceIsAutosaveable={ hasActiveMetaboxes }
					forcePreviewLink={ isSaving ? null : undefined }
				/>
				<PostPublishButtonOrToggle
					forceIsDirty={ hasActiveMetaboxes }
					forceIsSaving={ isSaving }
				/>
				<Button
					icon={ cog }
					label={ __( 'Settings' ) }
					onClick={ toggleGeneralSidebar }
					isPressed={ isEditorSidebarOpened }
					aria-expanded={ isEditorSidebarOpened }
					shortcut={ shortcut }
				/>
				<PinnedItems.Slot scope="core/edit-post" />
				<MoreMenu />
			</div>
		</div>
	);
}

export default Header;
