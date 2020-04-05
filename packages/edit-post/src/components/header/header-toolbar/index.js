/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	NavigableToolbar,
	BlockNavigationDropdown,
	ToolSelector,
} from '@wordpress/block-editor';
import {
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
} from '@wordpress/editor';

const inserterToggleProps = { isPrimary: true };

function HeaderToolbar() {
	const {
		hasFixedToolbar,
		showInserter,
		isTextModeEnabled,
		previewDeviceType,
	} = useSelect(
		( select ) => ( {
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			),
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			showInserter:
				select( 'core/edit-post' ).getEditorMode() === 'visual' &&
				select( 'core/editor' ).getEditorSettings().richEditingEnabled,
			isTextModeEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'text',
			previewDeviceType: select(
				'core/edit-post'
			).__experimentalGetPreviewDeviceType(),
		} ),
		[]
	);
	const isLargeViewport = useViewportMatch( 'medium' );

	const displayBlockToolbar =
		! isLargeViewport || previewDeviceType !== 'Desktop' || hasFixedToolbar;

	const toolbarAriaLabel = displayBlockToolbar
		? /* translators: accessibility text for the editor toolbar when Top Toolbar is on */
		  __( 'Document and block tools' )
		: /* translators: accessibility text for the editor toolbar when Top Toolbar is off */
		  __( 'Document tools' );

	return (
		<NavigableToolbar
			className="edit-post-header-toolbar"
			aria-label={ toolbarAriaLabel }
		>
			<Inserter
				disabled={ ! showInserter }
				position="bottom right"
				showInserterHelpPanel
				toggleProps={ inserterToggleProps }
			/>
			<ToolSelector />
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<TableOfContents hasOutlineItemsDisabled={ isTextModeEnabled } />
			<BlockNavigationDropdown isDisabled={ isTextModeEnabled } />
			{ displayBlockToolbar && (
				<div className="edit-post-header-toolbar__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
