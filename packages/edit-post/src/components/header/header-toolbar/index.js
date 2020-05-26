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
import {
	Button,
	__experimentalToolbarItem as ToolbarItem,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';

function HeaderToolbar( { onToggleInserter, isInserterOpen } ) {
	const {
		hasFixedToolbar,
		isInserterEnabled,
		isInserterVisible,
		isTextModeEnabled,
		previewDeviceType,
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
			{ isInserterVisible && (
				<ToolbarItem>
					{ ( itemProps ) => (
						<Button
							{ ...itemProps }
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
				</ToolbarItem>
			) }
			<ToolbarItem>
				{ ( itemProps ) => <ToolSelector { ...itemProps } /> }
			</ToolbarItem>
			<ToolbarItem>
				{ ( itemProps ) => <EditorHistoryUndo { ...itemProps } /> }
			</ToolbarItem>
			<ToolbarItem>
				{ ( itemProps ) => <EditorHistoryRedo { ...itemProps } /> }
			</ToolbarItem>
			<ToolbarItem>
				{ ( itemProps ) => (
					<TableOfContents
						hasOutlineItemsDisabled={ isTextModeEnabled }
						{ ...itemProps }
					/>
				) }
			</ToolbarItem>
			<ToolbarItem>
				{ ( itemProps ) => (
					<BlockNavigationDropdown
						isDisabled={ isTextModeEnabled }
						{ ...itemProps }
					/>
				) }
			</ToolbarItem>
			{ displayBlockToolbar && (
				<div className="edit-post-header-toolbar__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
