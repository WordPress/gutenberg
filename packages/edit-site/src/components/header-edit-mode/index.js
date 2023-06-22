/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch, useReducedMotion } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import {
	ToolSelector,
	__experimentalPreviewOptions as PreviewOptions,
	NavigableToolbar,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x, __ } from '@wordpress/i18n';
import { listView, plus, external, chevronUpDown } from '@wordpress/icons';
import {
	__unstableMotion as motion,
	Button,
	ToolbarItem,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
} from '@wordpress/components';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import DocumentActions from './document-actions';
import { store as editSiteStore } from '../../store';
import {
	getEditorCanvasContainerTitle,
	useHasEditorCanvasContainer,
} from '../editor-canvas-container';
import { unlock } from '../../lock-unlock';

const { useShouldContextualToolbarShow } = unlock( blockEditorPrivateApis );

const preventDefault = ( event ) => {
	event.preventDefault();
};

export default function HeaderEditMode() {
	const inserterButton = useRef();
	const {
		deviceType,
		templateType,
		isInserterOpen,
		isListViewOpen,
		listViewShortcut,
		isVisualMode,
		isDistractionFree,
		blockEditorMode,
		homeUrl,
		showIconLabels,
		editorCanvasView,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			getEditedPostType,
			isInserterOpened,
			isListViewOpened,
			getEditorMode,
		} = select( editSiteStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );

		const postType = getEditedPostType();

		const {
			getUnstableBase, // Site index.
		} = select( coreStore );

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			templateType: postType,
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			listViewShortcut: getShortcutRepresentation(
				'core/edit-site/toggle-list-view'
			),
			isVisualMode: getEditorMode() === 'visual',
			blockEditorMode: __unstableGetEditorMode(),
			homeUrl: getUnstableBase()?.home,
			showIconLabels: select( preferencesStore ).get(
				'core/edit-site',
				'showIconLabels'
			),
			editorCanvasView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			isDistractionFree: select( preferencesStore ).get(
				'core/edit-site',
				'distractionFree'
			),
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
		setIsListViewOpened,
	} = useDispatch( editSiteStore );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const disableMotion = useReducedMotion();

	const isLargeViewport = useViewportMatch( 'medium' );

	const toggleInserter = useCallback( () => {
		if ( isInserterOpen ) {
			// Focusing the inserter button should close the inserter popover.
			// However, there are some cases it won't close when the focus is lost.
			// See https://github.com/WordPress/gutenberg/issues/43090 for more details.
			inserterButton.current.focus();
			setIsInserterOpened( false );
		} else {
			setIsInserterOpened( true );
		}
	}, [ isInserterOpen, setIsInserterOpened ] );

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	const {
		shouldShowContextualToolbar,
		canFocusHiddenToolbar,
		fixedToolbarCanBeFocused,
	} = useShouldContextualToolbarShow();
	// If there's a block toolbar to be focused, disable the focus shortcut for the document toolbar.
	// There's a fixed block toolbar when the fixed toolbar option is enabled or when the browser width is less than the large viewport.
	const blockToolbarCanBeFocused =
		shouldShowContextualToolbar ||
		canFocusHiddenToolbar ||
		fixedToolbarCanBeFocused;

	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();

	const isFocusMode =
		templateType === 'wp_template_part' || templateType === 'wp_navigation';

	/* translators: button label text should, if possible, be under 16 characters. */
	const longLabel = _x(
		'Toggle block inserter',
		'Generic label for block inserter button'
	);
	const shortLabel = ! isInserterOpen ? __( 'Add' ) : __( 'Close' );

	const isZoomedOutViewExperimentEnabled =
		window?.__experimentalEnableZoomedOutView && isVisualMode;
	const isZoomedOutView = blockEditorMode === 'zoom-out';

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
				<NavigableToolbar
					as={ motion.div }
					className="edit-site-header-edit-mode__start"
					aria-label={ __( 'Document tools' ) }
					shouldUseKeyboardFocusShortcut={
						! blockToolbarCanBeFocused
					}
					variants={ toolbarVariants }
					transition={ toolbarTransition }
				>
					<div className="edit-site-header-edit-mode__toolbar">
						{ ! isDistractionFree && (
							<ToolbarItem
								ref={ inserterButton }
								as={ Button }
								className="edit-site-header-edit-mode__inserter-toggle"
								variant="primary"
								isPressed={ isInserterOpen }
								onMouseDown={ preventDefault }
								onClick={ toggleInserter }
								disabled={ ! isVisualMode }
								icon={ plus }
								label={
									showIconLabels ? shortLabel : longLabel
								}
								showTooltip={ ! showIconLabels }
							/>
						) }
						{ isLargeViewport && (
							<>
								<ToolbarItem
									as={ ToolSelector }
									showTooltip={ ! showIconLabels }
									variant={
										showIconLabels ? 'tertiary' : undefined
									}
									disabled={ ! isVisualMode }
								/>
								<ToolbarItem
									as={ UndoButton }
									showTooltip={ ! showIconLabels }
									variant={
										showIconLabels ? 'tertiary' : undefined
									}
								/>
								<ToolbarItem
									as={ RedoButton }
									showTooltip={ ! showIconLabels }
									variant={
										showIconLabels ? 'tertiary' : undefined
									}
								/>
								{ ! isDistractionFree && (
									<ToolbarItem
										as={ Button }
										className="edit-site-header-edit-mode__list-view-toggle"
										disabled={
											! isVisualMode || isZoomedOutView
										}
										icon={ listView }
										isPressed={ isListViewOpen }
										/* translators: button label text should, if possible, be under 16 characters. */
										label={ __( 'List View' ) }
										onClick={ toggleListView }
										shortcut={ listViewShortcut }
										showTooltip={ ! showIconLabels }
										variant={
											showIconLabels
												? 'tertiary'
												: undefined
										}
									/>
								) }
								{ isZoomedOutViewExperimentEnabled &&
									! isDistractionFree && (
										<ToolbarItem
											as={ Button }
											className="edit-site-header-edit-mode__zoom-out-view-toggle"
											icon={ chevronUpDown }
											isPressed={ isZoomedOutView }
											/* translators: button label text should, if possible, be under 16 characters. */
											label={ __( 'Zoom-out View' ) }
											onClick={ () => {
												setPreviewDeviceType(
													'desktop'
												);
												__unstableSetEditorMode(
													isZoomedOutView
														? 'edit'
														: 'zoom-out'
												);
											} }
										/>
									) }
							</>
						) }
					</div>
				</NavigableToolbar>
			) }

			{ ! isDistractionFree && (
				<div className="edit-site-header-edit-mode__center">
					{ ! hasDefaultEditorCanvasView ? (
						getEditorCanvasContainerTitle( editorCanvasView )
					) : (
						<DocumentActions />
					) }
				</div>
			) }

			<div className="edit-site-header-edit-mode__end">
				<motion.div
					className="edit-site-header-edit-mode__actions"
					variants={ toolbarVariants }
					transition={ toolbarTransition }
				>
					{ ! isFocusMode && hasDefaultEditorCanvasView && (
						<div
							className={ classnames(
								'edit-site-header-edit-mode__preview-options',
								{ 'is-zoomed-out': isZoomedOutView }
							) }
						>
							<PreviewOptions
								deviceType={ deviceType }
								setDeviceType={ setPreviewDeviceType }
								label={ __( 'View' ) }
							>
								<MenuGroup>
									<MenuItem
										href={ homeUrl }
										target="_blank"
										icon={ external }
									>
										{ __( 'View site' ) }
										<VisuallyHidden as="span">
											{
												/* translators: accessibility text */
												__( '(opens in a new tab)' )
											}
										</VisuallyHidden>
									</MenuItem>
								</MenuGroup>
							</PreviewOptions>
						</div>
					) }
					<SaveButton />
					{ ! isDistractionFree && (
						<PinnedItems.Slot scope="core/edit-site" />
					) }
					<MoreMenu showIconLabels={ showIconLabels } />
				</motion.div>
			</div>
		</div>
	);
}
