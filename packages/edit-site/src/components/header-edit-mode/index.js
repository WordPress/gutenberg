/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useViewportMatch, useReducedMotion } from '@wordpress/compose';
import {
	BlockToolbar,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import {
	Button,
	__unstableMotion as motion,
	Popover,
} from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DocumentBar,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import SaveButton from '../save-button';
import DocumentTools from './document-tools';
import { store as editSiteStore } from '../../store';
import {
	getEditorCanvasContainerTitle,
	useHasEditorCanvasContainer,
} from '../editor-canvas-container';
import { unlock } from '../../lock-unlock';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';

const { useHasBlockToolbar } = unlock( blockEditorPrivateApis );
const { PostViewLink, PreviewDropdown, PinnedItems } =
	unlock( editorPrivateApis );

export default function HeaderEditMode() {
	const {
		templateType,
		isDistractionFree,
		blockEditorMode,
		blockSelectionStart,
		showIconLabels,
		editorCanvasView,
		isFixedToolbar,
	} = useSelect( ( select ) => {
		const { getEditedPostType } = select( editSiteStore );
		const { getBlockSelectionStart, __unstableGetEditorMode } =
			select( blockEditorStore );
		const { get: getPreference } = select( preferencesStore );
		const { getDeviceType } = select( editorStore );

		return {
			deviceType: getDeviceType(),
			templateType: getEditedPostType(),
			blockEditorMode: __unstableGetEditorMode(),
			blockSelectionStart: getBlockSelectionStart(),
			showIconLabels: getPreference( 'core', 'showIconLabels' ),
			editorCanvasView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			isDistractionFree: getPreference( 'core', 'distractionFree' ),
			isFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
		};
	}, [] );

	const isLargeViewport = useViewportMatch( 'medium' );
	const hasBlockToolbar = useHasBlockToolbar();
	const hasFixedToolbar = hasBlockToolbar && isFixedToolbar;
	const showTopToolbar =
		isLargeViewport && hasFixedToolbar && blockEditorMode !== 'zoom-out';
	const blockToolbarRef = useRef();
	const disableMotion = useReducedMotion();

	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();

	const isFocusMode = FOCUSABLE_ENTITIES.includes( templateType );

	const isZoomedOutView = blockEditorMode === 'zoom-out';

	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	useEffect( () => {
		// If we have a new block selection, show the block tools
		if ( blockSelectionStart ) {
			setIsBlockToolsCollapsed( false );
		}
	}, [ blockSelectionStart ] );

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

	return (
		<div
			className={ classnames( 'edit-site-header-edit-mode', {
				'show-icon-labels': showIconLabels,
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
						<>
							<div
								className={ classnames(
									'selected-block-tools-wrapper',
									{
										'is-collapsed': isBlockToolsCollapsed,
									}
								) }
							>
								<BlockToolbar hideDragHandle />
							</div>
							<Popover.Slot
								ref={ blockToolbarRef }
								name="block-toolbar"
							/>
							<Button
								className="edit-site-header-edit-mode__block-tools-toggle"
								icon={ isBlockToolsCollapsed ? next : previous }
								onClick={ () => {
									setIsBlockToolsCollapsed(
										( collapsed ) => ! collapsed
									);
								} }
								label={
									isBlockToolsCollapsed
										? __( 'Show block tools' )
										: __( 'Hide block tools' )
								}
								size="compact"
							/>
						</>
					) }
				</motion.div>
			) }

			{ ! isDistractionFree && (
				<div
					className={ classnames(
						'edit-site-header-edit-mode__center',
						{
							'is-collapsed':
								! isBlockToolsCollapsed && showTopToolbar,
						}
					) }
				>
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
							className={ classnames(
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
					<SaveButton size="compact" />
					{ ! isDistractionFree && <PinnedItems.Slot scope="core" /> }
					<MoreMenu showIconLabels={ showIconLabels } />
				</motion.div>
			</div>
		</div>
	);
}
