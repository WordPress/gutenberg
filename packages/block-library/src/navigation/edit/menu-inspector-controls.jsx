import clsx from 'clsx';
import {
	privateApis as blockEditorPrivateApis,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, Spinner as WCSpinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';
import DeletedNavigationWarning from './deleted-navigation-warning';
import useNavigationMenu from '../use-navigation-menu';
import LeafMoreMenu from './leaf-more-menu';
import { NavigationLinkUI } from './navigation-link-ui';
import NavigationListViewHeader from './navigation-list-view-header';
import PageListPagesControl from '../../page-list/pages-control';
import {
	useAddLinkAfterPage,
	useDropIntoOrOutOfPageList,
} from '../../page-list/use-convert-to-navigation-links';
import { PAGE_DRAG_TYPE } from '../../page-list/pages-list';
import dropZoneStyles from './page-drop-zone.module.scss';

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );
const {
	PrivateListView,
	PrivateBlockContext,
	useListViewPanelState,
	useBlockDisplayTitle,
} = unlock( blockEditorPrivateApis );

/**
 * Lets a page dragged from the Page List's pages be dropped between the
 * list view's rows, which turns the Page List into links.
 *
 * @param {Object}                                                       props            Component props.
 * @param {Element}                                                      props.children   The list view.
 * @param {(pageId: number, clientId: string, isAfter: boolean) => void} props.onDropPage Called with the page ID, the
 *                                                                                        client ID of the row's block,
 *                                                                                        and which side of it.
 */
function PageDropZone( { children, onDropPage } ) {
	const [ indicator, setIndicator ] = useState( null );

	const getTarget = ( event ) => {
		if ( ! event.dataTransfer.types.includes( PAGE_DRAG_TYPE ) ) {
			return null;
		}
		const row = event.target.closest?.( '[role="row"][data-block]' );
		if ( ! row || ! event.currentTarget.contains( row ) ) {
			return null;
		}
		const rowRect = row.getBoundingClientRect();
		const zoneRect = event.currentTarget.getBoundingClientRect();
		const isAfter = event.clientY > rowRect.top + rowRect.height / 2;
		return {
			clientId: row.dataset.block,
			isAfter,
			top: ( isAfter ? rowRect.bottom : rowRect.top ) - zoneRect.top,
		};
	};

	return (
		<div
			className={ clsx(
				'wp-block-navigation__page-drop-zone',
				dropZoneStyles.zone
			) }
			// Capturing keeps the list view's own drop handling, which is for
			// blocks, from seeing a page.
			onDragOverCapture={ ( event ) => {
				const target = getTarget( event );
				if ( ! target ) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				event.dataTransfer.dropEffect = 'move';
				if (
					target.clientId !== indicator?.clientId ||
					target.isAfter !== indicator?.isAfter
				) {
					setIndicator( target );
				}
			} }
			onDragLeave={ ( event ) => {
				if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
					setIndicator( null );
				}
			} }
			onDropCapture={ ( event ) => {
				const target = getTarget( event );
				setIndicator( null );
				if ( ! target ) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				let page;
				try {
					page = JSON.parse(
						event.dataTransfer.getData( PAGE_DRAG_TYPE )
					);
				} catch {
					return;
				}
				if ( page?.type === 'page' && Number.isInteger( page.id ) ) {
					onDropPage( page.id, target.clientId, target.isAfter );
				}
			} }
		>
			{ children }
			{ indicator && (
				<div
					className={ clsx(
						'wp-block-navigation__page-drop-indicator',
						dropZoneStyles.indicator
					) }
					style={ { top: indicator.top } }
				/>
			) }
		</div>
	);
}

/**
 * A Navigation block's items, for its sidebar and the site editor's
 * Navigation screen. A Page List's pages are listed to switch on and off and
 * reorder, in place of the Page List, which the list view leaves out. The
 * list view is only needed for the menu's other items, so a menu of only
 * pages has an Add link button instead. Dragging items between the two turns
 * the Page List into links.
 *
 * @param {Object}  props          Component props.
 * @param {string}  props.clientId Client ID of the Navigation block.
 * @param {Element} props.listView The list view of the Navigation block.
 */
export function NavigationMenuItems( { clientId, listView } ) {
	const { pageListClientId, hasOtherItems } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockName } = select( blockEditorStore );
			const order = getBlockOrder( clientId );
			const pageList = order.find(
				( id ) => getBlockName( id ) === 'core/page-list'
			);
			return {
				pageListClientId: pageList,
				hasOtherItems: order.length > ( pageList ? 1 : 0 ),
			};
		},
		[ clientId ]
	);

	const addLinkAfterPage = useAddLinkAfterPage( pageListClientId );
	const { dropBlocksNextToPage, dropPageNextToBlock } =
		useDropIntoOrOutOfPageList( pageListClientId );

	if ( ! pageListClientId ) {
		return listView;
	}

	return (
		<>
			<PageListPagesControl
				clientId={ pageListClientId }
				showAddLink={ ! hasOtherItems }
				onAddLinkAfter={ addLinkAfterPage }
				onDropItems={ dropBlocksNextToPage }
			/>
			{ hasOtherItems && (
				<PageDropZone onDropPage={ dropPageNextToBlock }>
					{ listView }
				</PageDropZone>
			) }
		</>
	);
}

const MainContent = ( {
	clientId,
	currentMenuId,
	isLoading,
	isNavigationMenuMissing,
	onCreateNew,
	expandRevision,
} ) => {
	const hasChildren = useSelect(
		( select ) => !! select( blockEditorStore ).getBlockCount( clientId ),
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
			<NavigationMenuItems
				clientId={ clientId }
				listView={
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
				}
			/>
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
