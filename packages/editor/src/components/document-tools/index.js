/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { NavigableToolbar, ToolSelector } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarItem } from '@wordpress/components';
import { listView, plus } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import EditorHistoryRedo from '../editor-history/redo';
import EditorHistoryUndo from '../editor-history/undo';

function DocumentTools( { className, disableBlockTools = false } ) {
	const { setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editorStore );
	const {
		isDistractionFree,
		isInserterOpened,
		isListViewOpen,
		listViewShortcut,
		inserterSidebarToggleRef,
		listViewToggleRef,
		showIconLabels,
		showTools,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const {
			isListViewOpened,
			getEditorMode,
			getInserterSidebarToggleRef,
			getListViewToggleRef,
			getRenderingMode,
			getCurrentPostType,
		} = unlock( select( editorStore ) );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		return {
			isInserterOpened: select( editorStore ).isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			listViewShortcut: getShortcutRepresentation(
				'core/editor/toggle-list-view'
			),
			inserterSidebarToggleRef: getInserterSidebarToggleRef(),
			listViewToggleRef: getListViewToggleRef(),
			showIconLabels: get( 'core', 'showIconLabels' ),
			isDistractionFree: get( 'core', 'distractionFree' ),
			isVisualMode: getEditorMode() === 'visual',
			showTools:
				!! window?.__experimentalEditorWriteMode &&
				( getRenderingMode() !== 'post-only' ||
					getCurrentPostType() === 'wp_template' ),
		};
	}, [] );

	const preventDefault = ( event ) => {
		// Because the inserter behaves like a dialog,
		// if the inserter is opened already then when we click on the toggle button
		// then the initial click event will close the inserter and then be propagated
		// to the inserter toggle and it will open it again.
		// To prevent this we need to stop the propagation of the event.
		// This won't be necessary when the inserter no longer behaves like a dialog.

		if ( isInserterOpened ) {
			event.preventDefault();
		}
	};

	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideViewport = useViewportMatch( 'wide' );

	/* translators: accessibility text for the editor toolbar */
	const toolbarAriaLabel = __( 'Document tools' );

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	const toggleInserter = useCallback(
		() => setIsInserterOpened( ! isInserterOpened ),
		[ isInserterOpened, setIsInserterOpened ]
	);

	/* translators: button label text should, if possible, be under 16 characters. */
	const longLabel = _x(
		'Block Inserter',
		'Generic label for block inserter button'
	);
	const shortLabel = ! isInserterOpened ? __( 'Add' ) : __( 'Close' );

	return (
		// Some plugins expect and use the `edit-post-header-toolbar` CSS class to
		// find the toolbar and inject UI elements into it. This is not officially
		// supported, but we're keeping it in the list of class names for backwards
		// compatibility.
		<NavigableToolbar
			className={ clsx(
				'editor-document-tools',
				'edit-post-header-toolbar',
				className
			) }
			aria-label={ toolbarAriaLabel }
			variant="unstyled"
		>
			<div className="editor-document-tools__left">
				{ ! isDistractionFree && (
					<ToolbarButton
						ref={ inserterSidebarToggleRef }
						className="editor-document-tools__inserter-toggle"
						variant="primary"
						isPressed={ isInserterOpened }
						onMouseDown={ preventDefault }
						onClick={ toggleInserter }
						disabled={ disableBlockTools }
						icon={ plus }
						label={ showIconLabels ? shortLabel : longLabel }
						showTooltip={ ! showIconLabels }
						aria-expanded={ isInserterOpened }
					/>
				) }
				{ ( isWideViewport || ! showIconLabels ) && (
					<>
						{ showTools && isLargeViewport && (
							<ToolbarItem
								as={ ToolSelector }
								showTooltip={ ! showIconLabels }
								variant={
									showIconLabels ? 'tertiary' : undefined
								}
								disabled={ disableBlockTools }
								size="compact"
							/>
						) }
						<ToolbarItem
							as={ EditorHistoryUndo }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							size="compact"
						/>
						<ToolbarItem
							as={ EditorHistoryRedo }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							size="compact"
						/>
						{ ! isDistractionFree && (
							<ToolbarButton
								className="editor-document-tools__document-overview-toggle"
								icon={ listView }
								disabled={ disableBlockTools }
								isPressed={ isListViewOpen }
								/* translators: button label text should, if possible, be under 16 characters. */
								label={ __( 'Document Overview' ) }
								onClick={ toggleListView }
								shortcut={ listViewShortcut }
								showTooltip={ ! showIconLabels }
								variant={
									showIconLabels ? 'tertiary' : undefined
								}
								aria-expanded={ isListViewOpen }
								ref={ listViewToggleRef }
							/>
						) }
					</>
				) }
			</div>
		</NavigableToolbar>
	);
}

export default DocumentTools;
