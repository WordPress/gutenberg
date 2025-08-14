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
import { useEffect } from '@wordpress/element';

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

/**
 * Shared cleanup function for auto-inserted Navigation Link blocks.
 *
 * Removes the block if it has no URL and clears the inserted block state.
 * This ensures consistent cleanup behavior across different contexts.
 *
 * @param {Object}   insertedBlock    - The currently inserted block data
 * @param {Function} removeBlock      - Function to remove a block
 * @param {Function} setInsertedBlock - Function to clear the inserted block state
 */
function cleanupInsertedBlock( insertedBlock, removeBlock, setInsertedBlock ) {
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
}

/**
 * Custom hook to handle iframe interaction cleanup for LinkUI in List View context.
 *
 * PROBLEM: When LinkUI is open in the List View and the user clicks on a block in the
 * editor canvas (which is in an iframe), the Popover's built-in focus detection doesn't
 * work because iframe events don't bubble up to the parent document. This causes the
 * auto-inserted Navigation Link block to remain in the canvas instead of being cleaned up.
 *
 * SOLUTION: When LinkUI is open, we add a mousedown listener to the editor canvas iframe.
 * When triggered, we call the provided cleanup function to handle block removal.
 *
 * @param {boolean}  isLinkUIOpen   - Whether the LinkUI is currently rendered
 * @param {Object}   insertedBlock  - The currently inserted block data
 * @param {Function} cleanupFn      - Function to call for cleanup when iframe is clicked
 */
function useEditorCanvasCleanup( isLinkUIOpen, insertedBlock, cleanupFn ) {
	useEffect( () => {
		// Only add listeners when LinkUI is actually rendered
		if ( ! isLinkUIOpen ) {
			return;
		}

		const handleIframeClick = () => {
			// Check if the LinkUI is still open (insertedBlock still exists)
			if ( insertedBlock?.clientId ) {
				// Call the provided cleanup function
				cleanupFn();
			}
		};

		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );

		if ( iframe?.contentDocument ) {
			iframe.contentDocument.addEventListener(
				'mousedown',
				handleIframeClick
			);
		}

		return () => {
			// Cleanup when component unmounts or LinkUI closes
			if ( iframe?.contentDocument ) {
				iframe.contentDocument.removeEventListener(
					'mousedown',
					handleIframeClick
				);
			}
		};
	}, [ isLinkUIOpen, insertedBlock, cleanupFn ] );
}

function AdditionalBlockContent( { block, insertedBlock, setInsertedBlock } ) {
	const { updateBlockAttributes, removeBlock } =
		useDispatch( blockEditorStore );

	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT?.includes(
		insertedBlock?.name
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	// Use the editor canvas cleanup hook to handle canvas interactions
	useEditorCanvasCleanup( showLinkControls, insertedBlock, () =>
		cleanupInsertedBlock( insertedBlock, removeBlock, setInsertedBlock )
	);

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
				// Use shared cleanup function
				cleanupInsertedBlock(
					insertedBlock,
					removeBlock,
					setInsertedBlock
				);
			} }
			onChange={ ( updatedValue ) => {
				updateAttributes(
					updatedValue,
					setInsertedBlockAttributes( insertedBlock?.clientId ),
					insertedBlock?.attributes
				);
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
