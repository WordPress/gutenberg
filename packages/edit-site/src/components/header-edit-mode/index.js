/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import {
	ToolSelector,
	__experimentalPreviewOptions as PreviewOptions,
	NavigableToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x, __ } from '@wordpress/i18n';
import { listView, plus, external, chevronUpDown } from '@wordpress/icons';
import {
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
import { useHasStyleBook } from '../style-book';

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
		blockEditorMode,
		homeUrl,
		showIconLabels,
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
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
		setIsListViewOpened,
	} = useDispatch( editSiteStore );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );

	const isLargeViewport = useViewportMatch( 'medium' );

	const openInserter = useCallback( () => {
		if ( isInserterOpen ) {
			// Focusing the inserter button closes the inserter popover.
			inserterButton.current.focus();
		} else {
			setIsInserterOpened( true );
		}
	}, [ isInserterOpen, setIsInserterOpened ] );

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	const hasStyleBook = useHasStyleBook();

	const isFocusMode = templateType === 'wp_template_part';

	/* translators: button label text should, if possible, be under 16 characters. */
	const longLabel = _x(
		'Toggle block inserter',
		'Generic label for block inserter button'
	);
	const shortLabel = ! isInserterOpen ? __( 'Add' ) : __( 'Close' );

	const isZoomedOutViewExperimentEnabled =
		window?.__experimentalEnableZoomedOutView && isVisualMode;
	const isZoomedOutView = blockEditorMode === 'zoom-out';

	return (
		<div
			className={ classnames( 'edit-site-header-edit-mode', {
				'show-icon-labels': showIconLabels,
			} ) }
		>
			{ ! hasStyleBook && (
				<NavigableToolbar
					className="edit-site-header-edit-mode__start"
					aria-label={ __( 'Document tools' ) }
				>
					<div className="edit-site-header-edit-mode__toolbar">
						<ToolbarItem
							ref={ inserterButton }
							as={ Button }
							className="edit-site-header-edit-mode__inserter-toggle"
							variant="primary"
							isPressed={ isInserterOpen }
							onMouseDown={ preventDefault }
							onClick={ openInserter }
							disabled={ ! isVisualMode }
							icon={ plus }
							label={ showIconLabels ? shortLabel : longLabel }
							showTooltip={ ! showIconLabels }
						/>
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
										showIconLabels ? 'tertiary' : undefined
									}
								/>
								{ isZoomedOutViewExperimentEnabled && (
									<ToolbarItem
										as={ Button }
										className="edit-site-header-edit-mode__zoom-out-view-toggle"
										icon={ chevronUpDown }
										isPressed={ isZoomedOutView }
										/* translators: button label text should, if possible, be under 16 characters. */
										label={ __( 'Zoom-out View' ) }
										onClick={ () => {
											setPreviewDeviceType( 'desktop' );
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

			<div className="edit-site-header-edit-mode__center">
				{ hasStyleBook ? __( 'Style Book' ) : <DocumentActions /> }
			</div>

			<div className="edit-site-header-edit-mode__end">
				<div className="edit-site-header-edit-mode__actions">
					{ ! isFocusMode && ! hasStyleBook && (
						<div
							className={ classnames(
								'edit-site-header-edit-mode__preview-options',
								{ 'is-zoomed-out': isZoomedOutView }
							) }
						>
							<PreviewOptions
								deviceType={ deviceType }
								setDeviceType={ setPreviewDeviceType }
								/* translators: button label text should, if possible, be under 16 characters. */
								viewLabel={ __( 'View' ) }
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
					<PinnedItems.Slot scope="core/edit-site" />
					<MoreMenu showIconLabels={ showIconLabels } />
				</div>
			</div>
		</div>
	);
}
