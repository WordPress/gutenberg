/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	NavigableToolbar,
	ToolSelector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	EditorHistoryRedo,
	EditorHistoryUndo,
	store as editorStore,
} from '@wordpress/editor';
import { Button, ToolbarItem } from '@wordpress/components';
import { listView, plus } from '@wordpress/icons';
import { useRef, useCallback } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const preventDefault = ( event ) => {
	event.preventDefault();
};

function HeaderToolbar() {
	const inserterButton = useRef();
	const { setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editPostStore );
	const {
		isInserterEnabled,
		isInserterOpened,
		isTextModeEnabled,
		showIconLabels,
		isListViewOpen,
		listViewShortcut,
		useKeyboardFocusShortcut,
	} = useSelect( ( select ) => {
		const {
			hasInserterItems,
			getBlock,
			getBlockRootClientId,
			getBlockSelectionEnd,
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
			getSettings,
			__unstableGetEditorMode,
		} = select( blockEditorStore );
		const { getEditorSettings } = select( editorStore );
		const { getEditorMode, isFeatureActive, isListViewOpened } =
			select( editPostStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		const editorMode = __unstableGetEditorMode();
		const isDistractionFree = getSettings().isDistractionFree;
		const hasFixedToolbar = getSettings().hasFixedToolbar;

		let isBlockWithToolbarSelected = false;
		// Check if we have an empty block selected
		// If the first block in a multi selection is empty, there isn't a toolbar to show
		const selectedBlockId =
			getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();
		if ( selectedBlockId ) {
			const { name, attributes = {} } = getBlock( selectedBlockId ) || {};
			isBlockWithToolbarSelected =
				name && ! isUnmodifiedDefaultBlock( { name, attributes } );
		}

		const maybeBlockToolbarShowing =
			isBlockWithToolbarSelected ||
			// Anytime there's a fixed toolbar and a selection, a toolbar is showing
			( hasFixedToolbar && selectedBlockId );

		const shouldUseKeyboardFocusShortcut =
			isDistractionFree ||
			! maybeBlockToolbarShowing ||
			( ! hasFixedToolbar && editorMode !== 'edit' );

		return {
			useKeyboardFocusShortcut: shouldUseKeyboardFocusShortcut,
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			isInserterEnabled:
				getEditorMode() === 'visual' &&
				getEditorSettings().richEditingEnabled &&
				hasInserterItems(
					getBlockRootClientId( getBlockSelectionEnd() )
				),
			isInserterOpened: select( editPostStore ).isInserterOpened(),
			isTextModeEnabled: getEditorMode() === 'text',
			showIconLabels: isFeatureActive( 'showIconLabels' ),
			isListViewOpen: isListViewOpened(),
			listViewShortcut: getShortcutRepresentation(
				'core/edit-post/toggle-list-view'
			),
		};
	}, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideViewport = useViewportMatch( 'wide' );

	/* translators: accessibility text for the editor toolbar */
	const toolbarAriaLabel = __( 'Document tools' );

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);
	const overflowItems = (
		<>
			<ToolbarItem
				as={ Button }
				className="edit-post-header-toolbar__document-overview-toggle"
				icon={ listView }
				disabled={ isTextModeEnabled }
				isPressed={ isListViewOpen }
				/* translators: button label text should, if possible, be under 16 characters. */
				label={ __( 'Document Overview' ) }
				onClick={ toggleListView }
				shortcut={ listViewShortcut }
				showTooltip={ ! showIconLabels }
				variant={ showIconLabels ? 'tertiary' : undefined }
			/>
		</>
	);
	const toggleInserter = useCallback( () => {
		if ( isInserterOpened ) {
			// Focusing the inserter button should close the inserter popover.
			// However, there are some cases it won't close when the focus is lost.
			// See https://github.com/WordPress/gutenberg/issues/43090 for more details.
			inserterButton.current.focus();
			setIsInserterOpened( false );
		} else {
			setIsInserterOpened( true );
		}
	}, [ isInserterOpened, setIsInserterOpened ] );

	/* translators: button label text should, if possible, be under 16 characters. */
	const longLabel = _x(
		'Toggle block inserter',
		'Generic label for block inserter button'
	);
	const shortLabel = ! isInserterOpened ? __( 'Add' ) : __( 'Close' );

	return (
		<NavigableToolbar
			className="edit-post-header-toolbar"
			aria-label={ toolbarAriaLabel }
			useKeyboardFocusShortcut={ useKeyboardFocusShortcut }
		>
			<div className="edit-post-header-toolbar__left">
				<ToolbarItem
					ref={ inserterButton }
					as={ Button }
					className="edit-post-header-toolbar__inserter-toggle"
					variant="primary"
					isPressed={ isInserterOpened }
					onMouseDown={ preventDefault }
					onClick={ toggleInserter }
					disabled={ ! isInserterEnabled }
					icon={ plus }
					label={ showIconLabels ? shortLabel : longLabel }
					showTooltip={ ! showIconLabels }
				/>
				{ ( isWideViewport || ! showIconLabels ) && (
					<>
						{ isLargeViewport && (
							<ToolbarItem
								as={ ToolSelector }
								showTooltip={ ! showIconLabels }
								variant={
									showIconLabels ? 'tertiary' : undefined
								}
								disabled={ isTextModeEnabled }
							/>
						) }
						<ToolbarItem
							as={ EditorHistoryUndo }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
						/>
						<ToolbarItem
							as={ EditorHistoryRedo }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
						/>
						{ overflowItems }
					</>
				) }
			</div>
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
