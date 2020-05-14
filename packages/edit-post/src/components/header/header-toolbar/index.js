/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
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
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';

function HeaderToolbar( { onToggleInserter, isInserterOpen } ) {
	const {
		hasFixedToolbar,
		isInserterEnabled,
		isInserterVisible,
		isTextModeEnabled,
		previewDeviceType,
		isSingleBlockMode,
	} = useSelect(
		( select ) => ( {
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			),
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			isInserterEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'visual' &&
				select( 'core/editor' ).getEditorSettings().richEditingEnabled,
			isInserterVisible: select( 'core/block-editor' ).hasInserterItems(),
			isTextModeEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'text',
			previewDeviceType: select(
				'core/edit-post'
			).__experimentalGetPreviewDeviceType(),
			isSingleBlockMode: select( 'core/edit-post' ).isFeatureActive(
				'singleBlockMode'
			),
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

	if ( isSingleBlockMode ) {
		return (
			<NavigableToolbar
				className="edit-post-header-toolbar"
				aria-label={ toolbarAriaLabel }
			>
				<div className="edit-post-header-toolbar__block-toolbar edit-post-header-toolbar__block-toolbar_single-block-mode">
					<BlockToolbar hideDragHandle />
				</div>
			</NavigableToolbar>
		);
	}

	return (
		<NavigableToolbar
			className="edit-post-header-toolbar"
			aria-label={ toolbarAriaLabel }
		>
			{ isInserterVisible && (
				<Button
					className="edit-post-header-toolbar__inserter-toggle"
					isPrimary
					isPressed={ isInserterOpen }
					onClick={ onToggleInserter }
					disabled={ ! isInserterEnabled }
					icon={ plus }
					label={ _x(
						'Add block',
						'Generic label for block inserter button'
					) }
				/>
			) }
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
