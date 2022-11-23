/**
 * WordPress dependencies
 */
import {
	__experimentalOffCanvasEditor as OffCanvasEditor,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CreateNewMenuButton from './create-new-menu-button';
import ManageMenusButton from './manage-menus-button';
import NavigationMenuSelector from './navigation-menu-selector';
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';

const WrappedNavigationMenuSelector = ( {
	clientId,
	currentMenuId,
	handleUpdateMenu,
	convertClassicMenu,
	onCreateNew,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
} ) => (
	<NavigationMenuSelector
		currentMenuId={ currentMenuId }
		clientId={ clientId }
		onSelectNavigationMenu={ ( menuId ) => {
			handleUpdateMenu( menuId );
		} }
		onSelectClassicMenu={ async ( classicMenu ) => {
			const navMenu = await convertClassicMenu(
				classicMenu.id,
				classicMenu.name,
				'draft'
			);
			if ( navMenu ) {
				handleUpdateMenu( navMenu.id, {
					focusNavigationBlock: true,
				} );
			}
		} }
		onCreateNew={ onCreateNew }
		createNavigationMenuIsSuccess={ createNavigationMenuIsSuccess }
		createNavigationMenuIsError={ createNavigationMenuIsError }
		/* translators: %s: The name of a menu. */
		actionLabel={ __( "Switch to '%s'" ) }
	/>
);
const MenuInspectorControls = ( {
	clientId,
	convertClassicMenu,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	currentMenuId = null,
	handleUpdateMenu,
	isNavigationMenuMissing,
	innerBlocks,
	isManageMenusButtonDisabled,
	onCreateNew,
} ) => {
	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;
	const menuControlsSlot = window?.__experimentalEnableBlockInspectorTabs
		? 'list'
		: undefined;

	const { menus: classicMenus } = useNavigationEntities();
	const { navigationMenus } = useNavigationMenu();
	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	const hasClassicOrNavigationMenus = hasClassicMenus || hasNavigationMenus;

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
							<WrappedNavigationMenuSelector
								clientId={ clientId }
								currentMenuId={ currentMenuId }
								handleUpdateMenu={ handleUpdateMenu }
								convertClassicMenu={ convertClassicMenu }
								onCreateNew={ onCreateNew }
								createNavigationMenuIsSuccess={
									createNavigationMenuIsSuccess
								}
								createNavigationMenuIsError={
									createNavigationMenuIsError
								}
							/>
						</HStack>
						{ currentMenuId && isNavigationMenuMissing ? (
							<p>{ __( 'Select or create a menu' ) }</p>
						) : (
							<OffCanvasEditor
								blocks={ innerBlocks }
								isExpanded={ true }
								selectBlockInCanvas={ false }
							/>
						) }
					</>
				) : (
					<>
						{ hasClassicOrNavigationMenus ? (
							<WrappedNavigationMenuSelector
								clientId={ clientId }
								currentMenuId={ currentMenuId }
								handleUpdateMenu={ handleUpdateMenu }
								convertClassicMenu={ convertClassicMenu }
								onCreateNew={ onCreateNew }
								createNavigationMenuIsSuccess={
									createNavigationMenuIsSuccess
								}
								createNavigationMenuIsError={
									createNavigationMenuIsError
								}
							/>
						) : (
							<CreateNewMenuButton onCreateNew={ onCreateNew } />
						) }
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
