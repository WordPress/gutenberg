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
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';
import DeletedNavigationWarning from './deleted-navigation-warning';
import useNavigationMenu from '../use-navigation-menu';
import LeafMoreMenu from './leaf-more-menu';
import { updateAttributes } from '../../navigation-link/update-attributes';
import { LinkUI } from '../../navigation-link/link-ui';

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );
const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];
const { PrivateListView } = unlock( blockEditorPrivateApis );

function AdditionalBlockContent( { block, insertedBlock, setInsertedBlock } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT?.includes(
		insertedBlock?.name
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	if ( ! showLinkControls ) {
		return null;
	}

	const setInsertedBlockAttributes =
		( _insertedBlockClientId ) => ( _updatedAttributes ) => {
			if ( ! _insertedBlockClientId ) {
				return;
			}
			updateBlockAttributes( _insertedBlockClientId, _updatedAttributes );
		};

	return (
		<LinkUI
			clientId={ insertedBlock?.clientId }
			link={ insertedBlock?.attributes }
			onClose={ () => {
				setInsertedBlock( null );
			} }
			onChange={ ( updatedValue ) => {
				updateAttributes(
					updatedValue,
					setInsertedBlockAttributes( insertedBlock?.clientId ),
					insertedBlock?.attributes
				);
				setInsertedBlock( null );
			} }
			onCancel={ () => {
				setInsertedBlock( null );
			} }
		/>
	);
}

const MainContent = ( {
	clientId,
	currentMenuId,
	isLoading,
	isNavigationMenuMissing,
	onCreateNew,
} ) => {
	const hasChildren = useSelect(
		( select ) => {
			return !! select( blockEditorStore ).getBlockCount( clientId );
		},
		[ clientId ]
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
				rootClientId={ clientId }
				isExpanded
				description={ description }
				showAppender
				blockSettingsMenu={ LeafMoreMenu }
				additionalBlockContent={ AdditionalBlockContent }
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
		blockEditingMode,
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
				</HStack>
				<MainContent { ...props } />
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
