/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	NavigableToolbar,
	BlockNavigationDropdown,
	ToolSelector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
} from '@wordpress/editor';
import { Button, ToolbarItem } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplateTitle from '../template-title';
import PostTitle from '../post-title';
import { store as editPostStore } from '../../../store';

function HeaderToolbar() {
	const inserterButton = useRef();
	const { setIsInserterOpened } = useDispatch( editPostStore );
	const {
		isInserterEnabled,
		isInserterOpened,
		isTextModeEnabled,
		showIconLabels,
		isTemplateMode,
	} = useSelect( ( select ) => {
		const {
			hasInserterItems,
			getBlockRootClientId,
			getBlockSelectionEnd,
		} = select( blockEditorStore );
		return {
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			isInserterEnabled:
				select( editPostStore ).getEditorMode() === 'visual' &&
				select( 'core/editor' ).getEditorSettings()
					.richEditingEnabled &&
				hasInserterItems(
					getBlockRootClientId( getBlockSelectionEnd() )
				),
			isInserterOpened: select( editPostStore ).isInserterOpened(),
			isTextModeEnabled:
				select( editPostStore ).getEditorMode() === 'text',
			showIconLabels: select( editPostStore ).isFeatureActive(
				'showIconLabels'
			),
			isTemplateMode: select( editPostStore ).isEditingTemplate(),
		};
	}, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideViewport = useViewportMatch( 'wide' );

	/* translators: accessibility text for the editor toolbar */
	const toolbarAriaLabel = __( 'Document tools' );

	const overflowItems = (
		<>
			<ToolbarItem
				as={ TableOfContents }
				hasOutlineItemsDisabled={ isTextModeEnabled }
				repositionDropdown={ showIconLabels && ! isWideViewport }
				showTooltip={ ! showIconLabels }
				isTertiary={ showIconLabels }
			/>
			<ToolbarItem
				as={ BlockNavigationDropdown }
				isDisabled={ isTextModeEnabled }
				showTooltip={ ! showIconLabels }
				isTertiary={ showIconLabels }
			/>
		</>
	);

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
					isPrimary
					isPressed={ isInserterOpened }
					onMouseDown={ ( event ) => {
						event.preventDefault();
					} }
					onClick={ () => {
						if ( isInserterOpened ) {
							// Focusing the inserter button closes the inserter popover
							inserterButton.current.focus();
						} else {
							setIsInserterOpened( true );
						}
					} }
					disabled={ ! isInserterEnabled }
					icon={ plus }
					/* translators: button label text should, if possible, be under 16
			characters. */
					label={ _x(
						'Toggle block inserter',
						'Generic label for block inserter button'
					) }
					showTooltip={ ! showIconLabels }
				>
					{ showIconLabels && __( 'Add' ) }
				</ToolbarItem>
				{ ( isWideViewport || ! showIconLabels ) && (
					<>
						{ isLargeViewport && (
							<ToolbarItem
								as={ ToolSelector }
								showTooltip={ ! showIconLabels }
								isTertiary={ showIconLabels }
								disabled={ isTextModeEnabled }
							/>
						) }
						<ToolbarItem
							as={ EditorHistoryUndo }
							showTooltip={ ! showIconLabels }
							isTertiary={ showIconLabels }
						/>
						<ToolbarItem
							as={ EditorHistoryRedo }
							showTooltip={ ! showIconLabels }
							isTertiary={ showIconLabels }
						/>
						{ overflowItems }
					</>
				) }
			</div>

			<div className="edit-post-header-toolbar__middle">
				{ isTemplateMode ? <TemplateTitle /> : <PostTitle /> }
			</div>
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
