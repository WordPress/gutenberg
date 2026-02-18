/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { NavigationListViewProvider } from './navigation-list-view-context';
import NavigationListViewHeader from './navigation-list-view-header';
import useCreateNavigationMenu from './use-create-navigation-menu';
import useConvertClassicToBlockMenu from './use-convert-classic-menu-to-block-menu';

/**
 * Wrapper component that provides navigation context to the list view header.
 * This accesses the navigation block's attributes and creates the necessary callbacks.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 * @return {Element} The header with context.
 */
export default function NavigationListViewProviderWrapper( { clientId } ) {
	const { updateBlockAttributes, selectBlock } =
		useDispatch( blockEditorStore );

	// Use the same hooks as the navigation edit component
	const {
		create: createNavigationMenu,
		isSuccess: createNavigationMenuIsSuccess,
		isError: createNavigationMenuIsError,
		value: createNavigationMenuPost,
	} = useCreateNavigationMenu( clientId );

	const { convert: convertClassicMenu } =
		useConvertClassicToBlockMenu( createNavigationMenu );

	// Helper to update menu and optionally focus the block
	const handleUpdateMenu = useCallback(
		( menuId, options = { focusNavigationBlock: false } ) => {
			const { focusNavigationBlock } = options;
			updateBlockAttributes( clientId, { ref: menuId } );
			if ( focusNavigationBlock ) {
				selectBlock( clientId );
			}
		},
		[ updateBlockAttributes, selectBlock, clientId ]
	);

	// Handle successful menu creation
	useEffect( () => {
		if ( createNavigationMenuIsSuccess && createNavigationMenuPost?.id ) {
			handleUpdateMenu( createNavigationMenuPost.id, {
				focusNavigationBlock: true,
			} );
		}
	}, [
		createNavigationMenuIsSuccess,
		createNavigationMenuPost?.id,
		handleUpdateMenu,
	] );

	// Create an untitled empty navigation menu
	const createUntitledEmptyNavigationMenu = useCallback( async () => {
		await createNavigationMenu( '' );
	}, [ createNavigationMenu ] );

	// Get navigation state from the block's context
	const { currentMenuId, blockEditingMode } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockEditingMode } =
				select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );

			return {
				currentMenuId: attributes?.ref,
				blockEditingMode: getBlockEditingMode( clientId ),
			};
		},
		[ clientId ]
	);

	const contextValue = {
		currentMenuId,
		blockEditingMode,
		createNavigationMenuIsSuccess,
		createNavigationMenuIsError,
		onSelectNavigationMenu: handleUpdateMenu,
		onCreateNew: createUntitledEmptyNavigationMenu,
		onSelectClassicMenu: convertClassicMenu,
		isManageMenusButtonDisabled: false,
		isNavigationMenuMissing: false,
	};

	return (
		<NavigationListViewProvider value={ contextValue }>
			<NavigationListViewHeader clientId={ clientId } />
		</NavigationListViewProvider>
	);
}
