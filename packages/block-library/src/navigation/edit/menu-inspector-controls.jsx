import {
	privateApis as blockEditorPrivateApis,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, Spinner as WCSpinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';
import DeletedNavigationWarning from './deleted-navigation-warning';
import useNavigationMenu from '../use-navigation-menu';
import LeafMoreMenu from './leaf-more-menu';
import { NavigationLinkUI } from './navigation-link-ui';
import NavigationListViewHeader from './navigation-list-view-header';
import PageListPagesControl from '../../page-list/pages-control';
import { useAddLinkAfterPage } from '../../page-list/use-convert-to-navigation-links';

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
	const { hasChildren, pageListClientId, hasOtherItems } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockName } = select( blockEditorStore );
			const order = getBlockOrder( clientId );
			const pageList = order.find(
				( id ) => getBlockName( id ) === 'core/page-list'
			);
			return {
				hasChildren: order.length > 0,
				pageListClientId: pageList,
				hasOtherItems: order.length > ( pageList ? 1 : 0 ),
			};
		},
		[ clientId ]
	);

	const addLinkAfterPage = useAddLinkAfterPage( pageListClientId );

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
		return <WCSpinner />;
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
			{ /*
			 * A Page List's pages are edited here rather than in the list
			 * view, which leaves the Page List out. The list view is only
			 * needed for the menu's other items, so a menu of only pages has
			 * an Add link button.
			 */ }
			{ pageListClientId && (
				<PageListPagesControl
					clientId={ pageListClientId }
					showAddLink={ ! hasOtherItems }
					onAddLinkAfter={ addLinkAfterPage }
				/>
			) }
			{ ( ! pageListClientId || hasOtherItems ) && (
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
			) }
		</div>
	);
};

const MenuInspectorControls = ( props ) => {
	const {
		clientId,
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
