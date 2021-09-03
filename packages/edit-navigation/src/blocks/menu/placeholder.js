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
import { useSelect } from '@wordpress/data';
import {
	forwardRef,
	useCallback,
	useState,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as navigationStore } from '../../store';
import { useMenuEntityProp } from '../../hooks';
import useNavigationEntities from './use-navigation-entities';
import menuItemsToBlocks from './menu-items-to-blocks';

function NavigationPlaceholder( { onCreate }, ref ) {
	const [ selectedMenu, setSelectedMenu ] = useState();
	const [ isCreatingFromMenu, setIsCreatingFromMenu ] = useState( false );

	const selectedMenuId = useSelect( ( select ) =>
		select( navigationStore ).getSelectedMenuId()
	);
	const [ menuName ] = useMenuEntityProp( 'name', selectedMenuId );

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
		// TODO - don't create a page list.
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
		variant: 'tertiary',
	};

	return (
		<Placeholder
			className="wp-block-menu-placeholder"
			label={ menuName }
			instructions={ __(
				'This menu is empty. You can start blank and choose what to add,' +
					' add your existing pages, or add the content of another menu.'
			) }
		>
			<div className="wp-block-menu-placeholder__controls">
				{ isLoading && (
					<div ref={ ref }>
						<Spinner />
					</div>
				) }
				{ ! isLoading && (
					<div
						ref={ ref }
						className="wp-block-menu-placeholder__actions"
					>
						<Button
							variant="tertiary"
							onClick={ onCreateEmptyMenu }
						>
							{ __( 'Start blank' ) }
						</Button>
						{ hasPages ? (
							<Button
								variant={ hasMenus ? 'tertiary' : 'primary' }
								onClick={ onCreateAllPages }
							>
								{ __( 'Add all pages' ) }
							</Button>
						) : undefined }
						{ hasMenus ? (
							<DropdownMenu
								text={ __( 'Copy existing menu' ) }
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
					</div>
				) }
			</div>
		</Placeholder>
	);
}

export default forwardRef( NavigationPlaceholder );
