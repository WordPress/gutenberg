/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	__experimentalOffCanvasEditor as OffCanvasEditor,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	DropdownMenu,
	MenuItem,
	MenuGroup,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ManageMenusButton from './manage-menus-button';
import NavigationMenuSelector from './navigation-menu-selector';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	variant: 'toolbar',
};

const LeafMoreMenu = ( props ) => {
	const { clientId, block } = props;

	const { insertBlock, replaceBlock, removeBlocks } =
		useDispatch( blockEditorStore );

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			className="block-editor-block-settings-menu"
			popoverProps={ POPOVER_PROPS }
			noIcons
			{ ...props }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<MenuItem
						onClick={ () => {
							const newLink = createBlock(
								'core/navigation-link'
							);
							if ( block.name === 'core/navigation-submenu' ) {
								const updateSelectionOnInsert = false;
								insertBlock(
									newLink,
									block.innerBlocks.length,
									clientId,
									updateSelectionOnInsert
								);
							} else {
								// Convert to a submenu if the block currently isn't one.
								const newSubmenu = createBlock(
									'core/navigation-submenu',
									block.attributes,
									block.innerBlocks
										? [ ...block.innerBlocks, newLink ]
										: [ newLink ]
								);
								replaceBlock( clientId, newSubmenu );
							}
							onClose();
						} }
					>
						{ __( 'Add submenu item' ) }
					</MenuItem>
					<MenuItem
						onClick={ () => {
							removeBlocks( [ clientId ], false );
							onClose();
						} }
					>
						{ __( 'Remove item' ) }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};

const MenuInspectorControls = ( {
	clientId,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	currentMenuId = null,
	isNavigationMenuMissing,
	isManageMenusButtonDisabled,
	onCreateNew,
	onSelectClassicMenu,
	onSelectNavigationMenu,
} ) => {
	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;
	const menuControlsSlot = window?.__experimentalEnableBlockInspectorTabs
		? 'list'
		: undefined;
	/* translators: %s: The name of a menu. */
	const actionLabel = __( "Switch to '%s'" );

	// Provide a hierarchy of clientIds for the given Navigation block (clientId).
	// This is required else the list view will display the entire block tree.
	const clientIdsTree = useSelect(
		( select ) => {
			const { __unstableGetClientIdsTree } = select( blockEditorStore );
			return __unstableGetClientIdsTree( clientId );
		},
		[ clientId ]
	);

	return (
		<InspectorControls __experimentalGroup={ menuControlsSlot }>
			<PanelBody
				title={
					isOffCanvasNavigationEditorEnabled ? null : __( 'Menu' )
				}
			>
				{ isOffCanvasNavigationEditorEnabled ? (
					<>
						<HStack className="wp-block-navigation-off-canvas-editor__header">
							<Heading
								className="wp-block-navigation-off-canvas-editor__title"
								level={ 2 }
							>
								{ __( 'Menu' ) }
							</Heading>
							<NavigationMenuSelector
								currentMenuId={ currentMenuId }
								onSelectClassicMenu={ onSelectClassicMenu }
								onSelectNavigationMenu={
									onSelectNavigationMenu
								}
								onCreateNew={ onCreateNew }
								createNavigationMenuIsSuccess={
									createNavigationMenuIsSuccess
								}
								createNavigationMenuIsError={
									createNavigationMenuIsError
								}
								actionLabel={ actionLabel }
							/>
						</HStack>
						{ currentMenuId && isNavigationMenuMissing ? (
							<p>{ __( 'Select or create a menu' ) }</p>
						) : (
							<OffCanvasEditor
								blocks={ clientIdsTree }
								isExpanded={ true }
								selectBlockInCanvas={ false }
								LeafMoreMenu={ LeafMoreMenu }
							/>
						) }
					</>
				) : (
					<>
						<NavigationMenuSelector
							currentMenuId={ currentMenuId }
							onSelectClassicMenu={ onSelectClassicMenu }
							onSelectNavigationMenu={ onSelectNavigationMenu }
							onCreateNew={ onCreateNew }
							createNavigationMenuIsSuccess={
								createNavigationMenuIsSuccess
							}
							createNavigationMenuIsError={
								createNavigationMenuIsError
							}
							actionLabel={ actionLabel }
						/>
						<ManageMenusButton
							disabled={ isManageMenusButtonDisabled }
						/>
					</>
				) }
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
