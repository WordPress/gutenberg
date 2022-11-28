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
import {
	Button,
	ToolbarItem,
	Dropdown,
	VisuallyHidden,
	TextControl,
	__experimentalText as Text,
} from '@wordpress/components';
import { chevronDown, listView, plus } from '@wordpress/icons';
import { useRef, useCallback } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const preventDefault = ( event ) => {
	event.preventDefault();
};

function HeaderToolbar() {
	const inserterButton = useRef();
	const centerToolbar = useRef();
	const { editPost } = useDispatch( editorStore );
	const { setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editPostStore );
	const {
		title,
		isInserterEnabled,
		isInserterOpened,
		isTextModeEnabled,
		showIconLabels,
		isListViewOpen,
		listViewShortcut,
	} = useSelect( ( select ) => {
		const { hasInserterItems, getBlockRootClientId, getBlockSelectionEnd } =
			select( blockEditorStore );
		const { getEditedPostAttribute, getEditorSettings } =
			select( editorStore );
		const { getEditorMode, isFeatureActive, isListViewOpened } =
			select( editPostStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		return {
			title: getEditedPostAttribute( 'title' ),
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
	const openInserter = useCallback( () => {
		if ( isInserterOpened ) {
			// Focusing the inserter button closes the inserter popover.
			inserterButton.current.focus();
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
		>
			<div className="edit-post-header-toolbar__left">
				<ToolbarItem
					ref={ inserterButton }
					as={ Button }
					className="edit-post-header-toolbar__inserter-toggle"
					variant="primary"
					isPressed={ isInserterOpened }
					onMouseDown={ preventDefault }
					onClick={ openInserter }
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
			<div
				className="edit-post-header-toolbar__center"
				ref={ centerToolbar }
			>
				<Text size="body" as="h1" limit={ 24 }>
					<VisuallyHidden as="span">
						{ __( 'Editing: ' ) }
					</VisuallyHidden>
					{ title !== ''
						? decodeEntities( title )
						: __( '(Untitled Document)' ) }
				</Text>
				<Dropdown
					popoverProps={ {
						anchor: centerToolbar.current,
					} }
					position="bottom center"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							icon={ chevronDown }
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
							label={ __( 'Edit document details' ) }
						>
							{ showIconLabels && __( 'Details' ) }
						</Button>
					) }
					contentClassName="edit-post-header-toolbar__title-dropdown"
					renderContent={ () => (
						<TextControl
							label={ __( 'Title' ) }
							value={ title }
							onChange={ ( newTitle ) =>
								editPost( { title: newTitle } )
							}
						/>
					) }
				/>
			</div>
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
