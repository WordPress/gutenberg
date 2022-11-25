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
import ManageMenusButton from './manage-menus-button';
import NavigationMenuSelector from './navigation-menu-selector';

const WrappedNavigationMenuSelector = ( {
	currentMenuId,
	onCreateNew,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	onSelectClassicMenu,
	onSelectNavigationMenu,
} ) => (
	<NavigationMenuSelector
		currentMenuId={ currentMenuId }
		onSelectNavigationMenu={ onSelectNavigationMenu }
		onSelectClassicMenu={ onSelectClassicMenu }
		onCreateNew={ onCreateNew }
		createNavigationMenuIsSuccess={ createNavigationMenuIsSuccess }
		createNavigationMenuIsError={ createNavigationMenuIsError }
		/* translators: %s: The name of a menu. */
		actionLabel={ __( "Switch to '%s'" ) }
	/>
);
const MenuInspectorControls = ( {
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	currentMenuId = null,
	isNavigationMenuMissing,
	innerBlocks,
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
						<WrappedNavigationMenuSelector
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
