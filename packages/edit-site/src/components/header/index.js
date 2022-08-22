/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import {
	ToolSelector,
	__experimentalPreviewOptions as PreviewOptions,
	NavigableToolbar,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x, __ } from '@wordpress/i18n';
import { listView, plus, external } from '@wordpress/icons';
import {
	Button,
	ToolbarItem,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
} from '@wordpress/components';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import DocumentActions from './document-actions';
import TemplateDetails from '../template-details';
import { store as editSiteStore } from '../../store';

const preventDefault = ( event ) => {
	event.preventDefault();
};

export default function Header( {
	openEntitiesSavedStates,
	isEntitiesSavedStatesOpen,
	showIconLabels,
} ) {
	const inserterButton = useRef();
	const {
		deviceType,
		entityTitle,
		template,
		templateType,
		isInserterOpen,
		isListViewOpen,
		listViewShortcut,
		isLoaded,
		isVisualMode,
		settings,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			getEditedPostType,
			getEditedPostId,
			isInserterOpened,
			isListViewOpened,
			getEditorMode,
			getSettings,
		} = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEditedEntityRecord( 'postType', postType, postId );
		const _isLoaded = !! postId;

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			entityTitle: getTemplateInfo( record ).title,
			isLoaded: _isLoaded,
			template: record,
			templateType: postType,
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			listViewShortcut: getShortcutRepresentation(
				'core/edit-site/toggle-list-view'
			),
			isVisualMode: getEditorMode() === 'visual',
			settings: getSettings(),
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
		setIsListViewOpened,
	} = useDispatch( editSiteStore );

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

	const isFocusMode = templateType === 'wp_template_part';

	/* translators: button label text should, if possible, be under 16 characters. */
	const longLabel = _x(
		'Toggle block inserter',
		'Generic label for block inserter button'
	);
	const shortLabel = ! isInserterOpen ? __( 'Add' ) : __( 'Close' );

	return (
		<div className="edit-site-header">
			<NavigableToolbar
				className="edit-site-header_start"
				aria-label={ __( 'Document tools' ) }
			>
				<div className="edit-site-header__toolbar">
					<ToolbarItem
						ref={ inserterButton }
						as={ Button }
						className="edit-site-header-toolbar__inserter-toggle"
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
								className="edit-site-header-toolbar__list-view-toggle"
								icon={ listView }
								disabled={ ! isVisualMode }
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
						</>
					) }
				</div>
			</NavigableToolbar>

			<div className="edit-site-header_center">
				<DocumentActions
					entityTitle={ entityTitle }
					entityLabel={
						templateType === 'wp_template_part'
							? 'template part'
							: 'template'
					}
					isLoaded={ isLoaded }
					showIconLabels={ showIconLabels }
				>
					{ ( { onClose } ) => (
						<TemplateDetails
							template={ template }
							onClose={ onClose }
						/>
					) }
				</DocumentActions>
			</div>

			<div className="edit-site-header_end">
				<div className="edit-site-header__actions">
					{ ! isFocusMode && (
						<PreviewOptions
							deviceType={ deviceType }
							setDeviceType={ setPreviewDeviceType }
						>
							<MenuGroup>
								<MenuItem
									href={ settings?.siteUrl }
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
					) }
					<SaveButton
						openEntitiesSavedStates={ openEntitiesSavedStates }
						isEntitiesSavedStatesOpen={ isEntitiesSavedStatesOpen }
					/>
					<PinnedItems.Slot scope="core/edit-site" />
					<MoreMenu showIconLabels={ showIconLabels } />
				</div>
			</div>
		</div>
	);
}
