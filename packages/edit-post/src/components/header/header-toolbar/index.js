/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import {
	BlockToolbar,
	NavigableToolbar,
	ToolSelector,
} from '@wordpress/block-editor';
import {
	TableOfContents,
	EditorHistoryRedo,
	EditorHistoryUndo,
} from '@wordpress/editor';
import {
	Button,
	DropdownMenu,
	ToolbarItem,
	MenuItemsChoice,
	MenuGroup,
	SVG,
	Path,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

const ListViewIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
	>
		<Path d="M13.8 5.2H3v1.5h10.8V5.2zm-3.6 12v1.5H21v-1.5H10.2zm7.2-6H6.6v1.5h10.8v-1.5z" />
	</SVG>
);

function HeaderToolbar() {
	const inserterButton = useRef();
	const listViewButton = useRef();
	const { setIsInserterOpened, setIsListViewOpened } = useDispatch(
		'core/edit-post'
	);
	const {
		hasFixedToolbar,
		isInserterEnabled,
		isInserterOpened,
		isListViewEnabled,
		isListViewOpened,
		isTextModeEnabled,
		previewDeviceType,
		showIconLabels,
		isNavigationTool,
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
			isListViewEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'visual' &&
				select( 'core/editor' ).getEditorSettings().richEditingEnabled,
			isInserterOpened: select( 'core/edit-post' ).isInserterOpened(),
			isListViewOpened: select( 'core/edit-post' ).isListViewOpened(),
			isTextModeEnabled:
				select( 'core/edit-post' ).getEditorMode() === 'text',
			previewDeviceType: select(
				'core/edit-post'
			).__experimentalGetPreviewDeviceType(),
			showIconLabels: select( 'core/edit-post' ).isFeatureActive(
				'showIconLabels'
			),
			isNavigationTool: select( 'core/block-editor' ).isNavigationMode(),
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

	const { setNavigationMode } = useDispatch( 'core/block-editor' );

	const onSwitchMode = ( mode ) => {
		setNavigationMode( mode === 'edit' ? false : true );
	};

	const overflowItems = (
		<>
			<ToolbarItem
				as={ TableOfContents }
				hasOutlineItemsDisabled={ isTextModeEnabled }
				repositionDropdown={ showIconLabels && ! isWideViewport }
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
					'Add block',
					'Generic label for block inserter button'
				) }
				showTooltip={ ! showIconLabels }
			>
				{ showIconLabels && __( 'Add' ) }
			</ToolbarItem>
			<ToolbarItem
				ref={ listViewButton }
				as={ Button }
				className="edit-post-header-toolbar__inserter-toggle"
				isPrimary
				isPressed={ isListViewOpened }
				onMouseDown={ ( event ) => {
					event.preventDefault();
				} }
				onClick={ () => {
					if ( isListViewOpened ) {
						// Focusing the inserter button closes the inserter popover
						listViewButton.current.focus();
					} else {
						setIsListViewOpened( true );
					}
				} }
				disabled={ ! isListViewEnabled }
				icon={ ListViewIcon }
				/* translators: button label text should, if possible, be under 16
			characters. */
				label={ _x(
					'List View',
					'Generic label for list view button'
				) }
				showTooltip={ ! showIconLabels }
			>
				{ showIconLabels && __( 'List View' ) }
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
			{ ! isWideViewport && ! isSmallViewport && showIconLabels && (
				<DropdownMenu
					position="bottom right"
					label={
						/* translators: button label text should, if possible, be under 16
	characters. */
						__( 'Tools' )
					}
				>
					{ () => (
						<div className="edit-post-header__dropdown">
							<MenuGroup label={ __( 'Modes' ) }>
								<MenuItemsChoice
									value={
										isNavigationTool ? 'select' : 'edit'
									}
									onSelect={ onSwitchMode }
									choices={ [
										{
											value: 'edit',
											label: __( 'Edit' ),
										},
										{
											value: 'select',
											label: __( 'Select' ),
										},
									] }
								/>
							</MenuGroup>
							<MenuGroup label={ __( 'Edit' ) }>
								<EditorHistoryUndo
									showTooltip={ ! showIconLabels }
									isTertiary={ showIconLabels }
								/>
								<EditorHistoryRedo
									showTooltip={ ! showIconLabels }
									isTertiary={ showIconLabels }
								/>
							</MenuGroup>
							<MenuGroup>{ overflowItems }</MenuGroup>
						</div>
					) }
				</DropdownMenu>
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
