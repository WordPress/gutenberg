/**
 * WordPress dependencies
 */
import {
	__experimentalOffCanvasEditor as OffCanvasEditor,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ManageMenusButton from './manage-menus-button';
import NavigationMenuSelector from './navigation-menu-selector';
import { LeafMoreMenu } from '../leaf-more-menu';

/* translators: %s: The name of a menu. */
const actionLabel = __( "Switch to '%s'" );

const ExperimentMainContent = ( {
	clientId,
	currentMenuId,
	isLoading,
	isNavigationMenuMissing,
} ) => {
	// Provide a hierarchy of clientIds for the given Navigation block (clientId).
	// This is required else the list view will display the entire block tree.
	const clientIdsTree = useSelect(
		( select ) => {
			const { __unstableGetClientIdsTree } = select( blockEditorStore );
			return __unstableGetClientIdsTree( clientId );
		},
		[ clientId ]
	);

	if ( currentMenuId && isNavigationMenuMissing ) {
		return <p>{ __( 'Select or create a menu' ) }</p>;
	}

	if ( isLoading ) {
		return <Spinner />;
	}

	return (
		<OffCanvasEditor
			blocks={ clientIdsTree }
			isExpanded={ true }
			selectBlockInCanvas={ false }
			LeafMoreMenu={ LeafMoreMenu }
		/>
	);
};

const ExperimentControls = ( props ) => {
	const {
		createNavigationMenuIsSuccess,
		createNavigationMenuIsError,
		currentMenuId = null,
		onCreateNew,
		onSelectClassicMenu,
		onSelectNavigationMenu,
		isManageMenusButtonDisabled,
	} = props;

	return (
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
					onSelectNavigationMenu={ onSelectNavigationMenu }
					onCreateNew={ onCreateNew }
					createNavigationMenuIsSuccess={
						createNavigationMenuIsSuccess
					}
					createNavigationMenuIsError={ createNavigationMenuIsError }
					actionLabel={ actionLabel }
					isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
				/>
			</HStack>
			<ExperimentMainContent { ...props } />
		</>
	);
};

const DefaultControls = ( props ) => {
	const {
		createNavigationMenuIsSuccess,
		createNavigationMenuIsError,
		currentMenuId = null,
		isManageMenusButtonDisabled,
		onCreateNew,
		onSelectClassicMenu,
		onSelectNavigationMenu,
	} = props;

	return (
		<>
			<NavigationMenuSelector
				currentMenuId={ currentMenuId }
				onSelectClassicMenu={ onSelectClassicMenu }
				onSelectNavigationMenu={ onSelectNavigationMenu }
				onCreateNew={ onCreateNew }
				createNavigationMenuIsSuccess={ createNavigationMenuIsSuccess }
				createNavigationMenuIsError={ createNavigationMenuIsError }
				actionLabel={ actionLabel }
				isManageMenusButtonDisabled={ isManageMenusButtonDisabled }
			/>
			<ManageMenusButton disabled={ isManageMenusButtonDisabled } />
		</>
	);
};

const MenuInspectorControls = ( props ) => {
	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;
	const menuControlsSlot = isOffCanvasNavigationEditorEnabled
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
					<ExperimentControls { ...props } />
				) : (
					<DefaultControls { ...props } />
				) }
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
