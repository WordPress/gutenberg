/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	Placeholder,
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Spinner,
} from '@wordpress/components';

import {
	forwardRef,
	useCallback,
	useState,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { navigation, chevronDown, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useNavigationEntities from './use-navigation-entities';
import PlaceholderPreview from './placeholder-preview';
import menuItemsToBlocks from './menu-items-to-blocks';

function NavigationPlaceholder( { onCreate }, ref ) {
	const [ selectedMenu, setSelectedMenu ] = useState();

	const [ isCreatingFromMenu, setIsCreatingFromMenu ] = useState( false );

	const {
		isResolvingPages,
		menus,
		isResolvingMenus,
		menuItems,
		hasResolvedMenuItems,
		hasPages,
		hasMenus,
	} = useNavigationEntities( selectedMenu );

	const isLoading = isResolvingPages || isResolvingMenus;

	const createFromMenu = useCallback( () => {
		const { innerBlocks: blocks } = menuItemsToBlocks( menuItems );
		const selectNavigationBlock = true;
		onCreate( blocks, selectNavigationBlock );
	} );

	const onCreateFromMenu = () => {
		// If we have menu items, create the block right away.
		if ( hasResolvedMenuItems ) {
			createFromMenu();
			return;
		}

		// Otherwise, create the block when resolution finishes.
		setIsCreatingFromMenu( true );
	};

	const onCreateEmptyMenu = () => {
		onCreate( [] );
	};

	const onCreateAllPages = () => {
		const block = [ createBlock( 'core/page-list' ) ];
		const selectNavigationBlock = true;
		onCreate( block, selectNavigationBlock );
	};

	useEffect( () => {
		// If the user selected a menu but we had to wait for menu items to
		// finish resolving, then create the block once resolution finishes.
		if ( isCreatingFromMenu && hasResolvedMenuItems ) {
			createFromMenu();
			setIsCreatingFromMenu( false );
		}
	}, [ isCreatingFromMenu, hasResolvedMenuItems ] );

	const toggleProps = {
		variant: 'primary',
		className: 'wp-block-navigation-placeholder__actions__dropdown',
	};
	return (
		<Placeholder className="wp-block-navigation-placeholder">
			<PlaceholderPreview />

			<div className="wp-block-navigation-placeholder__controls">
				{ isLoading && (
					<div ref={ ref }>
						<Spinner />
					</div>
				) }
				{ ! isLoading && (
					<div
						ref={ ref }
						className="wp-block-navigation-placeholder__actions"
					>
						<div className="wp-block-navigation-placeholder__actions__indicator">
							<Icon icon={ navigation } /> { __( 'Navigation' ) }
						</div>
						{ hasMenus ? (
							<DropdownMenu
								text={ __( 'Add existing menu' ) }
								icon={ chevronDown }
								toggleProps={ toggleProps }
							>
								{ ( { onClose } ) => (
									<MenuGroup>
										{ menus.map( ( menu ) => {
											return (
												<MenuItem
													onClick={ () => {
														setSelectedMenu(
															menu.id
														);
														onCreateFromMenu();
													} }
													onClose={ onClose }
													key={ menu.id }
												>
													{ menu.name }
												</MenuItem>
											);
										} ) }
									</MenuGroup>
								) }
							</DropdownMenu>
						) : undefined }
						{ hasPages ? (
							<Button
								variant={ hasMenus ? 'tertiary' : 'primary' }
								onClick={ onCreateAllPages }
							>
								{ __( 'Add all pages' ) }
							</Button>
						) : undefined }
						<Button
							variant="tertiary"
							onClick={ onCreateEmptyMenu }
						>
							{ __( 'Start empty' ) }
						</Button>
					</div>
				) }
			</div>
		</Placeholder>
	);
}

export default forwardRef( NavigationPlaceholder );
