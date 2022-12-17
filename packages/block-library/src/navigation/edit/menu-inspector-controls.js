/**
 * WordPress dependencies
 */
import {
	__experimentalOffCanvasEditor as OffCanvasEditor,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, VisuallyHidden } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ManageMenusButton from './manage-menus-button';
import NavigationMenuSelector from './navigation-menu-selector';

const MenuInspectorControls = ( {
	clientId,
	createNavigationMenuIsSuccess,
	createNavigationMenuIsError,
	currentMenuId = null,
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
							blocks={ clientIdsTree }
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
