/**
 * WordPress dependencies
 */
import {
	__experimentalOffCanvasEditor as OffCanvasEditor,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ManageMenusButton from './manage-menus-button';
import NavigationMenuSelector from './navigation-menu-selector';

const MenuInspectorControls = ( {
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	currentMenuId = null,
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
	/* translators: %s: The name of a menu. */
	const actionLabel = __( "Switch to '%s'" );

	return (
		<InspectorControls __experimentalGroup={ menuControlsSlot }>
			<PanelBody
				title={
					isOffCanvasNavigationEditorEnabled ? null : __( 'Menu' )
				}
			>
				<>
					{ isOffCanvasNavigationEditorEnabled && (
						<VisuallyHidden as="h2">
							{ __( 'Menu' ) }
						</VisuallyHidden>
					) }
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
					{ isOffCanvasNavigationEditorEnabled ? (
						<OffCanvasEditor
							blocks={ innerBlocks }
							isExpanded={ true }
							selectBlockInCanvas={ false }
						/>
					) : (
						<ManageMenusButton
							disabled={ isManageMenusButtonDisabled }
						/>
					) }
				</>
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
