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
import { Button, Dropdown, ToolbarItem } from '@wordpress/components';
import { plus, chevronDown } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

function HeaderToolbar() {
	const inserterButton = useRef();
	const { setIsInserterOpened } = useDispatch( 'core/edit-post' );
	const {
		hasFixedToolbar,
		isInserterEnabled,
		isInserterOpened,
		isTextModeEnabled,
		previewDeviceType,
		showIconLabels,
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
			showIconLabels: select( 'core/edit-post' ).isFeatureActive(
				'showIconLabels'
			),
		};
	}, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideViewport = useViewportMatch( 'wide' );
	const isSmallViewport = useViewportMatch( 'small', '<' );

	const displayBlockToolbar =
		! isLargeViewport || previewDeviceType !== 'Desktop' || hasFixedToolbar;

	const toolbarAriaLabel = displayBlockToolbar
		? /* translators: accessibility text for the editor toolbar when Top Toolbar is on */
		  __( 'Document and block tools' )
		: /* translators: accessibility text for the editor toolbar when Top Toolbar is off */
		  __( 'Document tools' );

	const overflowItems = (
		<>
			{ isLargeViewport && (
				<ToolbarItem
					as={ ToolSelector }
					showTooltip={ ! showIconLabels }
					disabled={ isTextModeEnabled }
				/>
			) }
			<ToolbarItem
				as={ EditorHistoryUndo }
				showTooltip={ ! showIconLabels }
			/>
			<ToolbarItem
				as={ EditorHistoryRedo }
				showTooltip={ ! showIconLabels }
			/>
			<ToolbarItem
				as={ TableOfContents }
				hasOutlineItemsDisabled={ isTextModeEnabled }
				showTooltip={ ! showIconLabels }
			/>
			<ToolbarItem
				as={ BlockNavigationDropdown }
				isDisabled={ isTextModeEnabled }
				showTooltip={ ! showIconLabels }
			/>
		</>
	);

	return (
		<NavigableToolbar
			className="edit-post-header-toolbar"
			aria-label={ toolbarAriaLabel }
		>
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
				label={ _x(
					'Add block',
					'Generic label for block inserter button'
				) }
				showTooltip={ ! showIconLabels }
			/>
			{ ( isWideViewport || ! showIconLabels ) && overflowItems }
			{ ! isWideViewport && ! isSmallViewport && showIconLabels && (
				<Dropdown
					contentClassName="edit-post-header__dropdown"
					position="bottom right"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="button-toggle"
							aria-expanded={ isOpen }
							icon={ chevronDown }
							isSecondary
							onClick={ onToggle }
						/>
					) }
					renderContent={ () => overflowItems }
				/>
			) }
			{ displayBlockToolbar && (
				<div className="edit-post-header-toolbar__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</NavigableToolbar>
	);
}

export default HeaderToolbar;
