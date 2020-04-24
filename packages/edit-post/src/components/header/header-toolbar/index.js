/**
 * External dependencies
 */
import classnames from 'classnames';

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
		showIconLabels,
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
			showIconLabels: select( 'core/edit-post' ).isFeatureActive(
				'showIconLabels'
			),
		} ),
		[]
	);
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideViewport = useViewportMatch( 'wide' );

	const displayBlockToolbar =
		! isLargeViewport || previewDeviceType !== 'Desktop' || hasFixedToolbar;

	const showTooltip = ! showIconLabels;

	const toolbarAriaLabel = displayBlockToolbar
		? /* translators: accessibility text for the editor toolbar when Top Toolbar is on */
		  __( 'Document and block tools' )
		: /* translators: accessibility text for the editor toolbar when Top Toolbar is off */
		  __( 'Document tools' );

	return (
		<NavigableToolbar
			aria-label={ toolbarAriaLabel }
			className={ classnames( 'edit-post-header-toolbar', {
				'show-icon-labels': showIconLabels,
			} ) }
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
					showTooltip={ showTooltip }
				/>
			) }
			<ToolSelector showTooltip={ showTooltip } />
			<EditorHistoryUndo showTooltip={ showTooltip } />
			<EditorHistoryRedo showTooltip={ showTooltip } />
			<TableOfContents
				hasOutlineItemsDisabled={ isTextModeEnabled }
				showTooltip={ showTooltip }
			/>
			<BlockNavigationDropdown
				isDisabled={ isTextModeEnabled }
				showTooltip={ showTooltip }
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
