/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import {
	ToolSelector,
	NavigableToolbar,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { _x, __ } from '@wordpress/i18n';
import { listView, plus, chevronUpDown } from '@wordpress/icons';
import { Button, ToolbarItem } from '@wordpress/components';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import UndoButton from '../undo-redo/undo';
import RedoButton from '../undo-redo/redo';
import { store as editSiteStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { useShouldContextualToolbarShow } = unlock( blockEditorPrivateApis );

const preventDefault = ( event ) => {
	event.preventDefault();
};

export default function DocumentTools( {
	blockEditorMode,
	hasFixedToolbar,
	isDistractionFree,
	showIconLabels,
	setListViewToggleElement,
} ) {
	const inserterButton = useRef();
	const { isInserterOpen, isListViewOpen, listViewShortcut, isVisualMode } =
		useSelect( ( select ) => {
			const { getEditorMode } = select( editSiteStore );
			const { getShortcutRepresentation } = select(
				keyboardShortcutsStore
			);
			const { isInserterOpened, isListViewOpened } =
				select( editorStore );

			return {
				isInserterOpen: isInserterOpened(),
				isListViewOpen: isListViewOpened(),
				listViewShortcut: getShortcutRepresentation(
					'core/edit-site/toggle-list-view'
				),
				isVisualMode: getEditorMode() === 'visual',
			};
		}, [] );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const { setDeviceType, setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editorStore );

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
		<NavigableToolbar
			className="edit-site-header-edit-mode__document-tools"
			aria-label={ __( 'Document tools' ) }
			shouldUseKeyboardFocusShortcut={ ! blockToolbarCanBeFocused }
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
						label={ showIconLabels ? shortLabel : longLabel }
						showTooltip={ ! showIconLabels }
						aria-expanded={ isInserterOpen }
						size="compact"
					/>
				) }
				{ isLargeViewport && (
					<>
						{ ! hasFixedToolbar && (
							<ToolbarItem
								as={ ToolSelector }
								showTooltip={ ! showIconLabels }
								variant={
									showIconLabels ? 'tertiary' : undefined
								}
								disabled={ ! isVisualMode }
								size="compact"
							/>
						) }
						<ToolbarItem
							as={ UndoButton }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							size="compact"
						/>
						<ToolbarItem
							as={ RedoButton }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							size="compact"
						/>
						{ ! isDistractionFree && (
							<ToolbarItem
								as={ Button }
								className="edit-site-header-edit-mode__list-view-toggle"
								disabled={ ! isVisualMode || isZoomedOutView }
								icon={ listView }
								isPressed={ isListViewOpen }
								/* translators: button label text should, if possible, be under 16 characters. */
								label={ __( 'List View' ) }
								onClick={ toggleListView }
								ref={ setListViewToggleElement }
								shortcut={ listViewShortcut }
								showTooltip={ ! showIconLabels }
								variant={
									showIconLabels ? 'tertiary' : undefined
								}
								aria-expanded={ isListViewOpen }
								size="compact"
							/>
						) }
						{ isZoomedOutViewExperimentEnabled &&
							! isDistractionFree &&
							! hasFixedToolbar && (
								<ToolbarItem
									as={ Button }
									className="edit-site-header-edit-mode__zoom-out-view-toggle"
									icon={ chevronUpDown }
									isPressed={ isZoomedOutView }
									/* translators: button label text should, if possible, be under 16 characters. */
									label={ __( 'Zoom-out View' ) }
									onClick={ () => {
										setDeviceType( 'Desktop' );
										__unstableSetEditorMode(
											isZoomedOutView
												? 'edit'
												: 'zoom-out'
										);
									} }
									size="compact"
								/>
							) }
					</>
				) }
			</div>
		</NavigableToolbar>
	);
}
