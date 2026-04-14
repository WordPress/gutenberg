/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';
import DeletedNavigationWarning from './deleted-navigation-warning';
import useNavigationMenu from '../use-navigation-menu';
import LeafMoreMenu from './leaf-more-menu';
import { NavigationLinkUI } from './navigation-link-ui';
import NavigationListViewHeader from './navigation-list-view-header';

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );
const {
	PrivateListView,
	PrivateBlockContext,
	useListViewPanelState,
	useBlockDisplayTitle,
} = unlock( blockEditorPrivateApis );

const MainContent = ( {
	clientId,
	currentMenuId,
	isLoading,
	isNavigationMenuMissing,
	onCreateNew,
	expandRevision,
} ) => {
	const hasChildren = useSelect(
		( select ) => {
			return !! select( blockEditorStore ).getBlockCount( clientId );
		},
		[ clientId ]
	);

	const { openListViewContentPanel } = unlock(
		useDispatch( blockEditorStore )
	);

	const { navigationMenu } = useNavigationMenu( currentMenuId );

	if ( currentMenuId && isNavigationMenuMissing ) {
		return (
			<DeletedNavigationWarning onCreateNew={ onCreateNew } isNotice />
		);
	}

	if ( isLoading ) {
		return <Spinner />;
	}

	const description = navigationMenu
		? sprintf(
				/* translators: %s: The name of a menu. */
				__( 'Structure for Navigation Menu: %s' ),
				navigationMenu?.title || __( 'Untitled menu' )
		  )
		: __(
				'You have not yet created any menus. Displaying a list of your Pages'
		  );

	return (
		<div className="wp-block-navigation__menu-inspector-controls">
			{ ! hasChildren && (
				<p className="wp-block-navigation__menu-inspector-controls__empty-message">
					{ __( 'This Navigation Menu is empty.' ) }
				</p>
			) }
			<PrivateListView
				key={ `${ clientId }-${ expandRevision }` }
				rootClientId={ clientId }
				isExpanded
				description={ description }
				showAppender
				blockSettingsMenu={ LeafMoreMenu }
				additionalBlockContent={ NavigationLinkUI }
				onSelect={ openListViewContentPanel }
			/>
		</div>
	);
};

const MenuInspectorControls = ( props ) => {
	const {
		clientId,
		createNavigationMenuIsSuccess,
		createNavigationMenuIsError,
		currentMenuId = null,
		onCreateNew,
		onSelectClassicMenu,
		onSelectNavigationMenu,
		isManageMenusButtonDisabled,
		blockEditingMode,
	} = props;

	const { isSelectionWithinCurrentSection } =
		useContext( PrivateBlockContext );

	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );

	// Only make panel collapsible in contentOnly mode
	const showBlockTitle = isSelectionWithinCurrentSection;

	const { isOpened, expandRevision, handleToggle } =
		useListViewPanelState( clientId );

	if ( ! showBlockTitle ) {
		return (
			<InspectorControls group="list">
				<PanelBody title={ null }>
					<NavigationListViewHeader
						clientId={ clientId }
						blockEditingMode={ blockEditingMode }
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
						isManageMenusButtonDisabled={
							isManageMenusButtonDisabled
						}
					/>
					<MainContent
						{ ...props }
						expandRevision={ expandRevision }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}

	// ContentOnly mode: use collapsible PanelBody
	return (
		<InspectorControls group="list">
			<PanelBody
				title={ blockTitle }
				opened={ isOpened }
				onToggle={ handleToggle }
			>
				{ blockEditingMode === 'default' && (
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
				) }
				<MainContent { ...props } expandRevision={ expandRevision } />
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
