/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useViewportMatch, useReducedMotion } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __unstableMotion as motion } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DocumentBar,
	PostSavedState,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SiteEditorMoreMenuItems from './more-menu';
import SaveButton from '../save-button';
import DocumentTools from './document-tools';
import { store as editSiteStore } from '../../store';
import {
	getEditorCanvasContainerTitle,
	useHasEditorCanvasContainer,
} from '../editor-canvas-container';
import { unlock } from '../../lock-unlock';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';

const {
	CollapsableBlockToolbar,
	MoreMenu,
	PostViewLink,
	PreviewDropdown,
	PinnedItems,
	PostPublishButtonOrToggle,
} = unlock( editorPrivateApis );

export default function HeaderEditMode( { setEntitiesSavedStatesCallback } ) {
	const {
		templateType,
		isDistractionFree,
		blockEditorMode,
		showIconLabels,
		editorCanvasView,
		isFixedToolbar,
		isPublishSidebarOpened,
	} = useSelect( ( select ) => {
		const { getEditedPostType } = select( editSiteStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { get: getPreference } = select( preferencesStore );
		const { getDeviceType } = select( editorStore );

		return {
			deviceType: getDeviceType(),
			templateType: getEditedPostType(),
			blockEditorMode: __unstableGetEditorMode(),
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
			editorCanvasView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			isDistractionFree: getPreference( 'core', 'distractionFree' ),
			isFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
			isPublishSidebarOpened:
				select( editorStore ).isPublishSidebarOpened(),
		};
	}, [] );

	const isLargeViewport = useViewportMatch( 'medium' );
	const showTopToolbar =
		isLargeViewport && isFixedToolbar && blockEditorMode !== 'zoom-out';
	const disableMotion = useReducedMotion();

	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();

	const isFocusMode = FOCUSABLE_ENTITIES.includes( templateType );

	const isZoomedOutView = blockEditorMode === 'zoom-out';

	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	const toolbarVariants = {
		isDistractionFree: { y: '-50px' },
		isDistractionFreeHovering: { y: 0 },
		view: { y: 0 },
		edit: { y: 0 },
	};

	const toolbarTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : 0.2,
		ease: 'easeOut',
	};

	const _isPreviewingTheme = isPreviewingTheme();
	return (
		<div
			className={ clsx( 'edit-site-header-edit-mode', {
				'show-icon-labels': showIconLabels,
				'show-block-toolbar': ! isBlockToolsCollapsed && showTopToolbar,
			} ) }
		>
			{ hasDefaultEditorCanvasView && (
				<motion.div
					className="edit-site-header-edit-mode__start"
					variants={ toolbarVariants }
					transition={ toolbarTransition }
				>
					<DocumentTools
						blockEditorMode={ blockEditorMode }
						isDistractionFree={ isDistractionFree }
					/>
					{ showTopToolbar && (
						<CollapsableBlockToolbar
							isCollapsed={ isBlockToolsCollapsed }
							onToggle={ setIsBlockToolsCollapsed }
						/>
					) }
				</motion.div>
			) }

			{ ! isDistractionFree && (
				<div className="edit-site-header-edit-mode__center">
					{ ! hasDefaultEditorCanvasView ? (
						getEditorCanvasContainerTitle( editorCanvasView )
					) : (
						<DocumentBar />
					) }
				</div>
			) }

			<div className="edit-site-header-edit-mode__end">
				<motion.div
					className="edit-site-header-edit-mode__actions"
					variants={ toolbarVariants }
					transition={ toolbarTransition }
				>
					{ isLargeViewport && (
						<div
							className={ clsx(
								'edit-site-header-edit-mode__preview-options',
								{ 'is-zoomed-out': isZoomedOutView }
							) }
						>
							<PreviewDropdown
								disabled={
									isFocusMode || ! hasDefaultEditorCanvasView
								}
							/>
						</div>
					) }
					<PostViewLink />
					{
						// TODO: For now we conditionally render the Save/Publish buttons based on
						// some specific site editor extra handling. Examples are when we're previewing
						// a theme, handling of global styles changes or when we're in 'view' mode,
						// which opens the save panel in a Modal.
					 }
					{ ! _isPreviewingTheme && ! isPublishSidebarOpened && (
						// This button isn't completely hidden by the publish sidebar.
						// We can't hide the whole toolbar when the publish sidebar is open because
						// we want to prevent mounting/unmounting the PostPublishButtonOrToggle DOM node.
						// We track that DOM node to return focus to the PostPublishButtonOrToggle
						// when the publish sidebar has been closed.
						<PostSavedState />
					) }
					{ ! _isPreviewingTheme && (
						<PostPublishButtonOrToggle
							setEntitiesSavedStatesCallback={
								setEntitiesSavedStatesCallback
							}
						/>
					) }
					{ _isPreviewingTheme && <SaveButton size="compact" /> }
					{ ! isDistractionFree && <PinnedItems.Slot scope="core" /> }
					<MoreMenu />
					<SiteEditorMoreMenuItems />
				</motion.div>
			</div>
		</div>
	);
}
