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
} from '@wordpress/components';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { navigation, Icon } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */

import useNavigationEntities from '../../use-navigation-entities';
import PlaceholderPreview from './placeholder-preview';
import menuItemsToBlocks from '../../menu-items-to-blocks';
import useNavigationMenu from '../../use-navigation-menu';
import useCreateNavigationMenu from '../use-create-navigation-menu';

const ExistingMenusDropdown = ( {
	showNavigationMenus,
	navigationMenus,
	setSelectedMenu,
	onFinish,
	menus,
	onCreateFromMenu,
	showClassicMenus = false,
} ) => {
	const toggleProps = {
		variant: 'tertiary',
		iconPosition: 'right',
		className: 'wp-block-navigation-placeholder__actions__dropdown',
	};

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! menus?.length;

	return (
		<DropdownMenu
			text={ __( 'Select menu' ) }
			icon={ null }
			toggleProps={ toggleProps }
			popoverProps={ { isAlternate: true } }
		>
			{ ( { onClose } ) => (
				<>
					{ showNavigationMenus && hasNavigationMenus && (
						<MenuGroup label={ __( 'Menus' ) }>
							{ navigationMenus.map( ( menu ) => {
								return (
									<MenuItem
										onClick={ () => {
											setSelectedMenu( menu.id );
											onFinish( menu );
										} }
										onClose={ onClose }
										key={ menu.id }
									>
										{ decodeEntities(
											menu.title.rendered
										) }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
					{ showClassicMenus && hasClassicMenus && (
						<MenuGroup label={ __( 'Classic Menus' ) }>
							{ menus.map( ( menu ) => {
								return (
									<MenuItem
										onClick={ () => {
											setSelectedMenu( menu.id );
											onCreateFromMenu( menu.name );
										} }
										onClose={ onClose }
										key={ menu.id }
									>
										{ decodeEntities( menu.name ) }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
};

export default function NavigationPlaceholder( {
	clientId,
	onFinish,
	canSwitchNavigationMenu,
	hasResolvedNavigationMenus,
	canUserCreateNavigation = false,
} ) {
	const [ selectedMenu, setSelectedMenu ] = useState();
	const [ isCreatingFromMenu, setIsCreatingFromMenu ] = useState( false );
	const [ menuName, setMenuName ] = useState( '' );
	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		if ( ! canUserCreateNavigation ) {
			return;
		}

		const navigationMenu = await createNavigationMenu(
			navigationMenuTitle,
			blocks
		);
		onFinish( navigationMenu, blocks );
	};

	const {
		isResolvingPages,
		menus,
		isResolvingMenus,
		menuItems,
		hasResolvedMenuItems,
		hasPages,
		hasMenus,
	} = useNavigationEntities( selectedMenu );

	const isStillLoading = isResolvingPages || isResolvingMenus;

	const createFromMenu = useCallback(
		( name ) => {
			const { innerBlocks: blocks } = menuItemsToBlocks( menuItems );
			onFinishMenuCreation( blocks, name );
		},
		[ menuItems, menuItemsToBlocks, onFinish ]
	);

	const onCreateFromMenu = ( name ) => {
		// If we have menu items, create the block right away.
		if ( hasResolvedMenuItems ) {
			createFromMenu( name );
			return;
		}

		// Otherwise, create the block when resolution finishes.
		setIsCreatingFromMenu( true );
		// Store the name to use later.
		setMenuName( name );
	};

	const onCreateEmptyMenu = () => {
		onFinishMenuCreation( [] );
	};

	const onCreateAllPages = () => {
		const block = [ createBlock( 'core/page-list' ) ];
		onFinishMenuCreation( block );
	};

	useEffect( () => {
		// If the user selected a menu but we had to wait for menu items to
		// finish resolving, then create the block once resolution finishes.
		if ( isCreatingFromMenu && hasResolvedMenuItems ) {
			createFromMenu( menuName );
			setIsCreatingFromMenu( false );
		}
	}, [ isCreatingFromMenu, hasResolvedMenuItems, menuName ] );

	const { navigationMenus } = useNavigationMenu();

	const hasNavigationMenus = !! navigationMenus?.length;

	const showSelectMenus =
		( canSwitchNavigationMenu || canUserCreateNavigation ) &&
		( hasNavigationMenus || hasMenus );

	return (
		<>
			{ ( ! hasResolvedNavigationMenus || isStillLoading ) && (
				<PlaceholderPreview isLoading />
			) }
			{ hasResolvedNavigationMenus && ! isStillLoading && (
				<Placeholder className="wp-block-navigation-placeholder">
					<PlaceholderPreview />
					<div className="wp-block-navigation-placeholder__controls">
						<div className="wp-block-navigation-placeholder__actions">
							<div className="wp-block-navigation-placeholder__actions__indicator">
								<Icon icon={ navigation } />{ ' ' }
								{ __( 'Navigation' ) }
							</div>

							<hr />

							{ showSelectMenus ? (
								<>
									<ExistingMenusDropdown
										showNavigationMenus={
											canSwitchNavigationMenu
										}
										navigationMenus={ navigationMenus }
										setSelectedMenu={ setSelectedMenu }
										onFinish={ onFinish }
										menus={ menus }
										onCreateFromMenu={ onCreateFromMenu }
										showClassicMenus={
											canUserCreateNavigation
										}
									/>
									<hr />
								</>
							) : undefined }
							{ canUserCreateNavigation && hasPages ? (
								<>
									<Button
										variant="tertiary"
										onClick={ onCreateAllPages }
									>
										{ __( 'Add all pages' ) }
									</Button>
									<hr />
								</>
							) : undefined }

							{ canUserCreateNavigation && (
								<Button
									variant="tertiary"
									onClick={ onCreateEmptyMenu }
								>
									{ __( 'Start empty' ) }
								</Button>
							) }
						</div>
					</div>
				</Placeholder>
			) }
		</>
	);
}
