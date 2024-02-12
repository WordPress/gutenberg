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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { PinnedItems } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import {
	Button,
	SVG,
	Path,
	Popover,
	__unstableMotion as motion,
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

const { PostViewLink, PreviewDropdown } = unlock( editorPrivateApis );

export default function HeaderEditMode() {
	const {
		templateType,
		isDistractionFree,
		blockEditorMode,
		blockSelectionStart,
		showIconLabels,
		editorCanvasView,
		hasFixedToolbar,
		isZoomOutMode,
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
			hasFixedToolbar: getPreference( 'core', 'fixedToolbar' ),
			isDistractionFree: getPreference( 'core', 'distractionFree' ),
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );

	const isLargeViewport = useViewportMatch( 'medium' );
	const isTopToolbar = ! isZoomOutMode && hasFixedToolbar && isLargeViewport;
	const blockToolbarRef = useRef();
	const disableMotion = useReducedMotion();

	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();

	const isFocusMode = FOCUSABLE_ENTITIES.includes( templateType );

	const isZoomedOutView = blockEditorMode === 'zoom-out';

	const [ isBlockToolsCollapsed, setIsBlockToolsCollapsed ] =
		useState( true );

	const hasBlockSelected = !! blockSelectionStart;

	const { canvasMode } = useSelect( ( select ) => {
		const { getCanvasMode } = unlock( select( editSiteStore ) );

		return {
			canvasMode: getCanvasMode(),
		};
	}, [] );

	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );

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
					<motion.div
						animate={ { opacity: canvasMode === 'edit' ? 1 : 0 } }
					>
						<Button
							className="edit-site-header-edit-mode__toggle"
							label="Back to admin"
							onClick={ () => setCanvasMode( 'view' ) }
							icon={
								<SVG
									width="26"
									height="16"
									viewBox="0 0 26 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<Path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M19.5 16H25.5V3.86207L17.5 0L9.5 3.86207V16H15.5H19.5ZM19.5 14.5H24V4.80358L17.5 1.66565L11 4.80358V14.5H15.5V9H19.5V14.5Z"
										fill="#1E1E1E"
									/>
									<Path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M3.63974 12L0.221375 8.01191L3.63974 4.02381L4.77863 5L2.19699 8.01191L4.77862 11.0238L3.63974 12Z"
										fill="#1F1F1F"
									/>
								</SVG>
							}
						/>

						<DocumentTools
							blockEditorMode={ blockEditorMode }
							isDistractionFree={ isDistractionFree }
						/>

						{ isTopToolbar && (
							<>
								<div
									className={ classnames(
										'selected-block-tools-wrapper',
										{
											'is-collapsed':
												isBlockToolsCollapsed,
										}
									) }
								>
									<BlockToolbar hideDragHandle />
								</div>
								<Popover.Slot
									ref={ blockToolbarRef }
									name="block-toolbar"
								/>
								{ hasBlockSelected && (
									<Button
										className="edit-site-header-edit-mode__block-tools-toggle"
										icon={
											isBlockToolsCollapsed
												? next
												: previous
										}
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
									/>
								) }
							</>
						) }
					</motion.div>
				</motion.div>
			) }

			{ ! isDistractionFree && (
				<div
					className={ classnames(
						'edit-site-header-edit-mode__center',
						{
							'is-collapsed':
								! isBlockToolsCollapsed && isLargeViewport,
							'is-view-mode': canvasMode === 'view',
						}
					) }
				>
					{ ! hasDefaultEditorCanvasView ? (
						getEditorCanvasContainerTitle( editorCanvasView )
					) : (
						<DocumentBar isNaked={ canvasMode === 'view' } />
					) }
				</div>
			) }

			<div className="edit-site-header-edit-mode__end">
				<motion.div
					animate={ { opacity: canvasMode === 'edit' ? 1 : 0 } }
				>
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
										isFocusMode ||
										! hasDefaultEditorCanvasView
									}
								/>
							</div>
						) }
						<PostViewLink />
						<SaveButton size="compact" />
						{ ! isDistractionFree && (
							<PinnedItems.Slot scope="core/edit-site" />
						) }
						<MoreMenu showIconLabels={ showIconLabels } />
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}
