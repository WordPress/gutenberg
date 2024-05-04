/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	DocumentBar,
	PostSavedState,
	PostPreviewButton,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { __unstableMotion as motion } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import PostEditorMoreMenu from './more-menu';
import MainDashboardButton from './main-dashboard-button';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const {
	CollapsableBlockToolbar,
	DocumentTools,
	PostViewLink,
	PreviewDropdown,
	PinnedItems,
	MoreMenu,
	PostPublishButtonOrToggle,
} = unlock( editorPrivateApis );

const slideY = {
	hidden: { y: '-50px' },
	distractionFreeInactive: { y: 0 },
	hover: { y: 0, transition: { type: 'tween', delay: 0.2 } },
};

const slideX = {
	hidden: { x: '-100%' },
	distractionFreeInactive: { x: 0 },
	hover: { x: 0, transition: { type: 'tween', delay: 0.2 } },
};

function Header( { setEntitiesSavedStatesCallback, initialPost } ) {
	const isWideViewport = useViewportMatch( 'large' );
	const isLargeViewport = useViewportMatch( 'medium' );
	const {
		isTextEditor,
		hasActiveMetaboxes,
		isPublishSidebarOpened,
		showIconLabels,
		hasHistory,
		hasFixedToolbar,
	} = useSelect( ( select ) => {
		const { get: getPreference } = select( preferencesStore );
		const { getEditorMode } = select( editorStore );

		return {
			isTextEditor: getEditorMode() === 'text',
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			hasHistory:
				!! select( editorStore ).getEditorSettings()
					.onNavigateToPreviousEntityRecord,
			isPublishSidebarOpened:
				select( editorStore ).isPublishSidebarOpened(),
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
			hasFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
		};
	}, [] );

	const hasTopToolbar = isLargeViewport && hasFixedToolbar;

	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	return (
		<div className="edit-post-header">
			<MainDashboardButton.Slot>
				<motion.div
					variants={ slideX }
					transition={ { type: 'tween', delay: 0.8 } }
				>
					<FullscreenModeClose
						showTooltip
						initialPost={ initialPost }
					/>
				</motion.div>
			</MainDashboardButton.Slot>
			<motion.div
				variants={ slideY }
				transition={ { type: 'tween', delay: 0.8 } }
				className="edit-post-header__toolbar"
			>
				<DocumentTools disableBlockTools={ isTextEditor } />
				{ hasTopToolbar && (
					<CollapsableBlockToolbar
						isCollapsed={ isBlockToolsCollapsed }
						onToggle={ setIsBlockToolsCollapsed }
					/>
				) }
				<div
					className={ clsx( 'edit-post-header__center', {
						'is-collapsed':
							hasHistory &&
							! isBlockToolsCollapsed &&
							hasTopToolbar,
					} ) }
				>
					{ hasHistory && <DocumentBar /> }
				</div>
			</motion.div>
			<motion.div
				variants={ slideY }
				transition={ { type: 'tween', delay: 0.8 } }
				className="edit-post-header__settings"
			>
				{ ! isPublishSidebarOpened && (
					// This button isn't completely hidden by the publish sidebar.
					// We can't hide the whole toolbar when the publish sidebar is open because
					// we want to prevent mounting/unmounting the PostPublishButtonOrToggle DOM node.
					// We track that DOM node to return focus to the PostPublishButtonOrToggle
					// when the publish sidebar has been closed.
					<PostSavedState forceIsDirty={ hasActiveMetaboxes } />
				) }
				<PreviewDropdown forceIsAutosaveable={ hasActiveMetaboxes } />
				<PostPreviewButton
					className="edit-post-header__post-preview-button"
					forceIsAutosaveable={ hasActiveMetaboxes }
				/>
				<PostViewLink />
				<PostPublishButtonOrToggle
					forceIsDirty={ hasActiveMetaboxes }
					setEntitiesSavedStatesCallback={
						setEntitiesSavedStatesCallback
					}
				/>
				{ ( isWideViewport || ! showIconLabels ) && (
					<PinnedItems.Slot scope="core" />
				) }
				<MoreMenu />
				<PostEditorMoreMenu />
			</motion.div>
		</div>
	);
}

export default Header;
