/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMediaQuery, useViewportMatch } from '@wordpress/compose';
import { __unstableMotion as motion } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { useState } from '@wordpress/element';
import { PinnedItems } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import BackButton, { useHasBackButton } from './back-button';
import CollapsibleBlockToolbar from '../collapsible-block-toolbar';
import DocumentBar from '../document-bar';
import DocumentTools from '../document-tools';
import MoreMenu from '../more-menu';
import PostPreviewButton from '../post-preview-button';
import PostPublishButtonOrToggle from '../post-publish-button/post-publish-button-or-toggle';
import PostSavedState from '../post-saved-state';
import PostViewLink from '../post-view-link';
import PreviewDropdown from '../preview-dropdown';
import ZoomOutToggle from '../zoom-out-toggle';
import { store as editorStore } from '../../store';

const toolbarVariations = {
	distractionFreeDisabled: { y: '-50px' },
	distractionFreeHover: { y: 0 },
	distractionFreeHidden: { y: '-50px' },
	visible: { y: 0 },
	hidden: { y: 0 },
};

const backButtonVariations = {
	distractionFreeDisabled: { x: '-100%' },
	distractionFreeHover: { x: 0 },
	distractionFreeHidden: { x: '-100%' },
	visible: { x: 0 },
	hidden: { x: 0 },
};

function Header( {
	customSaveButton,
	forceIsDirty,
	forceDisableBlockTools,
	setEntitiesSavedStatesCallback,
	title,
	isEditorIframed,
} ) {
	const isWideViewport = useViewportMatch( 'large' );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isTooNarrowForDocumentBar = useMediaQuery( '(max-width: 403px)' );
	const {
		isTextEditor,
		isPublishSidebarOpened,
		showIconLabels,
		hasFixedToolbar,
		isNestedEntity,
		postType,
	} = useSelect( ( select ) => {
		const { get: getPreference } = select( preferencesStore );
		const {
			getEditorMode,
			getEditorSettings,
			getCurrentPostType,
			isPublishSidebarOpened: _isPublishSidebarOpened,
		} = select( editorStore );

		return {
			postType: getCurrentPostType(),
			isTextEditor: getEditorMode() === 'text',
			isPublishSidebarOpened: _isPublishSidebarOpened(),
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
			hasFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
			isNestedEntity:
				!! getEditorSettings().onNavigateToPreviousEntityRecord,
		};
	}, [] );

	const canBeZoomedOut = [ 'post', 'page', 'wp_template' ].includes(
		postType
	);

	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	const hasCenter = isBlockToolsCollapsed && ! isTooNarrowForDocumentBar;
	const hasBackButton = useHasBackButton();
	/*
	 * The edit-post-header classname is only kept for backward compatability
	 * as some plugins might be relying on its presence.
	 */
	return (
		<div className="editor-header edit-post-header">
			{ hasBackButton && (
				<motion.div
					className="editor-header__back-button"
					variants={ backButtonVariations }
					transition={ { type: 'tween' } }
				>
					<BackButton.Slot />
				</motion.div>
			) }
			<motion.div
				variants={ toolbarVariations }
				className="editor-header__toolbar"
				transition={ { type: 'tween' } }
			>
				<DocumentTools
					disableBlockTools={ forceDisableBlockTools || isTextEditor }
				/>
				{ hasFixedToolbar && isLargeViewport && (
					<CollapsibleBlockToolbar
						isCollapsed={ isBlockToolsCollapsed }
						onToggle={ setIsBlockToolsCollapsed }
					/>
				) }
			</motion.div>
			{ hasCenter && (
				<motion.div
					className="editor-header__center"
					variants={ toolbarVariations }
					transition={ { type: 'tween' } }
				>
					<DocumentBar title={ title } />
				</motion.div>
			) }
			<motion.div
				variants={ toolbarVariations }
				transition={ { type: 'tween' } }
				className="editor-header__settings"
			>
				{ ! customSaveButton && ! isPublishSidebarOpened && (
					/*
					 * This button isn't completely hidden by the publish sidebar.
					 * We can't hide the whole toolbar when the publish sidebar is open because
					 * we want to prevent mounting/unmounting the PostPublishButtonOrToggle DOM node.
					 * We track that DOM node to return focus to the PostPublishButtonOrToggle
					 * when the publish sidebar has been closed.
					 */
					<PostSavedState forceIsDirty={ forceIsDirty } />
				) }

				{ canBeZoomedOut && isEditorIframed && isWideViewport && (
					<ZoomOutToggle />
				) }

				<PreviewDropdown
					forceIsAutosaveable={ forceIsDirty }
					disabled={ isNestedEntity }
				/>
				<PostPreviewButton
					className="editor-header__post-preview-button"
					forceIsAutosaveable={ forceIsDirty }
				/>
				<PostViewLink />

				{ ( isWideViewport || ! showIconLabels ) && (
					<PinnedItems.Slot scope="core" />
				) }

				{ ! customSaveButton && (
					<PostPublishButtonOrToggle
						forceIsDirty={ forceIsDirty }
						setEntitiesSavedStatesCallback={
							setEntitiesSavedStatesCallback
						}
					/>
				) }

				{ customSaveButton }
				<MoreMenu />
			</motion.div>
		</div>
	);
}

export default Header;
