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
	Spinner,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from './navigation-menu-selector';
import { unlock } from '../../lock-unlock';
import DeletedNavigationWarning from './deleted-navigation-warning';
import useNavigationMenu from '../use-navigation-menu';
import LeafMoreMenu from './leaf-more-menu';
import {
	LinkUI,
	updateAttributes,
	useEntityBinding,
	getActionableStatus,
} from '../../navigation-link/shared';

/**
 * Returns a map of clientId → badge data for all navigation link descendants.
 * Badge data is `{ label, intent }` or absent if the link has no actionable status.
 * Intended to be called once per list view render, not per block.
 *
 * @param {string} rootClientId - Client ID of the root navigation block
 * @return {Map<string, {label: string, intent: string}>} Badge data keyed by clientId
 */
function useNavigationBadgeMap( rootClientId ) {
	return useSelect(
		( select ) => {
			const { getClientIdsOfDescendants, getBlock } =
				select( blockEditorStore );
			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const map = new Map();

			for ( const clientId of getClientIdsOfDescendants(
				rootClientId
			) ) {
				const block = getBlock( clientId );
				if (
					! block ||
					( block.name !== 'core/navigation-link' &&
						block.name !== 'core/navigation-submenu' )
				) {
					continue;
				}

				const { url, type, kind, metadata, id } =
					block.attributes || {};
				const hasBinding = !! metadata?.bindings?.url && !! id;
				let entityRecord = null;
				let isEntityAvailable = false;

				if ( hasBinding && id ) {
					const isPostType = kind === 'post-type';
					const isTaxonomy = kind === 'taxonomy';
					if ( isPostType || isTaxonomy ) {
						const entityType = isTaxonomy ? 'taxonomy' : 'postType';
						const typeForAPI = type === 'tag' ? 'post_tag' : type;
						const record = getEntityRecord(
							entityType,
							typeForAPI,
							id
						);
						const hasResolved = hasFinishedResolution(
							'getEntityRecord',
							[ entityType, typeForAPI, id ]
						);
						entityRecord = record || null;
						isEntityAvailable = hasResolved
							? record !== undefined
							: true;
					}
				}

				const status = getActionableStatus( {
					url,
					type,
					entityStatus: entityRecord?.status,
					hasBinding,
					isEntityAvailable,
				} );

				if ( status ) {
					map.set( clientId, status );
				}
			}

			return map;
		},
		[ rootClientId ]
	);
}

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );
const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];
const {
	PrivateListView,
	useBlockDisplayTitle,
	PrivateBlockContext,
	useListViewPanelState,
} = unlock( blockEditorPrivateApis );

function AdditionalBlockContent( { block, insertedBlock, setInsertedBlock } ) {
	const { updateBlockAttributes, removeBlock } =
		useDispatch( blockEditorStore );

	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT?.includes(
		insertedBlock?.name
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	// Get binding utilities for the inserted block
	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: insertedBlock?.clientId,
		attributes: insertedBlock?.attributes || {},
	} );

	if ( ! showLinkControls ) {
		return null;
	}

	/**
	 * Cleanup function for auto-inserted Navigation Link blocks.
	 *
	 * Removes the block if it has no URL and clears the inserted block state.
	 * This ensures consistent cleanup behavior across different contexts.
	 */
	const cleanupInsertedBlock = () => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// Follows the exact same pattern as Navigation Link block's onClose handler
		// If there is no URL then remove the auto-inserted block to avoid empty blocks
		if ( ! insertedBlock?.attributes?.url && insertedBlock?.clientId ) {
			// Remove the block entirely to avoid poor UX
			// This matches the Navigation Link block's behavior
			removeBlock( insertedBlock.clientId, shouldAutoSelectBlock );
		}
		setInsertedBlock( null );
	};

	const setInsertedBlockAttributes =
		( _insertedBlockClientId ) => ( _updatedAttributes ) => {
			if ( ! _insertedBlockClientId ) {
				return;
			}
			updateBlockAttributes( _insertedBlockClientId, _updatedAttributes );
		};

	// Wrapper function to clean up original block when a new block is selected
	const handleSetInsertedBlock = ( newBlock ) => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// If we have an existing inserted block and a new block is being set,
		// remove the original block to avoid duplicates
		if ( insertedBlock?.clientId && newBlock ) {
			removeBlock( insertedBlock.clientId, shouldAutoSelectBlock );
		}
		setInsertedBlock( newBlock );
	};

	return (
		<LinkUI
			clientId={ insertedBlock?.clientId }
			link={ insertedBlock?.attributes }
			onBlockInsert={ handleSetInsertedBlock }
			onClose={ () => {
				// Use cleanup function
				cleanupInsertedBlock();
			} }
			onChange={ ( updatedValue ) => {
				// updateAttributes determines the final state and returns metadata
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes(
						updatedValue,
						setInsertedBlockAttributes( insertedBlock?.clientId ),
						insertedBlock?.attributes
					);

				// Handle URL binding based on the final computed state
				// Only create bindings for entity links (posts, pages, taxonomies)
				// Never create bindings for custom links (manual URLs)
				if ( isEntityLink ) {
					createBinding( updatedAttributes );
				} else {
					clearBinding();
				}

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
	const badgeMap = useNavigationBadgeMap( clientId );
	const getBlockBadge = useCallback(
		( block ) => badgeMap.get( block.clientId ) ?? null,
		[ badgeMap ]
	);

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
				additionalBlockContent={ AdditionalBlockContent }
				getBlockBadge={ getBlockBadge }
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
					<HStack className="wp-block-navigation-off-canvas-editor__header">
						<Heading
							className="wp-block-navigation-off-canvas-editor__title"
							level={ 2 }
						>
							{ blockTitle }
						</Heading>
						{ blockEditingMode === 'default' && (
							<NavigationMenuSelector
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
								actionLabel={ actionLabel }
								isManageMenusButtonDisabled={
									isManageMenusButtonDisabled
								}
							/>
						) }
					</HStack>
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
				title={ __( 'Navigation' ) }
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
