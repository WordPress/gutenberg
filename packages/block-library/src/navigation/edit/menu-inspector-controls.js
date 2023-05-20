/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
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
import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../private-apis';
import DeletedNavigationWarning from './deleted-navigation-warning';
import useNavigationMenu from '../use-navigation-menu';
import LeafMoreMenu from './leaf-more-menu';
import { updateAttributes } from '../../navigation-link/update-attributes';
import { LinkUI } from '../../navigation-link/link-ui';
import { useInsertedBlock } from '../../navigation-link/use-inserted-block';

/* translators: %s: The name of a menu. */
const actionLabel = __( "Switch to '%s'" );
const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

const MainContent = ( {
	clientId,
	currentMenuId,
	isLoading,
	isNavigationMenuMissing,
	onCreateNew,
} ) => {
	const { PrivateListView } = unlock( blockEditorPrivateApis );

	// Provide a hierarchy of clientIds for the given Navigation block (clientId).
	// This is required else the list view will display the entire block tree.
	const clientIdsTree = useSelect(
		( select ) => {
			const { __unstableGetClientIdsTree } = select( blockEditorStore );
			return __unstableGetClientIdsTree( clientId );
		},
		[ clientId ]
	);

	const [ clientIdWithOpenLinkUI, setClientIdWithOpenLinkUI ] = useState();
	const { lastInsertedBlockClientId } = useSelect( ( select ) => {
		const { getLastInsertedBlocksClientIds } = unlock(
			select( blockEditorStore )
		);
		const lastInsertedBlocksClientIds = getLastInsertedBlocksClientIds();
		return {
			lastInsertedBlockClientId:
				lastInsertedBlocksClientIds && lastInsertedBlocksClientIds[ 0 ],
		};
	}, [] );

	const {
		insertedBlockAttributes,
		insertedBlockName,
		setInsertedBlockAttributes,
	} = useInsertedBlock( lastInsertedBlockClientId );

	const hasExistingLinkValue = insertedBlockAttributes?.url;

	useEffect( () => {
		if (
			lastInsertedBlockClientId &&
			BLOCKS_WITH_LINK_UI_SUPPORT?.includes( insertedBlockName ) &&
			! hasExistingLinkValue // don't re-show the Link UI if the block already has a link value.
		) {
			setClientIdWithOpenLinkUI( lastInsertedBlockClientId );
		}
	}, [
		lastInsertedBlockClientId,
		clientId,
		insertedBlockName,
		hasExistingLinkValue,
	] );

	const { navigationMenu } = useNavigationMenu( currentMenuId );

	if ( currentMenuId && isNavigationMenuMissing ) {
		return <DeletedNavigationWarning onCreateNew={ onCreateNew } />;
	}

	if ( isLoading ) {
		return <Spinner />;
	}

	const description = navigationMenu
		? sprintf(
				/* translators: %s: The name of a menu. */
				__( 'Structure for navigation menu: %s' ),
				navigationMenu?.title?.rendered || __( 'Untitled menu' )
		  )
		: __(
				'You have not yet created any menus. Displaying a list of your Pages'
		  );

	const renderLinkUI = ( block ) => {
		return (
			clientIdWithOpenLinkUI === block.clientId && (
				<LinkUI
					clientId={ lastInsertedBlockClientId }
					link={ insertedBlockAttributes }
					onClose={ () => setClientIdWithOpenLinkUI( null ) }
					hasCreateSuggestion={ false }
					onChange={ ( updatedValue ) => {
						updateAttributes(
							updatedValue,
							setInsertedBlockAttributes,
							insertedBlockAttributes
						);
						setClientIdWithOpenLinkUI( null );
					} }
					onCancel={ () => setClientIdWithOpenLinkUI( null ) }
				/>
			)
		);
	};

	return (
		<div className="wp-block-navigation__menu-inspector-controls">
			{ clientIdsTree.length === 0 && (
				<p className="wp-block-navigation__menu-inspector-controls__empty-message">
					{ __( 'This navigation menu is empty.' ) }
				</p>
			) }
			<PrivateListView
				blocks={ clientIdsTree }
				rootClientId={ clientId }
				isExpanded
				description={ description }
				showAppender
				blockSettingsMenu={ LeafMoreMenu }
				renderAdditionalBlockUI={ renderLinkUI }
			/>
		</div>
	);
};

const MenuInspectorControls = ( props ) => {
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
		<InspectorControls group="list">
			<PanelBody title={ null }>
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
						createNavigationMenuIsError={
							createNavigationMenuIsError
						}
						actionLabel={ actionLabel }
						isManageMenusButtonDisabled={
							isManageMenusButtonDisabled
						}
					/>
				</HStack>
				<MainContent { ...props } />
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
