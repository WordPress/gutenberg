/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
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

function HeaderToolbar() {
	const { setIsInserterOpened } = useDispatch( 'core/edit-post' );
	const {
		hasFixedToolbar,
		isInserterEnabled,
		isInserterOpened,
		isTextModeEnabled,
		previewDeviceType,
	} = useSelect( ( select ) => {
		const {
			hasInserterItems,
			getBlockRootClientId,
			getBlockSelectionEnd,
		} = select( 'core/block-editor' );
		return {
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			),
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			isInserterEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'visual' &&
				select( 'core/editor' ).getEditorSettings()
					.richEditingEnabled &&
				hasInserterItems(
					getBlockRootClientId( getBlockSelectionEnd() )
				),
			isInserterOpened: select( 'core/edit-post' ).isInserterOpened(),
			isTextModeEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'text',
			previewDeviceType: select(
				'core/edit-post'
			).__experimentalGetPreviewDeviceType(),
		};
	}, [] );
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
			<ToolbarItem
				as={ Button }
				className="edit-post-header-toolbar__inserter-toggle"
				isPrimary
				isPressed={ isInserterOpened }
				onClick={ () => setIsInserterOpened( ! isInserterOpened ) }
				disabled={ ! isInserterEnabled }
				icon={ plus }
				label={ _x(
					'Add block',
					'Generic label for block inserter button'
				) }
			/>
			{ isLargeViewport && <ToolbarItem as={ ToolSelector } /> }
			<ToolbarItem as={ EditorHistoryUndo } />
			<ToolbarItem as={ EditorHistoryRedo } />
			<ToolbarItem
				as={ TableOfContents }
				hasOutlineItemsDisabled={ isTextModeEnabled }
			/>
			<ToolbarItem
				as={ BlockNavigationDropdown }
				isDisabled={ isTextModeEnabled }
			/>
			{ displayBlockToolbar && (
				<div className="edit-post-header-toolbar__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
