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
	Button,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { arrowLeft } from '@wordpress/icons';

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
	Controls as NavigationLinkControls,
} from '../../navigation-link/shared';

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );
const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];
const { PrivateListView } = unlock( blockEditorPrivateApis );

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
} ) => {
	const [ selectedItemClientId, setSelectedItemClientId ] = useState( null );
	const { selectBlock } = useDispatch( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const hasChildren = useSelect(
		( select ) => {
			return !! select( blockEditorStore ).getBlockCount( clientId );
		},
		[ clientId ]
	);

	// Get the globally selected block
	const globallySelectedBlock = useSelect(
		( select ) => {
			const { getSelectedBlock, getBlockParents } =
				select( blockEditorStore );
			const selected = getSelectedBlock();

			// Check if the selected block is a child of this navigation block
			if ( selected ) {
				const parents = getBlockParents( selected.clientId );
				const isChildOfNavigation = parents.includes( clientId );

				if (
					isChildOfNavigation &&
					BLOCKS_WITH_LINK_UI_SUPPORT.includes( selected.name )
				) {
					return selected;
				}
			}

			return null;
		},
		[ clientId ]
	);

	// When a different block is selected from the canvas, go back to list view
	useEffect( () => {
		if ( selectedItemClientId ) {
			if (
				! globallySelectedBlock ||
				globallySelectedBlock.clientId !== selectedItemClientId
			) {
				setSelectedItemClientId( null );
			}
		}
	}, [ globallySelectedBlock, selectedItemClientId ] );

	// Get selected block details
	const selectedBlock = useSelect(
		( select ) => {
			if ( ! selectedItemClientId ) {
				return null;
			}
			const { getBlock } = select( blockEditorStore );
			return getBlock( selectedItemClientId );
		},
		[ selectedItemClientId ]
	);

	const { navigationMenu } = useNavigationMenu( currentMenuId );

	// Handler to select navigation item when clicked in list view
	const handleSelectBlock = ( block ) => {
		if ( block ) {
			selectBlock( block.clientId );
			setSelectedItemClientId( block.clientId );
		}
	};

	// Handler to close the inspector panel
	const handleCloseInspector = () => {
		setSelectedItemClientId( null );
	};

	// Handler to update block attributes
	const handleSetAttributes = ( attributes ) => {
		if ( selectedItemClientId ) {
			updateBlockAttributes( selectedItemClientId, attributes );
		}
	};

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

	// Show inspector controls if an item is selected, otherwise show List View
	const showInspector =
		selectedBlock &&
		BLOCKS_WITH_LINK_UI_SUPPORT.includes( selectedBlock.name );

	return {
		showInspector,
		selectedBlock,
		handleCloseInspector,
		content: (
			<div className="wp-block-navigation__menu-inspector-controls">
				{ showInspector ? (
					<div className="wp-block-navigation__menu-item-inspector">
						<NavigationLinkControls
							attributes={ selectedBlock.attributes }
							setAttributes={ handleSetAttributes }
							clientId={ selectedItemClientId }
						/>
					</div>
				) : (
					<>
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
							onSelect={ handleSelectBlock }
						/>
					</>
				) }
			</div>
		),
	};
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

	const { showInspector, selectedBlock, handleCloseInspector, content } =
		MainContent( props );

	// Determine the heading text based on whether an item is selected
	let headingText = __( 'Menu' );
	if ( showInspector ) {
		headingText =
			selectedBlock.name === 'core/navigation-submenu'
				? __( 'Submenu settings' )
				: __( 'Link settings' );
	}

	return (
		<InspectorControls group="list">
			<PanelBody title={ null }>
				<HStack
					className="wp-block-navigation-off-canvas-editor__header"
					justify="flex-start"
					spacing={ 2 }
				>
					{ showInspector && (
						<Button
							icon={ arrowLeft }
							label={ __( 'Back' ) }
							onClick={ handleCloseInspector }
							size="small"
						/>
					) }
					<Heading
						className="wp-block-navigation-off-canvas-editor__title"
						level={ 2 }
					>
						{ headingText }
					</Heading>
					{ ! showInspector && blockEditingMode === 'default' && (
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
				{ content }
			</PanelBody>
		</InspectorControls>
	);
};

export default MenuInspectorControls;
