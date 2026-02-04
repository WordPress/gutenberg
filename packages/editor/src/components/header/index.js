/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMediaQuery, useViewportMatch } from '@wordpress/compose';
import { store as preferencesStore } from '@wordpress/preferences';
import { useState } from '@wordpress/element';
import { PinnedItems } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import CollapsibleBlockToolbar from '../collapsible-block-toolbar';
import DocumentBar from '../document-bar';
import DocumentTools from '../document-tools';
import HeaderSkeleton from './header-skeleton';
import MoreMenu from '../more-menu';
import PostPreviewButton from '../post-preview-button';
import PostPublishButtonOrToggle from '../post-publish-button/post-publish-button-or-toggle';
import PostSavedState from '../post-saved-state';
import PostViewLink from '../post-view-link';
import PreviewDropdown from '../preview-dropdown';
import ZoomOutToggle from '../zoom-out-toggle';
import { store as editorStore } from '../../store';
import {
	ATTACHMENT_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../../store/constants';
import { CollaboratorsPresence } from '../collaborators-presence/index';
import { unlock } from '../../lock-unlock';

function Header( {
	customSaveButton,
	forceIsDirty,
	setEntitiesSavedStatesCallback,
} ) {
	const isWideViewport = useViewportMatch( 'large' );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isTooNarrowForDocumentBar = useMediaQuery( '(max-width: 403px)' );
	const {
		postId,
		postType,
		isTextEditor,
		isPublishSidebarOpened,
		showIconLabels,
		hasFixedToolbar,
		hasBlockSelection,
		hasSectionRootClientId,
		isStylesCanvasActive,
		isAttachment,
	} = useSelect( ( select ) => {
		const { get: getPreference } = select( preferencesStore );
		const {
			getEditorMode,
			getCurrentPostType,
			getCurrentPostId,
			isPublishSidebarOpened: _isPublishSidebarOpened,
		} = select( editorStore );
		const { getStylesPath, getShowStylebook } = unlock(
			select( editorStore )
		);
		const { getBlockSelectionStart, getSectionRootClientId } = unlock(
			select( blockEditorStore )
		);

		return {
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
			isTextEditor: getEditorMode() === 'text',
			isPublishSidebarOpened: _isPublishSidebarOpened(),
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
			hasFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
			hasBlockSelection: !! getBlockSelectionStart(),
			hasSectionRootClientId: !! getSectionRootClientId(),
			isStylesCanvasActive:
				!! getStylesPath()?.startsWith( '/revisions' ) ||
				getShowStylebook(),
			isAttachment:
				getCurrentPostType() === ATTACHMENT_POST_TYPE &&
				window?.__experimentalMediaEditor,
		};
	}, [] );

	const canBeZoomedOut =
		[ 'post', 'page', 'wp_template' ].includes( postType ) &&
		hasSectionRootClientId;

	const disablePreviewOption =
		[
			ATTACHMENT_POST_TYPE,
			NAVIGATION_POST_TYPE,
			TEMPLATE_PART_POST_TYPE,
			PATTERN_POST_TYPE,
		].includes( postType ) || isStylesCanvasActive;

	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	const hasCenter =
		! isTooNarrowForDocumentBar &&
		( ! hasFixedToolbar ||
			( hasFixedToolbar &&
				( ! hasBlockSelection || isBlockToolsCollapsed ) ) );

	return (
		<HeaderSkeleton
			toolbar={
				<>
					{ ! isAttachment && (
						<DocumentTools
							disableBlockTools={
								isStylesCanvasActive || isTextEditor
							}
						/>
					) }
					{ hasFixedToolbar && isLargeViewport && (
						<CollapsibleBlockToolbar
							isCollapsed={ isBlockToolsCollapsed }
							onToggle={ setIsBlockToolsCollapsed }
						/>
					) }
				</>
			}
			center={
				hasCenter ? (
					<>
						<CollaboratorsPresence
							postType={ postType }
							postId={ postId }
						/>
						<DocumentBar />
					</>
				) : undefined
			}
			settings={
				<>
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

					<PostViewLink />

					<PreviewDropdown
						forceIsAutosaveable={ forceIsDirty }
						disabled={ disablePreviewOption }
					/>

					<PostPreviewButton
						className="editor-header__post-preview-button"
						forceIsAutosaveable={ forceIsDirty }
					/>

					{ isWideViewport && canBeZoomedOut && (
						<ZoomOutToggle disabled={ isStylesCanvasActive } />
					) }

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
					{ ! isAttachment && <MoreMenu /> }
				</>
			}
		/>
	);
}

export default Header;
